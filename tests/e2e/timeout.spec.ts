import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { SchedulersRegistry } from '../../lib/schedulers.registry';
import { AppModule } from '../src/app.module';
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
    const registry = app.get(SchedulersRegistry);
    expect(registry.getTimeout('test')).not.toBeUndefined();
  });

  afterEach(async () => {
    await app.close();
  });
});
