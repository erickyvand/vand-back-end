// import { PrismaClient, Language } from '@prisma/client';

// const categories = [
//   {
//     slug: 'politics',
//     names: [
//       { language: Language.en, name: 'Politics', description: 'Political news and analysis' },
//       { language: Language.fr, name: 'Politique', description: 'Actualités et analyses politiques' },
//       { language: Language.rw, name: 'Politiki', description: 'Amakuru ya politiki' },
//     ],
//   },
//   {
//     slug: 'sports',
//     names: [
//       { language: Language.en, name: 'Sports', description: 'Sports coverage and updates' },
//       { language: Language.fr, name: 'Sports', description: 'Couverture sportive et mises à jour' },
//       { language: Language.rw, name: 'Siporo', description: 'Amakuru ya siporo' },
//     ],
//   },
//   {
//     slug: 'technology',
//     names: [
//       { language: Language.en, name: 'Technology', description: 'Technology news and trends' },
//       { language: Language.fr, name: 'Technologie', description: 'Actualités et tendances technologiques' },
//       { language: Language.rw, name: 'Ikoranabuhanga', description: 'Amakuru ya ikoranabuhanga' },
//     ],
//   },
//   {
//     slug: 'entertainment',
//     names: [
//       { language: Language.en, name: 'Entertainment', description: 'Entertainment and culture' },
//       { language: Language.fr, name: 'Divertissement', description: 'Divertissement et culture' },
//       { language: Language.rw, name: 'Imyidagaduro', description: "Imyidagaduro n'umuco" },
//     ],
//   },
//   {
//     slug: 'business',
//     names: [
//       { language: Language.en, name: 'Business', description: 'Business and economy news' },
//       { language: Language.fr, name: 'Affaires', description: 'Actualités économiques et commerciales' },
//       { language: Language.rw, name: 'Ubucuruzi', description: "Amakuru y'ubucuruzi n'ubukungu" },
//     ],
//   },
//   {
//     slug: 'health',
//     names: [
//       { language: Language.en, name: 'Health', description: 'Health and wellness' },
//       { language: Language.fr, name: 'Santé', description: 'Santé et bien-être' },
//       { language: Language.rw, name: 'Ubuzima', description: "Ubuzima n'imibereho myiza" },
//     ],
//   },
// ];

// export async function seedCategories(prisma: PrismaClient) {
//   let count = 0;

//   for (const cat of categories) {
//     for (const entry of cat.names) {
//       const existing = await prisma.category.findUnique({
//         where: { slug_language: { slug: cat.slug, language: entry.language } },
//       });

//       if (existing) continue;

//       await prisma.category.create({
//         data: {
//           slug: cat.slug,
//           language: entry.language,
//           name: entry.name,
//           description: entry.description,
//         },
//       });

//       count++;
//     }
//   }

//   console.log(`Seeded ${count} categories`);
// }
