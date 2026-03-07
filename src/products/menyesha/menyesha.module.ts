import { Module } from '@nestjs/common';
import { ArticleModule } from './article/article.module';
import { CategoryModule } from './category/category.module';
import { TagModule } from './tag/tag.module';

@Module({
  imports: [ArticleModule, CategoryModule, TagModule],
})
export class MenyeshaModule {}
