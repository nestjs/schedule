import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '../../lib/index.js';

@Injectable()
export class DistributedCronService {
  public callsCount = 0;

  @Cron(CronExpression.EVERY_SECOND, {
    name: 'DISTRIBUTED_EVERY_SECOND',
    distributed: true,
    lockKey: 'test:distributed-cron',
    lockTtlMs: 5_000,
  })
  handleDistributed() {
    this.callsCount += 1;
  }

  @Cron(CronExpression.EVERY_SECOND, {
    name: 'LOCAL_EVERY_SECOND',
  })
  handleLocal() {
    this.callsCount += 1;
  }
}
