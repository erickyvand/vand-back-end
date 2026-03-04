import { PrismaClient } from '@prisma/client';

export async function seedCategories(prisma: PrismaClient) {
  const categories = [
    {
      name: 'Politics',
      slug: 'politics',
      description: 'Political news and analysis',
      translations: [
        { language: 'fr' as const, name: 'Politique', description: 'Actualités et analyses politiques' },
        { language: 'rw' as const, name: 'Politiki', description: 'Amakuru ya politiki' },
      ],
    },
    {
      name: 'Sports',
      slug: 'sports',
      description: 'Sports coverage and updates',
      translations: [
        { language: 'fr' as const, name: 'Sports', description: 'Couverture sportive et mises à jour' },
        { language: 'rw' as const, name: 'Siporo', description: 'Amakuru ya siporo' },
      ],
    },
    {
      name: 'Technology',
      slug: 'technology',
      description: 'Technology news and trends',
      translations: [
        { language: 'fr' as const, name: 'Technologie', description: 'Actualités et tendances technologiques' },
        { language: 'rw' as const, name: 'Ikoranabuhanga', description: 'Amakuru ya ikoranabuhanga' },
      ],
    },
    {
      name: 'Entertainment',
      slug: 'entertainment',
      description: 'Entertainment and culture',
      translations: [
        { language: 'fr' as const, name: 'Divertissement', description: 'Divertissement et culture' },
        { language: 'rw' as const, name: 'Imyidagaduro', description: 'Imyidagaduro n\'umuco' },
      ],
    },
    {
      name: 'Business',
      slug: 'business',
      description: 'Business and economy news',
      translations: [
        { language: 'fr' as const, name: 'Affaires', description: 'Actualités économiques et commerciales' },
        { language: 'rw' as const, name: 'Ubucuruzi', description: 'Amakuru y\'ubucuruzi n\'ubukungu' },
      ],
    },
    {
      name: 'Health',
      slug: 'health',
      description: 'Health and wellness',
      translations: [
        { language: 'fr' as const, name: 'Santé', description: 'Santé et bien-être' },
        { language: 'rw' as const, name: 'Ubuzima', description: 'Ubuzima n\'imibereho myiza' },
      ],
    },
  ];

  let count = 0;

  for (const cat of categories) {
    const existing = await prisma.category.findUnique({
      where: { slug: cat.slug },
    });

    if (existing) continue;

    await prisma.category.create({
      data: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        translations: {
          create: cat.translations,
        },
      },
    });

    count++;
  }

  console.log(`Seeded ${count} categories`);
}
