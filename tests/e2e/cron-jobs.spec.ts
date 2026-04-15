import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { INestApplication, Logger } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CronJob } from 'cron';
import { CronExpression } from '../../lib';
import { SchedulerRegistry } from '../../lib/scheduler.registry';
import { AppModule } from '../src/app.module';
import { CronService } from '../src/cron.service';
import { nullPrototypeObjectProvider } from '../src/null-prototype-object.provider';

const deleteAllRegisteredJobsExceptOne = (
  registry: SchedulerRegistry,
  name: string,
) => {
  Array.from(registry.getCronJobs().keys())
    .filter((key) => key !== name)
    .forEach((item) => registry.deleteCronJob(item));
};

describe('Cron', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule.registerCron()],
    }).compile();

    app = module.createNestApplication();
    vi.useFakeTimers({ now: 1577836800000 }); // 2020-01-01T00:00:00.000Z
  });

  it(`should schedule "cron"`, async () => {
    const service = app.get(CronService);

    expect(service.callsCount).toEqual(0);

    await app.init();
    vi.advanceTimersByTime(3000);

    expect(service.callsCount).toEqual(3);
  });

  it(`should catch and log exception inside cron-function added by scheduler`, async () => {
    await app.init();
    const registry = app.get(SchedulerRegistry);
    const errorHandlerSpy = vi.fn();

    registry['logger'].error = vi.fn();
    const job = CronJob.from({
      cronTime: CronExpression.EVERY_SECOND,
      onTick: () => {
        throw new Error('ERROR IN CRONJOB GOT CATCHED');
      },
      errorHandler: errorHandlerSpy,
    });
    registry.addCronJob('THROWS_EXCEPTION_INSIDE', job);
    job.start();
    vi.advanceTimersByTime(1_000);

    expect(errorHandlerSpy).toHaveBeenCalledWith(
      new Error('ERROR IN CRONJOB GOT CATCHED'),
    );
  });

  it(`should run "cron" once after 30 seconds`, async () => {
    const service = app.get(CronService);

    await app.init();
    const registry = app.get(SchedulerRegistry);
    const job = registry.getCronJob('EXECUTES_EVERY_30_SECONDS');
    deleteAllRegisteredJobsExceptOne(registry, 'EXECUTES_EVERY_30_SECONDS');

    expect(job.isActive).toBe(true);
    expect(service.callsCount).toEqual(0);

    vi.advanceTimersByTime(30_000);
    expect(service.callsCount).toEqual(1);
    expect(job.lastDate()).toEqual(new Date('2020-01-01T00:00:30.000Z'));

    vi.advanceTimersByTime(31_000);
    expect(job.isActive).toBe(false);
  });

  it(`should wait for "cron" to complete`, async () => {
    // run every minute for 61 seconds
    // 00:01:00 - 00:02:01
    // 00:02:00 - skipped
    // 00:03:00 - 00:04:01
    // 00:04:00 - skipped
    // 00:05:00 - 00:06:01

    const service = app.get(CronService);

    await app.init();
    const registry = app.get(SchedulerRegistry);
    const job = registry.getCronJob('WAIT_FOR_COMPLETION');
    deleteAllRegisteredJobsExceptOne(registry, 'WAIT_FOR_COMPLETION');

    expect(job.isActive).toBe(true);
    expect(service.callsCount).toEqual(0);

    await vi.advanceTimersByTimeAsync(60_000);
    // 00:01:00
    expect(service.callsCount).toEqual(1);
    expect(service.callsFinishedCount).toEqual(0);
    expect(job.lastDate()).toEqual(new Date('2020-01-01T00:01:00.000Z'));

    await vi.advanceTimersByTimeAsync(1_000);
    // 00:01:01
    expect(service.callsCount).toEqual(1);
    expect(service.callsFinishedCount).toEqual(0);

    await vi.advanceTimersByTimeAsync(59_000);
    // 00:02:00
    expect(service.callsCount).toEqual(1);
    expect(service.callsFinishedCount).toEqual(0);

    await vi.advanceTimersByTimeAsync(1_000);
    // 00:02:01
    expect(service.callsCount).toEqual(1);
    expect(service.callsFinishedCount).toEqual(1);
    expect(job.lastDate()).toEqual(new Date('2020-01-01T00:02:00.000Z'));

    await vi.advanceTimersByTimeAsync(59_000);
    // 00:03:00
    expect(service.callsCount).toEqual(2);
    expect(service.callsFinishedCount).toEqual(1);

    await vi.advanceTimersByTimeAsync(1_000);
    // 00:03:01
    expect(service.callsCount).toEqual(2);
    expect(service.callsFinishedCount).toEqual(1);
    expect(job.lastDate()).toEqual(new Date('2020-01-01T00:03:00.000Z'));

    await vi.advanceTimersByTimeAsync(59_000);
    // 00:04:00
    expect(service.callsCount).toEqual(2);
    expect(service.callsFinishedCount).toEqual(1);

    await vi.advanceTimersByTimeAsync(1_000);
    // 00:04:01
    expect(service.callsCount).toEqual(2);
    expect(service.callsFinishedCount).toEqual(2);
    expect(job.lastDate()).toEqual(new Date('2020-01-01T00:04:00.000Z'));

    await vi.advanceTimersByTimeAsync(59_000);
    // 00:05:00
    expect(service.callsCount).toEqual(3);
    expect(service.callsFinishedCount).toEqual(2);

    await vi.advanceTimersByTimeAsync(61_000);
    // 00:06:01
    expect(service.callsCount).toEqual(3);
    expect(service.callsFinishedCount).toEqual(3);
    expect(job.isActive).toBe(false);
  });

  it(`should run "cron" 3 times every 60 seconds`, async () => {
    const service = app.get(CronService);

    await app.init();
    expect(service.callsCount).toEqual(0);

    const registry = app.get(SchedulerRegistry);
    const job = registry.getCronJob('EXECUTES_EVERY_MINUTE');
    deleteAllRegisteredJobsExceptOne(registry, 'EXECUTES_EVERY_MINUTE');

    vi.advanceTimersByTime(180_000);
    expect(service.callsCount).toEqual(3);
    expect(job.lastDate()).toEqual(new Date('2020-01-01T00:03:00.000Z'));

    vi.advanceTimersByTime(181_000);
    expect(job.isActive).toBe(false);
  });

  it(`should run "cron" 3 times every hour`, async () => {
    const service = app.get(CronService);

    await app.init();
    expect(service.callsCount).toEqual(0);

    const registry = app.get(SchedulerRegistry);
    const job = registry.getCronJob('EXECUTES_EVERY_HOUR');
    deleteAllRegisteredJobsExceptOne(registry, 'EXECUTES_EVERY_HOUR');

    vi.advanceTimersByTime(10_800_000);
    expect(service.callsCount).toEqual(3);
    expect(job.lastDate()).toEqual(new Date('2020-01-01T03:00:00.000Z'));

    vi.advanceTimersByTime(10_801_000);
    expect(job.isActive).toBe(false);
  });

  it(`should not run "cron" at all`, async () => {
    const service = app.get(CronService);

    await app.init();
    const registry = app.get(SchedulerRegistry);

    expect(registry.getCronJob('DISABLED').isActive).toBeFalsy();
  });

  it(`should return cron id by name`, async () => {
    await app.init();
    const registry = app.get(SchedulerRegistry);
    expect(registry.getCronJob('EXECUTES_EVERY_SECOND')).not.toBeUndefined();
  });

  it(`should add dynamic cron job`, async () => {
    const service = app.get(CronService);
    await app.init();
    service.addCronJob();
    const registry = app.get(SchedulerRegistry);
    expect(registry.getCronJob('dynamic')).not.toBeUndefined();
  });

  it(`should return and start dynamic cron job`, async () => {
    const service = app.get(CronService);
    await app.init();
    const addedJob = service.addCronJob();
    const registry = app.get(SchedulerRegistry);
    const jobs = registry.getCronJobs();

    expect(jobs.get('dynamic')).toEqual(addedJob);

    const job = registry.getCronJob('dynamic');
    expect(job).toBeDefined();
    expect(job.isActive).toBe(false);

    job.start();
    expect(job.isActive).toBe(true);

    vi.advanceTimersByTime(3000);
    expect(service.dynamicCallsCount).toEqual(3);
  });

  it(`should delete dynamic cron job`, async () => {
    const service = app.get(CronService);
    await app.init();

    service.addCronJob();

    const registry = app.get(SchedulerRegistry);
    let job = registry.getCronJob('dynamic');
    expect(job).toBeDefined();

    registry.deleteCronJob('dynamic');
    try {
      job = registry.getCronJob('dynamic');
    } catch (e) {
      expect(e.message).toEqual(
        'No Cron Job was found with the given name (dynamic). Check that you created one with a decorator or with the create API.',
      );
    }
  });

  it(`should initialize when the consuming module contains a provider with a null prototype`, async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule.registerCron()],
      providers: [nullPrototypeObjectProvider],
    }).compile();
    app = module.createNestApplication();

    const instance = await app.init();
    expect(instance).toBeDefined();
  });

  it('should clean up dynamic cron jobs on application shutdown', async () => {
    const service = app.get(CronService);
    await app.init();
    service.addCronJob();

    const registry = app.get(SchedulerRegistry);

    await app.close();

    expect(registry.getCronJobs().size).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('should return true for dynamic cron job', async () => {
    const service: CronService = app.get(CronService);
    await app.init();

    service.addCronJob();
    expect(service.doesExist('dynamic')).toEqual(true);
  });

  it('should return false for dynamic cron job', async () => {
    const service: CronService = app.get(CronService);
    await app.init();
    expect(service.doesExist('dynamic')).toEqual(false);
  });

  it('should not execute "cron" before initialDelay elapses', async () => {
    const service = app.get(CronService);
    await app.init();
    const registry = app.get(SchedulerRegistry);
    deleteAllRegisteredJobsExceptOne(registry, 'INITIAL_DELAY');

    // Job should not have fired yet
    vi.advanceTimersByTime(4999);
    expect(service.initialDelayCalls).toEqual(0);

    // After initialDelay (5000ms) the cron starts; one tick at t=6000ms
    vi.advanceTimersByTime(1001);
    expect(service.initialDelayCalls).toEqual(1);
  });

  it('should execute "cron" on schedule after initialDelay', async () => {
    const service = app.get(CronService);
    await app.init();
    const registry = app.get(SchedulerRegistry);
    deleteAllRegisteredJobsExceptOne(registry, 'INITIAL_DELAY');

    // No ticks before the delay
    vi.advanceTimersByTime(5000);
    // Cron fires every second; advance 3 more seconds
    vi.advanceTimersByTime(3000);
    expect(service.initialDelayCalls).toEqual(3);
  });

  it('should not start "cron" when both disabled and initialDelay are set', async () => {
    const service = app.get(CronService);
    await app.init();
    const registry = app.get(SchedulerRegistry);

    expect(
      registry.getCronJob('DISABLED_WITH_INITIAL_DELAY').isActive,
    ).toBeFalsy();

    vi.advanceTimersByTime(5000);
    expect(service.initialDelayCalls).toEqual(0);
    expect(
      registry.getCronJob('DISABLED_WITH_INITIAL_DELAY').isActive,
    ).toBeFalsy();
  });

  it('should not start "cron" after shutdown when initialDelay is pending', async () => {
    const service = app.get(CronService);
    await app.init();

    // Close the app before the 5s delay elapses
    vi.advanceTimersByTime(2000);
    await app.close();

    // Advance past the original delay — timeout must have been cleared
    vi.advanceTimersByTime(5000);
    expect(service.initialDelayCalls).toEqual(0);
  });

  it(`should not log a warning when the provider is not request scoped`, async () => {
    const logger = {
      log: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
    };
    Logger.overrideLogger(logger);
    vi.spyOn(logger, 'warn');

    await app.init();

    expect(logger.warn).not.toHaveBeenCalled();
  });

  afterEach(async () => {
    await app.close();
    vi.useRealTimers();
  });
});

describe('Cron - Request Scoped Provider', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule.registerRequestScopedCron()],
    }).compile();

    app = module.createNestApplication();
    vi.useFakeTimers({ now: 1577836800000 }); // 2020-01-01T00:00:00.000Z
  });

  it(`should log a warning when trying to register a cron in a request scoped provider`, async () => {
    const logger = {
      log: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
    };
    Logger.overrideLogger(logger);
    vi.spyOn(logger, 'warn');

    await app.init();
    const registry = app.get(SchedulerRegistry);

    expect(registry.getCronJobs()).toEqual(new Map());
    expect(logger.warn).toHaveBeenCalledWith(
      'Cannot register cron job "RequestScopedCronService@handleCron" because it is defined in a non static provider.',
      'Scheduler',
    );
  });

  afterEach(async () => {
    await app.close();
    vi.useRealTimers();
  });
});
