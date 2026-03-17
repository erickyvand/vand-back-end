import { Module } from '@nestjs/common';
import AdminController from './admin.controller';
import TermsController from './terms.controller';
import AdminService from './admin.service';
import MailService from '../common/mail/mail.service';

@Module({
  controllers: [AdminController, TermsController],
  providers: [AdminService, MailService],
})
export class AdminModule {}
