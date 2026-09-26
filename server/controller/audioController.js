import { extractAudio, mergeAudio, safeDelete, separateAudio, separateAudioDual } from '../services.js';
import path from 'path';
import archiver from 'archiver';

import { audioQueue } from '../services/queue.js';

export const processAudio = async (req, res) => {
   const audioPath = req.file.path;
   const job = await audioQueue.add('process', { audioPath });
   res.json({ jobId: job.id });
};

export const musicRemoveAudio = async (req, res) => {
    const audioPath = req.file.path;

    try {
      const { vocals: only_vocals, no_vocals: only_music } = await separateAudioDual(audioPath, "mp3");
      const absolutePath1 = path.resolve(only_vocals);
      const absolutePath2 = path.resolve(only_music);
      await safeDelete(audioPath);

      const archive = archiver('zip');
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="processed.zip"');

      archive.pipe(res);
      archive.file(absolutePath1, { name: 'vocals.mp3' });
      archive.file(absolutePath2, { name: 'no_vocals.mp3' });
      archive.finalize();

      res.on("finish", async () => {
         await safeDelete(only_vocals);
         await safeDelete(only_music);

         console.log("Cleanup complete.");
      });

   } catch (error) {
      console.error("Processing failed:", error);
      res.status(500).json({ error: "Processing failed", details: error.message });
   }
}

export const musicRemoveVideo = async (req, res) => {
   const videoPath = req.file.path;

   try {
      const extractedAudio = await extractAudio(videoPath);

      const cleanedAudioPath = await separateAudio(extractedAudio, "wav", "vocals");

      const finalVideo = await mergeAudio(videoPath, cleanedAudioPath);

      const absolutePath = path.resolve(finalVideo);
      const fileName = path.parse(extractedAudio).name;
      await safeDelete(videoPath);
      await safeDelete(extractedAudio);
      await safeDelete(cleanedAudioPath);

      res.sendFile(absolutePath);

      res.on("finish", async () => {
         await safeDelete(finalVideo);

         console.log("Cleanup complete.");
      });

   } catch (error) {
      console.error("Processing failed:", error);
      res.status(500).json({ error: "Processing failed", details: error.message });
   }
}