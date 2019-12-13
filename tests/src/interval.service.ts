import { Injectable } from '@nestjs/common';
import { Interval } from '../../lib/decorators';
import { SchedulersRegistry } from '../../lib/schedulers.registry';

@Injectable()
export class IntervalService {
  called = false;

  constructor(private readonly schedulersRegistry: SchedulersRegistry) {}

  @Interval('test', 2500)
  handleInterval() {
    this.called = true;
    clearInterval(this.schedulersRegistry.getInterval('test'));
  }
}
