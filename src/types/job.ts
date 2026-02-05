export interface Job {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  videoPath: string;
  audioPath?: string;
  downloadUrl?: string;
  createdAt: Date;
  error?: string;
}
