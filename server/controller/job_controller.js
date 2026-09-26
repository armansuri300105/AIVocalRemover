import { ytQueue, audioQueue, videoQueue } from '../services/queue.js';

export const getJobStatus = async (req, res) => {
  const { id, type } = req.query;

  const queueMap = {
    youtube: ytQueue,
    audio:   audioQueue,
    video:   videoQueue,
  };

  const queue = queueMap[type];
  if (!queue) return res.status(400).json({ error: 'Invalid job type' });

  const job = await queue.getJob(id);
  if (!job) return res.status(404).json({ error: 'Job not found' });

  const state    = await job.getState();
  const progress = job.progress;
  const result   = job.returnvalue;
  const reason   = job.failedReason;

  res.json({ state, progress, result, reason });
};