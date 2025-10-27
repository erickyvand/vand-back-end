import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { Response } from 'express';

import AppService from './app.service';
import LoggerService from './logger/logger.service';
import ResponseCommon from './common/response.common';

const logger = new LoggerService('app');

/**
 * App Controller class
 */
@Controller('/api')
class AppController {
  /**
   * @param {Object} res Response
   * @return {string} Response<string>
   */
  @Get()
  getHello(@Res() res: Response): Response<string> {
    try {
      logger.handleInfoLog('log app controller');

      return ResponseCommon.handleSuccess(
        HttpStatus.OK,
        AppService.getHello(),
        res,
      );
    } catch (error) {
      throw new HttpException(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}

export default AppController;
