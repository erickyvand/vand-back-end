import { Injectable, Logger } from '@nestjs/common';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

/**
 * Logger Service class
 */
@Injectable()
class LoggerService extends Logger {
  private readonly logger: winston.Logger;

  /**
   * @param {String} context Context
   * @return {void}
   */
  constructor(context: string) {
    super(context);

    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss',
        }),
        winston.format.json(),
      ),
      transports: [
        new winston.transports.DailyRotateFile({
          dirname: `logs/${context}/info`,
          filename: '%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          level: 'info',
          zippedArchive: true,
        }),
        new winston.transports.DailyRotateFile({
          dirname: 'logs/catch',
          // dirname: `logs/${context}/error`,
          filename: '%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          level: 'error',
          zippedArchive: true,
        }),
        new winston.transports.Console(),
      ],
    });
  }

  /**
   * @param {String} message Message
   * @param {String} context Context
   * @return {void}
   */
  handleInfoLog(message: string, context?: string): void {
    this.logger.info(message, {
      context,
    });
  }

  /**
   * @param {String} message Message
   * @param {String} trace Trace
   * @param {String} context Context
   * @return {void}
   */
  handlErrorLog(message: string, trace?: string, context?: string): void {
    this.logger.error(message, {
      context,
      trace,
    });
  }
}

export default LoggerService;
