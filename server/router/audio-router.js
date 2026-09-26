import express from 'express';
import { upload } from '../uploadFile.js';
import { processAudio } from '../controller/audioController.js';

const router = express.Router();

router.post("/remove-music-from-audio", upload.single("audio"), processAudio)

export default router;