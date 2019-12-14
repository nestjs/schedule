import { Injectable } from '@nestjs/common';
import { CronJob } from 'cron';
import { NO_SCHEDULER_FOUND } from './schedule.messages';

@Injectable()
export class SchedulersRegistry {
  private readonly cronJobs = new Map<string, CronJob>();
  private readonly timeouts = new Map<string, number>();
  private readonly intervals = new Map<string, number>();

  getCron(name: string) {
    const ref = this.cronJobs.get(name);
    if (!ref) {
      throw new Error(NO_SCHEDULER_FOUND('Cron', name));
    }
    return ref;
  }

  getInterval(name: string) {
    const ref = this.intervals.get(name);
    if (typeof ref === 'undefined') {
      throw new Error(NO_SCHEDULER_FOUND('Interval', name));
    }
    return ref;
  }

  getTimeout(name: string) {
    const ref = this.timeouts.get(name);
    if (typeof ref === 'undefined') {
      throw new Error(NO_SCHEDULER_FOUND('Timeout', name));
    }
    return ref;
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
