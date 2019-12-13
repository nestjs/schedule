import { DynamicModule, Module } from '@nestjs/common';
import { ScheduleModule } from '../../lib/schedule.module';
import { CronService } from './cron.service';
import { IntervalService } from './interval.service';
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

  static registerInterval(): DynamicModule {
    return {
      module: AppModule,
      imports: [ScheduleModule.forRoot()],
      providers: [IntervalService],
    };
  }

  static registerCron(): DynamicModule {
    return {
      module: AppModule,
      imports: [ScheduleModule.forRoot()],
      providers: [CronService],
    };
  }
}
