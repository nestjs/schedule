import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CronExpression } from '../../lib';
import { SchedulerRegistry } from '../../lib/scheduler.registry';
import { AppModule } from '../src/app.module';

describe('Cron - Resolvable options (DI)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule.registerConfigResolvedCron()],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('should resolve "cronTime" from the DI container', async () => {
    const registry = app.get(SchedulerRegistry);
    const job = registry.getCronJob('CONFIG_RESOLVED_CRON_TIME');

    expect(job.cronTime.source).toEqual(CronExpression.EVERY_SECOND);
    expect(job.isActive).toBe(true);
  });

  it('should resolve "disabled" from the DI container', async () => {
    const registry = app.get(SchedulerRegistry);

    expect(registry.getCronJob('CONFIG_RESOLVED_DISABLED').isActive).toBe(
      false,
    );
  });
});
