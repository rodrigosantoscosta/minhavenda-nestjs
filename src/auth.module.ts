import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Usuario } from '@domain/entities/usuario.entity';
import { IUSUARIO_REPOSITORY } from '@domain/repositories/iusuario.repository';
import { UsuarioTypeOrmRepository } from '@infra/persistence/repositories/usuario.typeorm.repository';
import { JwtStrategy } from '@infra/security/jwt.strategy';
import { RegisterUseCase } from '@app/use-cases/auth/register.use-case';
import { LoginUseCase } from '@app/use-cases/auth/login.use-case';
import { AlterarSenhaUseCase } from '@app/use-cases/auth/alterar-senha.use-case';
import { AuthController } from '@presentation/controllers/auth.controller';

@Module({
  imports: [
    // Makes ConfigService available for JwtModule.registerAsync
    ConfigModule,

    PassportModule.register({ defaultStrategy: 'jwt' }),

    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<number>('JWT_EXPIRATION', 86400),
        },
      }),
    }),

    // Registers the TypeORM repository for Usuario within this module's scope
    TypeOrmModule.forFeature([Usuario]),
  ],
  controllers: [AuthController],
  providers: [
    // Repository binding: symbol token → TypeORM implementation
    { provide: IUSUARIO_REPOSITORY, useClass: UsuarioTypeOrmRepository },

    // Infrastructure
    JwtStrategy,

    // Use cases
    RegisterUseCase,
    LoginUseCase,
    AlterarSenhaUseCase,
  ],
  // Export JwtStrategy and PassportModule so other modules can use JwtAuthGuard.
  // Export IUSUARIO_REPOSITORY so MessagingModule (PedidoNotificationListener) can inject it.
  exports: [JwtModule, PassportModule, JwtStrategy, IUSUARIO_REPOSITORY],
})
export class AuthModule {}
