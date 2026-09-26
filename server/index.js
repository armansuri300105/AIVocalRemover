import express from 'express';
import cors from 'cors';
import downloadRouter from './router/download.js';
import yt_router from "./router/yt-router.js";
import audio_router from "./router/audio-router.js";
import video_router from "./router/video-router.js";
import job_router from "./router/job-router.js";

import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter }   from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter }  from '@bull-board/express';
import { ytQueue, audioQueue, videoQueue } from './services/queue.js';
import './services/workers/ytWorker.js';
import './services/workers/audioWorker.js';
import './services/workers/videoWorker.js';
import { startCleanupScheduler, stopCleanupScheduler } from './services/cleanupService.js';

import { upload } from './uploadFile.js';
import { musicRemoveAudio, musicRemoveVideo } from './controller/audioController.js';

const app = express();
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/yt", yt_router);
app.use("/api/audio", audio_router);
app.use("/api/video", video_router);
app.use("/api/job", job_router);
app.use('/files', downloadRouter);

// Direct processing endpoints for synchronous requests / legacy compatibility
app.post("/api/remove-music-from-video", upload.single("video"), musicRemoveVideo);
app.post("/api/remove-music-from-audio", upload.single("audio"), musicRemoveAudio);

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [
    new BullMQAdapter(ytQueue),
    new BullMQAdapter(audioQueue),
    new BullMQAdapter(videoQueue),
  ],
  serverAdapter,
});

app.use('/admin/queues', serverAdapter.getRouter());

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    startCleanupScheduler();
});

process.on('SIGTERM', () => {
    stopCleanupScheduler();
    server.close();
});

process.on('SIGINT', () => {
    stopCleanupScheduler();
    server.close();
});