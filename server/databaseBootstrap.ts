import { Client } from 'pg';
import { DatabaseConfig } from './config.js';

interface AdminClient {
  query: (sql: string, params?: unknown[]) => Promise<{ rows: unknown[] }>;
  end: () => Promise<void>;
}

interface EnsureDatabaseExistsOptions {
  createAdminClient?: (config: DatabaseConfig) => Promise<AdminClient>;
}

const quoteIdentifier = (value: string) => {
  return `"${value.replaceAll('"', '""')}"`;
};

const defaultCreateAdminClient = async (config: DatabaseConfig): Promise<AdminClient> => {
  const client = new Client({
    host: config.host,
    port: config.port,
    database: config.maintenanceDatabase ?? 'postgres',
    user: config.user,
    password: config.password,
    ssl: config.ssl ? { rejectUnauthorized: false } : false
  });

  await client.connect();
  return client;
};

export const ensureDatabaseExists = async (
  config: DatabaseConfig,
  options: EnsureDatabaseExistsOptions = {}
) => {
  const createAdminClient = options.createAdminClient ?? defaultCreateAdminClient;
  const adminClient = await createAdminClient(config);

  try {
    const result = await adminClient.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [config.database]
    );

    if (result.rows.length === 0) {
      await adminClient.query(`CREATE DATABASE ${quoteIdentifier(config.database)}`);
    }
  } finally {
    await adminClient.end();
  }
};
