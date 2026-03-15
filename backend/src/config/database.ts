import * as pg from 'pg';
import * as mysql from 'mysql2/promise';
import * as sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import dotenv from 'dotenv';

dotenv.config();

interface DBConnection {
  query: (sql: string, params?: any[]) => Promise<any>;
  end: () => Promise<void>;
}

// Stable pool object that routes can import at top-level
export const pool = {
  query: async (sql: string, params?: any[]) => {
    if (!dbInstance) {
      await initializeDB();
    }
    return dbInstance!.query(sql, params);
  },
  end: async () => {
    if (dbInstance) {
      await dbInstance.end();
    }
  }
};

let dbInstance: DBConnection | null = null;

export async function initializeDB(): Promise<DBConnection> {
  if (dbInstance) return dbInstance;

  const dbType = process.env.DB_TYPE || 'sqlite';

  if (dbType === 'postgres') {
    const pgPool = new pg.Pool({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    dbInstance = {
      query: async (sql: string, params?: any[]) => {
        try {
          return await pgPool.query(sql, params);
        } catch (err: any) {
          if (err.code === 'ECONNREFUSED') {
            throw new Error(`Database connection failed at ${err.address}:${err.port}. Please ensure your PostgreSQL service is running or switch to DB_TYPE=sqlite in .env`);
          }
          throw err;
        }
      },
      end: async () => {
        await pgPool.end();
      }
    };
  } else if (dbType === 'mysql') {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: parseInt(process.env.DB_PORT || '3306'),
    });

    dbInstance = {
      query: async (sql: string, params?: any[]) => {
        const [results] = await connection.execute(sql, params || []);
        return { rows: Array.isArray(results) ? results : [results] };
      },
      end: async () => {
        await connection.end();
      }
    };
  } else if (dbType === 'sqlite') {
    const db = await open({
      filename: './database.sqlite',
      driver: sqlite3.Database
    });

    dbInstance = {
      query: async (sql: string, params?: any[]) => {
        // Convert $1, $2, etc. to ?, ?, etc. for sqlite if necessary
        const sqliteSql = sql.replace(/\$\d+/g, '?');

        if (sqliteSql.trim().toUpperCase().startsWith('SELECT')) {
          const rows = await db.all(sqliteSql, params || []);
          return { rows };
        } else {
          const result = await db.run(sqliteSql, params || []);
          return { rows: [], lastID: result.lastID, changes: result.changes };
        }
      },
      end: async () => {
        await db.close();
      }
    };
  } else {
    throw new Error('Invalid database type');
  }

  return dbInstance;
}

export function getPool() {
  return pool;
}
