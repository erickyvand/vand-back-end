import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import JwtAuthGuard from '../../../common/auth/guards/jwt-auth.guard';
import RolesGuard from '../../../common/auth/guards/roles.guard';
import { Roles } from '../../../common/auth/decorators/roles.decorator';
import OptionalJwtAuthGuard from '../../../common/auth/guards/optional-jwt-auth.guard';
import ResponseCommon from '../../../common/response.common';
import CommentService from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CursorPaginationDto } from '../../../common/pagination';

@Controller('api/menyesha/articles')
@ApiTags('Menyesha - Comments')
class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post(':articleId/comments')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Add a comment to an article' })
  @ApiResponse({ status: 201, description: 'Comment created successfully' })
  @ApiResponse({ status: 404, description: 'Article not found' })
  async create(
    @Res() res: Response,
    @Req() req: Request,
    @Param('articleId') articleId: string,
    @Body() body: CreateCommentDto,
  ) {
    const user = req.user as any;
    const result = await this.commentService.create(articleId, body, user);
    return ResponseCommon.handleSuccess(
      HttpStatus.CREATED,
      'Comment created successfully',
      res,
      result,
    );
  }

  @Get(':articleId/comments')
  @ApiOperation({ summary: 'Get comments for an article' })
  @ApiResponse({ status: 200, description: 'Comments retrieved successfully' })
  async findByArticle(
    @Res() res: Response,
    @Param('articleId') articleId: string,
    @Query() query: CursorPaginationDto,
  ) {
    const result = await this.commentService.findByArticle(articleId, query);
    return ResponseCommon.handleSuccess(
      HttpStatus.OK,
      'Comments retrieved successfully',
      res,
      result,
    );
  }

  @Get(':articleId/comments/count')
  @ApiOperation({ summary: 'Get comment count for an article' })
  @ApiResponse({ status: 200, description: 'Comment count retrieved successfully' })
  async countByArticle(
    @Res() res: Response,
    @Param('articleId') articleId: string,
  ) {
    const result = await this.commentService.countByArticle(articleId);
    return ResponseCommon.handleSuccess(
      HttpStatus.OK,
      'Comment count retrieved successfully',
      res,
      result,
    );
  }

  @Delete('comments/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('editor', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a comment (moderator)' })
  @ApiResponse({ status: 200, description: 'Comment deleted successfully' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  async remove(@Res() res: Response, @Param('id') id: string) {
    await this.commentService.remove(id);
    return ResponseCommon.handleSuccess(
      HttpStatus.OK,
      'Comment deleted successfully',
      res,
    );
  }
}

export default CommentController;
