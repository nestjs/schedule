import { Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CronOptions } from './decorators/index.js';
import { SchedulerType } from './enums/scheduler-type.enum.js';
import { IntervalMetadata } from './interfaces/interval-metadata.interface.js';
import { TimeoutMetadata } from './interfaces/timeout-metadata.interface.js';
import {
  SCHEDULER_NAME,
  SCHEDULER_TYPE,
  SCHEDULE_CRON_OPTIONS,
  SCHEDULE_INTERVAL_OPTIONS,
  SCHEDULE_TIMEOUT_OPTIONS,
} from './schedule.constants.js';

@Injectable()
export class SchedulerMetadataAccessor {
  constructor(private readonly reflector: Reflector) {}

  getSchedulerType(target: Function): SchedulerType | undefined {
    return this.getMetadata(SCHEDULER_TYPE, target);
  }

  getSchedulerName(target: Function): string | undefined {
    return this.getMetadata(SCHEDULER_NAME, target);
  }

  getTimeoutMetadata(target: Function): TimeoutMetadata | undefined {
    return this.getMetadata(SCHEDULE_TIMEOUT_OPTIONS, target);
  }

  getIntervalMetadata(target: Function): IntervalMetadata | undefined {
    return this.getMetadata(SCHEDULE_INTERVAL_OPTIONS, target);
  }

  getCronMetadata(
    target: Function,
  ): (CronOptions & Record<'cronTime', string | Date | any>) | undefined {
    return this.getMetadata(SCHEDULE_CRON_OPTIONS, target);
  }

  private getMetadata<T>(key: string, target: Function): T | undefined {
    const isObject =
      typeof target === 'object'
        ? target !== null
        : typeof target === 'function';

    return isObject ? this.reflector.get(key, target) : undefined;
  }
}
