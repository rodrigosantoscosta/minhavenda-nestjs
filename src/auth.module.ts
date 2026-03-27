import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from '@domain/entities/usuario.entity';
import { IUSUARIO_REPOSITORY } from '@domain/repositories/iusuario.repository';
import { UsuarioTypeOrmRepository } from '@infra/persistence/repositories/usuario.typeorm.repository';
import { JwtStrategy } from '@infra/security/jwt.strategy';
import { JwtRefreshStrategy } from '@infra/security/jwt-refresh.strategy';
import { TokenService } from '@infra/security/token.service';
import { RegisterUseCase } from '@app/use-cases/auth/register.use-case';
import { LoginUseCase } from '@app/use-cases/auth/login.use-case';
import { AlterarSenhaUseCase } from '@app/use-cases/auth/alterar-senha.use-case';
import { AuthController } from '@presentation/controllers/auth.controller';

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRATION', 86400),
        },
      }),
    }),
    TypeOrmModule.forFeature([Usuario]),
  ],
  controllers: [AuthController],
  providers: [
    { provide: IUSUARIO_REPOSITORY, useClass: UsuarioTypeOrmRepository },
    JwtStrategy,
    JwtRefreshStrategy,
    TokenService,
    RegisterUseCase,
    LoginUseCase,
    AlterarSenhaUseCase,
  ],
  exports: [JwtModule, PassportModule, JwtStrategy, TokenService, IUSUARIO_REPOSITORY],
})
export class AuthModule {}