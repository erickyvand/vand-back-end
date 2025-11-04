import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';

import AppController from './app.controller';
import AppService from './app.service';
import MorganMiddleware from './middlewares/morgan.middleware';
import DatabaseModule from './database/database.module';

/**
 * Consumer objects
 * @param {Array} consumers Consumers
 * @return {Array} Consumer objects
 */

/**
 * App Module class
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
class AppModule implements NestModule {
  /**
   * @param {MiddlewareConsumer} consumer Middleware consumer
   * @return {void}
   */
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(MorganMiddleware).forRoutes('*');
  }
}

export default AppModule;
