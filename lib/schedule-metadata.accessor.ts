import { Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CronOptions } from './decorators';
import { SchedulerType } from './enums/scheduler-type.enum';
import { IntervalMetadata } from './interfaces/interval-metadata.interface';
import { TimeoutMetadata } from './interfaces/timeout-metadata.interface';
import {
  SCHEDULER_NAME,
  SCHEDULER_TYPE,
  SCHEDULE_CRON_OPTIONS,
  SCHEDULE_INTERVAL_OPTIONS,
  SCHEDULE_TIMEOUT_OPTIONS,
} from './schedule.constants';

@Injectable()
export class SchedulerMetadataAccessor {
  constructor(private readonly reflector: Reflector) {}

  getSchedulerType(target: Function): SchedulerType | undefined {
    return this.reflector.get(SCHEDULER_TYPE, target);
  }

  getSchedulerName(target: Function): string | undefined {
    return this.reflector.get(SCHEDULER_NAME, target);
  }

  getTimeoutMetadata(target: Function): TimeoutMetadata | undefined {
    return this.reflector.get(SCHEDULE_TIMEOUT_OPTIONS, target);
  }

  getIntervalMetadata(target: Function): IntervalMetadata | undefined {
    return this.reflector.get(SCHEDULE_INTERVAL_OPTIONS, target);
  }

  getCronMetadata(
    target: Function,
  ): (CronOptions & Record<'cronTime', string | Date | any>) | undefined {
    return this.reflector.get(SCHEDULE_CRON_OPTIONS, target);
  }
}
