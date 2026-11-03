import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcrypt';
import { prisma } from './lib/prisma';

async function seedAdmin() {
  const username = process.env.ADMIN_SEED_USERNAME || 'admin';
  const password = process.env.ADMIN_SEED_PASSWORD;

  if (!password) {
    console.error('Error: ADMIN_SEED_PASSWORD environment variable is required to seed an admin.');
    process.exit(1);
  }

  try {
    const existingAdmin = await prisma.admin.findUnique({
      where: { username },
    });

    if (existingAdmin) {
      console.log(`Admin user "${username}" already exists.`);
      return;
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const admin = await prisma.admin.create({
      data: {
        username,
        passwordHash,
      },
    });

    console.log(`Successfully created admin user: ${admin.username} (ID: ${admin.id})`);
  } catch (error) {
    console.error('Failed to seed admin:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedAdmin();
