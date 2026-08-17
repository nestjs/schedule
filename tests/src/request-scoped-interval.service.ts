import { Injectable, Scope } from '@nestjs/common';
import { Interval } from '../../lib/decorators/index.js';

@Injectable({ scope: Scope.REQUEST })
export class RequestScopedIntervalService {
  @Interval('test', 2500)
  handleInterval() {}
}
