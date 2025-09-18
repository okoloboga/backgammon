import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../users/users.service';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): User => {
    const request: { user: User } = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
