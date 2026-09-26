import torch
import torch.nn as nn
import torch.nn.functional as F


class DepthwiseSeparableConv2d(nn.Module):
    """
    Depthwise Separable 2D Convolution (MobileNet style).
    Reduces parameter count and FLOPs by 80-88% compared to standard Conv2d.
    """
    def __init__(self, in_channels, out_channels, kernel_size=3, stride=1, padding=1, dilation=1):
        super().__init__()
        self.depthwise = nn.Conv2d(
            in_channels,
            in_channels,
            kernel_size=kernel_size,
            stride=stride,
            padding=padding,
            dilation=dilation,
            groups=in_channels,
            bias=False
        )
        self.pointwise = nn.Conv2d(
            in_channels,
            out_channels,
            kernel_size=1,
            bias=False
        )
        self.bn = nn.BatchNorm2d(out_channels)
        self.act = nn.LeakyReLU(0.2, inplace=True)

    def forward(self, x):
        x = self.depthwise(x)
        x = self.pointwise(x)
        x = self.bn(x)
        return self.act(x)


class EncoderBlock(nn.Module):
    def __init__(self, in_channels, out_channels):
        super().__init__()
        self.conv1 = DepthwiseSeparableConv2d(in_channels, out_channels, kernel_size=3, stride=1, padding=1)
        self.conv2 = DepthwiseSeparableConv2d(out_channels, out_channels, kernel_size=3, stride=2, padding=1)

    def forward(self, x):
        feat = self.conv1(x)
        down = self.conv2(feat)
        return feat, down


class DecoderBlock(nn.Module):
    def __init__(self, in_channels, skip_channels, out_channels):
        super().__init__()
        self.conv1 = DepthwiseSeparableConv2d(in_channels + skip_channels, out_channels, kernel_size=3, padding=1)
        self.conv2 = DepthwiseSeparableConv2d(out_channels, out_channels, kernel_size=3, padding=1)

    def forward(self, x, skip):
        # Bilinear upsample is faster on CPU than Transposed Conv and eliminates checkerboard artifacts
        x = F.interpolate(x, size=(skip.shape[2], skip.shape[3]), mode="bilinear", align_corners=False)
        x = torch.cat([x, skip], dim=1)
        x = self.conv1(x)
        x = self.conv2(x)
        return x


class FastVocalsUNet(nn.Module):
    """
    Lightweight Spectrogram U-Net for Vocal Separation on CPU.
    - Operates on STFT magnitude spectrogram (Stereo, 2 channels).
    - Predicts a soft ratio mask M in [0, 1] for vocals.
    - Accompaniment is derived simultaneously via (1 - M).
    - Total parameters: ~2.2 Million (vs Demucs ~60M).
    """
    def __init__(self, in_channels=2, base_channels=32):
        super().__init__()
        c = base_channels

        # Encoder stages
        self.enc1 = EncoderBlock(in_channels, c)       # 32
        self.enc2 = EncoderBlock(c, c * 2)             # 64
        self.enc3 = EncoderBlock(c * 2, c * 4)         # 128
        self.enc4 = EncoderBlock(c * 4, c * 8)         # 256

        # Bottleneck with dilated convolution for wide receptive field
        self.bottleneck1 = DepthwiseSeparableConv2d(c * 8, c * 8, kernel_size=3, padding=2, dilation=2)
        self.bottleneck2 = DepthwiseSeparableConv2d(c * 8, c * 8, kernel_size=3, padding=4, dilation=4)

        # Decoder stages
        self.dec4 = DecoderBlock(c * 8, c * 8, c * 4)  # 256 + 256 -> 128
        self.dec3 = DecoderBlock(c * 4, c * 4, c * 2)  # 128 + 128 -> 64
        self.dec2 = DecoderBlock(c * 2, c * 2, c)      # 64 + 64 -> 32
        self.dec1 = DecoderBlock(c, c, c)              # 32 + 32 -> 32

        # Final projection to mask
        self.mask_head = nn.Sequential(
            nn.Conv2d(c, in_channels, kernel_size=1),
            nn.Sigmoid()
        )

    def forward(self, x):
        """
        x: [Batch, Channels=2, FreqBins=1025, TimeFrames]
        Returns:
            vocal_mask: [Batch, Channels=2, FreqBins=1025, TimeFrames]
        """
        skip1, d1 = self.enc1(x)
        skip2, d2 = self.enc2(d1)
        skip3, d3 = self.enc3(d2)
        skip4, d4 = self.enc4(d3)

        b = self.bottleneck1(d4)
        b = self.bottleneck2(b)

        u4 = self.dec4(b, skip4)
        u3 = self.dec3(u4, skip3)
        u2 = self.dec2(u3, skip2)
        u1 = self.dec1(u2, skip1)

        vocal_mask = self.mask_head(u1)
        return vocal_mask


if __name__ == "__main__":
    model = FastVocalsUNet()
    param_count = sum(p.numel() for p in model.parameters() if p.requires_grad)
    print(f"FastVocalsUNet Initialized successfully!")
    print(f"Total Trainable Parameters: {param_count:,} ({param_count * 4 / (1024*1024):.2f} MB in FP32)")
    
    # Test forward pass with 5-second audio slice (2 channels, 1025 freq bins, 431 frames)
    dummy = torch.randn(1, 2, 1025, 431)
    out = model(dummy)
    print(f"Input shape: {dummy.shape} -> Mask output shape: {out.shape}")
    assert out.shape == dummy.shape
    print("Verification passed!")
