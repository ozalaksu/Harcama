import { describe, expect, it } from 'vitest';
import { getDeploymentConfig } from '../runtimeConfig.js';

describe('getDeploymentConfig', () => {
  it('uses the expected default deployment values', () => {
    const config = getDeploymentConfig({});

    expect(config).toEqual({
      server: {
        port: 3000
      },
      auth: {
        password: '617714',
        sessionDurationDays: 30
      },
      database: {
        host: '127.0.0.1',
        port: 5432,
        database: 'payadmin',
        user: 'kahyaburak',
        password: '617714Bocek',
        ssl: false,
        maintenanceDatabase: 'postgres'
      }
    });
  });

  it('allows environment variables to override defaults', () => {
    const config = getDeploymentConfig({
      PORT: '8080',
      APP_PASSWORD: 'custom-app-password',
      DB_HOST: '10.0.0.5',
      DB_PORT: '5433',
      DB_NAME: 'customdb',
      DB_USER: 'customuser',
      DB_PASSWORD: 'customdbpassword',
      DB_SSL: 'true',
      DB_MAINTENANCE_NAME: 'template1'
    });

    expect(config).toEqual({
      server: {
        port: 8080
      },
      auth: {
        password: 'custom-app-password',
        sessionDurationDays: 30
      },
      database: {
        host: '10.0.0.5',
        port: 5433,
        database: 'customdb',
        user: 'customuser',
        password: 'customdbpassword',
        ssl: true,
        maintenanceDatabase: 'template1'
      }
    });
  });
});
