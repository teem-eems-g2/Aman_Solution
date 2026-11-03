import pg from 'pg';
const { Client } = pg;
const client = new Client({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/amanuel_maintenance?schema=public' });

async function main() {
  await client.connect();
  const res = await client.query(`
    SELECT 
      (SELECT count(*) FROM users) AS users,
      (SELECT count(*) FROM services) AS services,
      (SELECT count(*) FROM inventory_parts) AS inventory_parts;
  `);
  console.table(res.rows);
  await client.end();
}
main().catch(console.error);
