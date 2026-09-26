import express from 'express';
import { upload } from '../uploadFile.js';
import { processVideo } from '../controller/videoController.js';

const router = express.Router();

router.post("/remove-music-from-video", upload.single("video"), processVideo)

export default router;