import express from 'express';
import { processYouTube, fetchYouTubeMetadata } from '../controller/ytController.js';

const router = express.Router();

router.post("/process-youtube", processYouTube);
router.get("/youtube-metadata", fetchYouTubeMetadata);

export default router;