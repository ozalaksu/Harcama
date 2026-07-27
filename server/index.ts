import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { NextFunction, Request, Response } from 'express';
import { Pool } from 'pg';
import { loadConfig } from './config.js';
import { createApp } from './createApp.js';
import { ensureDatabaseExists } from './databaseBootstrap.js';
import { PostgresStore } from './storage/postgresStore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '../dist');

const bootstrap = async () => {
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

  const store = new PostgresStore(pool);
  await store.ensureSchema();

  const app = createApp({
    authPassword: config.auth.password,
    sessionDurationDays: config.auth.sessionDurationDays,
    store
  });

  app.get('/api/health', (_request: Request, response: Response) => {
    response.json({ ok: true });
  });

  app.use(express.static(distPath));

  app.get('*', (request: Request, response: Response, next: NextFunction) => {
    if (request.path.startsWith('/api/')) {
      return next();
    }

    response.sendFile(path.join(distPath, 'index.html'));
  });

  const server = app.listen(config.server.port, () => {
    console.log(`Masrafci server listening on port ${config.server.port}`);
  });

  const shutdown = async () => {
    server.close();
    await pool.end();
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
};

bootstrap().catch((error) => {
  console.error('Server failed to start', error);
  process.exit(1);
});
