import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { SchedulerRegistry } from '../../lib/scheduler.registry';
import { AppModule } from '../src/app.module';
import { CronService } from '../src/cron.service';

describe('Cron', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule.registerCron()],
    }).compile();

    app = module.createNestApplication();
    jest.useFakeTimers();
  });

  it(`should schedule "cron"`, async () => {
    const service = app.get(CronService);

    expect(service.callsCount).toEqual(0);

    await app.init();
    jest.runAllTimers();

    expect(service.callsCount).toEqual(3);
  });

  it(`should return cron id by name`, async () => {
    await app.init();
    const registry = app.get(SchedulerRegistry);
    expect(registry.getCronJob('test')).not.toBeUndefined();
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
    expect(job.running).toBeUndefined();
    job.start();
    expect(job.running).toEqual(true);
    jest.runAllTimers();
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

  afterEach(async () => {
    await app.close();
  });
});
