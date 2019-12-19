import { Injectable } from '@nestjs/common';
import { Cron } from '../../lib/decorators';
import { SchedulerRegistry } from '../../lib/scheduler.registry';
import { CronJob } from 'cron';

@Injectable()
export class CronService {
  callsCount = 0;
  dynamicCallsCount = 0;

  constructor(private readonly schedulerRegistry: SchedulerRegistry) {}

  @Cron('* * * * * *', {
    name: 'test',
  })
  handleCron() {
    ++this.callsCount;
    if (this.callsCount > 2) {
      const ref = this.schedulerRegistry.getCronJob('test');
      ref!.stop();
    }
  }

  addCronJob(): CronJob {
    const job = new CronJob('* * * * * *', () => {
      ++this.dynamicCallsCount;
      if (this.dynamicCallsCount > 2) {
        const ref = this.schedulerRegistry.getCronJob('dynamic');
        ref!.stop();
      }
    });
    this.schedulerRegistry.addCronJob('dynamic', job);
    return job;
  }
}
