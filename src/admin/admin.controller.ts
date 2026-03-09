import { Body, Controller, Get, HttpStatus, Post, Query, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import LoggerService from '../logger/logger.service';
import { Request, Response } from 'express';
import { CreateAdminDto } from './dto/create.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import ResponseCommon from '../common/response.common';
import AdminService from './admin.service';
import JwtAuthGuard from '../common/auth/guards/jwt-auth.guard';
import RolesGuard from '../common/auth/guards/roles.guard';
import { Roles } from '../common/auth/decorators/roles.decorator';

const logger = new LoggerService('admin');

@Controller('api/admin/users')
@ApiTags('Admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@ApiBearerAuth()
class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('create')
  @ApiOperation({ summary: 'Create a user' })
  @ApiResponse({ status: 201, description: 'User created successfully.' })
  async createAdmin(
    @Res() res: Response,
    @Req() req: Request,
    @Body() body: CreateAdminDto,
  ) {
    const user = req.user as any;
    const result = await this.adminService.createUser(body, user.internalProfile.id);
    logger.handleInfoLog(`User created: ${body.email} by ${user.internalProfile.id}`);
    return ResponseCommon.handleSuccess(
      HttpStatus.CREATED,
      'User created successfully',
      res,
      result,
    );
  }

  @Get()
  @ApiOperation({ summary: 'List internal users with pagination' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  async findAll(@Res() res: Response, @Query() query: QueryUsersDto) {
    const result = await this.adminService.findAllUsers(query);
    return ResponseCommon.handleSuccess(
      HttpStatus.OK,
      'Users retrieved successfully',
      res,
      result,
    );
  }

  @Get('roles')
  @ApiOperation({ summary: 'Get all roles' })
  @ApiResponse({ status: 200, description: 'Roles retrieved successfully' })
  async getRoles(@Res() res: Response) {
    const result = await this.adminService.findRoles();
    return ResponseCommon.handleSuccess(
      HttpStatus.OK,
      'Roles retrieved successfully',
      res,
      result,
    );
  }
}

export default AdminController;
