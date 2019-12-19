import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { SchedulerRegistry } from '../../lib/scheduler.registry';
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
    const registry = app.get(SchedulerRegistry);
    expect(registry.getInterval('test')).not.toBeUndefined();
  });

  it(`should add dynamic interval`, async () => {
    const service = app.get(IntervalService);
    await app.init();
    service.addInterval();
    const registry = app.get(SchedulerRegistry);
    expect(registry.getInterval('dynamic')).not.toBeUndefined();
  });

  it(`should return dynamic interval`, async () => {
    const service = app.get(IntervalService);
    await app.init();
    service.addInterval();
    const registry = app.get(SchedulerRegistry);
    const intervals = registry.getIntervals();
    expect(intervals).toContain('dynamic');
    const interval = registry.getInterval('dynamic');
    expect(interval).toBeDefined();
  });

  it(`should delete dynamic interval`, async () => {
    const service = app.get(IntervalService);
    await app.init();
    service.addInterval();
    const registry = app.get(SchedulerRegistry);
    let interval = registry.getInterval('dynamic');
    expect(interval).toBeDefined();
    registry.deleteInterval('dynamic');
    try {
      interval = registry.getInterval('dynamic');
    } catch (e) {
      expect(e.message).toEqual(
        'No Interval was found with the given name (dynamic). Check that you created one with a decorator or with the create API.',
      );
    }
  });

  afterEach(async () => {
    await app.close();
  });
});
