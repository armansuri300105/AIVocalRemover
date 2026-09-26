import { Worker } from 'bullmq';
import { connection } from '../queue.js';
import { safeDelete, separateAudioDual } from '../../services.js';
import path from "path";

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

export const audioWorker = new Worker('audio-processing', async (job) => {
  const { audioPath } = job.data;

  const updateProgressSafe = async (percent, status) => {
    try {
      await job.updateProgress({ percent, status });
    } catch (err) {
      console.warn("[audioWorker] Progress update error:", err.message);
    }
  };

  await updateProgressSafe(5, 'Preparing CPU separation engine...');

  // Single-pass lightweight CPU separation with live chunk progress
  const { vocals: only_vocals, no_vocals: only_music } = await separateAudioDual(
    audioPath,
    "mp3",
    async (percent, status) => {
      await updateProgressSafe(percent, status);
    }
  );

  await updateProgressSafe(96, 'Cleaning up temporary files...');
  console.log("[AudioWorker] Completed:", only_vocals, only_music);

  await safeDelete(audioPath);

  await updateProgressSafe(100, 'Audio separation complete!');

  return {
    previewVocal: `${BASE_URL}/files/preview/${path.basename(only_vocals)}`,
    previewNoVocal: `${BASE_URL}/files/preview/${path.basename(only_music)}`,
    downloadVocal:   `${BASE_URL}/files/download/${path.basename(only_vocals)}`,
    downloadNoVocal: `${BASE_URL}/files/download/${path.basename(only_music)}`,
  };

}, { connection });