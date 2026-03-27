import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { RegisterUseCase } from '@app/use-cases/auth/register.use-case';
import { LoginUseCase } from '@app/use-cases/auth/login.use-case';
import { AlterarSenhaUseCase } from '@app/use-cases/auth/alterar-senha.use-case';
import { RegisterRequestDto } from '@app/dtos/auth/register-request.dto';
import { LoginRequestDto } from '@app/dtos/auth/login-request.dto';
import { AlterarSenhaRequestDto } from '@app/dtos/auth/alterar-senha-request.dto';
import { RefreshTokenRequestDto } from '@app/dtos/auth/refresh-token-request.dto';
import { AuthResponseDto } from '@app/dtos/auth/auth-response.dto';
import { JwtAuthGuard } from '@infra/security/jwt-auth.guard';
import { JwtRefreshGuard } from '@infra/security/jwt-refresh.guard';
import { TokenService, TokenPair } from '@infra/security/token.service';
import { CurrentUser } from '@infra/security/roles.decorator';
import type { AuthenticatedUser } from '@infra/security/jwt.strategy';
import type { RefreshTokenPayload } from '@infra/security/jwt-refresh.strategy';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly alterarSenhaUseCase: AlterarSenhaUseCase,
    private readonly tokenService: TokenService,
  ) {}

  /**
   * POST /api/auth/register
   * Rate-limited: 10 requests per minute per IP.
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Registrar novo usuário' })
  @ApiResponse({ status: 201, description: 'Usuário criado', type: AuthResponseDto })
  @ApiResponse({ status: 409, description: 'Email já cadastrado' })
  registrar(@Body() dto: RegisterRequestDto): Promise<AuthResponseDto> {
    return this.registerUseCase.executar(dto);
  }

  /**
   * POST /api/auth/login
   * Rate-limited: 10 requests per minute per IP.
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Autenticar usuário e obter par de tokens' })
  @ApiResponse({ status: 200, description: 'Par de tokens JWT', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  login(@Body() dto: LoginRequestDto): Promise<AuthResponseDto> {
    return this.loginUseCase.executar(dto);
  }

  /**
   * POST /api/auth/refresh
   * Rotates the refresh token. Returns a new token pair.
   */
  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Rotacionar refresh token e obter novo par de tokens' })
  @ApiResponse({ status: 200, description: 'Novo par de tokens', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Refresh token inválido ou expirado' })
  async refresh(
    @Req() req: Request,
    @Body() _dto: RefreshTokenRequestDto,
  ): Promise<TokenPair> {
    const payload = req.user as RefreshTokenPayload;
    return this.tokenService.rotateRefreshToken(
      payload.jti,
      payload.sub,
      payload.email,
      payload.role,
    );
  }

  /**
   * POST /api/auth/logout
   * Revokes ALL refresh tokens for the authenticated user.
   */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Logout — revoga todos os refresh tokens do usuário' })
  @ApiResponse({ status: 204, description: 'Logout realizado' })
  async logout(@CurrentUser() user: AuthenticatedUser): Promise<void> {
    await this.tokenService.revokeAllForUser(user.id);
  }

  /**
   * POST /api/auth/alterar-senha
   * Authenticated. Returns 204 No Content on success.
   */
  @Post('alterar-senha')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Alterar senha do usuário autenticado' })
  @ApiResponse({ status: 204, description: 'Senha alterada com sucesso' })
  async alterarSenha(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AlterarSenhaRequestDto,
  ): Promise<void> {
    return this.alterarSenhaUseCase.executar(user.id, dto);
  }
}