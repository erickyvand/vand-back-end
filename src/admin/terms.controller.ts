import { Body, Controller, Get, HttpStatus, Param, Patch, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import ResponseCommon from '../common/response.common';
import AdminService from './admin.service';
import { CreateTermsDto } from './dto/create-terms.dto';
import JwtAuthGuard from '../common/auth/guards/jwt-auth.guard';
import RolesGuard from '../common/auth/guards/roles.guard';
import { Roles } from '../common/auth/decorators/roles.decorator';

@Controller('api/admin/terms')
@ApiTags('Admin - Terms')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@ApiBearerAuth()
class TermsController {
  constructor(private readonly adminService: AdminService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new terms version' })
  @ApiResponse({ status: 201, description: 'Terms created successfully' })
  async create(@Res() res: Response, @Req() req: Request, @Body() body: CreateTermsDto) {
    const admin = req.user as any;
    const result = await this.adminService.createTerms(body, admin.id);
    return ResponseCommon.handleSuccess(HttpStatus.CREATED, 'Terms created successfully', res, result);
  }

  @Get()
  @ApiOperation({ summary: 'List all terms versions' })
  @ApiResponse({ status: 200, description: 'Terms retrieved successfully' })
  async findAll(@Res() res: Response) {
    const result = await this.adminService.findAllTerms();
    return ResponseCommon.handleSuccess(HttpStatus.OK, 'Terms retrieved successfully', res, result);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a terms version by ID (full content)' })
  @ApiResponse({ status: 200, description: 'Terms retrieved successfully' })
  async findOne(@Res() res: Response, @Param('id') id: string) {
    const result = await this.adminService.findTermsById(id);
    return ResponseCommon.handleSuccess(HttpStatus.OK, 'Terms retrieved successfully', res, result);
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Set a terms version as active' })
  @ApiResponse({ status: 200, description: 'Terms activated successfully' })
  async activate(@Res() res: Response, @Param('id') id: string) {
    const result = await this.adminService.activateTerms(id);
    return ResponseCommon.handleSuccess(HttpStatus.OK, 'Terms activated successfully', res, result);
  }
}

export default TermsController;
