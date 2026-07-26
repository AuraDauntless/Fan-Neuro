# FanPlay Neuro: Robust EEG-Based BCI Classification

![License](https://img.shields.io/badge/license-MIT-blue)
![Python](https://img.shields.io/badge/python-3.10%2B-blue)
![React](https://img.shields.io/badge/react-18.x-cyan)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-green)
![PyTorch](https://img.shields.io/badge/PyTorch-2.0%2B-red)

An end-to-end Machine Learning Operations (MLOps) pipeline and consumer-facing web application that operationalizes a pre-trained PyTorch EEGNet model. This project bridges the gap between deep adversarial machine learning research and real-time biometric telemetry visualization.

## 🧠 Project Overview

Brain-computer interfaces heavily rely on EEG signals, which are highly susceptible to adversarial perturbations. This project is split into two primary paradigms:

1. **Adversarial Robustness Research:** Implementing an Alignment-Based Adversarial Training (ABAT) framework, utilizing Euclidean Alignment (EA) to mitigate inter-subject domain shift, and deploying a Stackelberg leader-follower game using the parameter-efficient `EEGNet` architecture to enhance robustness against physiological attacks.
2. **Full-Stack Deployment:** A comprehensive web architecture designed to natively ingest clinical `.edf` (European Data Format) files, replicate training data normalizations, execute frequency-domain signal processing, and visualize inferences via a premium React dashboard.

## 🏗️ Architecture

### 1. PyTorch Deep Learning Model
- **Preprocessing:** Applied Euclidean Alignment (EA) to whiten multi-subject data and strictly mitigate domain-shift signatures.
- **Model:** `EEGNet` (Depthwise Convolutional Architecture).
- **Defense:** Alignment-Based Adversarial Training (ABAT) utilizing a minimax game theoretic formulation, enforcing the L∞ constraint.
- **Compression:** Knowledge Distilled student weights for high-throughput edge deployment.

### 2. FastAPI Backend (`/fanplay-iot-fan-neuro/backend`)
- **Data Ingestion:** Asynchronous parsing of raw 8-channel `.edf` files using `mne-python`.
- **Mathematical Processing:** Real-time per-channel Z-score normalization matching the exact parameters of the adversarial training environment.
- **Feature Extraction:** Welch's Power Spectral Density (`scipy.signal.welch`) isolates Delta, Theta, Alpha, Beta, and Gamma brainwave bands.
- **Hardware Diagnostics:** Automated Signal-to-Noise Ratio (SNR) calculated in decibels to evaluate electrode contact quality.

### 3. React Frontend (`/fanplay-iot-fan-neuro/frontend`)
- **Tech Stack:** React 18, Vite, TypeScript.
- **UI/UX:** Immersive "electric" dark-mode aesthetic utilizing bespoke CSS and Glassmorphism.
- **Data Visualization:** Heavily customized `Recharts` SVG components (Cognitive State AreaChart, Brainwave Distribution PieChart, Active vs. Dormant Histogram) with precise localized tooltips mapping physiological truths to AI predictions.

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+

### Running the Backend Server
```bash
cd fanplay-iot-fan-neuro/backend
python -m venv venv
source venv/bin/activate  # On Windows use `venv\Scripts\activate`
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
The FastAPI swagger documentation will be available at `http://localhost:8000/docs`.

### Running the Frontend Client
```bash
cd fanplay-iot-fan-neuro/frontend
npm install
npm run dev
```
The dashboard will be available at `http://localhost:5173`.

---

## 📄 Documentation & Reports
- The finalized academic LaTeX reports detailing the Adversarial Training algorithms, Game Theoretic formulation, Knowledge Distillation, and Full-Stack Engineering can be found in the `LaTex Files (1)` directory.

## 👥 Authors
- **Advait Sandeep Raut** - *Software Engineering & Full-Stack MLOps Pipeline*
- **Pratham Sudheer Hegde** - *PyTorch Adversarial Training Research and signal preprocessing*
