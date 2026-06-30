import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DiscoveryService, MetadataScanner, ModuleRef } from '@nestjs/core';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { CronJobParams } from 'cron';
import {
  CronOptionFactory,
  CronOptions,
  Resolvable,
  ResolvedCronOptions,
} from './decorators/cron.decorator';
import { SchedulerType } from './enums/scheduler-type.enum';
import { SchedulerMetadataAccessor } from './schedule-metadata.accessor';
import { SchedulerOrchestrator } from './scheduler.orchestrator';
import { ScheduleModuleOptions } from './interfaces/schedule-module-options.interface';
import { SCHEDULE_MODULE_OPTIONS } from './schedule.constants';

type CronMetadata = CronOptions & Record<'cronTime', CronJobParams['cronTime']>;
type ResolvedCronMetadata = ResolvedCronOptions &
  Record<'cronTime', CronJobParams['cronTime']>;

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
    private readonly moduleRef: ModuleRef,
  ) {}

  async onModuleInit() {
    await this.explore();
  }

  async explore() {
    const instanceWrappers: InstanceWrapper[] = [
      ...this.discoveryService.getControllers(),
      ...this.discoveryService.getProviders(),
    ];
    const pending: Promise<unknown>[] = [];
    instanceWrappers.forEach((wrapper: InstanceWrapper) => {
      const { instance } = wrapper;

      if (!instance || !Object.getPrototypeOf(instance)) {
        return;
      }

      const processMethod = (name: string) => {
        const result = wrapper.isDependencyTreeStatic()
          ? this.lookupSchedulers(instance, name)
          : this.warnForNonStaticProviders(wrapper, instance, name);
        if (result instanceof Promise) {
          pending.push(result);
        }
      };

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

    await Promise.all(pending);
  }

  async lookupSchedulers(instance: Record<string, Function>, key: string) {
    const methodRef = instance[key];
    const metadata = this.metadataAccessor.getSchedulerType(methodRef);

    switch (metadata) {
      case SchedulerType.CRON: {
        if (!this.moduleOptions.cronJobs) {
          return;
        }
        const cronMetadata = this.metadataAccessor.getCronMetadata(methodRef);
        const cronFn = this.wrapFunctionInTryCatchBlocks(methodRef, instance);
        const resolvedMetadata = await this.resolveCronMetadata(
          cronMetadata!,
        );

        return this.schedulerOrchestrator.addCron(cronFn, resolvedMetadata);
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

  private async resolveCronMetadata(
    metadata: CronMetadata,
  ): Promise<ResolvedCronMetadata> {
    const entries = await Promise.all(
      Object.entries(metadata).map(async ([key, value]) => {
        // `name` is the registry key, not a resolvable value.
        if (key === 'name') {
          return [key, value] as const;
        }
        return [key, await this.resolveValue(value)] as const;
      }),
    );
    return Object.fromEntries(entries) as ResolvedCronMetadata;
  }

  private async resolveValue<T>(value: Resolvable<T>): Promise<T> {
    if (!this.isCronOptionFactory<T>(value)) {
      return value;
    }
    const deps = (value.inject ?? []).map((token) =>
      this.moduleRef.get(token, { strict: false }),
    );
    return value.useFactory(...deps);
  }

  private isCronOptionFactory<T>(
    value: Resolvable<T>,
  ): value is CronOptionFactory<T> {
    return (
      typeof value === 'object' &&
      value !== null &&
      typeof (value as CronOptionFactory<T>).useFactory === 'function'
    );
  }

  private wrapFunctionInTryCatchBlocks(methodRef: Function, instance: object) {
    return async (...args: unknown[]) => {
      try {
        await methodRef.call(instance, ...args);
      } catch (error) {
        this.logger.error(error);
      }
    };
  }
}
