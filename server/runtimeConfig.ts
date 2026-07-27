import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AppConfig } from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const toBoolean = (value: string | undefined, fallback: boolean) => {
  if (value === undefined) {
    return fallback;
  }

  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
};

export const getDeploymentConfig = (environment: NodeJS.ProcessEnv): AppConfig => {
  return {
    server: {
      port: Number(environment.PORT ?? environment.APP_PORT ?? 3000)
    },
    auth: {
      password: environment.APP_PASSWORD ?? '617714Bocek',
      sessionDurationDays: Number(environment.APP_SESSION_DAYS ?? 30)
    },
    database: {
      host: environment.DB_HOST ?? '127.0.0.1',
      port: Number(environment.DB_PORT ?? 5432),
      database: environment.DB_NAME ?? 'payadmin',
      user: environment.DB_USER ?? 'kahyaburak',
      password: environment.DB_PASSWORD ?? '617714Bocek',
      ssl: toBoolean(environment.DB_SSL, false),
      maintenanceDatabase: environment.DB_MAINTENANCE_NAME ?? 'postgres'
    }
  };
};

export const getDefaultAppConfigPath = () => {
  return path.resolve(__dirname, '../app.config.json');
};

export const writeDeploymentConfig = async (
  configPath = getDefaultAppConfigPath(),
  environment: NodeJS.ProcessEnv = process.env
) => {
  const config = getDeploymentConfig(environment);
  await writeFile(configPath, JSON.stringify(config, null, 2));
  return config;
};
