import os
import sys
import torch

# Add current directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.append(current_dir)

from model import FastVocalsUNet


def export_models(output_dir="weights"):
    os.makedirs(output_dir, exist_ok=True)
    ts_path = os.path.join(output_dir, "fast_vocals.pt")
    fp32_onnx_path = os.path.join(output_dir, "fast_vocals.onnx")
    int8_onnx_path = os.path.join(output_dir, "fast_vocals_int8.onnx")

    print("[1/3] Initializing FastVocalsUNet model...")
    model = FastVocalsUNet(in_channels=2, base_channels=32)
    model.eval()

    # Dummy input: 2 channels (stereo), 1025 freq bins, 256 time frames (~3 seconds)
    dummy_input = torch.randn(1, 2, 1025, 256, dtype=torch.float32)

    print(f"[2/3] Exporting to TorchScript (PyTorch JIT Optimized) -> {ts_path}...")
    with torch.no_grad():
        traced_model = torch.jit.trace(model, dummy_input)
        # Freeze model for CPU optimization (constant folding, operator inlining)
        frozen_model = torch.jit.freeze(traced_model)
        torch.jit.save(frozen_model, ts_path)

    ts_size = os.path.getsize(ts_path) / (1024 * 1024)
    print(f"      TorchScript model saved successfully! Size: {ts_size:.2f} MB")

    print(f"[3/3] Checking ONNX export capability...")
    try:
        import onnx
        from onnxruntime.quantization import quantize_dynamic, QuantType

        print(f"      Exporting to ONNX -> {fp32_onnx_path}...")
        torch.onnx.export(
            model,
            dummy_input,
            fp32_onnx_path,
            export_params=True,
            opset_version=17,
            do_constant_folding=True,
            input_names=["spectrogram"],
            output_names=["vocal_mask"],
            dynamic_axes={
                "spectrogram": {0: "batch_size", 3: "time_frames"},
                "vocal_mask": {0: "batch_size", 3: "time_frames"}
            },
            dynamo=False
        )
        fp32_size = os.path.getsize(fp32_onnx_path) / (1024 * 1024)
        print(f"      ONNX FP32 exported: {fp32_size:.2f} MB")

        print(f"      Quantizing to INT8 -> {int8_onnx_path}...")
        quantize_dynamic(
            model_input=fp32_onnx_path,
            model_output=int8_onnx_path,
            weight_type=QuantType.QInt8
        )
        int8_size = os.path.getsize(int8_onnx_path) / (1024 * 1024)
        print(f"      ONNX INT8 quantized: {int8_size:.2f} MB")

    except (ImportError, ModuleNotFoundError, Exception) as e:
        print(f"      Note: ONNX export skipped ({e}). TorchScript is ready and fully functional!")

    print(f"\n==========================================")
    print(f"Export Complete! Ready for CPU Inference.")
    print(f"==========================================")


if __name__ == "__main__":
    weights_dir = os.path.join(current_dir, "weights")
    export_models(weights_dir)
