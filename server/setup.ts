import { Pool } from 'pg';
import { loadConfig } from './config.js';
import { ensureDatabaseExists } from './databaseBootstrap.js';
import { PostgresStore } from './storage/postgresStore.js';
import { writeDeploymentConfig } from './runtimeConfig.js';

const bootstrapSetup = async () => {
  if (process.argv.includes('--write-config')) {
    await writeDeploymentConfig();
    console.log('app.config.json created');
  }

  const config = loadConfig();
  await ensureDatabaseExists(config.database);

  const pool = new Pool({
    host: config.database.host,
    port: config.database.port,
    database: config.database.database,
    user: config.database.user,
    password: config.database.password,
    ssl: config.database.ssl ? { rejectUnauthorized: false } : false
  });

  try {
    const store = new PostgresStore(pool);
    await store.ensureSchema();
    console.log('Database and tables are ready');
  } finally {
    await pool.end();
  }
};

bootstrapSetup().catch((error) => {
  console.error('Setup failed:', error);
  process.exit(1);
});
