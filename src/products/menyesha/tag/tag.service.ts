import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import PrismaService from '../../../prisma/prisma.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { Language } from '@prisma/client';

@Injectable()
class TagService {
  constructor(private readonly prismaService: PrismaService) {}

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  async create(data: CreateTagDto) {
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

      const existing = await this.prismaService.tag.findFirst({
        where: {
          language,
          OR: [{ name: translation.name }, { slug }],
        },
      });

      if (existing) {
        throw new HttpException(
          `Tag already exists for language '${translation.language}': ${translation.name}`,
          HttpStatus.CONFLICT,
        );
      }
    }

    const tags = await this.prismaService.$transaction(
      data.translations.map((translation) =>
        this.prismaService.tag.create({
          data: {
            name: translation.name,
            slug: this.generateSlug(translation.name),
            language: translation.language as Language,
          },
        }),
      ),
    );

    return tags;
  }

  async findAll(language?: string) {
    const where: any = {};
    if (language) where.language = language as Language;

    return this.prismaService.tag.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const tag = await this.prismaService.tag.findUnique({
      where: { id },
    });

    if (!tag) {
      throw new HttpException('Tag not found', HttpStatus.NOT_FOUND);
    }

    return tag;
  }

  async update(id: string, data: UpdateTagDto) {
    const tag = await this.prismaService.tag.findUnique({
      where: { id },
    });

    if (!tag) {
      throw new HttpException('Tag not found', HttpStatus.NOT_FOUND);
    }

    const updateData: any = { ...data };
    const effectiveLanguage = (data.language as Language) || tag.language;

    if (data.language) {
      updateData.language = data.language as Language;
    }

    if (data.name && data.name !== tag.name) {
      updateData.slug = this.generateSlug(data.name);
    }

    if (data.name || data.language) {
      const slug = updateData.slug || tag.slug;
      const name = data.name || tag.name;

      const existing = await this.prismaService.tag.findFirst({
        where: {
          language: effectiveLanguage,
          OR: [{ name }, { slug }],
          NOT: { id },
        },
      });

      if (existing) {
        throw new HttpException('Tag already exists for this language', HttpStatus.CONFLICT);
      }
    }

    return this.prismaService.tag.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string) {
    const tag = await this.prismaService.tag.findUnique({
      where: { id },
      include: { articles: true },
    });

    if (!tag) {
      throw new HttpException('Tag not found', HttpStatus.NOT_FOUND);
    }

    if (tag.articles.length > 0) {
      throw new HttpException(
        'Cannot delete tag that is associated with articles',
        HttpStatus.CONFLICT,
      );
    }

    await this.prismaService.tag.delete({ where: { id } });
  }
}

export default TagService;
