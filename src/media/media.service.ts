import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import PrismaService from '../prisma/prisma.service';
import R2Service from '../r2/r2.service';
import LoggerService from '../logger/logger.service';
import { R2_FOLDER } from '../common/constant.common';

const logger = new LoggerService('media');

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

@Injectable()
class MediaService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly r2Service: R2Service,
  ) {}

  async uploadFile(file: Express.Multer.File, uploadedBy: string, folder = 'media') {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new HttpException(
        `File type '${file.mimetype}' is not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new HttpException(
        `File size exceeds the limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const extension = extname(file.originalname);
    const env = R2_FOLDER || 'dev';
    const key = `${env}/${folder}/${randomUUID()}${extension}`;

    try {
      const url = await this.r2Service.uploadFile(
        file.buffer,
        key,
        file.mimetype,
      );

      const media = await this.prismaService.media.create({
        data: {
          url,
          filename: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          uploadedBy,
        },
      });

      logger.handleInfoLog(`Media uploaded: ${media.id} by ${uploadedBy}`);
      return media;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      const err = error as Error;
      logger.handleErrorLog(`Media upload failed: ${err.message}`);
      throw new HttpException(
        'Failed to upload file',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getMediaById(id: string) {
    const media = await this.prismaService.media.findUnique({
      where: { id },
    });

    if (!media) {
      throw new HttpException('Media not found', HttpStatus.NOT_FOUND);
    }

    return media;
  }

  async deleteMedia(id: string) {
    const media = await this.prismaService.media.findUnique({
      where: { id },
    });

    if (!media) {
      throw new HttpException('Media not found', HttpStatus.NOT_FOUND);
    }

    const key = media.url.split('/').slice(3).join('/');

    try {
      await this.r2Service.deleteFile(key);
      await this.prismaService.media.delete({ where: { id } });
      logger.handleInfoLog(`Media deleted: ${id}`);
    } catch (error) {
      const err = error as Error;
      logger.handleErrorLog(`Media deletion failed: ${err.message}`);
      throw new HttpException(
        'Failed to delete file',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

export default MediaService;
