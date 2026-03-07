import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import PrismaService from '../../../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Language } from '@prisma/client';

@Injectable()
class CategoryService {
  constructor(private readonly prismaService: PrismaService) {}

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  async create(data: CreateCategoryDto) {
    const languages = data.translations.map((t) => t.language);
    const uniqueLanguages = new Set(languages);
    if (uniqueLanguages.size !== languages.length) {
      throw new HttpException(
        'Duplicate languages in translations',
        HttpStatus.BAD_REQUEST,
      );
    }

    for (const translation of data.translations) {
      const slug = this.generateSlug(translation.name);
      const language = translation.language as Language;

      const existing = await this.prismaService.category.findUnique({
        where: { slug_language: { slug, language } },
      });

      if (existing) {
        throw new HttpException(
          `Category already exists for language '${translation.language}': ${translation.name}`,
          HttpStatus.CONFLICT,
        );
      }
    }

    const categories = await this.prismaService.$transaction(
      data.translations.map((translation) =>
        this.prismaService.category.create({
          data: {
            name: translation.name,
            slug: this.generateSlug(translation.name),
            description: translation.description,
            image: translation.image,
            language: translation.language as Language,
          },
        }),
      ),
    );

    return categories;
  }

  async findAll(language?: string) {
    const where: any = {};
    if (language) where.language = language as Language;

    return this.prismaService.category.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const category = await this.prismaService.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new HttpException('Category not found', HttpStatus.NOT_FOUND);
    }

    return category;
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
