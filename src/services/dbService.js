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
                status       VARCHAR(50) DEFAULT 'active',
                unread_count INT DEFAULT 0,
                needs_intervention BOOLEAN DEFAULT false,
                updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            -- Add columns to conversations if they don't exist
            ALTER TABLE conversations ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';
            ALTER TABLE conversations ADD COLUMN IF NOT EXISTS unread_count INT DEFAULT 0;
            ALTER TABLE conversations ADD COLUMN IF NOT EXISTS needs_intervention BOOLEAN DEFAULT false;

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

            -- New columns for Kanban v2
            ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pendiente';
            ALTER TABLE orders ADD COLUMN IF NOT EXISTS assigned_employee VARCHAR(255) DEFAULT NULL;
            ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255) DEFAULT NULL;
            ALTER TABLE orders ADD COLUMN IF NOT EXISTS description TEXT DEFAULT NULL;
            ALTER TABLE orders ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]';
            ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_date TIMESTAMPTZ DEFAULT NULL;
            ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number SERIAL;
        `);
        console.log('✅ Database initialized: conversations and orders tables ready.');
    } catch (error) {
        console.error('❌ Error initializing database:', error.message);
        throw error;
    }
};
