import {
  FactoryProvider,
  INestApplicationContext,
  InjectionToken,
  LoggerService,
} from '@nestjs/common';
import { SchedulerRegistry } from '../scheduler.registry';
import { SCHEDULE_CRON_PROVIDER_IDENTIFIER } from '../schedule.constants';
import { CronJob } from 'cron';

export type ProvidedCronJob = {
  name: string;
  job: CronJob;
};
export type CronProvider = FactoryProvider<ProvidedCronJob[]>;

export function buildCronProviders<
  T extends FactoryProvider<ProvidedCronJob[]>,
>(...providers: T[]): CronProvider[] {
  return [
    ...providers,
    mergeCronProviders(...providers.map((provider) => provider.provide)),
  ];
}

export function mergeCronProviders(
  ...providers: InjectionToken[]
): CronProvider {
  return {
    provide: SCHEDULE_CRON_PROVIDER_IDENTIFIER,
    useFactory: (...providerJobs: ProvidedCronJob[][]) => providerJobs.flat(),
    inject: providers,
  };
}

export function useCron(
  app: INestApplicationContext,
  logger?: LoggerService,
): void {
  const schedulerRegistry = app.get(SchedulerRegistry);
  const jobs = app.get(SCHEDULE_CRON_PROVIDER_IDENTIFIER) as ProvidedCronJob[];

  jobs.forEach((job) => {
    schedulerRegistry.addCronJob(job.name, job.job);
  });

  if (logger) {
    const registeredJobs = schedulerRegistry.getCronJobs().keys();
    logger.log(`Registered CRON jobs: ${[...registeredJobs]}`);
  }
}
