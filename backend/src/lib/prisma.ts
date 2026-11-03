import dns from 'node:dns';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Ensure IPv4 resolution where IPv6 is unreachable
const originalLookup = dns.lookup;

// @ts-ignore
dns.lookup = (hostname: string, options: any, callback: any) => {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }

  return (originalLookup as any)(
    hostname,
    { ...options, family: 4 },
    callback
  );
};

import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is not defined.');
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
});

const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });
