import { describe, expect, it, vi } from 'vitest';
import { ensureDatabaseExists } from '../databaseBootstrap.js';
import { DatabaseConfig } from '../config.js';

describe('ensureDatabaseExists', () => {
  const config: DatabaseConfig = {
    host: '127.0.0.1',
    port: 5432,
    database: 'payadmin',
    user: 'kahyaburak',
    password: '617714Bocek',
    ssl: false,
    maintenanceDatabase: 'postgres'
  };

  it('creates the target database when it does not exist', async () => {
    const query = vi.fn()
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });
    const end = vi.fn().mockResolvedValue(undefined);
    const createAdminClient = vi.fn().mockResolvedValue({ query, end });

    await ensureDatabaseExists(config, { createAdminClient });

    expect(createAdminClient).toHaveBeenCalledWith(config);
    expect(query).toHaveBeenNthCalledWith(
      1,
      'SELECT 1 FROM pg_database WHERE datname = $1',
      ['payadmin']
    );
    expect(query).toHaveBeenNthCalledWith(2, 'CREATE DATABASE "payadmin"');
    expect(end).toHaveBeenCalled();
  });

  it('does not create the target database when it already exists', async () => {
    const query = vi.fn().mockResolvedValueOnce({ rows: [{ '?column?': 1 }] });
    const end = vi.fn().mockResolvedValue(undefined);
    const createAdminClient = vi.fn().mockResolvedValue({ query, end });

    await ensureDatabaseExists(config, { createAdminClient });

    expect(query).toHaveBeenCalledTimes(1);
    expect(query).not.toHaveBeenCalledWith('CREATE DATABASE "payadmin"');
    expect(end).toHaveBeenCalled();
  });
});
