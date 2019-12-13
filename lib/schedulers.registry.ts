import { Injectable } from '@nestjs/common';
import { CronJob } from 'cron';

@Injectable()
export class SchedulersRegistry {
  private readonly cronJobs = new Map<string, CronJob>();
  private readonly timeouts = new Map<string, number>();
  private readonly intervals = new Map<string, number>();

  getCron(name: string) {
    return this.cronJobs.get(name);
  }

  getInterval(name: string) {
    return this.intervals.get(name);
  }

  getTimeout(name: string) {
    return this.timeouts.get(name);
  }

  addCron(name: string, job: CronJob) {
    this.cronJobs.set(name, job);
  }

  addInterval(name: string, intervalId: number) {
    this.intervals.set(name, intervalId);
  }

  addTimeout(name: string, timeoutId: number) {
    this.timeouts.set(name, timeoutId);
  }
}
