import { pool } from '../services/dbService.js';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

export const createOrder = async (req, res) => {
    try {
        const { mp_reference, customer_phone, details, total_price, customer_name, description, attachments, payment_status } = req.body;

        if (!mp_reference) {
            return res.status(400).json({ error: 'mp_reference is required' });
        }

        const query = `
            INSERT INTO orders (mp_reference, customer_phone, details, total_price, customer_name, description, attachments, payment_status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (mp_reference) DO NOTHING
            RETURNING *;
        `;
        const values = [
            mp_reference,
            customer_phone,
            JSON.stringify(details),
            total_price,
            customer_name || null,
            description || null,
            JSON.stringify(attachments || []),
            payment_status || 'pendiente'
        ];
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

const VALID_STATUSES = ['en_revision', 'nuevos_pedidos', 'en_proceso', 'para_retirar', 'entregados'];

export const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!VALID_STATUSES.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        // Block moving to 'entregados' if not paid
        if (status === 'entregados') {
            const checkPayment = await pool.query('SELECT payment_status, customer_phone FROM orders WHERE id = $1', [id]);
            if (checkPayment.rows.length === 0) {
                return res.status(404).json({ error: 'Order not found' });
            }
            if (checkPayment.rows[0].payment_status !== 'pagado') {
                return res.status(400).json({ error: 'No se puede entregar un pedido sin pagar. Marque como PAGADO primero.' });
            }
        }

        // Build the update query — set delivery_date when moving to 'entregados'
        let query;
        if (status === 'entregados') {
            query = `UPDATE orders SET status = $1, delivery_date = NOW(), updated_at = NOW() WHERE id = $2 RETURNING *;`;
        } else {
            query = `UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *;`;
        }

        const result = await pool.query(query, [status, id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const updatedOrder = result.rows[0];

        // Auto-send WhatsApp notification when moving to 'para_retirar'
        if (status === 'para_retirar' && updatedOrder.customer_phone) {
            try {
                const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
                if (n8nWebhookUrl) {
                    const customerName = updatedOrder.customer_name || 'Cliente';
                    const message = `¡Hola ${customerName}! 👋 Le informamos que su pedido #${updatedOrder.order_number || updatedOrder.id} ya está listo para retirar. Lo esperamos en el local. ¡Gracias por elegirnos! - CopyShow Salta`;
                    await axios.post(n8nWebhookUrl, {
                        session_id: updatedOrder.customer_phone,
                        message: message
                    });
                    console.log(`✅ WhatsApp notification sent to ${updatedOrder.customer_phone} for order #${updatedOrder.id}`);
                }
            } catch (whatsappError) {
                console.error('⚠️ WhatsApp notification failed (order still moved):', whatsappError?.response?.data || whatsappError.message);
                // Don't block the status change if WhatsApp fails
            }
        }

        res.status(200).json({ success: true, data: updatedOrder });
    } catch (error) {
        console.error('Error in updateOrderStatus:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// PUT /orders/:id/payment — Mark order as paid/unpaid
export const updateOrderPayment = async (req, res) => {
    try {
        const { id } = req.params;
        const { payment_status } = req.body;

        if (!['pagado', 'pendiente'].includes(payment_status)) {
            return res.status(400).json({ error: 'Invalid payment_status. Must be "pagado" or "pendiente".' });
        }

        const query = `UPDATE orders SET payment_status = $1, updated_at = NOW() WHERE id = $2 RETURNING *;`;
        const result = await pool.query(query, [payment_status, id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.status(200).json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error in updateOrderPayment:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// PUT /orders/:id/assign — Assign employee to order
export const updateOrderAssignment = async (req, res) => {
    try {
        const { id } = req.params;
        const { assigned_employee } = req.body;

        const query = `UPDATE orders SET assigned_employee = $1, updated_at = NOW() WHERE id = $2 RETURNING *;`;
        const result = await pool.query(query, [assigned_employee || null, id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.status(200).json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error in updateOrderAssignment:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
