import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import PrismaService from '../../../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CursorPagination, CursorPaginationDto } from '../../../common/pagination';

@Injectable()
class CommentService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(articleId: string, data: CreateCommentDto, user?: any) {
    const article = await this.prismaService.article.findFirst({
      where: { id: articleId, deletedAt: null, status: 'Published' },
    });

    if (!article) {
      throw new HttpException('Article not found', HttpStatus.NOT_FOUND);
    }

    const authorName = user?.fullName || data.authorName;
    const authorEmail = user?.email || data.authorEmail;

    if (!authorName || !authorEmail) {
      throw new HttpException(
        'authorName and authorEmail are required for anonymous comments',
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.prismaService.comment.create({
      data: {
        content: data.content,
        authorName,
        authorEmail,
        articleId,
        userId: user?.id || null,
      },
    });
  }

  async findByArticle(articleId: string, query: CursorPaginationDto) {
    const { limit, cursor } = CursorPagination.parse(query);

    const where = { articleId };

    const comments = await this.prismaService.comment.findMany({
      where,
      ...CursorPagination.query(cursor, limit),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        content: true,
        authorName: true,
        createdAt: true,
        userId: true,
      },
    });

    const { data, meta } = CursorPagination.result(comments, limit);
    return { comments: data, meta };
  }

  async remove(id: string) {
    const comment = await this.prismaService.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      throw new HttpException('Comment not found', HttpStatus.NOT_FOUND);
    }

    await this.prismaService.comment.delete({ where: { id } });
  }
}

export default CommentService;
