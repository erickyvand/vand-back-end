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
import TagService from './tag.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';

@Controller('api/menyesha/tags')
@ApiTags('Menyesha - Tags')
class TagController {
  constructor(private readonly tagService: TagService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('editor', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new tag' })
  @ApiResponse({ status: 201, description: 'Tag created successfully' })
  async create(@Res() res: Response, @Body() body: CreateTagDto) {
    const result = await this.tagService.create(body);
    return ResponseCommon.handleSuccess(
      HttpStatus.CREATED,
      'Tag created successfully',
      res,
      result,
    );
  }

  @Get()
  @ApiOperation({ summary: 'List all tags' })
  @ApiQuery({ name: 'language', required: false, enum: ['en', 'fr', 'rw'] })
  @ApiResponse({ status: 200, description: 'Tags retrieved successfully' })
  async findAll(@Res() res: Response, @Query('language') language?: string) {
    const result = await this.tagService.findAll(language);
    return ResponseCommon.handleSuccess(
      HttpStatus.OK,
      'Tags retrieved successfully',
      res,
      result,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single tag by ID' })
  @ApiResponse({ status: 200, description: 'Tag retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Tag not found' })
  async findOne(@Res() res: Response, @Param('id') id: string) {
    const result = await this.tagService.findOne(id);
    return ResponseCommon.handleSuccess(
      HttpStatus.OK,
      'Tag retrieved successfully',
      res,
      result,
    );
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('editor', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a tag' })
  @ApiResponse({ status: 200, description: 'Tag updated successfully' })
  @ApiResponse({ status: 404, description: 'Tag not found' })
  @ApiResponse({ status: 409, description: 'Tag already exists' })
  async update(
    @Res() res: Response,
    @Param('id') id: string,
    @Body() body: UpdateTagDto,
  ) {
    const result = await this.tagService.update(id, body);
    return ResponseCommon.handleSuccess(
      HttpStatus.OK,
      'Tag updated successfully',
      res,
      result,
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('editor', 'admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a tag' })
  @ApiResponse({ status: 200, description: 'Tag deleted successfully' })
  @ApiResponse({ status: 404, description: 'Tag not found' })
  @ApiResponse({ status: 409, description: 'Tag is associated with articles' })
  async remove(@Res() res: Response, @Param('id') id: string) {
    await this.tagService.remove(id);
    return ResponseCommon.handleSuccess(
      HttpStatus.OK,
      'Tag deleted successfully',
      res,
    );
  }
}

export default TagController;
