import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

export const initDB = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS conversations (
                session_id   TEXT PRIMARY KEY,
                history      JSONB NOT NULL DEFAULT '[]',
                updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);
        console.log('✅ Database initialized: conversations table ready.');
    } catch (error) {
        console.error('❌ Error initializing database:', error.message);
        throw error;
    }
};
