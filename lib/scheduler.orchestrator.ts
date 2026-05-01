import {
  BeforeApplicationShutdown,
  Injectable,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { CronCallback, CronJob, CronJobParams } from 'cron';
import { CronOptions } from './decorators/cron.decorator.js';
import { SchedulerRegistry } from './scheduler.registry.js';

type TargetHost = { target: Function };
type TimeoutHost = { timeout: number };
type RefHost<T> = { ref?: T };

type CronOptionsHost = {
  options: CronOptions & Record<'cronTime', CronJobParams['cronTime']>;
};

type IntervalOptions = TargetHost & TimeoutHost & RefHost<number>;
type TimeoutOptions = TargetHost & TimeoutHost & RefHost<number>;
type CronJobOptions = TargetHost &
  CronOptionsHost &
  RefHost<CronJob> & { initialDelayRef?: ReturnType<typeof setTimeout> };

@Injectable()
export class SchedulerOrchestrator
  implements OnApplicationBootstrap, BeforeApplicationShutdown
{
  private readonly cronJobs: Record<string, CronJobOptions> = {};
  private readonly timeouts: Record<string, TimeoutOptions> = {};
  private readonly intervals: Record<string, IntervalOptions> = {};

  constructor(private readonly schedulerRegistry: SchedulerRegistry) {}

  onApplicationBootstrap() {
    this.mountTimeouts();
    this.mountIntervals();
    this.mountCron();
  }

  beforeApplicationShutdown() {
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
      const cronJob = CronJob.from({
        ...options,
        onTick: target as CronCallback<null, false>,
        start: !options.disabled && !options.initialDelay,
      });

      this.cronJobs[key].ref = cronJob;
      this.schedulerRegistry.addCronJob(key, cronJob);

      if (options.initialDelay && options.initialDelay > 0 && !options.disabled) {
        this.cronJobs[key].initialDelayRef = setTimeout(() => {
          if (this.schedulerRegistry.doesExist('cron', key)) {
            cronJob.start();
          }
        }, options.initialDelay);
      }
    });
  }

  clearTimeouts() {
    this.schedulerRegistry
      .getTimeouts()
      .forEach((key) => this.schedulerRegistry.deleteTimeout(key));
  }

  clearIntervals() {
    this.schedulerRegistry
      .getIntervals()
      .forEach((key) => this.schedulerRegistry.deleteInterval(key));
  }

  closeCronJobs() {
    Object.values(this.cronJobs).forEach(({ initialDelayRef }) => {
      if (initialDelayRef !== undefined) {
        clearTimeout(initialDelayRef);
      }
    });
    Array.from(this.schedulerRegistry.getCronJobs().keys()).forEach((key) =>
      this.schedulerRegistry.deleteCronJob(key),
    );
  }

  addTimeout(methodRef: Function, timeout: number, name: string = crypto.randomUUID()) {
    this.timeouts[name] = {
      target: methodRef,
      timeout,
    };
  }

  addInterval(methodRef: Function, timeout: number, name: string = crypto.randomUUID()) {
    this.intervals[name] = {
      target: methodRef,
      timeout,
    };
  }

  addCron(
    methodRef: Function,
    options: CronOptions & Record<'cronTime', CronJobParams['cronTime']>,
  ) {
    const name = options.name || crypto.randomUUID();
    this.cronJobs[name] = {
      target: methodRef,
      options,
    };
  }
}
