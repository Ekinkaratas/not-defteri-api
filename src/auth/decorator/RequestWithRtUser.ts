import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

interface RequestWithRtUser extends Request {
  user: {
    sub: number;
    email: string;
    refreshToken: string;
  };
}
export const GetRefreshToken = createParamDecorator(
  (_: undefined, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<RequestWithRtUser>();

    return request.user?.refreshToken;
  },
);
