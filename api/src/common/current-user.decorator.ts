import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export type AuthUser = { id: string; email: string };

/** Injects the authenticated user (set by JwtStrategy.validate). */
export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): AuthUser =>
    ctx.switchToHttp().getRequest().user,
);
