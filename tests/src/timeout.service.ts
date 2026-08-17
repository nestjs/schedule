import { Injectable } from '@nestjs/common';
import { Timeout } from '../../lib/decorators/index.js';
import { SchedulerRegistry } from '../../lib/scheduler.registry.js';

@Injectable()
export class TimeoutService {
  called = false;
  calledDynamic = false;

  constructor(private readonly schedulerRegistry: SchedulerRegistry) {}

  @Timeout('test', 2500)
  handleTimeout() {
    this.called = true;
  }

  addTimeout() {
    const timeoutRef = setTimeout(() => {
      this.calledDynamic = true;
      clearTimeout(this.schedulerRegistry.getTimeout('dynamic'));
    }, 2500);

    this.schedulerRegistry.addTimeout(
      'dynamic',
      timeoutRef as unknown as number,
    );
  }

  doesExist(name: string): boolean {
    return this.schedulerRegistry.doesExist('timeout', name);
  }
}
