import os
import datetime
from typing import TypedDict, List, Optional
import psycopg2
from psycopg2.extras import RealDictCursor
import boto3
from botocore.client import Config
from langgraph.graph import StateGraph, END
from langchain_google_genai import ChatGoogleGenerativeAI
from pydantic import BaseModel, Field

# -----------------
# 1. State Definition
# -----------------
class ReviewState(TypedDict):
    exam_id: str
    student_id: str
    flags: List[dict]
    incidents: List[dict]       # flags grouped into incidents
    evidence: List[dict]        # snapshots pulled for borderline incidents
    summary: Optional[dict]     # final structured output

# -----------------
# 2. Data Fetchers
# -----------------
def get_db_connection():
    db_url = os.getenv("DATABASE_URL", "postgres://postgres:postgres123@db:5432/secureexam")
    return psycopg2.connect(db_url)

def get_s3_client():
    minio_endpoint = os.getenv("MINIO_ENDPOINT", "minio")
    minio_port = os.getenv("MINIO_PORT", "9000")
    use_ssl = os.getenv("MINIO_USE_SSL", "false").lower() == "true"
    protocol = "https" if use_ssl else "http"
    
    return boto3.client(
        's3',
        endpoint_url=f"{protocol}://{minio_endpoint}:{minio_port}",
        aws_access_key_id=os.getenv("MINIO_ACCESS_KEY", "admin"),
        aws_secret_access_key=os.getenv("MINIO_SECRET_KEY", "admin123"),
        config=Config(signature_version='s3v4'),
        region_name='us-east-1'
    )

def get_flags(exam_id: str, student_id: str) -> list[dict]:
    conn = get_db_connection()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT * FROM proctoring_flags 
                WHERE exam_id = %s AND student_id = %s 
                ORDER BY created_at ASC
            """, (exam_id, student_id))
            flags = cur.fetchall()
            # Convert datetime to avoid JSON serialization issues in LangGraph state
            for flag in flags:
                if isinstance(flag['created_at'], datetime.datetime):
                    flag['created_at_dt'] = flag['created_at'] # keep real datetime for math
                    flag['created_at'] = flag['created_at'].isoformat()
            return [dict(f) for f in flags]
    finally:
        conn.close()

def get_snapshot(snapshot_key: str) -> Optional[str]:
    # In a real agent we might pass images directly to Gemini vision. 
    # For now, we just indicate we have the evidence, as the user prompt didn't explicitly mandate 
    # vision-based multimodal analysis for the summary node.
    bucket = os.getenv("MINIO_BUCKET", "secureexam-snapshots")
    s3 = get_s3_client()
    try:
        # We could read bytes, but for state JSON passing, maybe just return a signed URL or success.
        # Returning true string to show it exists and was fetched.
        s3.head_object(Bucket=bucket, Key=snapshot_key)
        return "Image Evidence Successfully Retrieved"
    except Exception as e:
        print(f"Failed to fetch snapshot {snapshot_key}: {e}")
        return None

# -----------------
# 3. Deterministic Grouping Logic
# -----------------
def group_into_incidents(flags: list[dict], window_seconds=90) -> list[dict]:
    if not flags:
        return []
    
    incidents = []
    current_group = [flags[0]]
    
    for i in range(1, len(flags)):
        prev = flags[i-1]
        curr = flags[i]
        
        gap = curr['created_at_dt'] - prev['created_at_dt']
        if gap.total_seconds() <= window_seconds:
            current_group.append(curr)
        else:
            incidents.append(current_group)
            current_group = [curr]
    
    incidents.append(current_group)
    
    # Strip the real datetime object before returning so state remains JSON serializable
    formatted_incidents = []
    for group in incidents:
        clean_group = []
        for f in group:
            clean_f = {k: v for k, v in f.items() if k != 'created_at_dt'}
            clean_group.append(clean_f)
        formatted_incidents.append({
            "flags": clean_group, 
            "flag_count": len(clean_group)
        })
        
    return formatted_incidents

# -----------------
# 4. Graph Nodes
# -----------------
llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", temperature=0)

class IncidentSummary(BaseModel):
    incidents: list[dict] = Field(description="A list of distinct incident clusters with descriptions.")
    overall_risk: str = Field(description="Must be exactly 'low', 'medium', or 'high'.")
    explanation: str = Field(description="A brief paragraph summarizing the reasoning behind the risk rating.")

def fetch_flags_node(state: ReviewState) -> ReviewState:
    flags = get_flags(state["exam_id"], state["student_id"])
    return {**state, "flags": flags}

def group_node(state: ReviewState) -> ReviewState:
    incidents = group_into_incidents(state["flags"])
    return {**state, "incidents": incidents}

def evidence_node(state: ReviewState) -> ReviewState:
    evidence = []
    for incident in state["incidents"]:
        if incident["flag_count"] >= 2:  # only pull evidence for multi-flag incidents
            for flag in incident["flags"]:
                if flag.get("snapshot_key"):
                    evidence_result = get_snapshot(flag["snapshot_key"])
                    if evidence_result:
                        evidence.append({"flag_id": flag["id"], "evidence": evidence_result})
    return {**state, "evidence": evidence}

def summarize_node(state: ReviewState) -> ReviewState:
    # If no incidents, we can short-circuit or let LLM decide.
    if not state["incidents"]:
        return {**state, "summary": {
            "incidents": [],
            "overall_risk": "low",
            "explanation": "No suspicious flags detected during the exam session."
        }}

    structured_llm = llm.with_structured_output(IncidentSummary)
    prompt = (
        f"Review these proctoring incidents and evidence for one exam session.\n"
        f"Incidents: {state['incidents']}.\n"
        f"Evidence found: {len(state['evidence'])} verified snapshots.\n"
        f"Group related events into a clear narrative, rate overall risk (low/medium/high), "
        f"and explain your reasoning briefly."
    )
    result = structured_llm.invoke(prompt)
    
    # Extract dict safely depending on how structured output returns (Pydantic model vs dict)
    if isinstance(result, BaseModel):
        summary_dict = result.dict()
    else:
        summary_dict = result
        
    return {**state, "summary": summary_dict}

# -----------------
# 5. Build Graph
# -----------------
graph = StateGraph(ReviewState)
graph.add_node("fetch_flags", fetch_flags_node)
graph.add_node("group", group_node)
graph.add_node("evidence", evidence_node)
graph.add_node("summarize", summarize_node)

graph.set_entry_point("fetch_flags")
graph.add_edge("fetch_flags", "group")
graph.add_edge("group", "evidence")
graph.add_edge("evidence", "summarize")
graph.add_edge("summarize", END)

app_graph = graph.compile()
