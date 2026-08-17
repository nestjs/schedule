import { DynamicModule, Module, Provider, Type } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { SchedulerMetadataAccessor } from './schedule-metadata.accessor.js';
import { ScheduleExplorer } from './schedule.explorer.js';
import { SchedulerOrchestrator } from './scheduler.orchestrator.js';
import { SchedulerRegistry } from './scheduler.registry.js';
import {
  ScheduleModuleAsyncOptions,
  ScheduleModuleOptions,
  ScheduleModuleOptionsFactory,
} from './interfaces/schedule-module-options.interface.js';
import { SCHEDULE_MODULE_OPTIONS } from './schedule.constants.js';

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

  static forRootAsync(options: ScheduleModuleAsyncOptions): DynamicModule {
    return {
      global: true,
      module: ScheduleModule,
      imports: options.imports || [],
      providers: [
        ScheduleExplorer,
        SchedulerRegistry,
        ...this.createAsyncProviders(options),
      ],
      exports: [SchedulerRegistry],
    };
  }

  private static createAsyncProviders(
    options: ScheduleModuleAsyncOptions,
  ): Provider[] {
    if (options.useExisting || options.useFactory) {
      return [this.createAsyncOptionsProvider(options)];
    }
    const useClass = options.useClass as Type<ScheduleModuleOptionsFactory>;
    return [
      this.createAsyncOptionsProvider(options),
      {
        provide: useClass,
        useClass: useClass,
      },
    ];
  }

  private static createAsyncOptionsProvider(
    options: ScheduleModuleAsyncOptions,
  ): Provider {
    if (options.useFactory) {
      return {
        provide: SCHEDULE_MODULE_OPTIONS,
        useFactory: async (...args: any[]) => {
          const config = await options.useFactory!(...args);
          return {
            cronJobs: true,
            intervals: true,
            timeouts: true,
            ...config,
          };
        },
        inject: options.inject || [],
      };
    }
    const inject = [
      (options.useClass ||
        options.useExisting) as Type<ScheduleModuleOptionsFactory>,
    ];
    return {
      provide: SCHEDULE_MODULE_OPTIONS,
      useFactory: async (optionsFactory: ScheduleModuleOptionsFactory) => {
        const config = await optionsFactory.createScheduleOptions();
        return {
          cronJobs: true,
          intervals: true,
          timeouts: true,
          ...config,
        };
      },
      inject,
    };
  }
}
