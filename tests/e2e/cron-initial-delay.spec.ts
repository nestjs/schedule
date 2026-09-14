import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { INestApplication, Injectable } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CronJob } from 'cron';
import { Cron, CronExpression } from '../../lib/index.js';
import { ScheduleModule } from '../../lib/schedule.module.js';
import { SchedulerRegistry } from '../../lib/scheduler.registry.js';

@Injectable()
class ResurrectionService {
  oldJobCalls = 0;

  @Cron(CronExpression.EVERY_SECOND, {
    name: 'RESURRECT_ME',
    initialDelay: 5000,
  })
  oldJob() {
    ++this.oldJobCalls;
  }
}

describe('Cron initialDelay resurrection', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [ScheduleModule.forRoot()],
      providers: [ResurrectionService],
    }).compile();

    app = module.createNestApplication();
    vi.useFakeTimers({ now: 1577836800000 }); // 2020-01-01T00:00:00.000Z
  });

  afterEach(async () => {
    vi.useRealTimers();
    await app.close();
  });

  it('does not resurrect a deleted initialDelay job when its name is re-registered', async () => {
    const service = app.get(ResurrectionService);
    const registry = app.get(SchedulerRegistry);
    await app.init();

    // Delete the job while its initialDelay timer is still pending.
    registry.deleteCronJob('RESURRECT_ME');

    // Register a brand-new job under the same name.
    let newCalls = 0;
    const replacement = CronJob.from({
      cronTime: CronExpression.EVERY_SECOND,
      onTick: () => {
        ++newCalls;
      },
    });
    registry.addCronJob('RESURRECT_ME', replacement);
    replacement.start();

    // Advance well past the original 5s initialDelay deadline.
    vi.advanceTimersByTime(7000);

    // The new job keeps ticking...
    expect(newCalls).toBeGreaterThan(0);
    // ...while the deleted job must never execute again.
    expect(service.oldJobCalls).toEqual(0);
  });
});
