import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DiscoveryService, MetadataScanner } from '@nestjs/core';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { SchedulerType } from './enums/scheduler-type.enum';
import { SchedulerMetadataAccessor } from './schedule-metadata.accessor';
import { SchedulerOrchestrator } from './scheduler.orchestrator';
import { ScheduleModuleOptions } from './interfaces/schedule-module-options.interface';
import { SCHEDULE_MODULE_OPTIONS } from './schedule.constants';

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
        if (this.moduleOptions.disableCronJobDiscovery) {
          return;
        }
        const cronMetadata = this.metadataAccessor.getCronMetadata(methodRef);
        const cronFn = this.wrapFunctionInTryCatchBlocks(methodRef, instance);

        return this.schedulerOrchestrator.addCron(cronFn, cronMetadata!);
      }
      case SchedulerType.TIMEOUT: {
        if (this.moduleOptions.disableTimeoutDiscovery) {
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
        if (this.moduleOptions.disableIntervalDiscovery) {
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
        if (this.moduleOptions.disableCronJobDiscovery) {
          return;
        }
        this.logger.warn(
          `Cannot register cron job "${wrapper.name}@${key}" because it is defined in a non static provider.`,
        );
        break;
      }
      case SchedulerType.TIMEOUT: {
        if (this.moduleOptions.disableTimeoutDiscovery) {
          return;
        }
        this.logger.warn(
          `Cannot register timeout "${wrapper.name}@${key}" because it is defined in a non static provider.`,
        );
        break;
      }
      case SchedulerType.INTERVAL: {
        if (this.moduleOptions.disableIntervalDiscovery) {
          return;
        }
        this.logger.warn(
          `Cannot register interval "${wrapper.name}@${key}" because it is defined in a non static provider.`,
        );
        break;
      }
    }
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
