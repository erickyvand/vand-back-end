import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { Reflector } from '@nestjs/core';
import MustChangePasswordGuard from './common/auth/guards/must-change-password.guard';

import AppController from './app.controller';
import AppService from './app.service';
import MorganMiddleware from './middlewares/morgan.middleware';
import { AuthModule } from './common/auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { PrismaModule } from './prisma/prisma.module';
import { R2Module } from './r2/r2.module';
import { MediaModule } from './media/media.module';
import { MenyeshaModule } from './products/menyesha/menyesha.module';
import MailModule from './common/mail/mail.module';

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
    MenyeshaModule,
    MailModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    Reflector,
    { provide: APP_GUARD, useClass: MustChangePasswordGuard },
  ],
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
