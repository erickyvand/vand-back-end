import { Injectable } from '@nestjs/common';

/**
 * App Service class
 */
@Injectable()
class AppService {
  /**
   * Constructor
   * @return {void}
   * @constructor
   */
  /**
   * @return {string} Hello
   */
  static getHello(): string {
    return 'NestJS template';
  }
}

export default AppService;
