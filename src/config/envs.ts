import * as joi from 'joi';
import 'dotenv/config';

interface EnvsSchema {
  PORT: number;
  NAT_SERVERS: string[];
  DB_HOST: string;
  DB_PORT: number;
  DB_USERNAME: string;
  DB_PASSWORD: string;
  DB_NAME: string;
}

const envsSchema = joi
  .object({
    PORT: joi.number().required(),
    NAT_SERVERS: joi.array().items(joi.string()).required(),
    DB_HOST: joi.string().required(),
    DB_PORT: joi.number().required(),
    DB_USER: joi.string().required(),
    DB_PASSWORD: joi.string().required(),
    DB_NAME_ORDERS: joi.string().required(),
  })
  .unknown(true);

const { error, value } = envsSchema.validate({
  ...process.env,
  NAT_SERVERS: process.env.NAT_SERVERS?.split(','),
  DB_PORT: Number(process.env.DB_PORT),
});

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

export const envs: EnvsSchema = {
  PORT: value.PORT,
  NAT_SERVERS: value.NAT_SERVERS,
  DB_HOST: value.DB_HOST,
  DB_PORT: value.DB_PORT,
  DB_USERNAME: value.DB_USER,
  DB_PASSWORD: value.DB_PASSWORD,
  DB_NAME: value.DB_NAME_ORDERS,
};

