import { Worker } from 'bullmq';
import { connection } from '../queue.js';
import { extractAudio, mergeAudio, safeDelete, separateAudio } from '../../services.js';
import path from "path";

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

export const videoWorker = new Worker('video-processing', async (job) => {
  const { videoPath, filePath } = job.data;
  const inputVideo = videoPath || filePath;

  await job.updateProgress({ percent: 10, status: 'Extracting audio from video...' });
  const extractedAudio = await extractAudio(inputVideo);

  await job.updateProgress({ percent: 20, status: 'Initializing CPU audio separation...' });
  const cleanedAudioPath = await separateAudio(
    extractedAudio,
    "wav",
    "vocals",
    async (percent, status) => {
      // Map audio separation 0-100 to video job progress 20-75%
      const mapped = Math.round(20 + (percent / 100) * 55);
      try {
        await job.updateProgress({ percent: mapped, status });
      } catch (e) {}
    }
  );

  await job.updateProgress({ percent: 75, status: 'merging video' });
  const finalVideo = await mergeAudio(inputVideo, cleanedAudioPath);

  await safeDelete(extractedAudio);
  await safeDelete(cleanedAudioPath);
  await safeDelete(inputVideo);

  const filename = path.basename(finalVideo);
  await job.updateProgress({ percent: 100, status: 'completed' });

  return {
    downloadUrl: `${BASE_URL}/files/download/${filename}`,
    previewUrl:  `${BASE_URL}/files/preview/${filename}`
  };
}, { connection });