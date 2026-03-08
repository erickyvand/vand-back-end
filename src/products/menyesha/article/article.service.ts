import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import PrismaService from '../../../prisma/prisma.service';
import LoggerService from '../../../logger/logger.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { QueryArticleDto, CursorQueryArticleDto } from './dto/query-article.dto';
import { OffsetPagination } from '../../../common/pagination';
import { CursorPagination } from '../../../common/pagination';
import { Language, ArticleStatus } from '@prisma/client';

const logger = new LoggerService('article');

const ARTICLE_INCLUDE = {
  category: true,
  author: {
    include: {
      user: { select: { fullName: true, email: true } },
    },
  },
  thumbnail: true,
  tags: {
    include: {
      tag: true,
    },
  },
};

@Injectable()
class ArticleService {
  constructor(private readonly prismaService: PrismaService) {}

  private toSlug(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  private async generateSlug(title: string): Promise<string> {
    const base = this.toSlug(title);

    const existing = await this.prismaService.article.findFirst({
      where: { slug: base },
    });

    if (!existing) return base;

    const similar = await this.prismaService.article.findMany({
      where: { slug: { startsWith: `${base}-` } },
      select: { slug: true },
    });

    const numbers = similar
      .map((a) => {
        const suffix = a.slug.slice(base.length + 1);
        return /^\d+$/.test(suffix) ? parseInt(suffix, 10) : 0;
      })
      .filter((n) => n > 0);

    const next = numbers.length > 0 ? Math.max(...numbers) + 1 : 2;
    return `${base}-${next}`;
  }

  async create(data: CreateArticleDto, authorId: string) {
    const category = await this.prismaService.category.findUnique({
      where: { id: data.categoryId },
    });

    if (!category) {
      throw new HttpException('Category not found', HttpStatus.NOT_FOUND);
    }

    if (category.language !== data.language) {
      throw new HttpException(
        `Category language '${category.language}' does not match article language '${data.language}'`,
        HttpStatus.BAD_REQUEST,
      );
    }

    if (data.thumbnailId) {
      const media = await this.prismaService.media.findUnique({
        where: { id: data.thumbnailId },
      });
      if (!media) {
        throw new HttpException(
          'Thumbnail media not found',
          HttpStatus.NOT_FOUND,
        );
      }
    }

    if (data.tagIds?.length) {
      const tags = await this.prismaService.tag.findMany({
        where: { id: { in: data.tagIds } },
      });
      if (tags.length !== data.tagIds.length) {
        throw new HttpException(
          'One or more tags not found',
          HttpStatus.NOT_FOUND,
        );
      }
    }

    const slug = await this.generateSlug(data.title);

    try {
      const article = await this.prismaService.article.create({
        data: {
          title: data.title,
          slug,
          excerpt: data.excerpt,
          content: data.content,
          thumbnailId: data.thumbnailId,
          language: data.language as Language,
          status: 'Draft',
          categoryId: data.categoryId,
          authorId,
          ...(data.tagIds?.length && {
            tags: {
              create: data.tagIds.map((tagId) => ({ tagId })),
            },
          }),
        },
        include: ARTICLE_INCLUDE,
      });

      logger.handleInfoLog(`Article created: ${article.id} by ${authorId}`);
      return article;
    } catch (error: any) {
      if (error instanceof HttpException) throw error;

      logger.handleErrorLog(`Article creation failed: ${error.message}`);

      if (error.code === 'P2003') {
        const field = error.meta?.field_name || 'unknown';
        throw new HttpException(
          `Referenced record not found for field: ${field}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      throw new HttpException(
        'Failed to create article',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private buildWhere(filters: { status?: string; categoryId?: string; authorId?: string; language?: string }) {
    const where: any = { deletedAt: null };
    if (filters.status) where.status = filters.status as ArticleStatus;
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.authorId) where.authorId = filters.authorId;
    if (filters.language) where.language = filters.language as Language;
    return where;
  }

  async findAll(query: QueryArticleDto) {
    const { page, limit, skip } = OffsetPagination.parse(query);
    const where = this.buildWhere(query);

    const [articles, total] = await Promise.all([
      this.prismaService.article.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: ARTICLE_INCLUDE,
      }),
      this.prismaService.article.count({ where }),
    ]);

    return { articles, meta: OffsetPagination.meta(total, page, limit) };
  }

  async findAllCursor(query: CursorQueryArticleDto) {
    const { limit, cursor } = CursorPagination.parse(query);
    const where = this.buildWhere(query);

    const items = await this.prismaService.article.findMany({
      where,
      ...CursorPagination.query(cursor, limit),
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      include: ARTICLE_INCLUDE,
    });

    const { data: articles, meta } = CursorPagination.result(items, limit);
    return { articles, meta };
  }

  async findOne(id: string) {
    const article = await this.prismaService.article.findFirst({
      where: { id, deletedAt: null },
      include: ARTICLE_INCLUDE,
    });

    if (!article) {
      throw new HttpException('Article not found', HttpStatus.NOT_FOUND);
    }

    return article;
  }

  async findBySlug(slug: string) {
    const article = await this.prismaService.article.findFirst({
      where: { slug, deletedAt: null },
      include: ARTICLE_INCLUDE,
    });

    if (!article) {
      throw new HttpException('Article not found', HttpStatus.NOT_FOUND);
    }

    return article;
  }

  async update(id: string, data: UpdateArticleDto, user: any) {
    const article = await this.prismaService.article.findFirst({
      where: { id, deletedAt: null },
    });

    if (!article) {
      throw new HttpException('Article not found', HttpStatus.NOT_FOUND);
    }

    const roleName = user.internalProfile.role.name;
    if (roleName === 'reporter' && article.authorId !== user.internalProfile.id) {
      throw new HttpException(
        'You can only edit your own articles',
        HttpStatus.FORBIDDEN,
      );
    }

    const { tagIds, ...rest } = data;
    const updateData: any = { ...rest };

    if (data.title && data.title !== article.title) {
      updateData.slug = await this.generateSlug(data.title);
    }

    if (data.language) {
      updateData.language = data.language as Language;
    }

    if (data.status) {
      updateData.status = data.status as ArticleStatus;
      if (data.status === 'Published' && !article.publishedAt) {
        updateData.publishedAt = new Date();
      }
    }

    if (data.categoryId) {
      const category = await this.prismaService.category.findUnique({
        where: { id: data.categoryId },
      });
      if (!category) {
        throw new HttpException('Category not found', HttpStatus.NOT_FOUND);
      }
      const effectiveLanguage = data.language || article.language;
      if (category.language !== effectiveLanguage) {
        throw new HttpException(
          `Category language '${category.language}' does not match article language '${effectiveLanguage}'`,
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    if (data.thumbnailId) {
      const media = await this.prismaService.media.findUnique({
        where: { id: data.thumbnailId },
      });
      if (!media) {
        throw new HttpException(
          'Thumbnail media not found',
          HttpStatus.NOT_FOUND,
        );
      }
    }

    if (tagIds) {
      if (tagIds.length) {
        const tags = await this.prismaService.tag.findMany({
          where: { id: { in: tagIds } },
        });
        if (tags.length !== tagIds.length) {
          throw new HttpException(
            'One or more tags not found',
            HttpStatus.NOT_FOUND,
          );
        }
      }
      updateData.tags = {
        deleteMany: {},
        ...(tagIds.length && {
          create: tagIds.map((tagId) => ({ tagId })),
        }),
      };
    }

    const updated = await this.prismaService.article.update({
      where: { id },
      data: updateData,
      include: ARTICLE_INCLUDE,
    });

    logger.handleInfoLog(`Article updated: ${id}`);
    return updated;
  }

  async addTags(id: string, tagIds: string[]) {
    const article = await this.prismaService.article.findFirst({
      where: { id, deletedAt: null },
      include: { tags: true },
    });

    if (!article) {
      throw new HttpException('Article not found', HttpStatus.NOT_FOUND);
    }

    const tags = await this.prismaService.tag.findMany({
      where: { id: { in: tagIds } },
    });

    if (tags.length !== tagIds.length) {
      throw new HttpException('One or more tags not found', HttpStatus.NOT_FOUND);
    }

    const existingTagIds = article.tags.map((t) => t.tagId);
    const newTagIds = tagIds.filter((tagId) => !existingTagIds.includes(tagId));

    if (newTagIds.length === 0) {
      throw new HttpException(
        'All tags are already associated with this article',
        HttpStatus.CONFLICT,
      );
    }

    const updated = await this.prismaService.article.update({
      where: { id },
      data: {
        tags: {
          create: newTagIds.map((tagId) => ({ tagId })),
        },
      },
      include: ARTICLE_INCLUDE,
    });

    logger.handleInfoLog(`Tags added to article: ${id}`);
    return updated;
  }

  async removeTags(id: string, tagIds: string[]) {
    const article = await this.prismaService.article.findFirst({
      where: { id, deletedAt: null },
    });

    if (!article) {
      throw new HttpException('Article not found', HttpStatus.NOT_FOUND);
    }

    await this.prismaService.articleTag.deleteMany({
      where: {
        articleId: id,
        tagId: { in: tagIds },
      },
    });

    const updated = await this.prismaService.article.findUnique({
      where: { id },
      include: ARTICLE_INCLUDE,
    });

    logger.handleInfoLog(`Tags removed from article: ${id}`);
    return updated;
  }

  async softDelete(id: string, user: any) {
    const article = await this.prismaService.article.findFirst({
      where: { id, deletedAt: null },
    });

    if (!article) {
      throw new HttpException('Article not found', HttpStatus.NOT_FOUND);
    }

    const roleName = user.internalProfile.role.name;
    if (roleName === 'reporter' && article.authorId !== user.internalProfile.id) {
      throw new HttpException(
        'You can only delete your own articles',
        HttpStatus.FORBIDDEN,
      );
    }

    await this.prismaService.article.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    logger.handleInfoLog(`Article soft-deleted: ${id}`);
  }
}

export default ArticleService;
