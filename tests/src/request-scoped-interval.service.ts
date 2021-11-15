import { Injectable, Scope } from '@nestjs/common';
import { Interval } from '../../lib/decorators';

@Injectable({ scope: Scope.REQUEST })
export class RequestScopedIntervalService {
  @Interval('test', 2500)
  handleInterval() {}
}
