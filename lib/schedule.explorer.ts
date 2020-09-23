import { Injectable, OnModuleInit } from '@nestjs/common';
import { DiscoveryService } from '@nestjs/core';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { MetadataScanner } from '@nestjs/core/metadata-scanner';
import { SchedulerType } from './enums/scheduler-type.enum';
import { SchedulerMetadataAccessor } from './schedule-metadata.accessor';
import { SchedulerOrchestrator } from './scheduler.orchestrator';

@Injectable()
export class ScheduleExplorer implements OnModuleInit {
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
      this.metadataScanner.scanFromPrototype(
        instance,
        Object.getPrototypeOf(instance),
        (key: string) => this.lookupSchedulers(instance, key),
      );
    });
  }

  lookupSchedulers(instance: Record<string, Function>, key: string) {
    const methodRef = instance[key];
    const metadata = this.metadataAccessor.getSchedulerType(methodRef);

    switch (metadata) {
      case SchedulerType.CRON: {
        const cronMetadata = this.metadataAccessor.getCronMetadata(methodRef);
        return this.schedulerOrchestrator.addCron(
          methodRef.bind(instance),
          cronMetadata!,
        );
      }
      case SchedulerType.TIMEOUT: {
        const timeoutMetadata = this.metadataAccessor.getTimeoutMetadata(
          methodRef,
        );
        const name = this.metadataAccessor.getSchedulerName(methodRef);
        return this.schedulerOrchestrator.addTimeout(
          methodRef.bind(instance),
          timeoutMetadata!.timeout,
          name,
        );
      }
      case SchedulerType.INTERVAL: {
        const intervalMetadata = this.metadataAccessor.getIntervalMetadata(
          methodRef,
        );
        const name = this.metadataAccessor.getSchedulerName(methodRef);
        return this.schedulerOrchestrator.addInterval(
          methodRef.bind(instance),
          intervalMetadata!.timeout,
          name,
        );
      }
    }
  }
}
