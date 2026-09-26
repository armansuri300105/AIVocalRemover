import { spawn } from "child_process";
import { ytQueue } from '../services/queue.js';
import { randomInt } from "crypto";

export const processYouTube = async (req, res) => {
  const { url, option, format_id } = req.body;
  const jobId = randomInt(100000);
  const job = await ytQueue.add('process', { url, option, format_id, jobId });
  res.json({ jobId: job.id });
};

export const fetchYouTubeMetadata = async (req, res) => {
  const rawUrl = req.query.url;

  if (!rawUrl) {
    return res.status(400).json({ error: "URL query parameter required" });
  }

  const url = rawUrl.trim();

  try {
    const ytdlpBin = process.env.YTDLP_PATH || (process.platform === "win32" ? "yt-dlp" : "/usr/local/bin/yt-dlp");
    const extractorArgs = process.env.YTDLP_EXTRACTOR_ARGS || "youtube:player_client=android;player_skip=web;formats=missing_pot";

    const ytdlp = spawn(ytdlpBin, [
      "--extractor-args",
      extractorArgs,
      "-J",
      url
    ]);

    let output = "";
    let stderrData = "";

    ytdlp.stdout.on("data", (data) => {
      output += data.toString();
    });

    ytdlp.stderr.on("data", (data) => {
      stderrData += data.toString();
      console.warn("yt-dlp metadata log:", data.toString());
    });

    ytdlp.on("error", (err) => {
      console.error("Failed to spawn yt-dlp:", err);
      return res.status(500).json({
        error: "yt-dlp executable error: " + err.message
      });
    });

    ytdlp.on("close", (code) => {
      if (code !== 0) {
        console.error(`yt-dlp metadata failed with code ${code}:`, stderrData);
        return res.status(500).json({
          error: "yt-dlp exited with code " + code,
          details: stderrData.trim()
        });
      }

      try {
        const info = JSON.parse(output);

        const formats = (info.formats || [])
          .filter(f => f.format_id)
          .map(f => ({
            format_id: f.format_id,
            ext: f.ext,
            resolution: f.height ? `${f.height}p` : "audio only",
            filesize: f.filesize || f.filesize_approx || null,
            vcodec: f.vcodec,
            acodec: f.acodec,
            hasVideo: f.vcodec !== "none",
            hasAudio: f.acodec !== "none",
            note: f.format_note || "",
            url: f?.url || "none"
        }));

        formats.sort((a, b) => {
          return (b.filesize || 0) - (a.filesize || 0);
        });

        res.json({
          title: info.title,
          thumbnail: info.thumbnail,
          duration: info.duration,
          formats
        });

      } catch (err) {
        console.error("Parse metadata failed", err);
        res.status(500).json({
          error: "Failed to parse metadata",
          details: err.message
        });
      }
    });

  } catch (err) {
    console.error("Metadata fetch error:", err);
    res.status(500).json({
      error: "Metadata fetch failed",
      details: err.message
    });
  }
};