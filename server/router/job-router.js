import express from 'express';
import { getJobStatus } from '../controller/job_controller.js';

const router = express.Router();

router.get("/jobstatus", getJobStatus)

export default router;