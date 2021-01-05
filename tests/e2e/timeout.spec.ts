import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { SchedulerRegistry } from '../../lib/scheduler.registry';
import { AppModule } from '../src/app.module';
import { nullPrototypeObjectProvider } from '../src/null-prototype-object.provider';
import { TimeoutService } from '../src/timeout.service';

describe('Timeout', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule.registerTimeout()],
    }).compile();

    app = module.createNestApplication();
    jest.useFakeTimers();
  });

  it(`should schedule "timeout"`, async () => {
    const service = app.get(TimeoutService);

    expect(service.called).toBeFalsy();

    await app.init();
    jest.runAllTimers();

    expect(service.called).toBeTruthy();
  });

  it(`should return timeout id by name`, async () => {
    await app.init();
    const registry = app.get(SchedulerRegistry);
    expect(registry.getTimeout('test')).not.toBeUndefined();
  });

  it(`should add dynamic timeout`, async () => {
    const service = app.get(TimeoutService);
    await app.init();
    service.addTimeout();

    const registry = app.get(SchedulerRegistry);
    expect(registry.getTimeout('dynamic')).not.toBeUndefined();
  });

  it(`should return dynamic timeout`, async () => {
    const service = app.get(TimeoutService);
    await app.init();
    service.addTimeout();

    const registry = app.get(SchedulerRegistry);
    const timeouts = registry.getTimeouts();
    expect(timeouts).toContain('dynamic');

    const timeout = registry.getTimeout('dynamic');
    expect(timeout).toBeDefined();
  });

  it(`should delete dynamic timeout`, async () => {
    const service = app.get(TimeoutService);
    await app.init();
    service.addTimeout();

    const registry = app.get(SchedulerRegistry);
    let timeout = registry.getTimeout('dynamic');
    expect(timeout).toBeDefined();

    registry.deleteTimeout('dynamic');
    try {
      timeout = registry.getTimeout('dynamic');
    } catch (e) {
      expect(e.message).toEqual(
        'No Timeout was found with the given name (dynamic). Check that you created one with a decorator or with the create API.',
      );
    }
  });

  it('should return true for dynamic timeout', async () => {
    const service: TimeoutService = app.get(TimeoutService);
    await app.init();

    service.addTimeout();
    expect(service.isExist('dynamic')).toEqual(true);
  });

  it('should return false for dynamic timeout', async () => {
    const service: TimeoutService = app.get(TimeoutService);
    await app.init();
    expect(service.isExist('dynamic')).toEqual(false);
  });

  it(`should initialize when the consuming module contains a provider with a null prototype`, async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule.registerTimeout()],
      providers: [nullPrototypeObjectProvider],
    }).compile();
    app = module.createNestApplication();

    const instance = await app.init();
    expect(instance).toBeDefined();
  });

  it('should clean up dynamic timeouts on application shutdown', async () => {
    const service = app.get(TimeoutService);
    await app.init();
    service.addTimeout();

    const registry = app.get(SchedulerRegistry);
    await app.close();

    expect(registry.getTimeouts().length).toBe(0);
    expect(jest.getTimerCount()).toBe(0);
  });

  afterEach(async () => {
    await app.close();
  });
});
