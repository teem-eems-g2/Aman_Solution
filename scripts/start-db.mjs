import EmbeddedPostgres from 'embedded-postgres';

async function main() {
  const pg = new EmbeddedPostgres({
    databaseDir: './.pgdata',
    user: 'postgres',
    password: 'postgres',
    port: 5432,
    persistent: true,
    authMethod: 'password',
  });

  console.log('Initializing embedded postgres...');
  try {
    await pg.initialise();
  } catch (e) {
    console.log('Initialise note:', e?.message || e);
  }

  console.log('Starting embedded postgres on port 5432...');
  await pg.start();
  console.log('Postgres started!');

  try {
    await pg.createDatabase('amanuel_maintenance');
    console.log('Database amanuel_maintenance created!');
  } catch (err) {
    console.log('Database note:', err?.message || err);
  }

  console.log('Postgres cluster ready and accepting connections.');
  setInterval(() => {}, 60000);
}

main().catch(err => {
  console.error('Failed to run postgres:', err);
});
