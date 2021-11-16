import { Injectable, Scope } from '@nestjs/common';
import { Timeout } from '../../lib/decorators';

@Injectable({ scope: Scope.REQUEST })
export class RequestScopedTimeoutService {
  @Timeout('test', 2500)
  handleTimeout() {}
}
