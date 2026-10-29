import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CronJob } from 'cron';
import { CronExpression } from '../../lib/enums/index.js';
import { ScheduleModule } from '../../lib/schedule.module.js';
import { SchedulerRegistry } from '../../lib/scheduler.registry.js';

describe('Cron shutdown', () => {
  let app: INestApplication;
  let registry: SchedulerRegistry;
  let completeWork: () => void;
  let work: Promise<void>;
  let onApplicationShutdown: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    vi.useFakeTimers();
    work = new Promise<void>((resolve) => {
      completeWork = resolve;
    });
    onApplicationShutdown = vi.fn();
    const module = await Test.createTestingModule({
      imports: [ScheduleModule.forRoot()],
      providers: [{ provide: 'resource', useValue: { onApplicationShutdown } }],
    }).compile();
    app = module.createNestApplication();
    await app.init();
    registry = app.get(SchedulerRegistry);
  });

  afterEach(async () => {
    completeWork();
    const closing = app.close();
    await vi.runAllTimersAsync();
    await closing;
    vi.useRealTimers();
  });

  it('should stop all jobs before waiting for active callbacks during shutdown', async () => {
    const lifecycle: string[] = [];
    onApplicationShutdown.mockImplementation(() => lifecycle.push('shutdown'));
    const onComplete = vi.fn();
    const onTick = vi.fn(async () => {
      await work;
      lifecycle.push('job');
    });
    const job = CronJob.from({
      cronTime: CronExpression.EVERY_SECOND,
      onTick,
      onComplete,
      waitForCompletion: true,
      start: true,
    });
    const otherJob = CronJob.from({
      cronTime: CronExpression.EVERY_SECOND,
      onTick: vi.fn(),
      start: true,
    });
    registry.addCronJob('running', job);
    registry.addCronJob('other', otherJob);
    const running = job.fireOnTick();
    const closed = vi.fn();
    const closing = app.close().then(closed);

    await vi.advanceTimersByTimeAsync(0);
    expect(job.isActive).toBe(false);
    expect(otherJob.isActive).toBe(false);
    expect(registry.getCronJobs().size).toBe(0);
    expect(closed).not.toHaveBeenCalled();
    expect(onApplicationShutdown).not.toHaveBeenCalled();

    completeWork();
    await running;
    await vi.runAllTimersAsync();
    await closing;
    expect(onTick).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onApplicationShutdown).toHaveBeenCalledTimes(1);
    expect(lifecycle).toEqual(['job', 'shutdown']);
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each([false, undefined])(
    'should not wait for callbacks when waitForCompletion is %s',
    async (waitForCompletion) => {
      const finished = vi.fn();
      const job = CronJob.from({
        cronTime: CronExpression.EVERY_SECOND,
        onTick: async () => {
          await work;
          finished();
        },
        waitForCompletion,
        start: true,
      });
      registry.addCronJob('running', job);
      await job.fireOnTick();

      await app.close();
      expect(finished).not.toHaveBeenCalled();
      expect(onApplicationShutdown).toHaveBeenCalledTimes(1);
      expect(job.isActive).toBe(false);
      expect(registry.getCronJobs().size).toBe(0);
    },
  );

  it('should keep deleting an active job synchronously from its own callback', async () => {
    const deleted = vi.fn();
    let deletionResult: unknown = 'not deleted';
    const job = CronJob.from({
      cronTime: CronExpression.EVERY_SECOND,
      onTick: async () => {
        deletionResult = registry.deleteCronJob('running');
        await deletionResult;
        deleted();
      },
      waitForCompletion: true,
      start: true,
    });
    registry.addCronJob('running', job);

    await job.fireOnTick();
    expect(deletionResult).toBeUndefined();
    expect(registry.doesExist('cron', 'running')).toBe(false);
    expect(deleted).toHaveBeenCalledTimes(1);
    expect(job.isActive).toBe(false);
    await vi.runAllTimersAsync();
  });
});
