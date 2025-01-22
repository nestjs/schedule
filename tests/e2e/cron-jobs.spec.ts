import { INestApplication, Logger } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CronJob } from 'cron';
import sinon from 'sinon';
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
  let clock: sinon.SinonFakeTimers;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule.registerCron()],
    }).compile();

    app = module.createNestApplication();
    clock = sinon.useFakeTimers({ now: 1577836800000 }); // 2020-01-01T00:00:00.000Z
  });

  it(`should schedule "cron"`, async () => {
    const service = app.get(CronService);

    expect(service.callsCount).toEqual(0);

    await app.init();
    clock.tick(3000);

    expect(service.callsCount).toEqual(3);
  });

  it(`should catch and log exception inside cron-function added by scheduler`, async () => {
    await app.init();
    const registry = app.get(SchedulerRegistry);
    const errorHandlerSpy = jest.fn();

    registry['logger'].error = jest.fn();
    const job = CronJob.from({
      cronTime: CronExpression.EVERY_SECOND,
      onTick: () => {
        throw new Error('ERROR IN CRONJOB GOT CATCHED');
      },
      errorHandler: errorHandlerSpy,
    });
    registry.addCronJob('THROWS_EXCEPTION_INSIDE', job);
    job.start();
    clock.tick('1');

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

    expect(job.running).toBe(true);
    expect(service.callsCount).toEqual(0);

    clock.tick('30');
    expect(service.callsCount).toEqual(1);
    expect(job.lastDate()).toEqual(new Date('2020-01-01T00:00:30.000Z'));

    clock.tick('31');
    expect(job.running).toBe(false);
  });

  it(`should run "cron" once after 30 seconds`, async () => {
    const service = app.get(CronService);

    await app.init();
    const registry = app.get(SchedulerRegistry);
    const job = registry.getCronJob('WAIT_FOR_COMPLETION');
    deleteAllRegisteredJobsExceptOne(registry, 'WAIT_FOR_COMPLETION');

    expect(job.running).toBe(true);
    expect(service.callsCount).toEqual(0);

    clock.tick('30');
    expect(service.callsCount).toEqual(1);
    expect(job.lastDate()).toEqual(new Date('2020-01-01T00:00:30.000Z'));

    clock.tick('31');
    expect(service.callsCount).toEqual(1);
    expect(job.lastDate()).toEqual(new Date('2020-01-01T00:00:30.000Z'));

    clock.tick('32');
    expect(service.callsCount).toEqual(2);
    expect(job.lastDate()).toEqual(new Date('2020-01-01T00:00:32.000Z'));
    expect(job.running).toBe(false);
  });

  it(`should run "cron" 3 times every 60 seconds`, async () => {
    const service = app.get(CronService);

    await app.init();
    expect(service.callsCount).toEqual(0);

    const registry = app.get(SchedulerRegistry);
    const job = registry.getCronJob('EXECUTES_EVERY_MINUTE');
    deleteAllRegisteredJobsExceptOne(registry, 'EXECUTES_EVERY_MINUTE');

    clock.tick('03:00');
    expect(service.callsCount).toEqual(3);
    expect(job.lastDate()).toEqual(new Date('2020-01-01T00:03:00.000Z'));

    clock.tick('03:01');
    expect(job.running).toBe(false);
  });

  it(`should run "cron" 3 times every hour`, async () => {
    const service = app.get(CronService);

    await app.init();
    expect(service.callsCount).toEqual(0);

    const registry = app.get(SchedulerRegistry);
    const job = registry.getCronJob('EXECUTES_EVERY_HOUR');
    deleteAllRegisteredJobsExceptOne(registry, 'EXECUTES_EVERY_HOUR');

    clock.tick('03:00:00');
    expect(service.callsCount).toEqual(3);
    expect(job.lastDate()).toEqual(new Date('2020-01-01T03:00:00.000Z'));

    clock.tick('03:00:01');
    expect(job.running).toBe(false);
  });

  
  it(`should not run "cron" at all`, async () => {
    const service = app.get(CronService);

    await app.init();
    const registry = app.get(SchedulerRegistry);

    expect(registry.getCronJob('DISABLED').running).toBeFalsy();
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
    expect(job.running).toBe(false);

    job.start();
    expect(job.running).toBe(true);

    clock.tick(3000);
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
    expect(clock.countTimers()).toBe(0);
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

  it(`should not log a warning when the provider is not request scoped`, async () => {
    const logger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    };
    Logger.overrideLogger(logger);
    jest.spyOn(logger, 'warn');

    await app.init();

    expect(logger.warn).not.toHaveBeenCalled();
  });

  afterEach(async () => {
    clock.restore();
    await app.close();
  });
});

describe('Cron - Request Scoped Provider', () => {
  let app: INestApplication;
  let clock: sinon.SinonFakeTimers;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule.registerRequestScopedCron()],
    }).compile();

    app = module.createNestApplication();
    clock = sinon.useFakeTimers({ now: 1577836800000 }); // 2020-01-01T00:00:00.000Z
  });

  it(`should log a warning when trying to register a cron in a request scoped provider`, async () => {
    const logger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
    };
    Logger.overrideLogger(logger);
    jest.spyOn(logger, 'warn');

    await app.init();
    const registry = app.get(SchedulerRegistry);

    expect(registry.getCronJobs()).toEqual(new Map());
    expect(logger.warn).toHaveBeenCalledWith(
      'Cannot register cron job "RequestScopedCronService@handleCron" because it is defined in a non static provider.',
      'Scheduler',
    );
  });

  afterEach(async () => {
    clock.restore();
    await app.close();
  });
});
