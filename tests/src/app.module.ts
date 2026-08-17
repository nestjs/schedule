import { DynamicModule, Module } from '@nestjs/common';
import { ScheduleModule } from '../../lib/schedule.module.js';
import { CronService } from './cron.service.js';
import { IntervalService } from './interval.service.js';
import { RequestScopedCronService } from './request-scoped-cron.service.js';
import { RequestScopedIntervalService } from './request-scoped-interval.service.js';
import { RequestScopedTimeoutService } from './request-scoped-timeout.service.js';
import { TimeoutService } from './timeout.service.js';
import { ScheduleModuleOptions } from '../../lib/interfaces/schedule-module-options.interface.js';

@Module({})
export class AppModule {
  static registerTimeout(
    scheduleModuleOptions?: ScheduleModuleOptions,
  ): DynamicModule {
    return {
      module: AppModule,
      imports: [ScheduleModule.forRoot(scheduleModuleOptions)],
      providers: [TimeoutService],
    };
  }

  static registerRequestScopedTimeout(
    scheduleModuleOptions?: ScheduleModuleOptions,
  ): DynamicModule {
    return {
      module: AppModule,
      imports: [ScheduleModule.forRoot(scheduleModuleOptions)],
      providers: [RequestScopedTimeoutService],
    };
  }

  static registerInterval(
    scheduleModuleOptions?: ScheduleModuleOptions,
  ): DynamicModule {
    return {
      module: AppModule,
      imports: [ScheduleModule.forRoot(scheduleModuleOptions)],
      providers: [IntervalService],
    };
  }

  static registerRequestScopedInterval(
    scheduleModuleOptions?: ScheduleModuleOptions,
  ): DynamicModule {
    return {
      module: AppModule,
      imports: [ScheduleModule.forRoot(scheduleModuleOptions)],
      providers: [RequestScopedIntervalService],
    };
  }

  static registerCron(
    scheduleModuleOptions?: ScheduleModuleOptions,
  ): DynamicModule {
    return {
      module: AppModule,
      imports: [ScheduleModule.forRoot(scheduleModuleOptions)],
      providers: [CronService],
    };
  }

  static registerRequestScopedCron(
    scheduleModuleOptions?: ScheduleModuleOptions,
  ): DynamicModule {
    return {
      module: AppModule,
      imports: [ScheduleModule.forRoot(scheduleModuleOptions)],
      providers: [RequestScopedCronService],
    };
  }
}
