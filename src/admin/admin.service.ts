import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { kebabCase } from 'lodash';
import { randomBytes } from 'crypto';
import Argon from '../argon/argon';
import PrismaService from '../prisma/prisma.service';
import MailService from '../common/mail/mail.service';
import { CreateAdminDto } from './dto/create.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { CreateTermsDto } from './dto/create-terms.dto';
import { OffsetPagination } from '../common/pagination';

@Injectable()
class AdminService {
  private readonly argon = new Argon();

  constructor(
    private readonly prismaService: PrismaService,
    private readonly mailService: MailService,
  ) {}

  private generateTempPassword(): string {
    return randomBytes(6).toString('hex');
  }

  private toSlug(text: string): string {
    return kebabCase(text);
  }

  private async generateUserSlug(fullName: string): Promise<string> {
    const base = this.toSlug(fullName);
    const existing = await this.prismaService.user.findUnique({ where: { slug: base } });
    if (!existing) return base;

    const similar = await this.prismaService.user.findMany({
      where: { slug: { startsWith: `${base}-` } },
      select: { slug: true },
    });

    const numbers = similar
      .map((u) => {
        const suffix = u.slug.slice(base.length + 1);
        return /^\d+$/.test(suffix) ? parseInt(suffix, 10) : 0;
      })
      .filter((n) => n > 0);

    const next = numbers.length > 0 ? Math.max(...numbers) + 1 : 2;
    return `${base}-${next}`;
  }

  async createUser(body: CreateAdminDto, createdById: string) {
    const existingUser = await this.prismaService.user.findUnique({
      where: { email: body.email },
    });
    if (existingUser) {
      throw new HttpException('User with this email already exists', HttpStatus.CONFLICT);
    }

    const role = await this.prismaService.role.findUnique({
      where: { id: body.roleId },
    });
    if (!role) {
      throw new HttpException('Role not found', HttpStatus.NOT_FOUND);
    }

    const slug = await this.generateUserSlug(body.fullName);
    const tempPassword = this.generateTempPassword();
    const hashedPassword = await this.argon.hashPassword(tempPassword);

    const user = await this.prismaService.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          fullName: body.fullName,
          slug,
          email: body.email,
          phone: body.phone,
          password: hashedPassword,
          userType: 'Internal',
        },
      });

      await tx.internalProfile.create({
        data: {
          userId: newUser.id,
          roleId: body.roleId,
          createdBy: createdById,
          mustChangePassword: true,
        },
      });

      return tx.user.findUnique({
        where: { id: newUser.id },
        select: {
          id: true,
          fullName: true,
          slug: true,
          email: true,
          phone: true,
          userType: true,
          createdAt: true,
          internalProfile: {
            select: {
              id: true,
              role: true,
              mustChangePassword: true,
              avatar: true,
              bio: true,
            },
          },
        },
      });
    });

    await this.mailService.send({
      // to: { email: body.email, name: body.fullName },
      to: { email: 'erickyvand@gmail.com', name: body.fullName },
      subject: 'Welcome to Vand — Your account is ready',
      htmlContent: `
        <p>Hi ${body.fullName},</p>
        <p>Your account has been created. Use the credentials below to log in:</p>
        <table style="border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:4px 12px 4px 0;font-weight:bold">Email</td><td>${body.email}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;font-weight:bold">Password</td><td style="font-family:monospace;font-size:16px">${tempPassword}</td></tr>
        </table>
        <p>You will be required to accept our terms and conditions and set a new password before you can use your account.</p>
        <p>Keep this email confidential. If you did not expect this, contact your administrator immediately.</p>
      `,
    });

    return user;
  }

  async findAllUsers(query: QueryUsersDto) {
    const { page, limit, skip } = OffsetPagination.parse(query);
    const where: any = { userType: 'Internal' };

    if (query.role) {
      where.internalProfile = { role: { name: query.role } };
    }

    if (query.search) {
      where.OR = [
        { fullName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prismaService.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          fullName: true,
          slug: true,
          email: true,
          phone: true,
          isActive: true,
          createdAt: true,
          deletedAt: true,
          internalProfile: {
            select: {
              id: true,
              role: true,
              avatar: true,
              bio: true,
              isSuspended: true,
            },
          },
        },
      }),
      this.prismaService.user.count({ where }),
    ]);

    return { users, meta: OffsetPagination.meta(total, page, limit) };
  }

  private async findUserOrFail(id: string) {
    const user = await this.prismaService.user.findFirst({
      where: { id, userType: 'Internal' },
    });
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    return user;
  }

  async deactivateUser(id: string) {
    const user = await this.findUserOrFail(id);
    if (!user.isActive) {
      throw new HttpException('User is already deactivated', HttpStatus.BAD_REQUEST);
    }
    await this.prismaService.user.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async activateUser(id: string) {
    const user = await this.findUserOrFail(id);
    if (user.deletedAt) {
      throw new HttpException('Cannot activate a deleted user', HttpStatus.BAD_REQUEST);
    }
    if (user.isActive) {
      throw new HttpException('User is already active', HttpStatus.BAD_REQUEST);
    }
    await this.prismaService.user.update({
      where: { id },
      data: { isActive: true },
    });
  }

  async softDeleteUser(id: string) {
    const user = await this.findUserOrFail(id);
    if (user.deletedAt) {
      throw new HttpException('User is already deleted', HttpStatus.BAD_REQUEST);
    }
    await this.prismaService.user.update({
      where: { id },
      data: { isActive: false, deletedAt: new Date() },
    });
  }

  async toggleTwoFactor(id: string, enabled: boolean, adminId: string) {
    if (id === adminId) {
      throw new HttpException('You cannot toggle your own 2FA', HttpStatus.FORBIDDEN);
    }

    const user = await this.findUserOrFail(id);

    const profile = await this.prismaService.internalProfile.findUnique({
      where: { userId: user.id },
    });

    if (!profile) {
      throw new HttpException('Internal profile not found', HttpStatus.NOT_FOUND);
    }

    if (profile.twoFactorEnabled === enabled) {
      throw new HttpException(
        `2FA is already ${enabled ? 'enabled' : 'disabled'} for this user`,
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.prismaService.internalProfile.update({
      where: { userId: user.id },
      data: {
        twoFactorEnabled: enabled,
        ...(!enabled && { twoFactorOtp: null, twoFactorOtpExpiry: null }),
      },
    });
  }

  async findRoles() {
    return this.prismaService.role.findMany({
      select: {
        id: true,
        name: true,
        displayName: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async createTerms(data: CreateTermsDto, createdById: string) {
    const existing = await this.prismaService.terms.findUnique({
      where: { version: data.version },
    });
    if (existing) {
      throw new HttpException(`Terms version '${data.version}' already exists`, HttpStatus.CONFLICT);
    }

    return this.prismaService.terms.create({
      data: {
        version: data.version,
        content: data.content,
        createdBy: createdById,
      },
    });
  }

  async findAllTerms() {
    return this.prismaService.terms.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, version: true, isActive: true, createdAt: true, updatedAt: true },
    });
  }

  async findTermsById(id: string) {
    const terms = await this.prismaService.terms.findUnique({ where: { id } });
    if (!terms) throw new HttpException('Terms not found', HttpStatus.NOT_FOUND);
    return terms;
  }

  async activateTerms(id: string) {
    const terms = await this.prismaService.terms.findUnique({ where: { id } });
    if (!terms) throw new HttpException('Terms not found', HttpStatus.NOT_FOUND);
    if (terms.isActive) throw new HttpException('This version is already active', HttpStatus.BAD_REQUEST);

    await this.prismaService.$transaction([
      this.prismaService.terms.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      }),
      this.prismaService.terms.update({
        where: { id },
        data: { isActive: true },
      }),
    ]);

    return this.prismaService.terms.findUnique({ where: { id } });
  }

  async getActiveTerms() {
    const terms = await this.prismaService.terms.findFirst({ where: { isActive: true } });
    if (!terms) throw new HttpException('No active terms found', HttpStatus.NOT_FOUND);
    return terms;
  }
}

export default AdminService;
