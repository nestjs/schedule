import { Injectable } from '@nestjs/common';
import { Cron } from '../../lib/decorators';
import { CronExpression } from '../../lib/enums';
import { SchedulerRegistry } from '../../lib/scheduler.registry';
import { CronJob } from 'cron';

@Injectable()
export class CronService {
  callsCount = 0;
  dynamicCallsCount = 0;

  constructor(private readonly schedulerRegistry: SchedulerRegistry) {}

  @Cron(CronExpression.EVERY_SECOND, {
    name: 'EXECUTES_EVERY_SECOND',
  })
  handleCron() {
    ++this.callsCount;
    if (this.callsCount > 2) {
      const ref = this.schedulerRegistry.getCronJob('EXECUTES_EVERY_SECOND');
      ref!.stop();
    }
  }

  @Cron(CronExpression.EVERY_30_SECONDS, {
    name: 'EXECUTES_EVERY_30_SECONDS',
  })
  handleCronEvery30Seconds() {
    ++this.callsCount;
    if (this.callsCount === 1) {
      const ref = this.schedulerRegistry.getCronJob(
        'EXECUTES_EVERY_30_SECONDS',
      );
      ref!.stop();
    }
  }

  @Cron(CronExpression.EVERY_MINUTE, {
    name: 'EXECUTES_EVERY_MINUTE',
  })
  handleCronEveryMinute() {
    ++this.callsCount;
    if (this.callsCount > 2) {
      const ref = this.schedulerRegistry.getCronJob('EXECUTES_EVERY_MINUTE');
      ref!.stop();
    }
  }

  @Cron(CronExpression.EVERY_HOUR, {
    name: 'EXECUTES_EVERY_HOUR',
  })
  handleCronEveryHour() {
    ++this.callsCount;
    if (this.callsCount > 2) {
      const ref = this.schedulerRegistry.getCronJob('EXECUTES_EVERY_HOUR');
      ref!.stop();
    }
  }

  addCronJob(): CronJob {
    const job = new CronJob(CronExpression.EVERY_SECOND, () => {
      ++this.dynamicCallsCount;
      if (this.dynamicCallsCount > 2) {
        const ref = this.schedulerRegistry.getCronJob('dynamic');
        ref!.stop();
      }
    });
    this.schedulerRegistry.addCronJob('dynamic', job);
    return job;
  }

  isExist(name: string): boolean {
    return this.schedulerRegistry.isExists('cron', name);
  }
}
