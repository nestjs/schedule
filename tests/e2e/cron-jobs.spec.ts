import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { SchedulersRegistry } from '../../lib/schedulers.registry';
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
    const registry = app.get(SchedulersRegistry);
    expect(registry.getCron('test')).not.toBeUndefined();
  });

  afterEach(async () => {
    await app.close();
  });
});
