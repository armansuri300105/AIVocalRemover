import { Queue } from 'bullmq';

export const connection = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
};

export const ytQueue = new Queue('yt-processing', { connection });
export const audioQueue = new Queue('audio-processing', { connection });
export const videoQueue = new Queue('video-processing', { connection });