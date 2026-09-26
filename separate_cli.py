#!/usr/bin/env python3
"""
AudioSeparation CLI - Lightweight CPU-Optimized Vocal & Non-Vocal Separation
Powered by ONNX Runtime with Multi-Threaded SIMD Acceleration.
"""

import os
import sys
import time
import json
import argparse
import subprocess
import numpy as np

# Ensure UTF-8 output on Windows terminals
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass


def print_banner():
    print(r"""
 ==================================================================
  AudioSeparation CLI - CPU-Optimized Vocal & Non-Vocal Remover
  Powered by ONNX Runtime | Multi-Threaded SIMD Acceleration
 ==================================================================
""")


def load_audio_universal(file_path, target_sr=44100):
    """
    Loads any audio or video container (.mp3, .wav, .flac, .ogg, .mp4, .mov, .m4a, .webm, .mkv, etc.)
    Uses demucs_onnx / soundfile first for standard audio files, and falls back to FFmpeg
    to extract and decode the audio track from video containers or unsupported audio codecs.
    Returns (audio_float32, native_sr) where audio_float32 is shape [2, samples].
    """
    try:
        from demucs_onnx.inference import load_audio
        return load_audio(file_path, target_sr=target_sr)
    except Exception:
        # Fall back to FFmpeg for video containers (e.g. MP4, MKV, MOV, WEBM)
        cmd = [
            "ffmpeg", "-y", "-nostdin",
            "-i", file_path,
            "-vn",
            "-ac", "2",
            "-ar", str(target_sr),
            "-f", "s16le",
            "-"
        ]
        p = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        raw_bytes, err = p.communicate()
        if p.returncode != 0:
            err_msg = err.decode(errors="ignore").strip()
            raise RuntimeError(f"Failed to decode audio track from '{file_path}': {err_msg}")

        if not raw_bytes:
            raise RuntimeError(f"No audio stream found in '{file_path}'")

        audio_int16 = np.frombuffer(raw_bytes, dtype=np.int16).reshape(-1, 2).T
        audio_float32 = audio_int16.astype(np.float32) / 32768.0
        return np.ascontiguousarray(audio_float32, dtype=np.float32), target_sr


def save_stem_ffmpeg(audio_np, output_path, sample_rate=44100, fmt="mp3", bitrate="192k"):
    """
    Encodes float32 stereo numpy array directly to MP3 or WAV using FFmpeg.
    """
    os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
    audio_int16 = np.clip(audio_np * 32767.0, -32768, 32767).astype(np.int16)
    raw_bytes = audio_int16.T.tobytes()

    if fmt.lower() == "mp3":
        cmd = [
            "ffmpeg", "-y",
            "-nostdin",
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
            "-nostdin",
            "-f", "s16le",
            "-ar", str(sample_rate),
            "-ac", "2",
            "-i", "-",
            output_path
        ]

    p = subprocess.Popen(cmd, stdin=subprocess.PIPE, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
    _, err = p.communicate(input=raw_bytes)
    if p.returncode != 0:
        raise RuntimeError(f"FFmpeg encoding error: {err.decode(errors='ignore')}")


def report_progress(percent, status, json_mode=False, quiet=False):
    """
    Emits real-time progress events for CLI users or backend JSON listeners.
    """
    if json_mode:
        payload = json.dumps({"percent": int(percent), "status": str(status)})
        print(f"PROGRESS:{payload}", flush=True)
    elif not quiet:
        print(f"[{int(percent):>3}%] {status}", flush=True)


def run_separation(
    input_file,
    output_dir="./output",
    fmt="mp3",
    bitrate="192k",
    model="htdemucs",
    precision="fp16weights",
    providers="cpu",
    quiet=False,
    json_mode=False
):
    """
    Main separation function with chunk-by-chunk progress reporting.
    Returns dictionary with file paths, durations, and metrics.
    """
    if not os.path.isfile(input_file):
        raise FileNotFoundError(f"Input audio file not found: {input_file}")

    start_total = time.time()
    input_path = os.path.abspath(input_file)
    output_dir = os.path.abspath(output_dir)
    os.makedirs(output_dir, exist_ok=True)

    base_name = os.path.splitext(os.path.basename(input_file))[0]
    ext = fmt.lower().strip(".")
    vocals_out_path = os.path.join(output_dir, f"{base_name}_vocals-cleaned.{ext}")
    non_vocals_out_path = os.path.join(output_dir, f"{base_name}_no_vocals-cleaned.{ext}")

    if not quiet:
        print(f"[*] Input Song  : {input_path}")
        print(f"[*] Output Dir  : {output_dir}")
        print(f"[*] Format      : {ext.upper()} ({bitrate if ext == 'mp3' else 'Lossless'})")
        print(f"[*] Engine      : ONNX Runtime ({providers.upper()} Provider)")
        print("-" * 66)

    # 1. Load Audio
    report_progress(5, "Loading and decoding audio track...", json_mode=json_mode, quiet=quiet)
    t0 = time.time()
    from demucs_onnx.inference import (
        resolve_providers, session_pool, resolve_model_name,
        download_single_model, MODEL_REGISTRY, N_CHANNELS, N_SAMPLES,
        _make_transition_window, SAMPLE_RATE, resample_to_native
    )

    audio_orig, native_sr = load_audio_universal(input_path, target_sr=SAMPLE_RATE)
    total_len = audio_orig.shape[1]
    audio_duration_sec = total_len / SAMPLE_RATE
    load_time = time.time() - t0

    report_progress(15, f"Audio loaded ({audio_duration_sec:.1f}s). Initializing ONNX neural model...", json_mode=json_mode, quiet=quiet)

    # 2. Run ONNX Model Separation with chunk progress
    t1 = time.time()
    canonical = resolve_model_name(model)
    onnx_providers = resolve_providers(providers)
    pool = session_pool()

    if canonical in MODEL_REGISTRY and MODEL_REGISTRY[canonical].kind == "single":
        info = MODEL_REGISTRY[canonical]
        path = download_single_model(canonical, precision=precision)
        session = pool.get(path, onnx_providers)

        sources = info.sources
        overlap = N_SAMPLES // 4
        stride = N_SAMPLES - overlap
        n_chunks = max(1, (total_len + stride - 1) // stride)

        window = _make_transition_window(N_SAMPLES)
        out = {s: np.zeros((N_CHANNELS, total_len), dtype=np.float32) for s in sources}
        weight = np.zeros(total_len, dtype=np.float32)

        for i in range(n_chunks):
            start = i * stride
            end = min(start + N_SAMPLES, total_len)
            chunk = audio_orig[:, start:end]
            if chunk.shape[1] < N_SAMPLES:
                chunk = np.pad(chunk, ((0, 0), (0, N_SAMPLES - chunk.shape[1])), mode="constant")
            x = chunk[np.newaxis, ...].astype(np.float32, copy=False)
            chunk_len = end - start
            w = window[:chunk_len]

            stems_chunk = session.run(["stems"], {"mix": x})[0][0]
            for s in sources:
                row = sources.index(s)
                out[s][:, start:end] += stems_chunk[row, :, :chunk_len] * w

            weight[start:end] += w

            pct = int(18 + ((i + 1) / n_chunks) * 67)
            report_progress(pct, f"Separating audio stems: chunk {i + 1} of {n_chunks} ({pct}%)...", json_mode=json_mode, quiet=quiet)

        weight = np.maximum(weight, 1e-8)
        for s in out:
            out[s] /= weight

        if native_sr != SAMPLE_RATE:
            report_progress(86, "Resampling stems to native audio sample rate...", json_mode=json_mode, quiet=quiet)
            stems = {
                s: resample_to_native(arr, SAMPLE_RATE, native_sr)
                for s, arr in out.items()
            }
        else:
            stems = out
    else:
        from demucs_onnx import separate
        stems = separate(
            input_path,
            output_dir=None,
            model=model,
            precision=precision,
            providers=providers,
            verbose=False,
            progress=not quiet
        )

    inference_time = time.time() - t1

    # Extract Vocals and Non-Vocals (Accompaniment = drums + bass + other)
    vocals = stems["vocals"]
    non_vocals = stems["drums"] + stems["bass"] + stems["other"]

    # 3. Save Files
    report_progress(88, f"Encoding vocals to {ext.upper()} with FFmpeg...", json_mode=json_mode, quiet=quiet)
    t2 = time.time()
    out_sample_rate = 44100
    save_stem_ffmpeg(vocals, vocals_out_path, sample_rate=out_sample_rate, fmt=ext, bitrate=bitrate)

    report_progress(94, f"Encoding non-vocals (music) to {ext.upper()}...", json_mode=json_mode, quiet=quiet)
    save_stem_ffmpeg(non_vocals, non_vocals_out_path, sample_rate=out_sample_rate, fmt=ext, bitrate=bitrate)
    save_time = time.time() - t2

    report_progress(100, "Audio separation complete!", json_mode=json_mode, quiet=quiet)

    total_time = time.time() - start_total
    rtf = total_time / max(audio_duration_sec, 0.001)

    result = {
        "success": True,
        "input_file": input_path,
        "duration_seconds": round(audio_duration_sec, 2),
        "vocals": vocals_out_path,
        "no_vocals": non_vocals_out_path,
        "vocals_path": vocals_out_path,
        "non_vocals_path": non_vocals_out_path,
        "format": ext,
        "inference_seconds": round(inference_time, 2),
        "total_seconds": round(total_time, 2),
        "real_time_factor": round(rtf, 4),
        "speedup_factor": round(1.0 / max(rtf, 0.0001), 2)
    }

    if not quiet:
        print("=" * 66)
        print(">> SEPARATION COMPLETED SUCCESSFULLY!")
        print(f"  [+] Vocals Track     : {vocals_out_path}")
        print(f"  [+] Non-Vocals Track : {non_vocals_out_path}")
        print("-" * 66)
        print(f"  Timing: {total_time:.2f}s total | RTF: {rtf:.3f} ({result['speedup_factor']}x faster than real-time)")
        print("=" * 66)

    return result


def main():
    parser = argparse.ArgumentParser(
        description="AudioSeparation CLI - Separate any song into Vocals and Non-Vocals on CPU."
    )
    parser.add_argument(
        "input",
        nargs="?",
        default=None,
        help="Path to input audio or video file (e.g., song.mp3, audio.wav, video.mp4)"
    )
    parser.add_argument(
        "--input", "-i",
        dest="input_flag",
        default=None,
        help="Alternative flag for input file"
    )
    parser.add_argument(
        "--output_dir", "-o",
        default="./output",
        help="Directory where separated tracks will be saved (default: ./output)"
    )
    parser.add_argument(
        "--format", "-f",
        default="mp3",
        choices=["mp3", "wav"],
        help="Output audio format: mp3 (default) or wav"
    )
    parser.add_argument(
        "--bitrate", "-b",
        default="192k",
        choices=["128k", "192k", "256k", "320k"],
        help="MP3 bitrate (default: 192k)"
    )
    parser.add_argument(
        "--model", "-m",
        default="htdemucs",
        choices=["htdemucs", "htdemucs_ft"],
        help="Separation model: htdemucs (fastest single-file, default) or htdemucs_ft (specialist bag)"
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Output machine-readable JSON (useful for backend workers and scripts)"
    )
    parser.add_argument(
        "--quiet", "-q",
        action="store_true",
        help="Suppress banner and progress output"
    )

    args = parser.parse_args()
    input_file = args.input or args.input_flag

    if not input_file:
        parser.print_help()
        print("\n❌ Error: Please specify an input audio file.")
        print("Example: python separate_cli.py song.mp3 -o ./output")
        sys.exit(1)

    quiet_mode = args.quiet or args.json
    if not quiet_mode:
        print_banner()

    try:
        res = run_separation(
            input_file=input_file,
            output_dir=args.output_dir,
            fmt=args.format,
            bitrate=args.bitrate,
            model=args.model,
            precision="fp16weights",
            providers="cpu",
            quiet=quiet_mode,
            json_mode=args.json
        )
        if args.json:
            print(f"RESULT:{json.dumps(res)}", flush=True)
            print(json.dumps(res, indent=2))
    except Exception as e:
        if args.json:
            print(f"RESULT:{json.dumps({'success': False, 'error': str(e)})}", flush=True)
            print(json.dumps({"success": False, "error": str(e)}), file=sys.stderr)
        else:
            print(f"\n❌ Error during separation: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
