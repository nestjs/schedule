import { Injectable } from '@nestjs/common';
import { Cron } from '../../lib/decorators';
import { CronExpression } from '../../lib/enums';
import { SchedulerRegistry } from '../../lib/scheduler.registry';
import { CronJob } from 'cron';

@Injectable()
export class CronService {
  callsCount = 0;
  callsFinishedCount = 0;
  dynamicCallsCount = 0;

  constructor(private readonly schedulerRegistry: SchedulerRegistry) {}

  @Cron(CronExpression.EVERY_SECOND, {
    name: 'EXECUTES_EVERY_SECOND',
    utcOffset: 0,
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
    utcOffset: 0,
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
    utcOffset: 0,
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
    utcOffset: 0,
  })
  handleCronEveryHour() {
    ++this.callsCount;
    if (this.callsCount > 2) {
      const ref = this.schedulerRegistry.getCronJob('EXECUTES_EVERY_HOUR');
      ref!.stop();
    }
  }

  @Cron(CronExpression.EVERY_30_SECONDS, {
    name: 'DISABLED',
    disabled: true,
    utcOffset: 0,
  })
  handleDisabledCron() {}

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

  @Cron(CronExpression.EVERY_MINUTE, {
    name: 'WAIT_FOR_COMPLETION',
    waitForCompletion: true,
    utcOffset: 0,
  })
  async handleLongRunningCron() {
    ++this.callsCount;
    await new Promise((r) => setTimeout(r, 61 * 1000));
    ++this.callsFinishedCount;

    if (this.callsCount > 2) {
      const ref = this.schedulerRegistry.getCronJob('WAIT_FOR_COMPLETION');
      ref!.stop();
    }
  }

  doesExist(name: string): boolean {
    return this.schedulerRegistry.doesExist('cron', name);
  }
}
