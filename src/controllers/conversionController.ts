import { Request, Response } from 'express';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { processJob } from '../services/ffmpegService';
import { jobQueue } from '../services/jobQueue';
import { Job } from '../types/job';

const PORT = 3000; // In a real app, this should come from config/env

export const uploadVideo = (req: Request, res: Response): void => {
  if (!req.file) {
    res.status(400).json({ error: 'No video file provided' });
    return;
  }

  const jobId = uuidv4();
  const videoPath = req.file.path;

  const job: Job = {
    id: jobId,
    status: 'queued',
    videoPath: videoPath,
    createdAt: new Date(),
  };

  jobQueue.addJob(job);

  // Trigger async processing
  processJob(jobId, PORT);

  res.json({ jobId, message: 'Upload successful, conversion started' });
};

export const getJobStatus = (req: Request, res: Response): void => {
  const jobId = req.params.id;
  if (typeof jobId !== 'string') {
    res.status(400).json({ error: 'Invalid job ID' });
    return;
  }
  const job = jobQueue.getJob(jobId);

  if (!job) {
    res.status(404).json({ error: 'Job not found' });
    return;
  }

  res.json({
    id: job.id,
    status: job.status,
    downloadUrl: job.downloadUrl,
    error: job.error,
  });
};

export const deleteJob = (req: Request, res: Response): void => {
  const jobId = req.params.id;
  if (typeof jobId !== 'string') {
    res.status(400).json({ error: 'Invalid job ID' });
    return;
  }

  const job = jobQueue.getJob(jobId);

  if (!job) {
    res.status(404).json({ error: 'Job not found' });
    return;
  }

  // Delete video file
  if (job.videoPath && fs.existsSync(job.videoPath)) {
    try {
      fs.unlinkSync(job.videoPath);
      console.log(`[Job ${jobId}] Deleted video file: ${job.videoPath}`);
    } catch (err) {
      console.error(`[Job ${jobId}] Failed to delete video:`, err);
    }
  }

  // Delete audio file
  if (job.audioPath && fs.existsSync(job.audioPath)) {
    try {
      fs.unlinkSync(job.audioPath);
      console.log(`[Job ${jobId}] Deleted audio file: ${job.audioPath}`);
    } catch (err) {
      console.error(`[Job ${jobId}] Failed to delete audio:`, err);
    }
  }

  // Remove job from queue
  jobQueue.removeJob(jobId);

  res.json({ message: 'Job files cleaned up successfully' });
};
