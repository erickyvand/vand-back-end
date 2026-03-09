import { ArgumentsHost, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';

import ResponseCommon from '../common/response.common';
import LoggerService from '../logger/logger.service';

const logger = new LoggerService('catch');

/**
 * Http Exception Filter class
 */
class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      const errorMessage =
        typeof exceptionResponse === 'object'
          ? (exceptionResponse as any).message
          : exceptionResponse;

      logger.handleErrorLog(errorMessage);
      ResponseCommon.handleError(status, errorMessage, response);
    } else {
      const errorMessage =
        exception instanceof Error ? exception.message : 'Internal server error';

      logger.handleErrorLog(errorMessage);
      ResponseCommon.handleError(HttpStatus.INTERNAL_SERVER_ERROR, errorMessage, response);
    }
  }
}

export default HttpExceptionFilter;
