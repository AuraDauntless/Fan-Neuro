import time
import random
import mne
import torch
import numpy as np
import scipy.signal
from typing import List, Dict, Any
from app.services.models import EEGNET

import os

# Initialize the PyTorch model
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model_path = os.path.join(os.path.dirname(__file__), "eeg_model.pt")

if os.path.exists(model_path):
    print(f"Loading trained weights from {model_path}")
    checkpoint = torch.load(model_path, map_location=device, weights_only=False)
    kwargs = checkpoint.get("model_kwargs", {"num_classes": 2, "C": 8, "T": 512, "F1": 4, "D": 1, "F2": 8, "dropout": 0.25})
    model = EEGNET(**kwargs)
    model.load_state_dict(checkpoint["model_state_dict"])
else:
    print("Warning: eeg_model.pt not found. Using random weights.")
    model = EEGNET(num_classes=2, C=8, T=512)

model.to(device)
model.eval()

def process_eeg_frame(channels: dict) -> dict:
    """
    Dummy processing function to simulate EEG analysis.
    Ingests JSON payloads with 8-channel arrays:
    F1, F2, Fz, P1, P2, Pz, O1, O2
    
    Returns a mock cognitive classification state.
    """
    # In a real scenario, the Colab model will replace this logic.
    # We simulate a cognitive state based on some random logic or simple threshold.
    
    # Calculate a mock 'activation' based on average magnitudes (just for variation)
    total_magnitude = 0.0
    for channel, data in channels.items():
        if isinstance(data, list) and len(data) > 0:
            total_magnitude += sum(abs(v) for v in data) / len(data)
            
    # Add some randomness to simulate a model's prediction confidence
    base_confidence = random.uniform(0.6, 0.99)
    
    # Determine state (simulate mostly active with occasional dormant periods)
    if random.random() > 0.8:
        state = "Dormant"
    else:
        state = "Active"
        
    return {
        "state": state,
        "confidence": round(base_confidence, 2),
        "timestamp": time.time()
    }

def process_edf_file(filepath: str, window_size: int = 512) -> List[Dict[str, Any]]:
    """
    Parses an EDF file, chunks it into windows of `window_size`,
    and runs it through the PyTorch EEGNet model.
    """
    # 1. Load the EDF file using mne
    raw = mne.io.read_raw_edf(filepath, preload=True, verbose=False)
    
    # Extract data (shape: [channels, times])
    data = raw.get_data()
    n_channels, n_times = data.shape
    
    # If the EDF has fewer channels than 8, we might need to pad.
    # We'll select up to 8 channels to match C=8
    data = data[:8, :]
    if data.shape[0] < 8:
        pad = np.zeros((8 - data.shape[0], n_times))
        data = np.vstack([data, pad])
        
    results = []
    
    # 2. Iterate through data in chunks of window_size
    for start in range(0, n_times, window_size):
        end = start + window_size
        if end > n_times:
            break
            
        chunk = data[:, start:end]
        
        # 2.1 Apply Z-score normalization across time per channel
        # The model was trained with 'per_trial_time_zscore_across_time'
        means = chunk.mean(axis=1, keepdims=True)
        stds = chunk.std(axis=1, keepdims=True)
        # Avoid division by zero
        stds[stds == 0] = 1.0
        chunk_normalized = (chunk - means) / stds
        
        # 3. Prepare for PyTorch
        # Shape needs to be (Batch, 1, Channels, Time) => (1, 1, 8, 512)
        chunk_tensor = torch.tensor(chunk_normalized, dtype=torch.float32).unsqueeze(0).unsqueeze(0).to(device)
        
        # 4. Inference
        with torch.no_grad():
            logits = model(chunk_tensor)
            # Apply softmax to get confidences
            probs = torch.nn.functional.softmax(logits, dim=1)
            pred_class = torch.argmax(probs, dim=1).item()
            confidence = probs[0, pred_class].item()
            
        # 5. PSD Analysis for Dominant Wave and SNR
        sfreq = raw.info['sfreq']
        # Calculate Welch's PSD on the raw chunk (before Z-score) averaged across channels
        f, Pxx = scipy.signal.welch(chunk, fs=sfreq, nperseg=min(256, chunk.shape[1]), axis=1)
        mean_pxx = np.mean(Pxx, axis=0) # Average power across channels
        
        bands = {
            "Delta": (1, 4),
            "Theta": (4, 8),
            "Alpha": (8, 12),
            "Beta": (12, 30),
            "Gamma": (30, 100)
        }
        
        band_powers = {}
        total_signal_power = 0
        for band, (low, high) in bands.items():
            idx = np.logical_and(f >= low, f <= high)
            power = np.sum(mean_pxx[idx])
            band_powers[band] = power
            total_signal_power += power
            
        dominant_wave = max(band_powers, key=band_powers.get) if total_signal_power > 0 else "None"
        
        # Calculate SNR: Signal (1-100Hz) vs Noise (out of band, e.g. >100Hz)
        # For a standard 250Hz sampling rate, Nyquist is 125Hz.
        idx_noise = f > 100
        total_noise_power = np.sum(mean_pxx[idx_noise])
        # Add a small epsilon to avoid division by zero
        snr_ratio = total_signal_power / (total_noise_power + 1e-9)
        # Convert to dB
        snr_db = 10 * np.log10(snr_ratio + 1e-9)
        
        # 6. Format output
        state = "Active" if pred_class == 1 else "Dormant"
        
        results.append({
            "time_start": start / sfreq,
            "time_end": end / sfreq,
            "state": state,
            "confidence": round(confidence, 4),
            "dominant_wave": dominant_wave,
            "snr": round(snr_db, 2)
        })
        
    return results
