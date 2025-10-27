import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigModule } from '@nestjs/config';

/**
 * Database module.
 */
@Module({
  imports: [
    SequelizeModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async () => {
        const host = process.env.DB_HOST;
        const username = process.env.DB_USERNAME;
        const password = process.env.DB_PASSWORD;
        const database = process.env.DATABASE_NAME;
        const dialect = process.env.DB_DRIVER as any;

        return {
          dialect,
          host,
          username,
          password,
          database,
          autoLoadModels: true,
        };
      },
    }),
  ],
})
class DatabaseModule {}

export default DatabaseModule;
