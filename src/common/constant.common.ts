import * as path from 'path';
import * as dotenv from 'dotenv';
import { HttpException, HttpStatus } from '@nestjs/common';

dotenv.config({
  path: path.resolve(`${__dirname}/../../../.env`),
});

export const {
  NODE_ENV,
  PORT,
  CORS_ORIGIN_WHITELIST,
  CONSUMER_NAME,
  BROKERS_LIST,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  JWT_SECRET,
  JWT_REFRESH_SECRET,
  JWT_EXPIRATION,
  JWT_REFRESH_EXPIRATION,
  R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BUCKET_NAME,
  R2_PUBLIC_URL,
  R2_FOLDER,
} = process.env;

const corsWhitelist = CORS_ORIGIN_WHITELIST?.split(';') ?? [];
export const corsOptions = {
  origin: (origin: string, callback: (error: any, allow?: boolean) => void) => {
    if (corsWhitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(
        new HttpException(
          `${origin} is not allowed by CORS policy`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    }
  },
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
};

/**
 * Kafka consumers list
 * @return {Array} Kafka consumers list
 * This is contains the list of kafka consumers services
 */

export const consumerGroup = [
  {
    name: 'WELCOME_PACKAGE',
    topic: 'welcome-package',
  },
];

/**
 * Kafka consumers list
 * Kafka brokers list
 * @return {Array} Kafka brokers list
 */
const brokersArray = BROKERS_LIST?.split(';') ?? [];
export const brokersList = brokersArray.map((broker) => broker);
