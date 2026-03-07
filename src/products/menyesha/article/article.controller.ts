import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
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
import ResponseCommon from '../../../common/response.common';
import ArticleService from './article.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { QueryArticleDto, CursorQueryArticleDto } from './dto/query-article.dto';
import { ArticleTagsDto } from './dto/article-tags.dto';

@Controller('api/menyesha/articles')
@ApiTags('Menyesha - Articles')
class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('reporter', 'editor', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new article' })
  @ApiResponse({ status: 201, description: 'Article created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async create(
    @Res() res: Response,
    @Req() req: Request,
    @Body() body: CreateArticleDto,
  ) {
    const user = req.user as any;
    const result = await this.articleService.create(
      body,
      user.internalProfile.id,
    );
    return ResponseCommon.handleSuccess(
      HttpStatus.CREATED,
      'Article created successfully',
      res,
      result,
    );
  }

  @Get()
  @ApiOperation({ summary: 'List articles with pagination and filtering' })
  @ApiResponse({ status: 200, description: 'Articles retrieved successfully' })
  async findAll(@Res() res: Response, @Query() query: QueryArticleDto) {
    const result = await this.articleService.findAll(query);
    return ResponseCommon.handleSuccess(
      HttpStatus.OK,
      'Articles retrieved successfully',
      res,
      result,
    );
  }

  @Get('feed')
  @ApiOperation({ summary: 'List articles with cursor-based pagination' })
  @ApiResponse({ status: 200, description: 'Articles retrieved successfully' })
  async findAllCursor(
    @Res() res: Response,
    @Query() query: CursorQueryArticleDto,
  ) {
    const result = await this.articleService.findAllCursor(query);
    return ResponseCommon.handleSuccess(
      HttpStatus.OK,
      'Articles retrieved successfully',
      res,
      result,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single article by ID' })
  @ApiResponse({ status: 200, description: 'Article retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Article not found' })
  async findOne(@Res() res: Response, @Param('id') id: string) {
    const result = await this.articleService.findOne(id);
    return ResponseCommon.handleSuccess(
      HttpStatus.OK,
      'Article retrieved successfully',
      res,
      result,
    );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('reporter', 'editor', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an article' })
  @ApiResponse({ status: 200, description: 'Article updated successfully' })
  @ApiResponse({ status: 403, description: 'Not allowed to edit this article' })
  @ApiResponse({ status: 404, description: 'Article not found' })
  async update(
    @Res() res: Response,
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: UpdateArticleDto,
  ) {
    const user = req.user as any;
    const result = await this.articleService.update(id, body, user);
    return ResponseCommon.handleSuccess(
      HttpStatus.OK,
      'Article updated successfully',
      res,
      result,
    );
  }

  @Post(':id/tags')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('reporter', 'editor', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add tags to an article' })
  @ApiResponse({ status: 200, description: 'Tags added successfully' })
  @ApiResponse({ status: 404, description: 'Article or tags not found' })
  @ApiResponse({ status: 409, description: 'Tags already associated' })
  async addTags(
    @Res() res: Response,
    @Param('id') id: string,
    @Body() body: ArticleTagsDto,
  ) {
    const result = await this.articleService.addTags(id, body.tagIds);
    return ResponseCommon.handleSuccess(
      HttpStatus.OK,
      'Tags added successfully',
      res,
      result,
    );
  }

  @Delete(':id/tags')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('reporter', 'editor', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove tags from an article' })
  @ApiResponse({ status: 200, description: 'Tags removed successfully' })
  @ApiResponse({ status: 404, description: 'Article not found' })
  async removeTags(
    @Res() res: Response,
    @Param('id') id: string,
    @Body() body: ArticleTagsDto,
  ) {
    const result = await this.articleService.removeTags(id, body.tagIds);
    return ResponseCommon.handleSuccess(
      HttpStatus.OK,
      'Tags removed successfully',
      res,
      result,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('reporter', 'editor', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft delete an article' })
  @ApiResponse({ status: 200, description: 'Article deleted successfully' })
  @ApiResponse({ status: 403, description: 'Not allowed to delete this article' })
  @ApiResponse({ status: 404, description: 'Article not found' })
  async remove(
    @Res() res: Response,
    @Req() req: Request,
    @Param('id') id: string,
  ) {
    const user = req.user as any;
    await this.articleService.softDelete(id, user);
    return ResponseCommon.handleSuccess(
      HttpStatus.OK,
      'Article deleted successfully',
      res,
    );
  }
}

export default ArticleController;
