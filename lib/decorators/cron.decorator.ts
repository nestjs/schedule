import { applyDecorators, SetMetadata } from '@nestjs/common';
import { CronJobParams } from 'cron';
import { SchedulerType } from '../enums/scheduler-type.enum';
import {
  SCHEDULE_CRON_OPTIONS,
  SCHEDULER_NAME,
  SCHEDULER_TYPE,
} from '../schedule.constants';

/**
 * Describes how to resolve a cron option value lazily, from the DI container,
 * once the application has been bootstrapped (e.g. to read it from a
 * `ConfigService`). The factory is invoked with the providers listed in
 * `inject`, resolved through `ModuleRef`.
 *
 * @example
 * { inject: [ConfigService], useFactory: (config) => config.get('CRON_TIME') }
 *
 * @publicApi
 */
export type CronOptionFactory<T> = {
  inject?: any[];
  useFactory: (...args: any[]) => T | Promise<T>;
};

/**
 * A cron option that is either a plain value or a {@link CronOptionFactory}
 * resolved from the DI container at bootstrap time.
 *
 * @publicApi
 */
export type Resolvable<T> = T | CronOptionFactory<T>;

/**
 * Reference links: https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/cron/index.d.ts
 *
 * @publicApi
 */
export type CronOptions = {
  /**
   * Specify the name of your cron job. This will allow to inject your cron job reference through `@InjectCronRef`.
   */
  name?: string;

  /**
   * Specify the timezone for the execution. This will modify the actual time relative to your timezone. If the timezone is invalid, an error is thrown. You can check all timezones available at [Moment Timezone Website](http://momentjs.com/timezone/). Probably don't use both ```timeZone``` and ```utcOffset``` together or weird things may happen.
   */
  timeZone?: unknown;
  /**
   * This allows you to specify the offset of your timezone rather than using the ```timeZone``` param. Probably don't use both ```timeZone``` and ```utcOffset``` together or weird things may happen.
   */
  utcOffset?: unknown;

  /**
   * If you have code that keeps the event loop running and want to stop the node process when that finishes regardless of the state of your cronjob, you can do so making use of this parameter. This is off by default and cron will run as if it needs to control the event loop. For more information take a look at [timers#timers_timeout_unref](https://nodejs.org/api/timers.html#timers_timeout_unref) from the NodeJS docs.
   */
  unrefTimeout?: Resolvable<boolean>;

  /**
   * If true, no additional instances of cronjob will run until the current onTick callback has completed.
   * Any new scheduled executions that occur while the current cronjob is running will be skipped entirely.
   */
  waitForCompletion?: Resolvable<boolean>;

  /**
   * This flag indicates whether the job will be executed at all.
   * @default false
   */
  disabled?: Resolvable<boolean>;

  /**
   *  Threshold in ms to control whether to execute or skip missed execution deadlines caused by slow or busy hardware.
   *  Execution delays within threshold will be executed immediately, and otherwise will be skipped.
   *  In both cases a warning will be printed to the console with the job name and cron expression.
   *  Default is 250
   */
  threshold?: Resolvable<number>;

  /**
   * Delay in milliseconds before the first cron execution after application bootstrap.
   * Subsequent runs follow the normal cron schedule.
   * Useful when the job depends on resources that are not yet ready at application startup
   * (e.g. database connections, cache warm-up, external services).
   */
  initialDelay?: Resolvable<number>;
} & ( // make timeZone & utcOffset mutually exclusive
  | {
      timeZone?: Resolvable<string>;
      utcOffset?: never;
    }
  | {
      timeZone?: never;
      utcOffset?: Resolvable<number>;
    }
);

/**
 * {@link CronOptions} after every {@link Resolvable} field has been resolved to
 * a plain value. This is what the scheduler works with internally.
 *
 * @publicApi
 */
export type ResolvedCronOptions = {
  name?: string;
  unrefTimeout?: boolean;
  waitForCompletion?: boolean;
  disabled?: boolean;
  threshold?: number;
  initialDelay?: number;
} & (
  | {
      timeZone?: string;
      utcOffset?: never;
    }
  | {
      timeZone?: never;
      utcOffset?: number;
    }
);

/**
 * Creates a scheduled job.
 * @param cronTime The time to fire off your job. This can be in the form of cron syntax, a JS ```Date``` object or a Luxon ```DateTime``` object. It may also be a {@link CronOptionFactory} to resolve the value from the DI container at bootstrap time.
 * @param options Job execution options.
 *
 * @publicApi
 */
export function Cron(
  cronTime: Resolvable<CronJobParams['cronTime']>,
  options: CronOptions = {},
): MethodDecorator {
  const name = options?.name;
  return applyDecorators(
    SetMetadata(SCHEDULE_CRON_OPTIONS, {
      ...options,
      cronTime,
    }),
    SetMetadata(SCHEDULER_NAME, name),
    SetMetadata(SCHEDULER_TYPE, SchedulerType.CRON),
  );
}
