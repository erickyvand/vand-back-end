import { HttpException, HttpStatus } from '@nestjs/common';

/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable import/no-extraneous-dependencies */
const path = require('path');
require('dotenv').config({
  path: path.resolve(`${__dirname}/../../.env`),
});

export const { NODE_ENV, PORT, CORS_ORIGIN_WHITELIST, CONSUMER_NAME, BROKERS_LIST } = process.env;

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
    name: 'WELCOME_PACKAGE', topic: 'welcome-package',
  },
];

/**
 * Kafka consumers list
 * Kafka brokers list
 * @return {Array} Kafka brokers list
 */
const brokersArray = BROKERS_LIST?.split(';') ?? [];
export const brokersList = brokersArray.map((broker) => broker);
