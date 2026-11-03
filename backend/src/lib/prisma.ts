import dns from 'node:dns';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

// Load local environment files if present without overriding existing container env
dotenv.config({ path: '.env.local' });
dotenv.config();

// Ensure IPv4 resolution priority in Node.js environments without monkey-patching
if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}

function sanitizeAndValidateDatabaseUrl(rawUrl?: string): string {
  if (!rawUrl) {
    throw new Error('DATABASE_URL environment variable is not defined.');
  }

  let cleaned = rawUrl.trim();

  // Strip accidental command/variable prefixes from copy-paste
  if (cleaned.startsWith('export ')) {
    cleaned = cleaned.substring(7).trim();
  }
  if (cleaned.startsWith('DATABASE_URL=')) {
    cleaned = cleaned.substring(13).trim();
  }

  // Strip accidental surrounding single or double quotes
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    cleaned = cleaned.slice(1, -1).trim();
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(cleaned);
  } catch {
    throw new Error('Invalid DATABASE_URL: failed to parse connection string.');
  }

  if (parsedUrl.protocol !== 'postgresql:' && parsedUrl.protocol !== 'postgres:') {
    throw new Error(
      `Invalid DATABASE_URL: expected protocol postgresql: or postgres:, received ${parsedUrl.protocol}`
    );
  }

  if (!parsedUrl.hostname) {
    throw new Error('Invalid DATABASE_URL: hostname is missing.');
  }

  // Remove channel_binding parameter for pg driver compatibility
  parsedUrl.searchParams.delete('channel_binding');

  return parsedUrl.toString();
}

const databaseUrl = sanitizeAndValidateDatabaseUrl(process.env.DATABASE_URL);

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
});

const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });
