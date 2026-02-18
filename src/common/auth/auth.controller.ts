import { Controller, Post, Res } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { Response } from "express";

@Controller('api/auth')
  @ApiTags('Authentication')
class AuthController {
  @Post('signup')
  @ApiOperation({ summary: 'User signup' })
    @ApiResponse({ status: 201, description: 'User successfully signed up.' })
  async signup(@Res() res: Response) {
    return res.send('Signup endpoint');
  }
}

export default AuthController;