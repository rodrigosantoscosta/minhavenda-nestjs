import {
  SetMetadata,
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';
import { TipoUsuario } from '@domain/enums/tipo-usuario.enum';
import type { AuthenticatedUser } from './jwt.strategy';

export const ROLES_KEY = 'roles';

/** Attach required roles to a controller class or handler method. */
export const Roles = (
  ...roles: TipoUsuario[]
): MethodDecorator & ClassDecorator => SetMetadata(ROLES_KEY, roles);

/**
 * Parameter decorator that extracts the authenticated user from the request.
 * The user is populated by JwtStrategy.validate() after a valid JWT is verified.
 *
 * Usage: async myHandler(@CurrentUser() user: AuthenticatedUser) { ... }
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ user: AuthenticatedUser }>();
    return request.user;
  },
);
