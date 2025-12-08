import { ModuleMetadata, Type } from '@nestjs/common';

/**
 * @publicApi
 */
export interface ScheduleModuleOptions {
  cronJobs?: boolean;
  intervals?: boolean;
  timeouts?: boolean;
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
