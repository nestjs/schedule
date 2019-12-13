import { DynamicModule, Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { SchedulerMetadataAccessor } from './schedule-metadata.accessor';
import { ScheduleExplorer } from './schedule.explorer';
import { SchedulersOrchestrator } from './schedulers.orchestrator';
import { SchedulersRegistry } from './schedulers.registry';

@Module({
  imports: [DiscoveryModule],
  providers: [SchedulerMetadataAccessor, SchedulersOrchestrator],
})
export class ScheduleModule {
  static forRoot(): DynamicModule {
    return {
      global: true,
      module: ScheduleModule,
      providers: [ScheduleExplorer, SchedulersRegistry],
      exports: [SchedulersRegistry],
    };
  }
}
