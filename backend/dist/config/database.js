"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
exports.initializeDB = initializeDB;
exports.getPool = getPool;
const pg = __importStar(require("pg"));
const mysql = __importStar(require("mysql2/promise"));
const sqlite3 = __importStar(require("sqlite3"));
const sqlite_1 = require("sqlite");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Stable pool object that routes can import at top-level
exports.pool = {
    query: async (sql, params) => {
        if (!dbInstance) {
            await initializeDB();
        }
        return dbInstance.query(sql, params);
    },
    end: async () => {
        if (dbInstance) {
            await dbInstance.end();
        }
    }
};
let dbInstance = null;
async function initializeDB() {
    if (dbInstance)
        return dbInstance;
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
            query: async (sql, params) => {
                try {
                    return await pgPool.query(sql, params);
                }
                catch (err) {
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
    }
    else if (dbType === 'mysql') {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: parseInt(process.env.DB_PORT || '3306'),
        });
        dbInstance = {
            query: async (sql, params) => {
                const [results] = await connection.execute(sql, params || []);
                return { rows: Array.isArray(results) ? results : [results] };
            },
            end: async () => {
                await connection.end();
            }
        };
    }
    else if (dbType === 'sqlite') {
        const db = await (0, sqlite_1.open)({
            filename: './database.sqlite',
            driver: sqlite3.Database
        });
        dbInstance = {
            query: async (sql, params) => {
                // Convert $1, $2, etc. to ?, ?, etc. for sqlite if necessary
                const sqliteSql = sql.replace(/\$\d+/g, '?');
                if (sqliteSql.trim().toUpperCase().startsWith('SELECT')) {
                    const rows = await db.all(sqliteSql, params || []);
                    return { rows };
                }
                else {
                    const result = await db.run(sqliteSql, params || []);
                    return { rows: [], lastID: result.lastID, changes: result.changes };
                }
            },
            end: async () => {
                await db.close();
            }
        };
    }
    else {
        throw new Error('Invalid database type');
    }
    return dbInstance;
}
function getPool() {
    return exports.pool;
}
