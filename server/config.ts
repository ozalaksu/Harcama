import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

interface ServerConfig {
  port: number;
}

interface AuthConfig {
  password: string;
  sessionDurationDays: number;
}

export interface AppConfig {
  server: ServerConfig;
  auth: AuthConfig;
  database: DatabaseConfig;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultConfigPath = path.resolve(__dirname, '../app.config.json');

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl: boolean;
  maintenanceDatabase?: string;
}

export const loadConfig = (): AppConfig => {
  const configPath = process.env.APP_CONFIG_PATH
    ? path.resolve(process.cwd(), process.env.APP_CONFIG_PATH)
    : defaultConfigPath;

  if (!existsSync(configPath)) {
    throw new Error(`Configuration file not found: ${configPath}`);
  }

  const parsedConfig = JSON.parse(readFileSync(configPath, 'utf8')) as AppConfig;

  return {
    ...parsedConfig,
    server: {
      ...parsedConfig.server,
      port: Number(process.env.PORT ?? parsedConfig.server.port ?? 3000)
    }
  };
};
