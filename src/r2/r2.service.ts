import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import {
  R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BUCKET_NAME,
  R2_PUBLIC_URL,
} from '../common/constant.common';
import LoggerService from '../logger/logger.service';

const logger = new LoggerService('r2');

@Injectable()
class R2Service implements OnModuleInit {
  private s3Client!: S3Client;

  onModuleInit(): void {
    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID as string,
        secretAccessKey: R2_SECRET_ACCESS_KEY as string,
      },
    });
    logger.handleInfoLog('R2 S3 client initialized');
  }

  async uploadFile(
    fileBuffer: Buffer,
    key: string,
    mimeType: string,
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType,
    });

    await this.s3Client.send(command);
    logger.handleInfoLog(`File uploaded to R2: ${key}`);

    return `${R2_PUBLIC_URL}/${key}`;
  }

  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    });

    await this.s3Client.send(command);
    logger.handleInfoLog(`File deleted from R2: ${key}`);
  }
}

export default R2Service;
