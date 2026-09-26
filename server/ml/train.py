import os
import sys
import glob
import random
import argparse
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader

current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.append(current_dir)

from model import FastVocalsUNet
from inference_cpu import load_audio_ffmpeg


class AudioSeparationDataset(Dataset):
    """
    Dataset loader for vocal separation training.
    Expects directory structure:
      data_dir/
        track_1/
          mixture.wav (or audio.mp3)
          vocals.wav
        track_2/
          mixture.wav
          vocals.wav
    Or loads pairs of (mixture, vocals).
    """
    def __init__(self, root_dir, slice_seconds=6.0, sample_rate=44100):
        self.root_dir = root_dir
        self.slice_samples = int(slice_seconds * sample_rate)
        self.sample_rate = sample_rate
        self.tracks = []

        # Search for track folders
        track_folders = glob.glob(os.path.join(root_dir, "*"))
        for folder in track_folders:
            if os.path.isdir(folder):
                mix_file = None
                for name in ["mixture.wav", "mix.wav", "audio.mp3", "mixture.mp3"]:
                    candidate = os.path.join(folder, name)
                    if os.path.exists(candidate):
                        mix_file = candidate
                        break
                voc_file = os.path.join(folder, "vocals.wav")
                if not os.path.exists(voc_file):
                    voc_file = os.path.join(folder, "vocals.mp3")

                if mix_file and os.path.exists(voc_file):
                    self.tracks.append((mix_file, voc_file))

    def __len__(self):
        return max(len(self.tracks), 1)

    def __getitem__(self, idx):
        if not self.tracks:
            # Generate synthetic random audio slice for dry-run/testing
            mix = np.random.randn(2, self.slice_samples).astype(np.float32) * 0.1
            voc = np.random.randn(2, self.slice_samples).astype(np.float32) * 0.05
            return torch.from_numpy(mix), torch.from_numpy(voc)

        mix_path, voc_path = self.tracks[idx]
        mix_audio = load_audio_ffmpeg(mix_path, sample_rate=self.sample_rate)
        voc_audio = load_audio_ffmpeg(voc_path, sample_rate=self.sample_rate)

        # Ensure equal length
        min_len = min(mix_audio.shape[1], voc_audio.shape[1])
        if min_len > self.slice_samples:
            start = random.randint(0, min_len - self.slice_samples)
            mix_slice = mix_audio[:, start:start + self.slice_samples]
            voc_slice = voc_audio[:, start:start + self.slice_samples]
        else:
            # Pad
            mix_slice = np.pad(mix_audio, ((0, 0), (0, max(0, self.slice_samples - min_len))))
            voc_slice = np.pad(voc_audio, ((0, 0), (0, max(0, self.slice_samples - min_len))))

        return torch.from_numpy(mix_slice), torch.from_numpy(voc_slice)


class SeparationLoss(nn.Module):
    """
    Joint L1 Spectrogram Loss on Vocals and Instrumental Stems.
    """
    def __init__(self, n_fft=2048, hop_length=512):
        super().__init__()
        self.n_fft = n_fft
        self.hop_length = hop_length
        self.register_buffer("window", torch.hann_window(n_fft))
        self.l1 = nn.L1Loss()

    def forward(self, pred_mask, mix_stft, target_voc_stft):
        mix_mag = torch.abs(mix_stft)
        target_voc_mag = torch.abs(target_voc_stft)
        target_music_mag = torch.clamp(mix_mag - target_voc_mag, min=0.0)

        pred_voc_mag = pred_mask * mix_mag
        pred_music_mag = (1.0 - pred_mask) * mix_mag

        # Vocal loss + Instrumental loss
        loss_voc = self.l1(pred_voc_mag, target_voc_mag)
        loss_music = self.l1(pred_music_mag, target_music_mag)

        return loss_voc + 0.8 * loss_music


def train(data_dir, epochs=20, batch_size=4, lr=1e-3, output_dir="weights"):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Starting training FastVocalsUNet on device: {device}")

    os.makedirs(output_dir, exist_ok=True)
    dataset = AudioSeparationDataset(data_dir)
    dataloader = DataLoader(dataset, batch_size=batch_size, shuffle=True, num_workers=0)

    model = FastVocalsUNet(in_channels=2, base_channels=32).to(device)
    optimizer = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs)
    criterion = SeparationLoss().to(device)

    n_fft = 2048
    hop_length = 512
    window = torch.hann_window(n_fft).to(device)

    best_loss = float("inf")

    for epoch in range(1, epochs + 1):
        model.train()
        total_loss = 0.0
        steps = 0

        for mix_audio, voc_audio in dataloader:
            mix_audio = mix_audio.to(device)
            voc_audio = voc_audio.to(device)

            # Compute STFT
            # Shape: [B*2, Freq, Time]
            b, c, t = mix_audio.shape
            mix_flat = mix_audio.view(b * c, t)
            voc_flat = voc_audio.view(b * c, t)

            mix_stft = torch.stft(mix_flat, n_fft=n_fft, hop_length=hop_length, window=window, return_complex=True)
            voc_stft = torch.stft(voc_flat, n_fft=n_fft, hop_length=hop_length, window=window, return_complex=True)

            mix_stft = mix_stft.view(b, c, mix_stft.shape[-2], mix_stft.shape[-1])
            voc_stft = voc_stft.view(b, c, voc_stft.shape[-2], voc_stft.shape[-1])

            mix_mag = torch.abs(mix_stft)

            optimizer.zero_grad()
            mask = model(mix_mag)
            loss = criterion(mask, mix_stft, voc_stft)
            loss.backward()
            optimizer.step()

            total_loss += loss.item()
            steps += 1

        scheduler.step()
        avg_loss = total_loss / max(steps, 1)
        print(f"Epoch [{epoch}/{epochs}] - Loss: {avg_loss:.4f} - LR: {scheduler.get_last_lr()[0]:.6f}")

        # Save checkpoint
        if avg_loss < best_loss:
            best_loss = avg_loss
            ckpt_path = os.path.join(output_dir, "fast_vocals_best.pth")
            torch.save(model.state_dict(), ckpt_path)
            print(f"  -> Checkpoint saved to {ckpt_path}")

    print("Training Complete!")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--data_dir", default="data", help="Path to training dataset")
    parser.add_argument("--epochs", type=int, default=10)
    parser.add_argument("--batch_size", type=int, default=4)
    parser.add_argument("--lr", type=float, default=1e-3)
    args = parser.parse_args()

    train(args.data_dir, epochs=args.epochs, batch_size=args.batch_size, lr=args.lr)
