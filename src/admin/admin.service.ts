import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import Argon from '../argon/argon';
import PrismaService from '../prisma/prisma.service';
import { CreateAdminDto } from './dto/create.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { OffsetPagination } from '../common/pagination';

@Injectable()
class AdminService {
  private readonly argon = new Argon();

  constructor(private readonly prismaService: PrismaService) {}

  private toSlug(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
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
    const hashedPassword = await this.argon.hashPassword('password');

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
}

export default AdminService;
