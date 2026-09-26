import os
import sys
import json
import time
import argparse
import subprocess
import numpy as np
import torch

current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.append(current_dir)


def load_audio_ffmpeg(file_path, sample_rate=44100):
    """
    Load any audio or video file into float32 stereo numpy array using FFmpeg.
    """
    cmd = [
        "ffmpeg",
        "-nostdin",
        "-threads", "0",
        "-i", file_path,
        "-f", "s16le",
        "-ac", "2",
        "-ar", str(sample_rate),
        "-"
    ]
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
    raw_bytes, _ = p.communicate()
    if p.returncode != 0:
        raise RuntimeError(f"FFmpeg failed to decode audio from {file_path}")

    audio = np.frombuffer(raw_bytes, dtype=np.int16).astype(np.float32) / 32768.0
    audio = audio.reshape(-1, 2).T  # Shape: [2, Samples]
    return audio


def save_audio_ffmpeg(audio_np, output_path, sample_rate=44100, fmt="mp3", bitrate="192k"):
    """
    Encode float32 stereo numpy array directly to MP3 or WAV using FFmpeg.
    """
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    audio_int16 = np.clip(audio_np * 32767.0, -32768, 32767).astype(np.int16)
    raw_bytes = audio_int16.T.tobytes()

    if fmt == "mp3":
        cmd = [
            "ffmpeg", "-y",
            "-f", "s16le",
            "-ar", str(sample_rate),
            "-ac", "2",
            "-i", "-",
            "-codec:a", "libmp3lame",
            "-b:a", bitrate,
            output_path
        ]
    else:  # WAV
        cmd = [
            "ffmpeg", "-y",
            "-f", "s16le",
            "-ar", str(sample_rate),
            "-ac", "2",
            "-i", "-",
            output_path
        ]

    p = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    p.communicate(input=raw_bytes)
    if p.returncode != 0:
        raise RuntimeError(f"FFmpeg failed to encode audio to {output_path}")


def separate_audio(
    input_file,
    output_dir,
    model_path=None,
    fmt="mp3",
    sample_rate=44100,
    n_fft=2048,
    hop_length=512,
    chunk_seconds=12
):
    start_time = time.time()
    if model_path is None:
        model_path = os.path.join(current_dir, "weights", "fast_vocals.pt")

    # 1. Load Model (TorchScript or ONNX)
    is_onnx = model_path.endswith(".onnx")
    if is_onnx:
        import onnxruntime as ort
        session_opts = ort.SessionOptions()
        session_opts.intra_op_num_threads = os.cpu_count() or 4
        session_opts.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL
        session = ort.InferenceSession(model_path, session_opts, providers=["CPUExecutionProvider"])
    else:
        # Load TorchScript frozen model
        torch.set_num_threads(os.cpu_count() or 4)
        model = torch.jit.load(model_path, map_location="cpu")
        model.eval()

    # 2. Decode Input Audio
    audio_np = load_audio_ffmpeg(input_file, sample_rate=sample_rate)
    total_samples = audio_np.shape[1]
    duration_sec = total_samples / sample_rate

    # Convert to PyTorch Tensor for STFT
    waveform = torch.from_numpy(audio_np).float()
    window = torch.hann_window(n_fft)

    # 3. Process in Chunks to guarantee constant low RAM (<100MB)
    chunk_samples = int(chunk_seconds * sample_rate)
    hop_chunk = chunk_samples

    vocals_out = np.zeros_like(audio_np)
    music_out = np.zeros_like(audio_np)

    with torch.no_grad():
        for start_idx in range(0, total_samples, hop_chunk):
            end_idx = min(start_idx + chunk_samples, total_samples)
            chunk_wave = waveform[:, start_idx:end_idx]

            # STFT
            stft = torch.stft(
                chunk_wave,
                n_fft=n_fft,
                hop_length=hop_length,
                window=window,
                return_complex=True
            )  # [2, Freq=1025, Time]

            mag = torch.abs(stft)
            phase = torch.angle(stft)

            # Pad or pass to model
            model_input = mag.unsqueeze(0)  # [1, 2, 1025, Time]

            if is_onnx:
                ort_inputs = {session.get_inputs()[0].name: model_input.numpy()}
                mask_np = session.run(None, ort_inputs)[0]
                mask = torch.from_numpy(mask_np).squeeze(0)
            else:
                mask = model(model_input).squeeze(0)

            # Separate via soft ratio masking
            vocal_mag = mask * mag
            music_mag = (1.0 - mask) * mag

            # Reconstruct complex spectrograms
            vocal_stft = torch.polar(vocal_mag, phase)
            music_stft = torch.polar(music_mag, phase)

            # iSTFT
            vocal_chunk = torch.istft(
                vocal_stft,
                n_fft=n_fft,
                hop_length=hop_length,
                window=window,
                length=chunk_wave.shape[-1]
            ).numpy()

            music_chunk = torch.istft(
                music_stft,
                n_fft=n_fft,
                hop_length=hop_length,
                window=window,
                length=chunk_wave.shape[-1]
            ).numpy()

            vocals_out[:, start_idx:end_idx] = vocal_chunk
            music_out[:, start_idx:end_idx] = music_chunk

    # 4. Save Outputs
    base_name = os.path.splitext(os.path.basename(input_file))[0]
    ext = ".mp3" if fmt == "mp3" else ".wav"

    vocal_path = os.path.join(output_dir, f"{base_name}_vocals-cleaned{ext}")
    music_path = os.path.join(output_dir, f"{base_name}_no_vocals-cleaned{ext}")

    save_audio_ffmpeg(vocals_out, vocal_path, sample_rate=sample_rate, fmt=fmt)
    save_audio_ffmpeg(music_out, music_path, sample_rate=sample_rate, fmt=fmt)

    elapsed = time.time() - start_time
    rtf = elapsed / max(duration_sec, 0.001)

    result = {
        "success": True,
        "input": input_file,
        "vocals": os.path.abspath(vocal_path),
        "no_vocals": os.path.abspath(music_path),
        "duration_sec": round(duration_sec, 2),
        "elapsed_sec": round(elapsed, 2),
        "real_time_factor": round(rtf, 4)
    }
    return result


def main():
    parser = argparse.ArgumentParser(description="Lightweight Real-time CPU Audio Separation")
    parser.add_argument("--input", required=True, help="Path to input audio/video file")
    parser.add_argument("--output_dir", required=True, help="Directory to save separated tracks")
    parser.add_argument("--model_path", default=None, help="Path to .pt or .onnx model")
    parser.add_argument("--format", default="mp3", choices=["mp3", "wav"], help="Output audio format")
    args = parser.parse_args()

    try:
        res = separate_audio(
            input_file=args.input,
            output_dir=args.output_dir,
            model_path=args.model_path,
            fmt=args.format
        )
        print(json.dumps(res))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
