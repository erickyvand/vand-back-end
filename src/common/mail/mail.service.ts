import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { BrevoClient } from '@getbrevo/brevo';
import { BREVO_API_KEY, MAIL_FROM_EMAIL, MAIL_FROM_NAME } from '../constant.common';
import LoggerService from '../../logger/logger.service';

const logger = new LoggerService('mail');

export interface MailRecipient {
  email: string;
  name?: string;
}

export interface SendMailOptions {
  to: MailRecipient | MailRecipient[];
  subject: string;
  htmlContent: string;
  textContent?: string;
  replyTo?: MailRecipient;
}

export interface SendMailWithTemplateOptions {
  to: MailRecipient | MailRecipient[];
  templateId: number;
  params?: Record<string, any>;
  replyTo?: MailRecipient;
}

@Injectable()
class MailService {
  private readonly client: BrevoClient;

  constructor() {
    this.client = new BrevoClient({ apiKey: BREVO_API_KEY || '' });
  }

  async send(options: SendMailOptions): Promise<void> {
    const recipients = Array.isArray(options.to) ? options.to : [options.to];

    try {
      await this.client.transactionalEmails.sendTransacEmail({
        sender: {
          email: MAIL_FROM_EMAIL || 'no-reply@vand.rw',
          name: MAIL_FROM_NAME || 'Vand',
        },
        to: recipients,
        subject: options.subject,
        htmlContent: options.htmlContent,
        ...(options.textContent && { textContent: options.textContent }),
        ...(options.replyTo && { replyTo: options.replyTo }),
      });

      logger.handleInfoLog(`Email sent to ${recipients.map((r) => r.email).join(', ')}: ${options.subject}`);
    } catch (error: any) {
      logger.handleErrorLog(`Failed to send email: ${error?.message}`);
      throw new HttpException('Failed to send email', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async sendWithTemplate(options: SendMailWithTemplateOptions): Promise<void> {
    const recipients = Array.isArray(options.to) ? options.to : [options.to];

    try {
      await this.client.transactionalEmails.sendTransacEmail({
        sender: {
          email: MAIL_FROM_EMAIL || 'no-reply@vand.rw',
          name: MAIL_FROM_NAME || 'Vand',
        },
        to: recipients,
        templateId: options.templateId,
        ...(options.params && { params: options.params }),
        ...(options.replyTo && { replyTo: options.replyTo }),
      });

      logger.handleInfoLog(`Template email (id: ${options.templateId}) sent to ${recipients.map((r) => r.email).join(', ')}`);
    } catch (error: any) {
      logger.handleErrorLog(`Failed to send template email: ${error?.message}`);
      throw new HttpException('Failed to send email', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}

export default MailService;
