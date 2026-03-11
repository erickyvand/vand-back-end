import { Module } from '@nestjs/common';
import ArticleController from './article.controller';
import ArticleService from './article.service';
import CommentController from './comment.controller';
import CommentService from './comment.service';

@Module({
  controllers: [ArticleController, CommentController],
  providers: [ArticleService, CommentService],
  exports: [ArticleService],
})
export class ArticleModule {}
