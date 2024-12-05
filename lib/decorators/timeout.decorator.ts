import { applyDecorators, SetMetadata } from '@nestjs/common';
import { SchedulerType } from '../enums/scheduler-type.enum';
import {
  SCHEDULER_NAME,
  SCHEDULER_TYPE,
  SCHEDULE_TIMEOUT_OPTIONS,
} from '../schedule.constants';

/**
 * Schedules a timeout (`setTimeout`).
 */
export function Timeout(timeout: number): MethodDecorator;
/**
 * Schedules a timeout (`setTimeout`).
 */
export function Timeout(name: string, timeout: number): MethodDecorator;
/**
 * Schedules a timeout (`setTimeout`).
 */
export function Timeout(
  nameOrTimeout: string | number,
  timeout?: number,
): MethodDecorator {
  const [name, timeoutValue] = typeof nameOrTimeout === 'string'
    ? [nameOrTimeout, timeout]
    : [undefined, nameOrTimeout];

  return applyDecorators(
    SetMetadata(SCHEDULE_TIMEOUT_OPTIONS, { timeout: timeoutValue }),
    SetMetadata(SCHEDULER_NAME, name),
    SetMetadata(SCHEDULER_TYPE, SchedulerType.TIMEOUT),
  );
}
