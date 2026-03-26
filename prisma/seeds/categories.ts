import { PrismaClient, Language } from '@prisma/client';
import { randomUUID } from 'crypto';

const categories = [
  {
    slug: 'news',
    names: [
      { language: Language.en, name: 'News', description: 'News and analysis' },
      { language: Language.fr, name: 'Actualités', description: 'Actualités et analyses' },
      { language: Language.rw, name: 'Amakuru', description: 'Amakuru ya asanzwe' },
    ],
  },
  {
    slug: 'sports',
    names: [
      { language: Language.en, name: 'Sports', description: 'Sports coverage and updates' },
      { language: Language.fr, name: 'Sports', description: 'Couverture sportive et mises à jour' },
      { language: Language.rw, name: 'Siporo', description: 'Amakuru ya siporo' },
    ],
  },
  {
    slug: 'technology',
    names: [
      { language: Language.en, name: 'Technology', description: 'Technology news and trends' },
      { language: Language.fr, name: 'Technologie', description: 'Actualités et tendances technologiques' },
      { language: Language.rw, name: 'Ikoranabuhanga', description: 'Amakuru ya ikoranabuhanga' },
    ],
  },
  {
    slug: 'entertainment',
    names: [
      { language: Language.en, name: 'Entertainment', description: 'Entertainment and culture' },
      { language: Language.fr, name: 'Divertissement', description: 'Divertissement et culture' },
      { language: Language.rw, name: 'Imyidagaduro', description: "Imyidagaduro n'umuco" },
    ],
  },
];

export async function seedCategories(prisma: PrismaClient) {
  let count = 0;

  for (const cat of categories) {
    const groupId = randomUUID();

    for (const entry of cat.names) {
      const existing = await prisma.category.findUnique({
        where: { slug_language: { slug: cat.slug, language: entry.language } },
      });

      if (existing) continue;

      await prisma.category.create({
        data: {
          slug: cat.slug,
          groupId,
          language: entry.language,
          name: entry.name,
          description: entry.description,
        },
      });

      count++;
    }
  }

  console.log(`Seeded ${count} categories`);
}
