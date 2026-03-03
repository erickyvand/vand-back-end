import { PrismaClient } from "../../generated/prisma";
import Argon from "../../src/argon/argon";

export async function seedAdmin(prisma: PrismaClient) { 
  const adminEmail = 'admin@vand.rw'
  const passwordAdmin = 'admin123'
  const hashedPassword = await Argon.prototype.hashPassword(passwordAdmin);

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log('Admin user already exists, skipping seeding.');
    return;
  }
  await prisma.user.create({
    data: {
      fullName: 'Ericky',
      email: adminEmail,
      password: hashedPassword,
      userType: 'Internal',
    },
  });
}