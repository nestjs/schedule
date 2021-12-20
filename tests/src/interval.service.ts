import { Injectable } from '@nestjs/common';
import { Interval } from '../../lib/decorators';
import { SchedulerRegistry } from '../../lib/scheduler.registry';

@Injectable()
export class IntervalService {
  called = false;
  calledDynamic = false;

  constructor(private readonly schedulerRegistry: SchedulerRegistry) {}

  @Interval('test', 2500)
  handleInterval() {
    this.called = true;
    clearInterval(this.schedulerRegistry.getInterval('test'));
  }

  addInterval() {
    const intervalRef = setInterval(() => {
      this.calledDynamic = true;
      clearInterval(this.schedulerRegistry.getInterval('dynamic'));
    }, 2500);

    this.schedulerRegistry.addInterval(
      'dynamic',
      intervalRef as unknown as number,
    );
  }

  doesExists(name: string): boolean {
    return this.schedulerRegistry.doesExists('interval', name);
  }
}
