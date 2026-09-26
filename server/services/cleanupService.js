import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directories to monitor and clean up
export const UPLOAD_DIR = path.resolve(__dirname, "..", "uploads");
export const DOWNLOAD_DIR = path.resolve(__dirname, "..", "downloads");
export const OUTPUT_DIR = path.resolve(__dirname, "..", "..", "output");

// Configuration with sensible defaults
// Default retention: 30 minutes. Configurable via FILE_RETENTION_MINUTES in .env
export const RETENTION_MINUTES = Math.max(1, parseInt(process.env.FILE_RETENTION_MINUTES || "30", 10));
export const CLEANUP_INTERVAL_MINUTES = Math.max(1, parseInt(process.env.CLEANUP_INTERVAL_MINUTES || "5", 10));

// Files protected from deletion (e.g. sample tracks, gitkeep files)
const PROTECTED_FILES = new Set([
  ".gitkeep",
  ".gitignore",
  "1.mp3",
  "2.mp3"
]);

let cleanupTimer = null;

function formatBytes(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Scans directories and deletes any files older than retentionMinutes.
 */
export async function cleanupExpiredFiles(retentionMinutes = RETENTION_MINUTES) {
  const cutoffTime = Date.now() - retentionMinutes * 60 * 1000;
  const targetDirs = [UPLOAD_DIR, DOWNLOAD_DIR, OUTPUT_DIR];

  let totalDeleted = 0;
  let totalBytesFreed = 0;

  for (const dir of targetDirs) {
    if (!fs.existsSync(dir)) continue;

    try {
      const entries = await fs.promises.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        if (!entry.isFile()) continue;

        const filename = entry.name;
        if (PROTECTED_FILES.has(filename) || filename.startsWith(".")) continue;

        const fullPath = path.join(dir, filename);

        try {
          const stats = await fs.promises.stat(fullPath);
          const ageMs = Date.now() - stats.mtimeMs;
          const ageMinutes = Math.round(ageMs / (60 * 1000));

          if (stats.mtimeMs < cutoffTime) {
            await fs.promises.unlink(fullPath);
            totalDeleted++;
            totalBytesFreed += stats.size;
            console.log(`[CleanupService] Deleted expired file: ${filename} (Age: ${ageMinutes}m, Size: ${formatBytes(stats.size)})`);
          }
        } catch (fileErr) {
          // File may be locked or already removed
          console.warn(`[CleanupService] Could not process file ${filename}:`, fileErr.message);
        }
      }
    } catch (dirErr) {
      console.error(`[CleanupService] Error scanning directory ${dir}:`, dirErr.message);
    }
  }

  if (totalDeleted > 0) {
    console.log(`[CleanupService] Cleaned ${totalDeleted} expired file(s), freed ${formatBytes(totalBytesFreed)} (Retention: ${retentionMinutes} mins).`);
  }

  return { totalDeleted, totalBytesFreed };
}

/**
 * Schedules a specific file to be deleted after a specified number of minutes.
 */
export function scheduleFileDeletion(filePath, delayMinutes = 10) {
  if (!filePath) return;
  const delayMs = delayMinutes * 60 * 1000;

  setTimeout(async () => {
    try {
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
        console.log(`[CleanupService] Scheduled deletion executed for: ${filePath}`);
      }
    } catch (err) {
      console.warn(`[CleanupService] Failed scheduled deletion for ${filePath}:`, err.message);
    }
  }, delayMs);
}

/**
 * Starts the periodic cleanup scheduler.
 */
export function startCleanupScheduler() {
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
  }

  console.log(`[CleanupService] Initialized. Files older than ${RETENTION_MINUTES} mins in uploads/downloads will be deleted every ${CLEANUP_INTERVAL_MINUTES} mins.`);

  // Run immediate cleanup pass on startup
  cleanupExpiredFiles().catch((err) => console.error("[CleanupService] Initial run error:", err));

  // Schedule periodic cleanup
  const intervalMs = CLEANUP_INTERVAL_MINUTES * 60 * 1000;
  cleanupTimer = setInterval(() => {
    cleanupExpiredFiles().catch((err) => console.error("[CleanupService] Periodic run error:", err));
  }, intervalMs);

  return cleanupTimer;
}

/**
 * Stops the cleanup scheduler (for graceful shutdowns).
 */
export function stopCleanupScheduler() {
  if (cleanupTimer) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
    console.log("[CleanupService] Scheduler stopped.");
  }
}
