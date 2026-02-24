import { pool } from './dbService.js';

const SESSION_TTL_HOURS = 24;

/**
 * Returns the full message history for a session.
 * Returns [] if the session doesn't exist or has expired (> 24h without activity).
 */
export const getHistory = async (sessionId) => {
    try {
        const result = await pool.query(
            `SELECT history, updated_at FROM conversations WHERE session_id = $1`,
            [sessionId]
        );

        if (result.rows.length === 0) return [];

        const { history, updated_at } = result.rows[0];
        const hoursSinceUpdate = (Date.now() - new Date(updated_at).getTime()) / (1000 * 60 * 60);

        if (hoursSinceUpdate > SESSION_TTL_HOURS) {
            // Session expired — clear it
            await pool.query(`DELETE FROM conversations WHERE session_id = $1`, [sessionId]);
            console.log(`🗑️  Session expired and cleared: ${sessionId}`);
            return [];
        }

        return history || [];
    } catch (error) {
        console.error('Error reading conversation history:', error.message);
        return [];
    }
};

/**
 * Saves / updates the history for a session. Resets the 24h TTL.
 */
export const saveHistory = async (sessionId, history) => {
    try {
        await pool.query(
            `INSERT INTO conversations (session_id, history, updated_at)
             VALUES ($1, $2, NOW())
             ON CONFLICT (session_id)
             DO UPDATE SET history = $2, updated_at = NOW()`,
            [sessionId, JSON.stringify(history)]
        );
    } catch (error) {
        console.error('Error saving conversation history:', error.message);
    }
};
