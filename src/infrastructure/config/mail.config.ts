import { registerAs } from '@nestjs/config';

export const mailConfig = registerAs('mail', () => ({
  host: process.env.MAIL_HOST as string,
  port: Number(process.env.MAIL_PORT ?? 1025),
  from: process.env.MAIL_FROM as string,
  fromName: process.env.MAIL_FROM_NAME as string,
}));
