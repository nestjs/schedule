import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { SchedulersRegistry } from '../../lib/schedulers.registry';
import { AppModule } from '../src/app.module';
import { IntervalService } from '../src/interval.service';

describe('Interval', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule.registerInterval()],
    }).compile();

    app = module.createNestApplication();
    jest.useFakeTimers();
  });

  it(`should schedule "interval"`, async () => {
    const service = app.get(IntervalService);

    expect(service.called).toBeFalsy();

    await app.init();
    jest.runAllTimers();

    expect(service.called).toBeTruthy();
  });

  it(`should return interval id by name`, async () => {
    await app.init();
    const registry = app.get(SchedulersRegistry);
    expect(registry.getInterval('test')).not.toBeUndefined();
  });

  afterEach(async () => {
    await app.close();
  });
});
