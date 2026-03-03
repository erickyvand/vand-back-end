import { ArgumentsHost, ExceptionFilter, HttpException } from '@nestjs/common';

import ResponseCommon from '../common/response.common';
import LoggerService from '../logger/logger.service';

const logger = new LoggerService('catch');

/**
 * Http Exception Filter class
 */
class HttpExceptionFilter implements ExceptionFilter {
  /**
   * @param {HttpException} exception HttpException
   * @param {ArgumentsHost} host ArgumentsHost
   * @return {void} void
   */
  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();
    const errorMessage =
      typeof exceptionResponse === 'object'
        ? (exceptionResponse as any).message
        : exceptionResponse;
    // eslint-disable-next-line no-console
    console.log(exceptionResponse);

    logger.handleErrorLog(errorMessage);
    ResponseCommon.handleError(status, errorMessage, response);
  }
}

export default HttpExceptionFilter;
