import { videoQueue } from '../services/queue.js';

export const processVideo = async (req, res) => {
    const videoPath = req.file.path;
  const job = await videoQueue.add('process', { videoPath });
  res.json({ jobId: job.id });
};