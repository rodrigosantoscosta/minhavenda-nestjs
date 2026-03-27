import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { AppCacheService } from '@infra/cache/cache.service';
import { CACHE_KEYS } from '@infra/cache/cache-keys.constant';
import { TipoUsuario } from '@domain/enums/tipo-usuario.enum';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface RefreshPayloadStored {
  userId: string;
  issuedAt: number;
}

@Injectable()
export class TokenService {
  private readonly refreshSecret: string;
  private readonly refreshExpiration: number;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly cacheService: AppCacheService,
  ) {
    this.refreshSecret = this.configService.getOrThrow<string>('REFRESH_TOKEN_SECRET');
    this.refreshExpiration = this.configService.get<number>(
      'REFRESH_TOKEN_EXPIRATION',
      604800,
    );
  }

  async signTokenPair(
    userId: string,
    email: string,
    role: TipoUsuario,
  ): Promise<TokenPair> {
    const jti = randomUUID();
    const accessToken = this.jwtService.sign({ sub: userId, email, role, jti });
    const refreshToken = await this.signRefreshToken(userId, email, role, jti);
    return { accessToken, refreshToken };
  }

  private async signRefreshToken(
    userId: string,
    email: string,
    role: TipoUsuario,
    jti: string,
  ): Promise<string> {
    const payload: RefreshPayloadStored = { userId, issuedAt: Date.now() };

    // Key 1 — jti-indexed for O(1) lookup during rotation
    await this.cacheService.set(
      CACHE_KEYS.REFRESH_TOKEN(jti),
      payload,
      this.refreshExpiration,
    );
    // Key 2 — userId-prefixed for bulk revocation via delByPrefix
    await this.cacheService.set(
      CACHE_KEYS.REFRESH_TOKEN_BY_USER(userId, jti),
      1,
      this.refreshExpiration,
    );

    return this.jwtService.sign(
      { sub: userId, email, role, jti },
      { secret: this.refreshSecret, expiresIn: this.refreshExpiration },
    );
  }

  async rotateRefreshToken(
    oldJti: string,
    userId: string,
    email: string,
    role: TipoUsuario,
  ): Promise<TokenPair> {
    const stored = await this.cacheService.get<RefreshPayloadStored>(
      CACHE_KEYS.REFRESH_TOKEN(oldJti),
    );

    if (!stored) {
      // Possible reuse attack — revoke all sessions for this user
      await this.revokeAllForUser(userId);
      throw new UnauthorizedException('Refresh token inválido ou já utilizado');
    }

    // Invalidate consumed token (both keys)
    await this.cacheService.del(CACHE_KEYS.REFRESH_TOKEN(oldJti));
    await this.cacheService.del(CACHE_KEYS.REFRESH_TOKEN_BY_USER(userId, oldJti));

    return this.signTokenPair(userId, email, role);
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.cacheService.delByPrefix(`auth:refresh:user:${userId}:`);
  }
}