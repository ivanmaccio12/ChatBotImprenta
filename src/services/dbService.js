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

            CREATE TABLE IF NOT EXISTS orders (
                id SERIAL PRIMARY KEY,
                mp_reference VARCHAR(255) UNIQUE,
                customer_phone VARCHAR(50),
                details JSONB,
                total_price DECIMAL(10, 2),
                status VARCHAR(50) DEFAULT 'nuevos_pedidos',
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);
        console.log('✅ Database initialized: conversations and orders tables ready.');
    } catch (error) {
        console.error('❌ Error initializing database:', error.message);
        throw error;
    }
};
