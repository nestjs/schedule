import { CronJob } from 'cron';
import {
  buildCronProviders,
  CronProvider,
  mergeCronProviders, ScheduleModule,
  useCron,
} from '../../lib';
import { Test } from '@nestjs/testing';
import { SCHEDULE_CRON_PROVIDER_IDENTIFIER } from '../../lib/schedule.constants';
import { SchedulerRegistry } from '../../lib';

function createMockCronProvider(name: string): CronProvider {
  return {
    provide: name,
    useFactory: () => [
      {
        name,
        job: new CronJob('* * * * * *', () => {
        }),
      },
    ],
  };
}

describe('mergeCronProviders', () => {
  it('Should throw if provider is not injected', async () => {
    // Arrange
    const provider = createMockCronProvider('provider');

    // Act
    const cronProvider = mergeCronProviders(provider.provide);

    const act = async () =>
      await Test.createTestingModule({
        providers: [cronProvider],
      }).compile();

    // Assert
    await expect(act).rejects.toThrow();
  });

  it('Should return a cron provider with all CronJobs merged', async () => {
    // Arrange
    const provider1 = createMockCronProvider('provider1');
    const provider2 = createMockCronProvider('provider2');

    // Act
    const cronProvider = mergeCronProviders(
      provider1.provide,
      provider2.provide,
    );

    const moduleRef = await Test.createTestingModule({
      providers: [provider1, provider2, cronProvider],
    }).compile();

    // Act
    const cronJobs = moduleRef.get<CronJob[]>(
      SCHEDULE_CRON_PROVIDER_IDENTIFIER,
    );
    expect(cronJobs.length).toBe(2);
  });
});

describe('buildCronProviders', () => {
  it('Should locally add providers and create merged cron provider', async () => {
    // Arrange
    const provider1 = createMockCronProvider('provider1');
    const provider2 = createMockCronProvider('provider2');

    // Act
    const cronProviders = buildCronProviders(provider1, provider2);

    const moduleRef = await Test.createTestingModule({
      providers: [...cronProviders],
    }).compile();

    // Assert
    const cronJobs = moduleRef.get<CronJob[]>(
      SCHEDULE_CRON_PROVIDER_IDENTIFIER,
    );
    expect(cronJobs.length).toBe(2);
  });
});

describe('useCron', () => {
  it('Should register all cron jobs', async () => {
    // Arrange
    const provider1 = createMockCronProvider('provider1');
    const provider2 = createMockCronProvider('provider2');

    const cronProviders = buildCronProviders(provider1, provider2);
    const moduleRef = await Test.createTestingModule({
      imports: [ScheduleModule.forRoot()],
      providers: [...cronProviders],
    }).compile();

    const scheduleRegistry = moduleRef.get(SchedulerRegistry);

    // Act
    useCron(moduleRef);

    // Assert
    expect([...scheduleRegistry.getCronJobs().keys()]).toEqual([
      'provider1',
      'provider2',
    ]);
  });
});
