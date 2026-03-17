import { Body, Controller, Get, HttpStatus, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import JwtAuthGuard from './guards/jwt-auth.guard';
import LoggerService from '../../logger/logger.service';
import ResponseCommon from '../response.common';
import AuthService from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { VerifyTwoFactorDto } from './dto/two-factor.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { SkipMustChangePassword } from '../auth/guards/must-change-password.guard';

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
  @Post('2fa/verify')
  @ApiOperation({ summary: 'Verify 2FA OTP and complete login' })
  @ApiResponse({ status: 200, description: 'Login completed successfully.' })
  @ApiResponse({ status: 401, description: 'Invalid or expired OTP.' })
  async verifyTwoFactor(
    @Res() res: Response,
    @Req() req: Request,
    @Body() body: VerifyTwoFactorDto,
  ) {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const result = await this.authService.verifyTwoFactor(body.tempToken, body.otp, ip);
    return ResponseCommon.handleSuccess(HttpStatus.OK, 'Login successful', res, result);
  }

  @Get('terms')
  @ApiOperation({ summary: 'Get current active terms and conditions' })
  @ApiResponse({ status: 200, description: 'Terms retrieved successfully' })
  async getTerms(@Res() res: Response) {
    const result = await this.authService.getActiveTerms();
    return ResponseCommon.handleSuccess(HttpStatus.OK, 'Terms retrieved successfully', res, result);
  }

  @Post('change-password')
  @SkipMustChangePassword()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change password (required on first login) — must accept terms and conditions' })
  @ApiResponse({ status: 200, description: 'Password changed successfully.' })
  @ApiResponse({ status: 400, description: 'Terms not accepted or same password.' })
  @ApiResponse({ status: 401, description: 'Current password incorrect.' })
  async changePassword(
    @Res() res: Response,
    @Req() req: Request,
    @Body() body: ChangePasswordDto,
  ) {
    const user = req.user as any;
    await this.authService.changePassword(user.id, body.currentPassword, body.newPassword);
    return ResponseCommon.handleSuccess(HttpStatus.OK, 'Password changed successfully', res, null);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  async getMe(@Res() res: Response, @Req() req: Request) {
    const user = req.user as any;
    const result = await this.authService.getMe(user.id);
    return ResponseCommon.handleSuccess(
      HttpStatus.OK,
      'Profile retrieved successfully',
      res,
      result,
    );
  }
}

export default AuthController;
