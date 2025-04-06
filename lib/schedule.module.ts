import { DynamicModule, Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { SchedulerMetadataAccessor } from './schedule-metadata.accessor';
import { ScheduleExplorer } from './schedule.explorer';
import { SchedulerOrchestrator } from './scheduler.orchestrator';
import { SchedulerRegistry } from './scheduler.registry';
import { ScheduleModuleOptions } from './interfaces/schedule-module-options.interface';
import { SCHEDULE_MODULE_OPTIONS } from './schedule.constants';

/**
 * @publicApi
 */
@Module({
  imports: [DiscoveryModule],
  providers: [SchedulerMetadataAccessor, SchedulerOrchestrator],
})
export class ScheduleModule {
  static forRoot(options?: ScheduleModuleOptions): DynamicModule {
    const optionsWithDefaults = {
      cronJobs: true,
      intervals: true,
      timeouts: true,
      ...options,
    };
    return {
      global: true,
      module: ScheduleModule,
      providers: [
        ScheduleExplorer,
        SchedulerRegistry,
        {
          provide: SCHEDULE_MODULE_OPTIONS,
          useValue: optionsWithDefaults,
        },
      ],
      exports: [SchedulerRegistry],
    };
  }
}
