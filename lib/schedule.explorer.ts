import { Injectable, OnModuleInit } from '@nestjs/common';
import { DiscoveryService } from '@nestjs/core';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { MetadataScanner } from '@nestjs/core/metadata-scanner';
import { SchedulerType } from './enums/scheduler-type.enum';
import { SchedulerMetadataAccessor } from './schedule-metadata.accessor';
import { SchedulersOrchestrator } from './schedulers.orchestrator';

@Injectable()
export class ScheduleExplorer implements OnModuleInit {
  constructor(
    private readonly schedulersOrchestrator: SchedulersOrchestrator,
    private readonly discoveryService: DiscoveryService,
    private readonly metadataAccessor: SchedulerMetadataAccessor,
    private readonly metadataScanner: MetadataScanner,
  ) {}

  onModuleInit() {
    this.explore();
  }

  explore() {
    const providers: InstanceWrapper[] = this.discoveryService.getProviders();
    providers.forEach((wrapper: InstanceWrapper) => {
      const { instance } = wrapper;
      if (!instance) {
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
        return this.schedulersOrchestrator.addCron(
          methodRef.bind(instance),
          cronMetadata!,
        );
      }
      case SchedulerType.TIMEOUT: {
        const timeoutMetadata = this.metadataAccessor.getTimeoutMetadata(
          methodRef,
        );
        const name = this.metadataAccessor.getSchedulerName(methodRef);
        return this.schedulersOrchestrator.addTimeout(
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
        return this.schedulersOrchestrator.addInterval(
          methodRef.bind(instance),
          intervalMetadata!.timeout,
          name,
        );
      }
    }
  }
}
