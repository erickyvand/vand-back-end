import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import PrismaService from '../../../prisma/prisma.service';
import LoggerService from '../../../logger/logger.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { QueryArticleDto, CursorQueryArticleDto } from './dto/query-article.dto';
import { OffsetPagination } from '../../../common/pagination';
import { CursorPagination } from '../../../common/pagination';
import { Language, ArticleStatus, FeaturedType } from '@prisma/client';

const logger = new LoggerService('article');

const ARTICLE_INCLUDE = {
  category: true,
  author: {
    include: {
      user: { select: { fullName: true, email: true, slug: true } },
    },
  },
  thumbnail: true,
  tags: {
    include: {
      tag: {
        include: {
          translations: {
            select: { id: true, language: true, label: true },
            orderBy: { language: 'asc' as const },
          },
        },
      },
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
      if (data.tagIds.length > 5) {
        throw new HttpException('An article can have a maximum of 5 tags', HttpStatus.BAD_REQUEST);
      }
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

  private buildWhere(filters: { status?: string; categoryId?: string; authorId?: string; language?: string; featuredType?: string }) {
    const where: any = { deletedAt: null };
    if (filters.status) where.status = filters.status as ArticleStatus;
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.authorId) where.authorId = filters.authorId;
    if (filters.language) where.language = filters.language as Language;
    if (filters.featuredType) where.featuredType = filters.featuredType as FeaturedType;
    return where;
  }

  private validateStatusTransition(current: string, next: string) {
    const allowed: Record<string, string[]> = {
      Draft: ['Published', 'InReview'],
      InReview: ['Published', 'Draft', 'Rejected'],
      Published: ['Archived'],
      Rejected: ['Draft', 'InReview'],
      Archived: [],
    };

    if (!allowed[current]?.includes(next)) {
      throw new HttpException(
        `Cannot transition from ${current} to ${next}`,
        HttpStatus.BAD_REQUEST,
      );
    }
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

  async findOne(id: string, language?: string) {
    const where: any = { id, deletedAt: null };
    if (language) where.language = language as Language;
    const article = await this.prismaService.article.findFirst({
      where,
      include: ARTICLE_INCLUDE,
    });

    if (!article) {
      throw new HttpException('Article not found', HttpStatus.NOT_FOUND);
    }

    this.prismaService.article.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    }).catch(() => {});

    return article;
  }

  async findBySlug(slug: string, language?: string) {
    const where: any = { slug, deletedAt: null };
    if (language) where.language = language as Language;
    const article = await this.prismaService.article.findFirst({
      where,
      include: ARTICLE_INCLUDE,
    });

    if (!article) {
      throw new HttpException('Article not found', HttpStatus.NOT_FOUND);
    }

    this.prismaService.article.update({
      where: { id: article.id },
      data: { viewCount: { increment: 1 } },
    }).catch(() => {});

    return article;
  }

  async update(id: string, data: UpdateArticleDto, user: any) {
    const article = await this.prismaService.article.findFirst({
      where: { id, deletedAt: null },
      include: { tags: true },
    });

    if (!article) {
      throw new HttpException('Article not found', HttpStatus.NOT_FOUND);
    }

    const roleName = user.internalProfile.role.name;
    if (roleName === 'reporter') {
      if (article.authorId !== user.internalProfile.id) {
        throw new HttpException(
          'You can only edit your own articles',
          HttpStatus.FORBIDDEN,
        );
      }
      if (article.status === 'InReview') {
        throw new HttpException(
          'Cannot edit an article that is in review',
          HttpStatus.FORBIDDEN,
        );
      }
    }

    const { tagIds, featuredType, ...rest } = data;
    const updateData: any = { ...rest };

    if (featuredType !== undefined) {
      const effectiveStatus = data.status || article.status;
      if (featuredType && effectiveStatus !== 'Published') {
        throw new HttpException(
          'Only published articles can be featured',
          HttpStatus.BAD_REQUEST,
        );
      }
      if (featuredType) {
        const maxSlots: Record<string, number> = { Hero: 1, Secondary: 4, Spotlight: 8 };
        const max = maxSlots[featuredType];
        const existingCount = await this.prismaService.article.count({
          where: { featuredType: featuredType as FeaturedType, id: { not: id }, deletedAt: null },
        });
        if (existingCount >= max) {
          throw new HttpException(
            `${featuredType} section supports max ${max} article${max > 1 ? 's' : ''}`,
            HttpStatus.BAD_REQUEST,
          );
        }
      }
      updateData.featuredType = featuredType ? featuredType as FeaturedType : null;
      updateData.featuredAt = featuredType ? new Date() : null;
    }

    if (data.title && data.title !== article.title) {
      updateData.slug = await this.generateSlug(data.title);
    }

    if (data.language) {
      updateData.language = data.language as Language;
    }

    if (data.status) {
      this.validateStatusTransition(article.status, data.status);
      if (data.status === 'InReview' && article.tags.length === 0) {
        throw new HttpException(
          'Article must have at least one tag before submitting for review',
          HttpStatus.BAD_REQUEST,
        );
      }
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
      if (tagIds.length > 5) {
        throw new HttpException('An article can have a maximum of 5 tags', HttpStatus.BAD_REQUEST);
      }
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

    if (existingTagIds.length + newTagIds.length > 5) {
      throw new HttpException(
        `An article can have a maximum of 5 tags (currently has ${existingTagIds.length})`,
        HttpStatus.BAD_REQUEST,
      );
    }

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

  private generateTagSlug(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  async bulkCreateAndAssociateTags(
    articleId: string,
    tags: { name: string; translations: { label: string; language: string }[] }[],
  ) {
    const article = await this.prismaService.article.findFirst({
      where: { id: articleId, deletedAt: null },
      include: { tags: true },
    });

    if (!article) {
      throw new HttpException('Article not found', HttpStatus.NOT_FOUND);
    }

    const tagIds: string[] = [];
    const created: any[] = [];
    const skipped: string[] = [];

    for (const tag of tags) {
      const slug = this.generateTagSlug(tag.name);

      const existing = await this.prismaService.tag.findUnique({
        where: { slug },
        include: { translations: true },
      });

      if (existing) {
        tagIds.push(existing.id);
        skipped.push(slug);
      } else {
        const newTag = await this.prismaService.tag.create({
          data: {
            name: tag.name,
            slug,
            translations: {
              create: tag.translations.map((t) => ({
                label: t.label,
                language: t.language as Language,
              })),
            },
          },
          include: {
            translations: {
              select: { id: true, language: true, label: true },
            },
          },
        });
        tagIds.push(newTag.id);
        created.push(newTag);
      }
    }

    const existingTagIds = article.tags.map((t) => t.tagId);
    const newTagIds = tagIds.filter((id) => !existingTagIds.includes(id));

    if (existingTagIds.length + newTagIds.length > 5) {
      throw new HttpException(
        `An article can have a maximum of 5 tags (currently has ${existingTagIds.length})`,
        HttpStatus.BAD_REQUEST,
      );
    }

    if (newTagIds.length > 0) {
      await this.prismaService.article.update({
        where: { id: articleId },
        data: {
          tags: {
            create: newTagIds.map((tagId) => ({ tagId })),
          },
        },
      });
    }

    const updated = await this.prismaService.article.findUnique({
      where: { id: articleId },
      include: ARTICLE_INCLUDE,
    });

    return { article: updated, created, skipped };
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

  async trending(query: CursorQueryArticleDto) {
    const { limit, cursor } = CursorPagination.parse(query);
    const where: any = { deletedAt: null, status: 'Published' as ArticleStatus };
    if (query.language) where.language = query.language as Language;

    const items = await this.prismaService.article.findMany({
      where,
      ...CursorPagination.query(cursor, limit),
      orderBy: [{ viewCount: 'desc' }, { id: 'desc' }],
      include: ARTICLE_INCLUDE,
    });

    const { data: articles, meta } = CursorPagination.result(items, limit);
    return { articles, meta };
  }

  private async findAuthorBySlug(slug: string) {
    const user = await this.prismaService.user.findUnique({
      where: { slug },
      select: {
        id: true,
        fullName: true,
        slug: true,
        email: true,
        internalProfile: {
          select: {
            id: true,
            avatar: true,
            bio: true,
            role: true,
          },
        },
      },
    });

    if (!user || !user.internalProfile) {
      throw new HttpException('Author not found', HttpStatus.NOT_FOUND);
    }

    return user;
  }

  async findAuthorProfile(slug: string) {
    return this.findAuthorBySlug(slug);
  }

  async findAuthorArticles(slug: string, query: QueryArticleDto) {
    const user = await this.findAuthorBySlug(slug);
    const { page, limit, skip } = OffsetPagination.parse(query);
    const where: any = { authorId: user.internalProfile!.id, deletedAt: null };
    if (query.language) where.language = query.language as Language;
    if (query.status) where.status = query.status as ArticleStatus;

    const [articles, total] = await Promise.all([
      this.prismaService.article.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { category: true, thumbnail: true, tags: { include: { tag: { include: { translations: { select: { id: true, language: true, label: true }, orderBy: { language: 'asc' as const } } } } } } },
      }),
      this.prismaService.article.count({ where }),
    ]);

    return { articles, meta: OffsetPagination.meta(total, page, limit) };
  }
}

export default ArticleService;
