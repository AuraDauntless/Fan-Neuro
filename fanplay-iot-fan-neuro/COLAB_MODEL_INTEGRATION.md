# Google Colab Model Integration Guide

This guide details exactly how to format, serialize, and structure your Google Colab Python model file so it can replace the backend dummy code in this application.

## Current Setup

Currently, the application uses a mock function in `backend/app/services/neuro_processor.py` to simulate cognitive state classification from 8-channel EEG data. 

To connect your real model, you need to replace `process_eeg_frame` with a function that loads your pre-trained model and performs inference.

## Steps for Integration

### 1. Export your Model from Colab

In your Google Colab notebook, after training your model, you must serialize it. For example, if you are using PyTorch or Scikit-Learn:

**PyTorch:**
```python
import torch
# Save the model state dictionary
torch.save(model.state_dict(), 'eeg_model.pth')
```

**Scikit-Learn/XGBoost:**
```python
import joblib
# Save the model
joblib.dump(model, 'eeg_model.joblib')
```

Download this saved file (`.pth` or `.joblib`) and place it inside the `backend/app/services/` directory.

### 2. Update `requirements.txt`

If your model requires specific libraries (e.g., `torch`, `scikit-learn`, `numpy`, `scipy`), add them to `backend/requirements.txt`:

```text
fastapi==0.109.2
uvicorn==0.27.1
websockets==12.0
pydantic==2.6.1
pydantic-settings==2.1.0
torch==2.1.2     # <--- Add your model's dependencies
numpy==1.26.3
```
Then reinstall the requirements: `pip install -r requirements.txt`.

### 3. Modify `neuro_processor.py`

Rewrite `backend/app/services/neuro_processor.py` to load your model and perform inference.

```python
import time
import numpy as np
# import torch or joblib depending on your model
# import joblib
# model = joblib.load('app/services/eeg_model.joblib')

def process_eeg_frame(channels: dict) -> dict:
    \"\"\"
    Ingests JSON payloads with 8-channel arrays:
    F1, F2, Fz, P1, P2, Pz, O1, O2
    \"\"\"
    
    # 1. Extract the channels into a structured format (e.g., NumPy array)
    # Ensure the order matches what your model expects
    channel_order = ['F1', 'F2', 'Fz', 'P1', 'P2', 'Pz', 'O1', 'O2']
    
    try:
        # Create a 2D array: (1, 8, num_samples) or whatever shape is required
        data_matrix = []
        for ch in channel_order:
            data_matrix.append(channels.get(ch, []))
            
        # Example: Convert to numpy array
        np_data = np.array(data_matrix)
        
        # 2. Preprocess the data (Filtering, FFT, Bandpower extraction, etc.)
        # features = extract_features(np_data)
        
        # 3. Perform Inference
        # prediction = model.predict(features)
        # confidence = model.predict_proba(features).max()
        
        # For now, replacing with dummy prediction from the loaded model concept
        prediction_label = "Active" # Replace with actual mapping: 1 -> Active, 0 -> Dormant
        confidence = 0.95
        
    except Exception as e:
        print(f"Error during inference: {e}")
        prediction_label = "Dormant"
        confidence = 0.0

    return {
        "state": prediction_label,
        "confidence": round(float(confidence), 2),
        "timestamp": time.time()
    }
```

### 4. Restart the Backend

Once `neuro_processor.py` is updated and the model file is in place, restart the FastAPI server:

```bash
uvicorn app.main:app --reload
```

The WebSocket endpoint will now automatically stream data to your model and send real predictions back to the frontend!
