import { Injectable } from '@nestjs/common';
import { Cron } from '../../lib/decorators';
import { SchedulerRegistry } from '../../lib/scheduler.registry';

@Injectable()
export class CronService {
  callsCount = 0;

  constructor(private readonly schedulerRegistry: SchedulerRegistry) {}

  @Cron('* * * * * *', {
    name: 'test',
  })
  handleCron() {
    ++this.callsCount;
    if (this.callsCount > 2) {
      const ref = this.schedulerRegistry.getCron('test');
      ref!.stop();
    }
  }
}
