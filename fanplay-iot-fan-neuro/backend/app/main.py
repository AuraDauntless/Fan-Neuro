import json
import os
import shutil
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.services.neuro_processor import process_eeg_frame, process_edf_file

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": f"Welcome to {settings.PROJECT_NAME} API"}

@app.post("/api/upload-edf")
async def upload_edf(file: UploadFile = File(...)):
    # Save the file temporarily
    temp_dir = "temp_uploads"
    os.makedirs(temp_dir, exist_ok=True)
    temp_file_path = os.path.join(temp_dir, file.filename)
    
    with open(temp_file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        # Process the EDF file using our neuro processor
        results = process_edf_file(temp_file_path)
    except Exception as e:
        print(f"Error processing EDF: {e}")
        return {"error": str(e)}
    finally:
        # Clean up the temp file
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
            
    return {"filename": file.filename, "results": results}

@app.websocket(settings.WS_PATH)
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("WebSocket connected: /ws/neuro-stream")
    try:
        while True:
            # Receive text data from the client
            data = await websocket.receive_text()
            
            try:
                # Parse the JSON payload containing 8-channel EEG arrays
                payload = json.loads(data)
                
                # Process the EEG frame
                result = process_eeg_frame(payload)
                
                # Send the resulting cognitive state back to the client
                await websocket.send_json(result)
            except json.JSONDecodeError:
                await websocket.send_json({"error": "Invalid JSON payload"})
            except Exception as e:
                print(f"Error processing frame: {e}")
                await websocket.send_json({"error": "Internal processing error"})
                
    except WebSocketDisconnect:
        print("WebSocket disconnected")
