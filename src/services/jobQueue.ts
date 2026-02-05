import { Job } from '../types/job';

class JobQueue {
  private jobs: Map<string, Job>;

  constructor() {
    this.jobs = new Map<string, Job>();
  }

  addJob(job: Job): void {
    this.jobs.set(job.id, job);
  }

  getJob(id: string): Job | undefined {
    return this.jobs.get(id);
  }

  updateJobStatus(id: string, status: Job['status'], error?: string): void {
    const job = this.jobs.get(id);
    if (job) {
      job.status = status;
      if (error) {
        job.error = error;
      }
    }
  }

  // Helper to get all jobs if needed later
  getAllJobs(): Job[] {
    return Array.from(this.jobs.values());
  }

  removeJob(id: string): void {
    this.jobs.delete(id);
  }
}

export const jobQueue = new JobQueue();
