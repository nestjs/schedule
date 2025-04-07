import { applyDecorators, SetMetadata } from '@nestjs/common';
import { SchedulerType } from '../enums/scheduler-type.enum';
import {
  SCHEDULER_NAME,
  SCHEDULER_TYPE,
  SCHEDULE_INTERVAL_OPTIONS,
} from '../schedule.constants';

/**
 * Schedules an interval (`setInterval`).
 * 
 * @publicApi
 */
export function Interval(timeout: number): MethodDecorator;
/**
 * Schedules an interval (`setInterval`).
 * 
 * @publicApi
 */
export function Interval(name: string, timeout: number): MethodDecorator;
/**
 * Schedules an interval (`setInterval`).
 * 
 * @publicApi
 */
export function Interval(
  nameOrTimeout: string | number,
  timeout?: number,
): MethodDecorator {
  const [name, intervalTimeout] =
    typeof nameOrTimeout === 'string'
      ? [nameOrTimeout, timeout]
      : [undefined, nameOrTimeout];

  return applyDecorators(
    SetMetadata(SCHEDULE_INTERVAL_OPTIONS, { timeout: intervalTimeout }),
    SetMetadata(SCHEDULER_NAME, name),
    SetMetadata(SCHEDULER_TYPE, SchedulerType.INTERVAL),
  );
}
