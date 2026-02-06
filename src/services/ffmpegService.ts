import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import path from "path";
import { jobQueue } from "./jobQueue";

// Use system ffmpeg (more reliable than ffmpeg-static on some systems)
//VPS
ffmpeg.setFfmpegPath("/usr/local/bin/ffmpeg");
//local
// ffmpeg.setFfmpegPath("/usr/bin/ffmpeg");

ffmpeg.setFfprobePath("/usr/local/bin/ffprobe");
//local
// ffmpeg.setFfprobePath("/usr/bin/ffprobe");

export const processJob = (jobId: string, port: number) => {
  const job = jobQueue.getJob(jobId);
  if (!job) return;

  jobQueue.updateJobStatus(jobId, "processing");
  console.log(`[Job ${jobId}] Starting conversion...`);

  const outputFileName = `audio-${jobId}.mp3`;

  // Ensure uploads directory exists
  const uploadsDir = path.resolve(__dirname, "../../uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const outputPath = path.join(uploadsDir, outputFileName);

  // Check input video exists
  if (!fs.existsSync(job.videoPath)) {
    console.error(`[Job ${jobId}] Video file does not exist: ${job.videoPath}`);
    jobQueue.updateJobStatus(jobId, "failed", "Video file not found");
    return;
  }

  // First, probe the file to check if it has an audio stream
  ffmpeg.ffprobe(job.videoPath, (err, metadata) => {
    if (err) {
      console.error(`[Job ${jobId}] Error probing file:`, err.message);
      jobQueue.updateJobStatus(jobId, "failed", "Failed to analyze video file");
      return;
    }

    // Check if there's an audio stream
    const hasAudio = metadata.streams.some(
      (stream) => stream.codec_type === "audio",
    );
    if (!hasAudio) {
      console.error(`[Job ${jobId}] Video has no audio stream`);
      jobQueue.updateJobStatus(
        jobId,
        "failed",
        "Video file does not contain any audio",
      );
      return;
    }

    console.log(`[Job ${jobId}] Audio stream found, starting conversion...`);

    // Proceed with conversion
    ffmpeg(job.videoPath)
      .toFormat("mp3")
      .noVideo()
      .on("start", (commandLine) => {
        console.log(
          `[Job ${jobId}] Spawned Ffmpeg with command: ${commandLine}`,
        );
      })
      .on("stderr", (stderrLine) => {
        // Optional: log ffmpeg warnings/errors
        // console.log(`[Job ${jobId}] Stderr: ${stderrLine}`);
      })
      .on("end", () => {
        console.log(`[Job ${jobId}] Conversion finished`);

        // Construct download URL
        const downloadUrl = `https://vc.galaxydev.pk/downloads/${outputFileName}`;

        // Update job
        job.status = "completed";
        job.audioPath = outputPath;
        job.downloadUrl = downloadUrl;
      })
      .on("error", (err) => {
        console.error(`[Job ${jobId}] Error:`, err.message || err);
        jobQueue.updateJobStatus(
          jobId,
          "failed",
          err.message || "Unknown ffmpeg error",
        );
      })
      .save(outputPath);
  });
};
