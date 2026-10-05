import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

// Add global connection pool caching to persist across hot-reloads
declare global {
  var _postgresPool: Pool | undefined;
  var _dbCooldownUntil: number | undefined;
}

const DB_COOLDOWN_MS = 60000; // 1 minute cooldown if instance is sleeping or unreachable

export const isDbInCooldown = (): boolean => {
  if (!global._dbCooldownUntil) return false;
  if (Date.now() < global._dbCooldownUntil) return true;
  global._dbCooldownUntil = undefined;
  return false;
};

export const markDbUnavailable = (reason?: any) => {
  global._dbCooldownUntil = Date.now() + DB_COOLDOWN_MS;
  const msg = reason?.message || String(reason || 'connection down');
  console.warn(`[CloudSQL:Status] Database is sleeping or disconnected (${msg}). Local backup is actively handling all data operations.`);
};

// Function to create or retrieve the connection pool (Object Method)
export const createPool = () => {
  if (!global._postgresPool) {
    global._postgresPool = new Pool({
      host: process.env.SQL_HOST,
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      database: process.env.SQL_DB_NAME,
      max: 5,
      idleTimeoutMillis: 5000,
      connectionTimeoutMillis: 3000,
    });

    // Handle Cloud SQL Developer Edition scale-to-zero or idle socket disconnects gracefully
    global._postgresPool.on('error', (err) => {
      markDbUnavailable(err);
    });
  }
  return global._postgresPool;
};

// Create or retrieve the pool instance.
export const pool = createPool();

// Initialize Drizzle with the pool and schema.
export const db = drizzle(pool, { schema });

