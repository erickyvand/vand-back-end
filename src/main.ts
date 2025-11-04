import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import AppModule from './app.module';
import { NODE_ENV, PORT } from './common/constant.common';
import HttpExceptionFilter from './filters/http.exception.filter';
import { join } from 'path';

/**
 * Bootstrap function
 * @return {Promise<void>} core function
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Vand API')
    .setDescription('API documentation for Vand application')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api-docs', app, document, {
    customCss: require('fs').readFileSync(join(process.cwd(), 'src/swagger-theme.css'), 'utf8'),
  });

  app.use(helmet());

  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(PORT || 3000, () => {
    // eslint-disable-next-line no-console
    console.log(`Server is running in ${NODE_ENV} on port ${PORT || 3000}`);
  });
}
bootstrap();
