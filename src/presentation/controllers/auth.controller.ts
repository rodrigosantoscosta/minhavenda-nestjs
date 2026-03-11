import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { RegisterUseCase } from '@app/use-cases/auth/register.use-case';
import { LoginUseCase } from '@app/use-cases/auth/login.use-case';
import { AlterarSenhaUseCase } from '@app/use-cases/auth/alterar-senha.use-case';
import { RegisterRequestDto } from '@app/dtos/auth/register-request.dto';
import { LoginRequestDto } from '@app/dtos/auth/login-request.dto';
import { AlterarSenhaRequestDto } from '@app/dtos/auth/alterar-senha-request.dto';
import { AuthResponseDto } from '@app/dtos/auth/auth-response.dto';
import { JwtAuthGuard } from '@infra/security/jwt-auth.guard';
import { CurrentUser } from '@infra/security/roles.decorator';
import type { AuthenticatedUser } from '@infra/security/jwt.strategy';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly alterarSenhaUseCase: AlterarSenhaUseCase,
  ) {}

  /**
   * POST /api/auth/register
   * Rate-limited: 10 requests per minute per IP.
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Registrar novo usuário' })
  @ApiResponse({
    status: 201,
    description: 'Usuário criado',
    type: AuthResponseDto,
  })
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
  @ApiOperation({ summary: 'Autenticar usuário e obter JWT' })
  @ApiResponse({ status: 200, description: 'Token JWT', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  login(@Body() dto: LoginRequestDto): Promise<AuthResponseDto> {
    return this.loginUseCase.executar(dto);
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
