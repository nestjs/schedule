import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DiscoveryService, MetadataScanner } from '@nestjs/core';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { SchedulerType } from './enums/scheduler-type.enum';
import { SchedulerMetadataAccessor } from './schedule-metadata.accessor';
import { SchedulerOrchestrator } from './scheduler.orchestrator';

@Injectable()
export class ScheduleExplorer implements OnModuleInit {
  private readonly logger = new Logger('Scheduler');

  constructor(
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

      this.metadataScanner.getAllMethodNames(
        Object.getPrototypeOf(instance)
      ).forEach(
        (key: string) => wrapper.isDependencyTreeStatic()
          ? this.lookupSchedulers(instance, key)
          : this.warnForNonStaticProviders(wrapper, instance, key),
      );
    });
  }

  lookupSchedulers(instance: Record<string, Function>, key: string) {
    const methodRef = instance[key];
    const metadata = this.metadataAccessor.getSchedulerType(methodRef);

    switch (metadata) {
      case SchedulerType.CRON: {
        const cronMetadata = this.metadataAccessor.getCronMetadata(methodRef);
        const cronFn = this.wrapFunctionInTryCatchBlocks(methodRef, instance);

        return this.schedulerOrchestrator.addCron(cronFn, cronMetadata!);
      }
      case SchedulerType.TIMEOUT: {
        const timeoutMetadata = this.metadataAccessor.getTimeoutMetadata(
          methodRef,
        );
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
        const intervalMetadata = this.metadataAccessor.getIntervalMetadata(
          methodRef,
        );
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
        this.logger.warn(
          `Cannot register cron job "${wrapper.name}@${key}" because it is defined in a non static provider.`,
        );
        break;
      }
      case SchedulerType.TIMEOUT: {
        this.logger.warn(
          `Cannot register timeout "${wrapper.name}@${key}" because it is defined in a non static provider.`,
        );
        break;
      }
      case SchedulerType.INTERVAL: {
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
