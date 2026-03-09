import { PrismaClient } from '@prisma/client';
import Argon from "../../src/argon/argon";
import { ADMIN_EMAIL, ADMIN_PASSWORD } from "../../src/common/constant.common";

export async function seedAdmin(prisma: PrismaClient) { 
  if (!ADMIN_PASSWORD) {
    throw new Error('ADMIN_PASSWORD environment variable is not defined');
  }
  if (!ADMIN_EMAIL) {
    throw new Error('ADMIN_EMAIL environment variable is not defined');
  }
  const hashedPassword = await Argon.prototype.hashPassword(ADMIN_PASSWORD);

  const existingAdmin = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL },
  });

  if (existingAdmin) {
    console.log('Admin user already exists, skipping seeding.');
    return;
  }
  await prisma.$transaction(async (transaction) => {
    const adminRole = await transaction.role.findUnique({
      where: { name: 'admin' },
    });

    if (!adminRole) {
      throw new Error('Admin role not found. Make sure roles are seeded first.');
    }

    const user = await transaction.user.create({
      data: {
        fullName: 'Ericky',
        slug: 'ericky',
        email: ADMIN_EMAIL as string,
        password: hashedPassword,
        userType: 'Internal',
      },
    });

    await transaction.internalProfile.create({
      data: {
        userId: user.id,
        roleId: adminRole.id,
        mustChangePassword: true,
      },
    });

    console.log(`Seeded admin user: ${user.email}`);
  });
}