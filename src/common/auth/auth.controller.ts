import { Body, Controller, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import LoggerService from '../../logger/logger.service';
import ResponseCommon from '../response.common';
import AuthService from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';

const logger = new LoggerService('auth');

@Controller('api/auth')
@ApiTags('Authentication')
class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @ApiOperation({ summary: 'User signup' })
  @ApiResponse({ status: 201, description: 'User successfully signed up.' })
  async signup(@Res() res: Response) {
    return res.send('Signup endpoint');
  }

  @Post('login')
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'User successfully logged in.' })
  @ApiResponse({ status: 401, description: 'Invalid credentials.' })
  @ApiResponse({ status: 403, description: 'Account is deactivated or suspended.' })
  async login(
    @Res() res: Response,
    @Req() req: Request,
    @Body() body: LoginDto,
  ) {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    logger.handleInfoLog(`Login attempt for email: ${body.email}`);
    const result = await this.authService.login(body.email, body.password, ip);
    return ResponseCommon.handleSuccess(
      HttpStatus.OK,
      'Login successful',
      res,
      result,
    );
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully.' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token.' })
  async refresh(
    @Res() res: Response,
    @Body() body: RefreshDto,
  ) {
    logger.handleInfoLog('Token refresh attempt');
    const result = await this.authService.refresh(body.refreshToken);
    return ResponseCommon.handleSuccess(
      HttpStatus.OK,
      'Token refreshed successfully',
      res,
      result,
    );
  }
}

export default AuthController;
