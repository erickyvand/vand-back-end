import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import AppController from './app.controller';
import AppService from './app.service';
import MorganMiddleware from './middlewares/morgan.middleware';
import { AuthModule } from './common/auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { PrismaModule } from './prisma/prisma.module';
import { R2Module } from './r2/r2.module';
import { MediaModule } from './media/media.module';

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
    PrismaModule,
    R2Module,
    AuthModule,
    AdminModule,
    MediaModule,
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
