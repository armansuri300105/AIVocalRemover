import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from "url"
import dotenv from "dotenv";
import { spawn } from "child_process";

dotenv.config();

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const uploadDir = path.join(__dirname, "uploads")
const DownloadDir = path.join(__dirname, "downloads")

export const extractAudio = (videoPath) => {
    return new Promise((resolve, reject) => {

        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir)
        }
        const outputAudio = path.join(
            uploadDir,
            path.basename(videoPath, path.extname(videoPath)) + ".wav"
        )

        const command = `ffmpeg -y -i "${videoPath}" -vn -acodec pcm_s16le -ar 44100 -ac 2 "${outputAudio}"`

        exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error("FFmpeg extract error:", stderr)
            return reject(error)
        }
        resolve(outputAudio)
        })
    })
}

export const mergeAudio = (videoPath, cleanedAudioPath) => {
    if (!fs.existsSync(DownloadDir)) {
        fs.mkdirSync(DownloadDir)
    }
    return new Promise((resolve, reject) => {
        const outputPath = path.join(
            DownloadDir,
            path.basename(videoPath, path.extname(videoPath)) + "_processed.mp4"
        )

        const command = `ffmpeg -y -i "${videoPath}" -i "${cleanedAudioPath}" -map 0:v:0 -map 1:a:0 -c:v copy -shortest "${outputPath}"`

        exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error("FFmpeg merge error:", stderr)
            return reject(error)
        }
        resolve(outputPath)
        })
    })
}

export const safeDelete = async (targetPath) => {
  try {
    if (fs.existsSync(targetPath)) {
      await fs.promises.rm(targetPath, { recursive: true, force: true });
      console.log("Deleted:", targetPath);
    }
  } catch (err) {
    console.error("Delete error:", err);
  }
};

export const separateAudioDual = (audioPath, option = "mp3", onProgress = null) => {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(DownloadDir)) {
      fs.mkdirSync(DownloadDir, { recursive: true });
    }

    const scriptPath = path.resolve(__dirname, "..", "separate_cli.py");
    const pythonBin = process.env.PYTHON_PATH || (process.platform === "win32" ? "python" : "python3");

    console.log(`[CPU Separator] Running ${pythonBin} ${scriptPath} for ${audioPath}`);
    const py = spawn(pythonBin, [
      scriptPath,
      audioPath,
      "--output_dir", DownloadDir,
      "--format", option,
      "--json"
    ]);

    let stdoutBuffer = "";
    let stderrData = "";
    let finalResult = null;

    py.stdout.on("data", (chunk) => {
      stdoutBuffer += chunk.toString();
      const lines = stdoutBuffer.split(/\r?\n/);
      stdoutBuffer = lines.pop(); // Keep trailing incomplete line

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith("PROGRESS:")) {
          try {
            const p = JSON.parse(trimmed.slice("PROGRESS:".length));
            if (onProgress && typeof onProgress === "function") {
              onProgress(p.percent, p.status);
            }
          } catch (e) {
            // Ignore malformed progress line
          }
        } else if (trimmed.startsWith("RESULT:")) {
          try {
            finalResult = JSON.parse(trimmed.slice("RESULT:".length));
          } catch (e) {
            // Ignore malformed result line
          }
        }
      }
    });

    py.stderr.on("data", (data) => {
      stderrData += data.toString();
      console.error("[CPU Separator Log]:", data.toString());
    });

    py.on("error", (err) => {
      console.error("[CPU Separator Error]:", err);
      reject(err);
    });

    py.on("close", (code) => {
      if (code !== 0) {
        return reject(new Error(`Separation process failed with code ${code}: ${stderrData}`));
      }

      // Check if remaining buffer contains RESULT:
      if (!finalResult && stdoutBuffer) {
        const trimmed = stdoutBuffer.trim();
        if (trimmed.startsWith("RESULT:")) {
          try {
            finalResult = JSON.parse(trimmed.slice("RESULT:".length));
          } catch (e) {}
        }
      }

      if (finalResult && finalResult.success) {
        return resolve({
          vocals: finalResult.vocals,
          no_vocals: finalResult.no_vocals
        });
      }

      // Fallback: look for JSON object in entire accumulated stdout
      try {
        const match = stdoutBuffer.match(/\{[\s\S]*"success"[\s\S]*\}/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          if (parsed.success) {
            return resolve({
              vocals: parsed.vocals,
              no_vocals: parsed.no_vocals
            });
          }
        }
        reject(new Error(finalResult?.error || "Separation output could not be parsed"));
      } catch (err) {
        console.error("Failed to parse separator output:", stdoutBuffer);
        reject(new Error(`Failed to parse separator output: ${err.message}`));
      }
    });
  });
};

export const separateAudio = async (audioPath, option = "mp3", type = "vocals", onProgress = null) => {
  console.log("separateAudio called with:", audioPath, option, type);

  const fileName = path.parse(audioPath).name;
  const targetExt = option.toLowerCase();
  const targetFile = path.join(DownloadDir, `${fileName}_${type}-cleaned.${targetExt}`);

  // Check if target file already exists in downloads
  if (fs.existsSync(targetFile)) {
    console.log(`[Cache Hit] ${targetFile} already exists. Skipping inference.`);
    if (onProgress && typeof onProgress === "function") {
      onProgress(100, "Loaded from cache");
    }
    return targetFile;
  }

  // Run single-pass CPU separation
  const stems = await separateAudioDual(audioPath, option, onProgress);
  return type === "vocals" ? stems.vocals : stems.no_vocals;
};

// Helper to avoid duplicating the FFmpeg logic
const convertToMp3 = (inputWav, outputMp3, cleanupDir, resolve, reject) => {
  console.log("Converting to MP3...");

  const ffmpeg = spawn("ffmpeg", [
    "-y",
    "-i", inputWav,
    "-codec:a", "libmp3lame",
    "-b:a", "128k",
    outputMp3
  ]);

  ffmpeg.stderr.on("data", (data) => console.log("FFMPEG:", data.toString()));
  ffmpeg.on("error", reject);

  ffmpeg.on("close", (code) => {
    if (code !== 0) return reject(new Error("FFmpeg conversion failed"));
    if (!fs.existsSync(outputMp3)) return reject(new Error("MP3 not created"));

    console.log("MP3 created:", outputMp3);
    resolve(outputMp3);
  });
};

export const downloadYouTube = (url, outputPath, mode, formatId = null) => {
  return new Promise((resolve, reject) => {

    console.log("downloadYouTube called with:", url, outputPath, mode, formatId);

    const extractorArgs = process.env.YTDLP_EXTRACTOR_ARGS || "youtube:player_client=android;player_skip=web;formats=missing_pot";
    let args = [
      "--extractor-args",
      extractorArgs
    ];

    // AUDIO ONLY
    if (mode === "audio_with_music" || mode === "vocals_only" || mode === "music_only") {

      const base = outputPath.replace(".mp4", "");

      args.push(
        "-f", formatId || "bestaudio/best",
        "--extract-audio",
        "--audio-format", "mp3",
        "--audio-quality", "0",
        "--no-playlist",
        "-o", `${base}.%(ext)s`,
        url
      );
    }

    // VIDEO MODES
    else {

      args.push(
        "-f",
        formatId ? formatId : "bestvideo+bestaudio/best",
        "--merge-output-format", "mp4",
        "--no-playlist",
        "-o",
        outputPath,
        url
      );

    }

    const ytdlpBin = process.env.YTDLP_PATH || (process.platform === "win32" ? "yt-dlp" : "/usr/local/bin/yt-dlp");
    const ytdlp = spawn(ytdlpBin, args);

    ytdlp.stderr.on("data", (data) => {
      console.log("YTDLP:", data.toString());
    });

    ytdlp.on("error", (err) => {
      reject(err);
    });

    ytdlp.on("close", (code) => {

      if (code !== 0) {
        return reject(new Error("Download failed"));
      }

      // AUDIO RETURN
      if (mode === "audio_with_music" || mode === "vocals_only" || mode === "music_only") {

        const wavPath = outputPath.replace(".mp4", ".wav");

        if (fs.existsSync(wavPath)) {
          return resolve(wavPath);
        }

        const mp3Path = outputPath.replace(".mp4", ".mp3");

        if (fs.existsSync(mp3Path)) {
          return resolve(mp3Path);
        }

        return reject(new Error("Audio file not found"));
      }

      // VIDEO RETURN
      resolve(outputPath);
    });

  });
};