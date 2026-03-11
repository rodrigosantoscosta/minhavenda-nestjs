import * as Joi from 'joi';

const envValidationSchema = Joi.object({
  PORT: Joi.number().default(3000),
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),

  DB_HOST: Joi.string().hostname().required(),
  DB_PORT: Joi.number().port().required(),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().min(1).required(),
  DB_NAME: Joi.string().required(),

  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRATION: Joi.number().positive().default(86400),

  RABBITMQ_URL: Joi.string()
    .uri({ scheme: ['amqp', 'amqps'] })
    .required(),

  MAIL_HOST: Joi.string().required(),
  MAIL_PORT: Joi.number().port().required(),
  MAIL_FROM: Joi.string().email().required(),
  MAIL_FROM_NAME: Joi.string().required(),

  CORS_ALLOWED_ORIGINS: Joi.string().required(),

  SWAGGER_ENABLED: Joi.string().valid('true', 'false').default('false'),

  TRUSTED_PROXY_CIDRS: Joi.string().allow('').default(''),
});

export function validateEnv(
  config: Record<string, unknown>,
): Record<string, unknown> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const { error, value } = envValidationSchema
    .prefs({ abortEarly: false })
    .validate(config, { allowUnknown: true, stripUnknown: true });

  if (error) {
    throw new Error(`Config validation error: ${error.message}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return value;
}
