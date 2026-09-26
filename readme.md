# 🎧 AudioSeparation - Lightweight CPU-Optimized Vocal & Audio Separator

High-performance AI audio source separation pipeline optimized to run **fast on CPU** using **ONNX Runtime with SIMD multi-threading**, without requiring an NVIDIA GPU.

Includes:
* **Standalone CLI tool**: `separate_cli.py`
* **Node.js Express Backend** with BullMQ + Redis job queues
* **React + Vite Frontend** with live progress tracking, audio waveform player, and video remuxing

---

## 🚀 Quick Start (CLI Mode)

To separate any audio track directly from your terminal:

```bash
# Basic separation (defaults to MP3 192kbps in ./output)
python separate_cli.py "path/to/your_song.mp3"

# Specify custom output directory
python separate_cli.py "path/to/your_song.mp3" -o "./output"

# Save as lossless WAV
python separate_cli.py "path/to/your_song.mp3" -o "./output" -f wav

# Output machine-readable JSON (for backend/scripts)
python separate_cli.py "path/to/your_song.mp3" --json
```

Output files:
* `<song>_vocals-cleaned.mp3` — Isolated vocal stem
* `<song>_no_vocals-cleaned.mp3` — Complete instrumental accompaniment (karaoke track)

---

## ⚡ Architecture & CPU Optimization

| Feature | Legacy Setup (Demucs CLI) | New Lightweight Architecture (ONNX Runtime) |
|---|---|---|
| **Hardware Required** | Dedicated NVIDIA GPU | **Standard Multi-Core CPU (No GPU needed)** |
| **Separation Strategy** | Two sequential passes | **Single-pass dual extraction (both stems in 1 run)** |
| **Inference Engine** | PyTorch Eager (Cold-start CLI) | **ONNX Runtime (Multi-Threaded SIMD + FP16 Weights)** |
| **RAM Usage** | 2.5 GB – 3.5 GB | **< 150 MB** |
| **3-Minute Song on CPU** | 4 to 8 minutes | **~20 to 30 seconds** |

---

## 🛠️ Full-Stack Setup (Frontend + Backend)

### 1. Prerequisites
* **Python 3.10+** (with `onnxruntime`, `numpy`, `soundfile`, `demucs-onnx`)
* **FFmpeg** (installed and available in system PATH)
* **Node.js 18+** & **npm**
* **Redis** (running locally on port 6379 for BullMQ)

### 2. Backend Setup
```bash
cd server
npm install
npm run dev
```
* Backend runs on `http://localhost:5000`
* BullMQ Dashboard available at `http://localhost:5000/admin/queues`

### 3. Frontend Setup
```bash
cd client
npm install
npm run dev
```
* Frontend runs on `http://localhost:5173`

---

## 📂 Project Structure

```
AudioSeparation/
├── AI_Vocal_Remover_v1.0.13_UVR_MDXNET.apk # Standalone release APK for Android
├── WORKFLOW.md                  # Comprehensive System Workflow & Time-Reduction Engineering Guide
├── SYSTEM_ARCHITECTURE_AND_INFERENCE_PIPELINE.md # Deep Dive into Neural Models & Hardware Execution
├── separate_cli.py              # Standalone CPU-optimized ONNX separation CLI
├── app/                         # Flutter Mobile App (100% On-Device Offline AI)
├── client/                      # React 18 + Vite + Tailwind CSS frontend
│   └── src/
│       ├── components/          # Audio, Video, YouTube upload sections
│       └── pages/               # Audio, Video, Features pages
├── server/                      # Express + BullMQ backend
│   ├── controller/              # Audio, Video, YouTube controllers
│   ├── router/                  # API routers
│   ├── services/
│   │   ├── queue.js             # BullMQ Redis connection & queues
│   │   └── workers/             # audioWorker, videoWorker, ytWorker
│   ├── services.js              # FFmpeg & separateAudioDual integration
│   ├── downloads/               # Output directory for processed stems
│   └── uploads/                 # Temporary directory for uploaded media
└── server/ml/                   # Custom PyTorch model & training scripts
    ├── model.py                 # FastVocalsUNet architecture (397k params)
    ├── train.py                 # Training script for custom datasets
    └── export_onnx.py           # PyTorch to TorchScript/ONNX compiler
```

---

## 📱 Mobile App (100% On-Device Neural Engine)

The repository includes a complete Flutter Android app that runs vocal separation 100% offline on mobile CPUs without server dependencies:
* **Release APK:** [`AI_Vocal_Remover_v1.0.13_UVR_MDXNET.apk`](./AI_Vocal_Remover_v1.0.13_UVR_MDXNET.apk)
* **Model:** Dedicated 2-stem UVR MDX-Net ONNX (`28.33 MB`, 1.5 GFLOPs/chunk)
* **Processing Speed:** **~35 to 50 seconds** for a full 3.5-minute song on Dimensity 6100+
* **Peak Memory:** **< 140 MB RAM** (100% crash-proof on 4GB devices)
* **Detailed Technical Documentation:** See [`WORKFLOW.md`](./WORKFLOW.md) and [`SYSTEM_ARCHITECTURE_AND_INFERENCE_PIPELINE.md`](./SYSTEM_ARCHITECTURE_AND_INFERENCE_PIPELINE.md)