import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/amanuel_maintenance?schema=public'
});

async function run() {
  await client.connect();

  console.log('=== CREATED TABLES IN amanuel_maintenance (public schema) ===');
  const tablesRes = await client.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `);
  console.table(tablesRes.rows);

  console.log('\n=== NUMERIC(10, 2) FINANCIAL COLUMNS VERIFICATION ===');
  const colsRes = await client.query(`
    SELECT 
      table_name,
      column_name,
      data_type,
      numeric_precision,
      numeric_scale
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name IN ('quotations', 'quotation_items', 'services', 'inventory_parts', 'repair_parts', 'payments')
      AND data_type = 'numeric'
    ORDER BY table_name, column_name;
  `);
  console.table(colsRes.rows);

  await client.end();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
