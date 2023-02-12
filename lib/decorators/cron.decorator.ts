import { applyDecorators, SetMetadata } from '@nestjs/common';
import { SchedulerType } from '../enums/scheduler-type.enum';
import {
  SCHEDULER_NAME,
  SCHEDULER_TYPE,
  SCHEDULE_CRON_OPTIONS,
} from '../schedule.constants';

/**
 * @ref https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/cron/index.d.ts
 */
export interface CronOptions {
  /**
   * Specify the name of your cron job. This will allow to inject your cron job reference through `@InjectCronRef`.
   */
  name?: string;

  /**
   * Specify the timezone for the execution. This will modify the actual time relative to your timezone. If the timezone is invalid, an error is thrown. You can check all timezones available at [Moment Timezone Website](http://momentjs.com/timezone/). Code will throw if trying to use both ```timeZone``` and ```utcOffset``` together.
   */
  timeZone?: string;

  /**
   * This allows you to specify the offset of your timezone rather than using the ```timeZone``` param. Code will throw if trying to use both ```timeZone``` and ```utcOffset``` together.
   */
  utcOffset?: number;

  /**
   * If you have code that keeps the event loop running and want to stop the node process when that finishes regardless of the state of your cronjob, you can do so making use of this parameter. This is off by default and cron will run as if it needs to control the event loop. For more information take a look at [timers#timers_timeout_unref](https://nodejs.org/api/timers.html#timers_timeout_unref) from the NodeJS docs.
   * @default false
   */
  unrefTimeout?: boolean;

  /**
   * This flag indicates whether the job will be executed at all.
   * @default false
   */
  disabled?: boolean;

  /**
   * Will skip executions until the previous execution is finished, in case of long running jobs.
   * @default false
   */
  preventOverrun?: boolean;

  /**
   * Specify a minimum interval between executions, in addition to your pattern. Specified in milliseconds.
   * @default 0
   */
  interval?: number;

  /**
   * Allows passing an arbitrary object to the triggered function, will be passed as the second argument.
   * @default undefined
   */
  context?: unknown;

  /**
   * Set maximum number of executions before the job is canceled.
   * @default undefined
   */
  maxRuns?: number;

  /**
   * Change how day-of-month and day-of-week are combined. Legacy Mode (default, true) = OR. Alternative mode (false) = AND
   * @default true
   */
  legacyMode?: boolean;
}

/**
 * Creates a scheduled job.
 * @param cronTime The time to fire off your job. This can be in the form of cron syntax or a JS ```Date``` object.
 * @param options Job execution options.
 */
export function Cron(
  cronTime: string | Date,
  options: CronOptions = {},
): MethodDecorator {
  const name = options && options.name;
  return applyDecorators(
    SetMetadata(SCHEDULE_CRON_OPTIONS, {
      ...options,
      cronTime,
    }),
    SetMetadata(SCHEDULER_NAME, name),
    SetMetadata(SCHEDULER_TYPE, SchedulerType.CRON),
  );
}
