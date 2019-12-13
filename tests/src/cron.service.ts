import { Injectable } from '@nestjs/common';
import { Cron } from '../../lib/decorators';
import { SchedulersRegistry } from '../../lib/schedulers.registry';

@Injectable()
export class CronService {
  callsCount = 0;

  constructor(private readonly schedulersRegistry: SchedulersRegistry) {}

  @Cron('* * * * * *', {
    name: 'test',
  })
  handleCron() {
    ++this.callsCount;
    if (this.callsCount > 2) {
      const ref = this.schedulersRegistry.getCron('test');
      ref!.stop();
    }
  }
}
