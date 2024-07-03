import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { SchedulerRegistry } from '../../lib/scheduler.registry';
import { AppModule } from '../src/app.module';

describe('Cron', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [
        AppModule.registerCron({
          cronJobs: false,
          intervals: true,
          timeouts: true,
        }),
      ],
    }).compile();

    app = module.createNestApplication();
  });

  it('should not register cron', async () => {
    await app.init();
    const registry = app.get(SchedulerRegistry);
    const count = Array.from(registry.getCronJobs().keys()).length;
    expect(count).toBe(0);
  });

  afterEach(async () => {
    await app.close();
  });
});

describe('Interval', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [
        AppModule.registerInterval({
          cronJobs: true,
          intervals: false,
          timeouts: true,
        }),
      ],
    }).compile();

    app = module.createNestApplication();
  });

  it('should not register interval', async () => {
    await app.init();
    const registry = app.get(SchedulerRegistry);
    const count = registry.getIntervals().length;
    expect(count).toBe(0);
  });

  afterEach(async () => {
    await app.close();
  });
});

describe('Timeout', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [
        AppModule.registerTimeout({
          cronJobs: true,
          intervals: true,
          timeouts: false,
        }),
      ],
    }).compile();

    app = module.createNestApplication();
  });

  it('should not register timeout', async () => {
    await app.init();
    const registry = app.get(SchedulerRegistry);
    const count = registry.getTimeouts().length;
    expect(count).toBe(0);
  });

  afterEach(async () => {
    await app.close();
  });
});
