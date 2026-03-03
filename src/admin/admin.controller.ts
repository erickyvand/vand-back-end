import { Body, Controller, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import LoggerService from '../logger/logger.service';
import { Response } from 'express';
import { CreateAdminDto } from './dto/create.dto';
import ResponseCommon from '../common/response.common';
import AdminService from './admin.service';

const logger = new LoggerService('admin');

@Controller('api/admin/users')
@ApiTags('Admin')
class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('create')
  @ApiOperation({ summary: 'Create an admin user' })
  @ApiResponse({ status: 201, description: 'Admin user successfully created.' })
  async createAdmin(
    @Res() res: Response,
    @Req() req: Request,
    @Body() body: CreateAdminDto,
  ) {
    // Then in your method:
    logger.handleInfoLog('Admin user created');
    const result = await this.adminService.createUser(body);
    return ResponseCommon.handleSuccess(
      HttpStatus.CREATED,
      'Admin user created successfully',
      res,
      result,
    );
  }
}

export default AdminController;
