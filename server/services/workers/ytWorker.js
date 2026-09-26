import { Worker } from 'bullmq';
import { downloadYouTube, mergeAudio, safeDelete, separateAudio } from '../../services.js';
import path from "path";
import { fileURLToPath } from "url";
import { connection } from "../queue.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const downloadDir = path.resolve(__dirname, '..', '..', 'downloads');

export const youtubeWorker = new Worker('yt-processing', async (job) => {
  const { url, option, formatId, jobId } = job.data;

  const updateProgressSafe = async (percent, status) => {
    try {
      await job.updateProgress({ percent, status });
    } catch (e) {}
  };

  const outputPath = path.join(downloadDir, `${jobId}.mp4`);

  await updateProgressSafe(10, 'Downloading media from YouTube...');
  const downloaded = await downloadYouTube(url, outputPath, option, formatId);

  let filePath = downloaded;

  if (option === 'vocals_only') {
    await updateProgressSafe(25, 'Separating vocals on CPU...');
    const cleanAudio = await separateAudio(downloaded, 'mp3', 'vocals', async (pct, status) => {
      await updateProgressSafe(Math.round(25 + (pct / 100) * 70), status);
    });
    await safeDelete(downloaded);
    filePath = cleanAudio;

  } else if (option === 'music_only') {
    await updateProgressSafe(25, 'Separating accompaniment (music) on CPU...');
    const cleanAudio = await separateAudio(downloaded, 'mp3', 'no_vocals', async (pct, status) => {
      await updateProgressSafe(Math.round(25 + (pct / 100) * 70), status);
    });
    await safeDelete(downloaded);
    filePath = cleanAudio;

  } else if (option === 'video_no_music') {
    await updateProgressSafe(25, 'Separating video audio track on CPU...');
    const cleanAudio = await separateAudio(downloaded, 'wav', 'vocals', async (pct, status) => {
      await updateProgressSafe(Math.round(25 + (pct / 100) * 55), status);
    });
    await updateProgressSafe(85, 'Merging video with clean vocals track...');
    const merged = await mergeAudio(downloaded, cleanAudio);
    await safeDelete(downloaded);
    await safeDelete(cleanAudio);
    filePath = merged;
  }

  const filename = path.basename(filePath);

  await updateProgressSafe(100, 'Processing completed!');

  const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

  return { 
    downloadUrl: `${BASE_URL}/files/download/${filename}`,
    previewUrl:  `${BASE_URL}/files/preview/${filename}`
  };

}, { connection });