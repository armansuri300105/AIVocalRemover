import path from "path";
import fs from "fs";
import express from "express";
import { fileURLToPath } from "url";
import { scheduleFileDeletion } from "../services/cleanupService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DOWNLOAD_DIR = path.resolve(__dirname, "..", "downloads");

const router = express.Router();

router.get("/preview/:filename", (req, res) => {
  const filePath = path.join(DOWNLOAD_DIR, req.params.filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "File not found or expired" });
  }

  res.sendFile(filePath);
});

router.get("/download/:filename", async (req, res) => {
  const filePath = path.join(DOWNLOAD_DIR, req.params.filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "File not found or expired" });
  }

  res.download(filePath, async (err) => {
    if (err) {
      if (err.code === 'ECONNABORTED' || err.message?.includes('aborted')) {
        console.log('Download aborted by client:', filePath);
      } else {
        console.error("Download error:", err);
      }
      return;
    }

    if (process.env.DELETE_IMMEDIATELY_AFTER_DOWNLOAD === "true") {
      try {
        await fs.promises.unlink(filePath);
        console.log("File deleted immediately after download:", filePath);
      } catch (deleteErr) {
        console.error("Delete failed:", deleteErr);
      }
    } else {
      // Schedule deletion after buffer (default 10 mins) so preview and re-downloads remain available
      const bufferMinutes = parseInt(process.env.POST_DOWNLOAD_RETENTION_MINUTES || "10", 10);
      scheduleFileDeletion(filePath, bufferMinutes);
    }
  });
});

export default router;