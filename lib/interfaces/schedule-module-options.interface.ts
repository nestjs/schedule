import { ModuleMetadata, Type } from '@nestjs/common';
import { CronLocker } from './cron-locker.interface.js';

/**
 * Opt-in distributed cron execution across multiple Nest processes.
 * When unset, every instance runs every cron (existing behavior).
 *
 * @publicApi
 */
export interface ScheduleDistributedOptions {
  /**
   * Locker used by cron jobs decorated with `{ distributed: true }`.
   * Provide a Redis-backed implementation for multi-replica deployments.
   */
  locker: CronLocker;
}

/**
 * @publicApi
 */
export interface ScheduleModuleOptions {
  cronJobs?: boolean;
  intervals?: boolean;
  timeouts?: boolean;
  /**
   * Optional cluster-wide cron coordination. Default remains process-local.
   */
  distributed?: ScheduleDistributedOptions;
}

/**
 * @publicApi
 */
export interface ScheduleModuleOptionsFactory {
  createScheduleOptions():
    | Promise<ScheduleModuleOptions>
    | ScheduleModuleOptions;
}

/**
 * @publicApi
 */
export interface ScheduleModuleAsyncOptions
  extends Pick<ModuleMetadata, 'imports'> {
  useExisting?: Type<ScheduleModuleOptionsFactory>;
  useClass?: Type<ScheduleModuleOptionsFactory>;
  useFactory?: (
    ...args: any[]
  ) => Promise<ScheduleModuleOptions> | ScheduleModuleOptions;
  inject?: any[];
}
