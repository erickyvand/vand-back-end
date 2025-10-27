/* eslint-disable class-methods-use-this */
import { Injectable, NestMiddleware } from '@nestjs/common';
import * as morgan from 'morgan';
import { Request, Response, NextFunction } from 'express';

/**
 * Morgan Middleware class
 */
@Injectable()
class MorganMiddleware implements NestMiddleware {
  /**
   * @param {Request} req Request object
   * @param {Response} res Response object
   * @param {NextFunction} next Next function
   * @return {void}
   */
  use(req: Request, res: Response, next: NextFunction): void {
    morgan('dev')(req, res, next);
  }
}

export default MorganMiddleware;
