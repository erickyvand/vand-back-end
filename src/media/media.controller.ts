import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  Req,
  Res,
  HttpStatus,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import JwtAuthGuard from '../common/auth/guards/jwt-auth.guard';
import ResponseCommon from '../common/response.common';
import MediaService from './media.service';
import { UploadMediaDto } from './dto/upload-media.dto';

@Controller('api/media')
@ApiTags('Media')
class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload a media file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadMediaDto })
  @ApiResponse({ status: 201, description: 'File uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file type or size' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @Req() req: Request,
    @Res() res: Response,
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder?: string,
  ) {
    if (!file) {
      return ResponseCommon.handleError(
        HttpStatus.BAD_REQUEST,
        'No file provided',
        res,
      );
    }

    const user = req.user as any;

    if (!user.internalProfile) {
      return ResponseCommon.handleError(
        HttpStatus.FORBIDDEN,
        'Only internal users can upload media',
        res,
      );
    }

    const result = await this.mediaService.uploadFile(
      file,
      user.internalProfile.id,
      folder,
    );

    return ResponseCommon.handleSuccess(
      HttpStatus.CREATED,
      'File uploaded successfully',
      res,
      result,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get media by ID' })
  @ApiResponse({ status: 200, description: 'Media found' })
  @ApiResponse({ status: 404, description: 'Media not found' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getMedia(@Param('id') id: string, @Res() res: Response) {
    const result = await this.mediaService.getMediaById(id);
    return ResponseCommon.handleSuccess(
      HttpStatus.OK,
      'Media retrieved successfully',
      res,
      result,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a media file' })
  @ApiResponse({ status: 200, description: 'Media deleted successfully' })
  @ApiResponse({ status: 404, description: 'Media not found' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async deleteMedia(
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    await this.mediaService.deleteMedia(id);
    return ResponseCommon.handleSuccess(
      HttpStatus.OK,
      'Media deleted successfully',
      res,
    );
  }
}

export default MediaController;
