import { pool } from '../services/dbService.js';

export const createOrder = async (req, res) => {
    try {
        const { mp_reference, customer_phone, details, total_price } = req.body;

        if (!mp_reference) {
            return res.status(400).json({ error: 'mp_reference is required' });
        }

        const query = `
            INSERT INTO orders (mp_reference, customer_phone, details, total_price)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (mp_reference) DO NOTHING
            RETURNING *;
        `;
        const values = [mp_reference, customer_phone, JSON.stringify(details), total_price];
        const result = await pool.query(query, values);

        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error in createOrder:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const getOrders = async (req, res) => {
    try {
        const query = `SELECT * FROM orders ORDER BY created_at ASC;`;
        const result = await pool.query(query);
        res.status(200).json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error in getOrders:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['nuevos_pedidos', 'en_proceso', 'finalizados', 'entregados'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const query = `
            UPDATE orders 
            SET status = $1, updated_at = NOW() 
            WHERE id = $2 
            RETURNING *;
        `;
        const result = await pool.query(query, [status, id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.status(200).json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error in updateOrderStatus:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
