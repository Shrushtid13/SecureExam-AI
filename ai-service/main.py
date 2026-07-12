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
        # Evaluate audio anomaly
        if audio is not None:
            try:
                audio_bytes = await audio.read()
                audio_segment = AudioSegment.from_file(io.BytesIO(audio_bytes))
                # dBFS is loudness in decibels relative to full scale. 0 is max, negative is quieter.
                # Threshold for "suspiciously loud" depends on mic, but let's use -20 dBFS for a quiet room
                if audio_segment.dBFS > -15.0:
                    flags.append({"type": "audio_anomaly_detected", "confidence": 1.0})
            except Exception as e:
                logger.error(f"Failed to process audio: {e}")

        is_flagged = len(flags) > 0
        
        return {
            "flagged": is_flagged,
            "flags": flags,
            "message": f"Analyzed successfully. Found {person_count} person(s). dBFS check complete."
        }
        
    except Exception as e:
        logger.error(f"Error checking snapshot: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI Service snapshot check failed: {str(e)}")
