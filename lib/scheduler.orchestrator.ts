import {
  Injectable,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import { CronJob } from 'cron';
import { v4 } from 'uuid';
import { CronOptions } from './decorators/cron.decorator';
import { SchedulerRegistry } from './scheduler.registry';

type TargetHost = { target: Function };
type TimeoutHost = { timeout: number };
type RefHost<T> = { ref?: T };

type CronOptionsHost = {
  options: CronOptions & Record<'cronTime', string | Date | any>;
};

type IntervalOptions = TargetHost & TimeoutHost & RefHost<number>;
type TimeoutOptions = TargetHost & TimeoutHost & RefHost<number>;
type CronJobOptions = TargetHost & CronOptionsHost & RefHost<CronJob>;

@Injectable()
export class SchedulerOrchestrator
  implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly cronJobs: Record<string, CronJobOptions> = {};
  private readonly timeouts: Record<string, TimeoutOptions> = {};
  private readonly intervals: Record<string, IntervalOptions> = {};

  constructor(private readonly schedulerRegistry: SchedulerRegistry) {}

  onApplicationBootstrap() {
    this.mountTimeouts();
    this.mountIntervals();
    this.mountCron();
  }

  onApplicationShutdown() {
    this.clearTimeouts();
    this.clearIntervals();
    this.closeCronJobs();
  }

  mountIntervals() {
    const intervalKeys = Object.keys(this.intervals);
    intervalKeys.forEach((key) => {
      const options = this.intervals[key];
      const intervalRef = setInterval(options.target, options.timeout);

      options.ref = intervalRef;
      this.schedulerRegistry.addInterval(key, intervalRef);
    });
  }

  mountTimeouts() {
    const timeoutKeys = Object.keys(this.timeouts);
    timeoutKeys.forEach((key) => {
      const options = this.timeouts[key];
      const timeoutRef = setTimeout(options.target, options.timeout);

      options.ref = timeoutRef;
      this.schedulerRegistry.addTimeout(key, timeoutRef);
    });
  }

  mountCron() {
    const cronKeys = Object.keys(this.cronJobs);
    cronKeys.forEach((key) => {
      const { options, target } = this.cronJobs[key];
      const cronJob = new CronJob(
        options.cronTime,
        target as any,
        undefined,
        false,
        options.timeZone,
        undefined,
        false,
        options.utcOffset,
        options.unrefTimeout,
      );
  
      if (options.disabled) {
        cronJob.stop();
      }
      else {
        cronJob.start();
      }

      this.cronJobs[key].ref = cronJob;
      this.schedulerRegistry.addCronJob(key, cronJob);
    });
  }

  clearTimeouts() {
    this.schedulerRegistry.getTimeouts().forEach((key) =>
      this.schedulerRegistry.deleteTimeout(key),
    );
  }

  clearIntervals() {
    this.schedulerRegistry.getIntervals().forEach((key) =>
      this.schedulerRegistry.deleteInterval(key),
    );
  }

  closeCronJobs() {
    Array.from(this.schedulerRegistry.getCronJobs().keys()).forEach((key) =>
      this.schedulerRegistry.deleteCronJob(key),
    );
  }

  addTimeout(methodRef: Function, timeout: number, name: string = v4()) {
    this.timeouts[name] = {
      target: methodRef,
      timeout,
    };
  }

  addInterval(methodRef: Function, timeout: number, name: string = v4()) {
    this.intervals[name] = {
      target: methodRef,
      timeout,
    };
  }

  addCron(
    methodRef: Function,
    options: CronOptions & Record<'cronTime', string | Date | any>,
  ) {
    const name = options.name || v4();
    this.cronJobs[name] = {
      target: methodRef,
      options,
    };
  }
}
