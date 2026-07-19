import logging
import io
import numpy as np
from typing import Optional
from PIL import Image
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from ultralytics import YOLO
from pydub import AudioSegment


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ai-service")

app = FastAPI(title="SecureExam AI Proctoring Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load YOLOv8-nano model on startup
logger.info("Loading YOLOv8 model...")
try:
    model = YOLO('yolov8n.pt')
    logger.info("YOLOv8 model loaded successfully.")
except Exception as e:
    logger.error(f"Failed to load YOLO model: {e}")
    model = None

class HealthResponse(BaseModel):
    status: str
    service: str

@app.get("/health", response_model=HealthResponse)
def health_check():
    return HealthResponse(status="healthy", service="ai-service")

@app.post("/check-snapshot")
async def check_snapshot(
    file: UploadFile = File(...),
    audio: UploadFile = File(None),
    exam_id: int = Form(...),
    student_id: int = Form(...)
):
    logger.info(f"Received snapshot check request for exam_id={exam_id}, student_id={student_id}")
    
    if model is None:
        return {"flagged": False, "flags": [], "message": "AI model disabled."}
        
    try:
        content = await file.read()
        logger.info(f"Successfully read image snapshot of size {len(content)} bytes")
        
        # Convert bytes to PIL Image, then to numpy array for YOLO
        image = Image.open(io.BytesIO(content)).convert("RGB")
        img_array = np.array(image)
        
        # Run inference
        results = model(img_array, verbose=False)
        
        flags = []
        person_count = 0
        
        # Parse results
        for r in results:
            boxes = r.boxes
            for box in boxes:
                class_id = int(box.cls[0])
                class_name = model.names[class_id]
                confidence = float(box.conf[0])
                
                if confidence > 0.5:
                    if class_name == 'person':
                        person_count += 1
                    elif class_name == 'cell phone':
                        flags.append({"type": "cell_phone_detected", "confidence": confidence})
                    elif class_name in ['book', 'laptop']:
                        # Optional: flag books or extra laptops if strictly prohibited
                        pass

        # Evaluate person count
        if person_count == 0:
            flags.append({"type": "no_face_detected", "confidence": 1.0})
        elif person_count > 1:
            flags.append({"type": "multiple_faces_detected", "confidence": 1.0})
        # Evaluate audio anomaly (sustained loud segments)
        if audio is not None:
            try:
                audio_bytes = await audio.read()
                audio_segment = AudioSegment.from_file(io.BytesIO(audio_bytes))
                
                # Check chunks of 500ms
                chunk_length_ms = 500
                loud_chunks = 0
                for i in range(0, len(audio_segment), chunk_length_ms):
                    chunk = audio_segment[i:i + chunk_length_ms]
                    if chunk.dBFS > -15.0:  # Threshold for talking/loud noise
                        loud_chunks += 1
                
                # If we have at least 2 loud chunks (1 second total), flag it
                if loud_chunks >= 2:
                    flags.append({"type": "audio_anomaly_detected", "confidence": 1.0})
            except Exception as e:
                logger.error(f"Failed to process audio: {e}")

        is_flagged = len(flags) > 0
        
        return {
            "flagged": is_flagged,
            "flags": flags,
            "message": f"Analyzed successfully. Found {person_count} person(s). Audio check complete."
        }
        
    except Exception as e:
        logger.error(f"Error checking snapshot: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI Service snapshot check failed: {str(e)}")

class SummaryRequest(BaseModel):
    student_id: int
    student_name: str
    total_flags: int
    total_severity: int
    flags: list

@app.post("/summarize-student")
def summarize_student(req: SummaryRequest):
    if req.total_flags == 0:
        summary = f"{req.student_name} completed the exam with no flagged incidents. Behavior appeared normal and compliant with exam rules."
    elif req.total_severity < 10:
        summary = f"{req.student_name} had a few minor incidents ({req.total_flags} flags, severity {req.total_severity}), mainly related to brief distractions or environmental noise. Overall, the integrity of the session is likely intact, but a quick review is recommended."
    elif req.total_severity < 20:
        summary = f"{req.student_name} exhibited suspicious behavior with {req.total_flags} flags (severity {req.total_severity}). Multiple policy violations were detected. Review the flag timeline to verify if unauthorized assistance was used."
    else:
        summary = f"High risk of academic dishonesty. {req.student_name} generated {req.total_flags} flags with a high severity score of {req.total_severity}. Frequent critical violations such as unauthorized devices, multiple people, or leaving the testing environment were detected. Manual intervention and strict review are required."
    
    return {"summary": summary}

class ExamSummaryRequest(BaseModel):
    exam_id: int
    student_severities: list

@app.post("/summarize-exam")
def summarize_exam(req: ExamSummaryRequest):
    total_students = len(req.student_severities)
    flagged_students = [s for s in req.student_severities if s.get('total_severity', 0) > 0]
    high_risk_students = [s for s in req.student_severities if s.get('total_severity', 0) >= 20]
    
    summary = f"Exam Integrity Overview: Out of {total_students} students, {len(flagged_students)} triggered at least one proctoring flag. "
    if len(high_risk_students) > 0:
        summary += f"There are {len(high_risk_students)} high-risk students requiring immediate review."
    elif len(flagged_students) > 0:
        summary += "Most flags were low to moderate severity. Please review the highlighted students in the dashboard."
    else:
        summary += "The exam session was smooth with no anomalies detected across any students."
        
    return {"summary": summary}

class ReviewSessionRequest(BaseModel):
    exam_id: str
    student_id: str

@app.post("/agent/review-session")
def review_session(req: ReviewSessionRequest):
    try:
        from agents.proctoring_review import app_graph
        result = app_graph.invoke({
            "exam_id": req.exam_id,
            "student_id": req.student_id,
            "flags": [],
            "incidents": [],
            "evidence": [],
            "summary": None
        })
        return result["summary"]
    except Exception as e:
        logger.error(f"LangGraph Agent failed: {e}")
        return {
            "incidents": [],
            "overall_risk": "unknown",
            "explanation": "Summary unavailable due to an internal AI error - please review the raw flags below."
        }
