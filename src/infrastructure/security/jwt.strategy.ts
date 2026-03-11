import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { TipoUsuario } from '@domain/enums/tipo-usuario.enum';

/** Shape of the JWT payload written at sign time by LoginUseCase / RegisterUseCase. */
export interface JwtPayload {
  sub: string; // usuarioId (UUID)
  email: string;
  role: TipoUsuario;
  jti: string; // unique token ID — reserved for future revocation
  iat?: number;
  exp?: number;
}

/**
 * The object attached to req.user after a valid JWT is verified.
 * Available in controllers via @CurrentUser() or @Req() req.user.
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: TipoUsuario;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  /**
   * Called by Passport after the JWT signature is verified.
   * The return value is attached to req.user.
   * Role is embedded in the token — no DB hit needed.
   */
  validate(payload: JwtPayload): AuthenticatedUser {
    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
