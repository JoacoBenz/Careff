import { randomUUID } from 'node:crypto';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

// Standalone script (separate process from the app): it owns its own client
// rather than the lib/prisma.ts singleton, and disconnects when done.
const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@example.com';
  const password = process.env.SEED_ADMIN_PASSWORD ?? randomUUID();

  await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: 'Admin',
      passwordHash: await bcrypt.hash(password, 10),
    },
  });

  if (!process.env.SEED_ADMIN_PASSWORD) {
    console.error(`Seeded admin ${email} with generated password: ${password}`);
    console.error('Store it in a password manager — it will not be printed again.');
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
