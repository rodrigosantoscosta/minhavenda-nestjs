import { registerAs } from '@nestjs/config';

export const jwtConfig = registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET as string,
  expiration: Number(process.env.JWT_EXPIRATION ?? 86400),
}));
