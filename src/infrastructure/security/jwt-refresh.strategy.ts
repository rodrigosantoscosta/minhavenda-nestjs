import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import type { JwtPayload } from './jwt.strategy';

export interface RefreshTokenPayload extends JwtPayload {
  jti: string;
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('REFRESH_TOKEN_SECRET'),
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: RefreshTokenPayload): RefreshTokenPayload {
    const refreshToken = req.body?.refreshToken as string | undefined;
    if (!refreshToken) throw new UnauthorizedException('Refresh token ausente');
    return payload;
  }
}