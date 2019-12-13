import { Injectable } from '@nestjs/common';
import { Timeout } from '../../lib/decorators';

@Injectable()
export class TimeoutService {
  called = false;

  @Timeout('test', 2500)
  handleTimeout() {
    this.called = true;
  }
}
