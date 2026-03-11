import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Validates the Bearer JWT on every request.
 * Throws 401 Unauthorized automatically if the token is absent, malformed, or expired.
 * On success, populates req.user with AuthenticatedUser from JwtStrategy.validate().
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
