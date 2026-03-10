import { pool } from '../services/dbService.js';
import { getSession, saveSession } from '../services/conversationService.js';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

// GET /conversations
export const getConversationsList = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT session_id, status, unread_count, needs_intervention, updated_at 
             FROM conversations 
             WHERE updated_at >= NOW() - INTERVAL '24 HOURS'
             ORDER BY updated_at DESC`
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// GET /conversations/:session_id
export const getConversationHistory = async (req, res) => {
    try {
        const session = await getSession(req.params.session_id);
        if (!session) {
            return res.status(404).json({ error: 'Conversation not found' });
        }
        res.json({ success: true, data: session });
    } catch (error) {
        console.error('Error fetching conversation history:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// PUT /conversations/:session_id
export const updateConversation = async (req, res) => {
    try {
        const { session_id } = req.params;
        const { status, unread_count, needs_intervention } = req.body;

        let updates = [];
        let values = [session_id];
        let argIndex = 2;

        if (status !== undefined) {
            updates.push(`status = $${argIndex++}`);
            values.push(status);
        }
        if (unread_count !== undefined) {
            updates.push(`unread_count = $${argIndex++}`);
            values.push(unread_count);
        }
        if (needs_intervention !== undefined) {
            updates.push(`needs_intervention = $${argIndex++}`);
            values.push(needs_intervention);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        const query = `UPDATE conversations SET ${updates.join(', ')} WHERE session_id = $1 RETURNING *`;
        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Conversation not found' });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error updating conversation:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// POST /conversations/:session_id/send
export const sendManualMessage = async (req, res) => {
    try {
        const { session_id } = req.params;
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Send via n8n Webhook
        const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;

        if (!n8nWebhookUrl) {
            return res.status(500).json({ error: 'N8N_WEBHOOK_URL not configured in .env' });
        }

        let targetPhone = session_id;

        await axios.post(n8nWebhookUrl, {
            session_id: targetPhone,
            message: message
        });

        // Update DB
        const session = await getSession(session_id);
        const history = session ? session.history : [];
        const status = session ? session.status : 'paused'; // force pause if human messages? Typically yes.

        const updatedHistory = [...history, { role: 'assistant', content: message }];

        // Clear needs_intervention and unread_count, and optionally keep it paused.
        await saveSession(session_id, updatedHistory, 0, false);
        // We explicitly update status to paused if it was active, so the bot doesn't reply to the human's message
        if (status !== 'paused') {
            await pool.query(`UPDATE conversations SET status = 'paused' WHERE session_id = $1`, [session_id]);
        }

        res.json({ success: true, message: 'Message sent via n8n' });
    } catch (error) {
        console.error('Error sending manual message via n8n:', error?.response?.data || error.message);
        res.status(500).json({ error: 'Error sending message via n8n Webhook', details: error?.response?.data });
    }
};
