import { Response } from 'express';

/**
 * ResponseCommon class
 */
class ResponseCommon {
  /**
   * @param {number} statusCode Status code
   * @param {string} message Message
   * @param {Response} res Response
   * @param {any} data Data
   * @return {Response} Response
   */
  static handleSuccess(
    statusCode: number,
    message: string,
    res: Response,
    data: any = null,
  ): Response {
    return res.status(statusCode).json({
      statusCode,
      message,
      data,
    });
  }

  /**
   * @param {number} statusCode Status code
   * @param {string} message Message
   * @param {Response} res Response
   * @return {Response} Response
   */
  static handleError(
    statusCode: number,
    message: string,
    res: Response,
  ): Response {
    return res.status(statusCode).json({
      statusCode,
      message,
    });
  }
}

export default ResponseCommon;
