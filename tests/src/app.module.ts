import { DynamicModule, Module } from '@nestjs/common';
import { ScheduleModule } from '../../lib/schedule.module';
import { CronService } from './cron.service';
import { IntervalService } from './interval.service';
import { RequestScopedCronService } from './request-scoped-cron.service';
import { RequestScopedIntervalService } from './request-scoped-interval.service';
import { RequestScopedTimeoutService } from './request-scoped-timeout.service';
import { TimeoutService } from './timeout.service';

@Module({})
export class AppModule {
  static registerTimeout(): DynamicModule {
    return {
      module: AppModule,
      imports: [ScheduleModule.forRoot()],
      providers: [TimeoutService],
    };
  }

  static registerRequestScopedTimeout(): DynamicModule {
    return {
      module: AppModule,
      imports: [ScheduleModule.forRoot()],
      providers: [RequestScopedTimeoutService],
    };
  }

  static registerInterval(): DynamicModule {
    return {
      module: AppModule,
      imports: [ScheduleModule.forRoot()],
      providers: [IntervalService],
    };
  }

  static registerRequestScopedInterval(): DynamicModule {
    return {
      module: AppModule,
      imports: [ScheduleModule.forRoot()],
      providers: [RequestScopedIntervalService],
    };
  }

  static registerCron(): DynamicModule {
    return {
      module: AppModule,
      imports: [ScheduleModule.forRoot()],
      providers: [CronService],
    };
  }

  static registerRequestScopedCron(): DynamicModule {
    return {
      module: AppModule,
      imports: [ScheduleModule.forRoot()],
      providers: [RequestScopedCronService],
    };
  }
}
