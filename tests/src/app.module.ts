import { DynamicModule, Module } from '@nestjs/common';
import { ScheduleModule } from '../../lib/schedule.module';
import { CronService } from './cron.service';
import { IntervalService } from './interval.service';
import { RequestScopedCronService } from './request-scoped-cron.service';
import { RequestScopedIntervalService } from './request-scoped-interval.service';
import { RequestScopedTimeoutService } from './request-scoped-timeout.service';
import { TimeoutService } from './timeout.service';
import { ScheduleModuleOptions } from '../../lib/interfaces/schedule-module-options.interface';

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
