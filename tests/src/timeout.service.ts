import { Injectable } from '@nestjs/common';
import { Timeout } from '../../lib/decorators';
import { SchedulerRegistry } from '../../lib/scheduler.registry';

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
      clearTimeout(this.schedulerRegistry.getInterval('dynamic'));
    }, 2500);

    this.schedulerRegistry.addTimeout(
      'dynamic',
      (timeoutRef as unknown) as number,
    );
  }

  doesExists(name: string): boolean {
    return this.schedulerRegistry.doesExists('timeout', name);
  }
}
