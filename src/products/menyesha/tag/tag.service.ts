import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import PrismaService from '../../../prisma/prisma.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { Language } from '@prisma/client';

const TAG_INCLUDE = {
  translations: {
    select: { id: true, language: true, label: true },
    orderBy: { language: 'asc' as const },
  },
};

@Injectable()
class TagService {
  constructor(private readonly prismaService: PrismaService) {}

  private toSlug(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  async create(data: CreateTagDto) {
    const slug = this.toSlug(data.name);

    const existing = await this.prismaService.tag.findUnique({
      where: { slug },
    });
    if (existing) {
      throw new HttpException(`Tag with slug '${slug}' already exists`, HttpStatus.CONFLICT);
    }

    const languages = data.translations.map((t) => t.language);
    if (new Set(languages).size !== languages.length) {
      throw new HttpException('Duplicate languages in translations', HttpStatus.BAD_REQUEST);
    }

    for (const t of data.translations) {
      const existingLabel = await this.prismaService.tagTranslation.findFirst({
        where: { label: t.label, language: t.language as Language },
      });
      if (existingLabel) {
        throw new HttpException(
          `Label '${t.label}' already exists for language '${t.language}'`,
          HttpStatus.CONFLICT,
        );
      }
    }

    return this.prismaService.tag.create({
      data: {
        name: data.name,
        slug,
        translations: {
          create: data.translations.map((t) => ({
            label: t.label,
            language: t.language as Language,
          })),
        },
      },
      include: TAG_INCLUDE,
    });
  }

  private resolveLabel(tag: { name: string; translations: { language: string; label: string }[] }, language?: string) {
    if (!language) return tag;
    const translation = tag.translations.find((t) => t.language === language);
    return { ...tag, label: translation ? translation.label : tag.name };
  }

  async findAll(language?: string) {
    const tags = await this.prismaService.tag.findMany({
      orderBy: { slug: 'asc' },
      include: TAG_INCLUDE,
    });

    if (!language) return tags;

    return tags.map((tag) => this.resolveLabel(tag, language));
  }

  async findOne(id: string, language?: string) {
    const tag = await this.prismaService.tag.findUnique({
      where: { id },
      include: TAG_INCLUDE,
    });

    if (!tag) {
      throw new HttpException('Tag not found', HttpStatus.NOT_FOUND);
    }

    return this.resolveLabel(tag, language);
  }

  async findBySlug(slug: string, language?: string) {
    const tag = await this.prismaService.tag.findUnique({
      where: { slug },
      include: TAG_INCLUDE,
    });

    if (!tag) {
      throw new HttpException('Tag not found', HttpStatus.NOT_FOUND);
    }

    return this.resolveLabel(tag, language);
  }

  async update(id: string, data: UpdateTagDto) {
    const tag = await this.prismaService.tag.findUnique({
      where: { id },
    });

    if (!tag) {
      throw new HttpException('Tag not found', HttpStatus.NOT_FOUND);
    }

    if (data.name) {
      const slug = this.toSlug(data.name);
      const existing = await this.prismaService.tag.findFirst({
        where: { slug, NOT: { id } },
      });
      if (existing) {
        throw new HttpException(`Tag with slug '${slug}' already exists`, HttpStatus.CONFLICT);
      }
    }

    if (data.translations) {
      const languages = data.translations.map((t) => t.language);
      if (new Set(languages).size !== languages.length) {
        throw new HttpException('Duplicate languages in translations', HttpStatus.BAD_REQUEST);
      }

      for (const t of data.translations) {
        const existingLabel = await this.prismaService.tagTranslation.findFirst({
          where: {
            label: t.label,
            language: t.language as Language,
            NOT: { tagId: id },
          },
        });
        if (existingLabel) {
          throw new HttpException(
            `Label '${t.label}' already exists for language '${t.language}'`,
            HttpStatus.CONFLICT,
          );
        }
      }
    }

    return this.prismaService.tag.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name, slug: this.toSlug(data.name) }),
        ...(data.translations && {
          translations: {
            deleteMany: {},
            create: data.translations.map((t) => ({
              label: t.label,
              language: t.language as Language,
            })),
          },
        }),
      },
      include: TAG_INCLUDE,
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
