import { Pool } from 'pg';

let pool: Pool;

export function getPool() {
  if (!pool) {
    const config = {
      host: process.env.POSTGRES_HOST,
      port: parseInt(process.env.POSTGRES_PORT || '5432'),
      database: process.env.POSTGRES_DB,
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      ssl: {
        rejectUnauthorized: false // This allows self-signed certificates
      },
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    };

    // Validate configuration
    if (!config.host || !config.database || !config.user || !config.password) {
      throw new Error('Missing database configuration');
    }

    pool = new Pool(config);

    // Add error handler
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
      process.exit(-1);
    });
  }
  return pool;
} 