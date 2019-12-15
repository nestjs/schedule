import { Injectable } from '@nestjs/common';
import { Interval } from '../../lib/decorators';
import { SchedulerRegistry } from '../../lib/scheduler.registry';

@Injectable()
export class IntervalService {
  called = false;

  constructor(private readonly schedulerRegistry: SchedulerRegistry) {}

  @Interval('test', 2500)
  handleInterval() {
    this.called = true;
    clearInterval(this.schedulerRegistry.getInterval('test'));
  }
}
