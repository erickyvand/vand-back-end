import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { uniq, compact, kebabCase } from 'lodash';
import PrismaService from '../../../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Language } from '@prisma/client';

@Injectable()
class CategoryService {
  constructor(private readonly prismaService: PrismaService) {}

  private generateSlug(name: string): string {
    return kebabCase(name);
  }

  async create(data: CreateCategoryDto) {
    const languages = data.translations.map((t) => t.language);
    if (uniq(languages).length !== languages.length) {
      throw new HttpException(
        'Duplicate languages in translations',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (data.parentGroupId) {
      const parentRows = await this.prismaService.category.findMany({
        where: { groupId: data.parentGroupId },
      });
      if (parentRows.length === 0) {
        throw new HttpException('Parent category not found', HttpStatus.NOT_FOUND);
      }
      if (parentRows[0].parentGroupId) {
        throw new HttpException(
          'Subcategories can only be one level deep',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    for (const translation of data.translations) {
      const baseSlug = this.generateSlug(translation.name);
      const language = translation.language as Language;

      const existing = await this.prismaService.category.findUnique({
        where: { slug_language: { slug: baseSlug, language } },
      });

      if (existing) {
        throw new HttpException(
          `Category already exists for language '${translation.language}': ${translation.name}`,
          HttpStatus.CONFLICT,
        );
      }
    }

    const groupId = randomUUID();

    const categories = await this.prismaService.$transaction(
      data.translations.map((translation) =>
        this.prismaService.category.create({
          data: {
            groupId,
            name: translation.name,
            slug: this.generateSlug(translation.name),
            description: translation.description,
            image: translation.image,
            language: translation.language as Language,
            parentGroupId: data.parentGroupId || null,
          },
        }),
      ),
    );

    return categories;
  }

  async findAll(language?: string) {
    const where: any = { parentGroupId: null };
    if (language) where.language = language as Language;

    const parents = await this.prismaService.category.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    const parentGroupIds = uniq(compact(parents.map((p) => p.groupId))) as string[];

    const children = parentGroupIds.length
      ? await this.prismaService.category.findMany({
          where: {
            parentGroupId: { in: parentGroupIds },
            ...(language ? { language: language as Language } : {}),
          },
          orderBy: { name: 'asc' },
        })
      : [];

    return parents.map((parent) => ({
      ...parent,
      children: children.filter((c) => c.parentGroupId === parent.groupId),
    }));
  }

  async findOne(id: string) {
    const category = await this.prismaService.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new HttpException('Category not found', HttpStatus.NOT_FOUND);
    }

    const children = await this.prismaService.category.findMany({
      where: { parentGroupId: category.groupId },
      orderBy: { name: 'asc' },
    });

    const parent = category.parentGroupId
      ? await this.prismaService.category.findFirst({
          where: { groupId: category.parentGroupId, language: category.language },
        })
      : null;

    return { ...category, children, parent };
  }

  async findBySlug(slug: string, language?: string) {
    const where: any = { slug };
    if (language) where.language = language as Language;

    const category = await this.prismaService.category.findFirst({ where });

    if (!category) {
      throw new HttpException('Category not found', HttpStatus.NOT_FOUND);
    }

    const children = await this.prismaService.category.findMany({
      where: {
        parentGroupId: category.groupId,
        ...(language ? { language: language as Language } : {}),
      },
      orderBy: { name: 'asc' },
    });

    const parent = category.parentGroupId
      ? await this.prismaService.category.findFirst({
          where: { groupId: category.parentGroupId, language: category.language },
        })
      : null;

    return { ...category, children, parent };
  }

  async update(id: string, data: UpdateCategoryDto) {
    const category = await this.prismaService.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new HttpException('Category not found', HttpStatus.NOT_FOUND);
    }

    const updateData: any = { ...data };
    const effectiveLanguage = (data.language as Language) || category.language;

    if (data.language) {
      updateData.language = data.language as Language;
    }

    if (data.name && data.name !== category.name) {
      updateData.slug = this.generateSlug(data.name);
    }

    if (data.name || data.language) {
      const slug = updateData.slug || category.slug;

      const existing = await this.prismaService.category.findFirst({
        where: {
          slug,
          language: effectiveLanguage,
          NOT: { id },
        },
      });

      if (existing) {
        throw new HttpException(
          'Category already exists for this language',
          HttpStatus.CONFLICT,
        );
      }
    }

    if (data.parentGroupId !== undefined) {
      if (data.parentGroupId) {
        const parentRows = await this.prismaService.category.findMany({
          where: { groupId: data.parentGroupId },
        });
        if (parentRows.length === 0) {
          throw new HttpException('Parent category not found', HttpStatus.NOT_FOUND);
        }
        if (parentRows[0].parentGroupId) {
          throw new HttpException(
            'Subcategories can only be one level deep',
            HttpStatus.BAD_REQUEST,
          );
        }
        if (data.parentGroupId === category.groupId) {
          throw new HttpException(
            'Category cannot be its own parent',
            HttpStatus.BAD_REQUEST,
          );
        }
      }
      updateData.parentGroupId = data.parentGroupId;
    }

    return this.prismaService.category.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string) {
    const category = await this.prismaService.category.findUnique({
      where: { id },
      include: { articles: true },
    });

    if (!category) {
      throw new HttpException('Category not found', HttpStatus.NOT_FOUND);
    }

    if (category.articles.length > 0) {
      throw new HttpException(
        'Cannot delete category that has articles',
        HttpStatus.CONFLICT,
      );
    }

    await this.prismaService.category.delete({ where: { id } });
  }
}

export default CategoryService;
