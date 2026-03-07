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
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
import JwtAuthGuard from '../../../common/auth/guards/jwt-auth.guard';
import RolesGuard from '../../../common/auth/guards/roles.guard';
import { Roles } from '../../../common/auth/decorators/roles.decorator';
import ResponseCommon from '../../../common/response.common';
import CategoryService from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Controller('api/menyesha/categories')
@ApiTags('Menyesha - Categories')
class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('editor', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create categories (multiple languages at once)' })
  @ApiResponse({ status: 201, description: 'Categories created successfully' })
  @ApiResponse({ status: 409, description: 'Category already exists' })
  async create(@Res() res: Response, @Body() body: CreateCategoryDto) {
    const result = await this.categoryService.create(body);
    return ResponseCommon.handleSuccess(
      HttpStatus.CREATED,
      'Categories created successfully',
      res,
      result,
    );
  }

  @Get()
  @ApiOperation({ summary: 'List all categories' })
  @ApiQuery({ name: 'language', required: false, enum: ['en', 'fr', 'rw'] })
  @ApiResponse({ status: 200, description: 'Categories retrieved successfully' })
  async findAll(@Res() res: Response, @Query('language') language?: string) {
    const result = await this.categoryService.findAll(language);
    return ResponseCommon.handleSuccess(
      HttpStatus.OK,
      'Categories retrieved successfully',
      res,
      result,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single category by ID' })
  @ApiResponse({ status: 200, description: 'Category retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  async findOne(@Res() res: Response, @Param('id') id: string) {
    const result = await this.categoryService.findOne(id);
    return ResponseCommon.handleSuccess(
      HttpStatus.OK,
      'Category retrieved successfully',
      res,
      result,
    );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('editor', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a category' })
  @ApiResponse({ status: 200, description: 'Category updated successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiResponse({ status: 409, description: 'Category already exists' })
  async update(
    @Res() res: Response,
    @Param('id') id: string,
    @Body() body: UpdateCategoryDto,
  ) {
    const result = await this.categoryService.update(id, body);
    return ResponseCommon.handleSuccess(
      HttpStatus.OK,
      'Category updated successfully',
      res,
      result,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('editor', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a category' })
  @ApiResponse({ status: 200, description: 'Category deleted successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiResponse({ status: 409, description: 'Category has articles' })
  async remove(@Res() res: Response, @Param('id') id: string) {
    await this.categoryService.remove(id);
    return ResponseCommon.handleSuccess(
      HttpStatus.OK,
      'Category deleted successfully',
      res,
    );
  }
}

export default CategoryController;
