import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ScheduleModule } from '../../lib/schedule.module';
import { SchedulerRegistry } from '../../lib/scheduler.registry';
import { CronService } from '../src/cron.service';

describe('Async Configuration', () => {
  let app: INestApplication;

  afterEach(async () => {
    await app.close();
  });

  it('should provide options using useFactory', async () => {
    const module = await Test.createTestingModule({
      imports: [
        ScheduleModule.forRootAsync({
          useFactory: () => ({
            cronJobs: false,
          }),
        }),
      ],
      providers: [CronService],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    const registry = app.get(SchedulerRegistry);
    expect(registry.doesExist('cron', 'EXECUTES_EVERY_SECOND')).toBeFalsy();
  });

  it('should enable cron jobs by default when using async config', async () => {
    const module = await Test.createTestingModule({
      imports: [
        ScheduleModule.forRootAsync({
          useFactory: () => ({}),
        }),
      ],
      providers: [CronService],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    const registry = app.get(SchedulerRegistry);
    expect(registry.doesExist('cron', 'EXECUTES_EVERY_SECOND')).toBeTruthy();
  });

  it('should provide options using useClass', async () => {
    class ConfigService {
      createScheduleOptions() {
        return {
          cronJobs: false,
        };
      }
    }

    const module = await Test.createTestingModule({
      imports: [
        ScheduleModule.forRootAsync({
          useClass: ConfigService,
        }),
      ],
      providers: [CronService],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    const registry = app.get(SchedulerRegistry);
    expect(registry.doesExist('cron', 'EXECUTES_EVERY_SECOND')).toBeFalsy();
  });
});
