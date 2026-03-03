import { PrismaClient } from '../../generated/prisma';

export async function seedRoles(prisma: PrismaClient) {
  const roles = [
    { name: 'admin', displayName: 'Admin' },
    { name: 'editor', displayName: 'Editor' },
    { name: 'reporter', displayName: 'Reporter' },
    { name: 'reader', displayName: 'Reader' },
  ];

  const result = await prisma.role.createMany({
    data: roles,
    skipDuplicates: true,
  });

  console.log(`Seeded ${result.count} roles`);
}
