import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { INestApplication, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  InMemoryCronLocker,
  ScheduleModule,
  SchedulerRegistry,
} from '../../lib/index.js';
import { DistributedCronService } from '../src/distributed-cron.service.js';

@Module({})
class DistributedAppModule {
  static register(locker: InMemoryCronLocker) {
    return {
      module: DistributedAppModule,
      imports: [
        ScheduleModule.forRoot({
          distributed: { locker },
        }),
      ],
      providers: [DistributedCronService],
    };
  }
}

describe('Distributed cron', () => {
  let app: INestApplication;
  let locker: InMemoryCronLocker;

  beforeEach(async () => {
    locker = new InMemoryCronLocker();
    const module = await Test.createTestingModule({
      imports: [DistributedAppModule.register(locker)],
    }).compile();

    app = module.createNestApplication();
    vi.useFakeTimers({ now: 1577836800000 }); // 2020-01-01T00:00:00.000Z
  });

  afterEach(async () => {
    await app?.close();
    vi.useRealTimers();
  });

  it('runs when the distributed lock is acquired', async () => {
    const service = app.get(DistributedCronService);
    await app.init();

    const registry = app.get(SchedulerRegistry);
    registry.getCronJobs().forEach((_, name) => {
      if (name !== 'DISTRIBUTED_EVERY_SECOND') {
        registry.deleteCronJob(name);
      }
    });

    expect(service.callsCount).toEqual(0);
    await vi.advanceTimersByTimeAsync(3_000);
    expect(service.callsCount).toEqual(3);
  });

  it('skips when another instance holds the lock', async () => {
    const service = app.get(DistributedCronService);
    await app.init();

    const registry = app.get(SchedulerRegistry);
    registry.getCronJobs().forEach((_, name) => {
      if (name !== 'DISTRIBUTED_EVERY_SECOND') {
        registry.deleteCronJob(name);
      }
    });

    // Simulate another replica holding the lock for the whole window
    await locker.tryAcquire('test:distributed-cron', 60_000);

    await vi.advanceTimersByTimeAsync(3_000);
    expect(service.callsCount).toEqual(0);
  });

  it('still runs non-distributed crons without a lock', async () => {
    const service = app.get(DistributedCronService);
    await app.init();

    const registry = app.get(SchedulerRegistry);
    registry.getCronJobs().forEach((_, name) => {
      if (name !== 'LOCAL_EVERY_SECOND') {
        registry.deleteCronJob(name);
      }
    });

    // Hold an unrelated lock — local cron must ignore it
    await locker.tryAcquire('test:distributed-cron', 60_000);

    // Reset callsCount tracking — local handler also increments callsCount.
    // After holding the distributed lock, only LOCAL should fire.
    service.callsCount = 0;
    await vi.advanceTimersByTimeAsync(2_000);
    expect(service.callsCount).toEqual(2);
  });
});
