import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DiscoveryService, MetadataScanner } from '@nestjs/core';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper.js';
import { SchedulerType } from './enums/scheduler-type.enum.js';
import { SchedulerMetadataAccessor } from './schedule-metadata.accessor.js';
import { SchedulerOrchestrator } from './scheduler.orchestrator.js';
import { ScheduleModuleOptions } from './interfaces/schedule-module-options.interface.js';
import { CronOptions } from './decorators/cron.decorator.js';
import { SCHEDULE_MODULE_OPTIONS } from './schedule.constants.js';
import { CronJobParams } from 'cron';

const DEFAULT_DISTRIBUTED_LOCK_TTL_MS = 60_000;

@Injectable()
export class ScheduleExplorer implements OnModuleInit {
  private readonly logger = new Logger('Scheduler');

  constructor(
    @Inject(SCHEDULE_MODULE_OPTIONS)
    private readonly moduleOptions: ScheduleModuleOptions,
    private readonly schedulerOrchestrator: SchedulerOrchestrator,
    private readonly discoveryService: DiscoveryService,
    private readonly metadataAccessor: SchedulerMetadataAccessor,
    private readonly metadataScanner: MetadataScanner,
  ) {}

  onModuleInit() {
    this.explore();
  }

  explore() {
    const instanceWrappers: InstanceWrapper[] = [
      ...this.discoveryService.getControllers(),
      ...this.discoveryService.getProviders(),
    ];
    instanceWrappers.forEach((wrapper: InstanceWrapper) => {
      const { instance } = wrapper;

      if (!instance || !Object.getPrototypeOf(instance)) {
        return;
      }

      const processMethod = (name: string) =>
        wrapper.isDependencyTreeStatic()
          ? this.lookupSchedulers(instance, name)
          : this.warnForNonStaticProviders(wrapper, instance, name);

      // TODO(v4): remove this after dropping support for nestjs v9.3.2
      if (!Reflect.has(this.metadataScanner, 'getAllMethodNames')) {
        this.metadataScanner.scanFromPrototype(
          instance,
          Object.getPrototypeOf(instance),
          processMethod,
        );

        return;
      }

      this.metadataScanner
        .getAllMethodNames(Object.getPrototypeOf(instance))
        .forEach(processMethod);
    });
  }

  lookupSchedulers(instance: Record<string, Function>, key: string) {
    const methodRef = instance[key];
    const metadata = this.metadataAccessor.getSchedulerType(methodRef);

    switch (metadata) {
      case SchedulerType.CRON: {
        if (!this.moduleOptions.cronJobs) {
          return;
        }
        const cronMetadata = this.metadataAccessor.getCronMetadata(methodRef);
        const cronFn = this.wrapFunctionInTryCatchBlocks(
          methodRef,
          instance,
          key,
          cronMetadata!,
        );

        return this.schedulerOrchestrator.addCron(cronFn, cronMetadata!);
      }
      case SchedulerType.TIMEOUT: {
        if (!this.moduleOptions.timeouts) {
          return;
        }
        const timeoutMetadata =
          this.metadataAccessor.getTimeoutMetadata(methodRef);
        const name = this.metadataAccessor.getSchedulerName(methodRef);
        const timeoutFn = this.wrapFunctionInTryCatchBlocks(
          methodRef,
          instance,
        );

        return this.schedulerOrchestrator.addTimeout(
          timeoutFn,
          timeoutMetadata!.timeout,
          name,
        );
      }
      case SchedulerType.INTERVAL: {
        if (!this.moduleOptions.intervals) {
          return;
        }
        const intervalMetadata =
          this.metadataAccessor.getIntervalMetadata(methodRef);
        const name = this.metadataAccessor.getSchedulerName(methodRef);
        const intervalFn = this.wrapFunctionInTryCatchBlocks(
          methodRef,
          instance,
        );

        return this.schedulerOrchestrator.addInterval(
          intervalFn,
          intervalMetadata!.timeout,
          name,
        );
      }
    }
  }

  warnForNonStaticProviders(
    wrapper: InstanceWrapper<any>,
    instance: Record<string, Function>,
    key: string,
  ) {
    const methodRef = instance[key];
    const metadata = this.metadataAccessor.getSchedulerType(methodRef);

    switch (metadata) {
      case SchedulerType.CRON: {
        if (!this.moduleOptions.cronJobs) {
          return;
        }
        this.logger.warn(
          `Cannot register cron job "${wrapper.name}@${key}" because it is defined in a non static provider.`,
        );
        break;
      }
      case SchedulerType.TIMEOUT: {
        if (!this.moduleOptions.timeouts) {
          return;
        }
        this.logger.warn(
          `Cannot register timeout "${wrapper.name}@${key}" because it is defined in a non static provider.`,
        );
        break;
      }
      case SchedulerType.INTERVAL: {
        if (!this.moduleOptions.intervals) {
          return;
        }
        this.logger.warn(
          `Cannot register interval "${wrapper.name}@${key}" because it is defined in a non static provider.`,
        );
        break;
      }
    }
  }

  private wrapFunctionInTryCatchBlocks(
    methodRef: Function,
    instance: object,
    methodKey?: string,
    cronMetadata?: CronOptions &
      Record<'cronTime', CronJobParams['cronTime']>,
  ) {
    return async (...args: unknown[]) => {
      try {
        if (cronMetadata?.distributed) {
          const locker = this.moduleOptions.distributed?.locker;
          if (!locker) {
            this.logger.error(
              `Cron "${cronMetadata.name ?? methodKey}" is marked distributed: true but ScheduleModule was not configured with distributed.locker — skipping`,
            );
            return;
          }

          const lockKey =
            cronMetadata.lockKey ??
            cronMetadata.name ??
            `${instance.constructor?.name ?? 'Anonymous'}.${methodKey ?? 'cron'}`;
          const lockTtlMs =
            cronMetadata.lockTtlMs ?? DEFAULT_DISTRIBUTED_LOCK_TTL_MS;

          const acquired = await locker.tryAcquire(lockKey, lockTtlMs);
          if (!acquired) {
            this.logger.debug(
              `Cron "${lockKey}" skipped — another instance holds the distributed lock`,
            );
            return;
          }

          try {
            await methodRef.call(instance, ...args);
          } finally {
            if (typeof locker.release === 'function') {
              try {
                await locker.release(lockKey);
              } catch (releaseError) {
                this.logger.warn(
                  `Failed to release distributed lock "${lockKey}"`,
                  releaseError as Error,
                );
              }
            }
          }
          return;
        }

        await methodRef.call(instance, ...args);
      } catch (error) {
        this.logger.error(error);
      }
    };
  }
}
