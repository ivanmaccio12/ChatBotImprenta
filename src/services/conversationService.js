import { pool } from './dbService.js';

const SESSION_TTL_HOURS = 24;

/**
 * Returns the full session data.
 * Returns null if the session doesn't exist or has expired (> 24h without activity).
 */
export const getSession = async (sessionId) => {
    try {
        const result = await pool.query(
            `SELECT history, status, unread_count, needs_intervention, updated_at FROM conversations WHERE session_id = $1`,
            [sessionId]
        );

        if (result.rows.length === 0) return null;

        const session = result.rows[0];
        const hoursSinceUpdate = (Date.now() - new Date(session.updated_at).getTime()) / (1000 * 60 * 60);

        if (hoursSinceUpdate > SESSION_TTL_HOURS) {
            // Session expired — clear it
            await pool.query(`DELETE FROM conversations WHERE session_id = $1`, [sessionId]);
            console.log(`🗑️  Session expired and cleared: ${sessionId}`);
            return null;
        }

        return session;
    } catch (error) {
        console.error('Error reading conversation session:', error.message);
        return null;
    }
};

/**
 * Saves / updates the history and metadata for a session. Resets the 24h TTL.
 */
export const saveSession = async (sessionId, history, unreadCount = 0, needsIntervention = false) => {
    try {
        await pool.query(
            `INSERT INTO conversations (session_id, history, unread_count, needs_intervention, updated_at)
             VALUES ($1, $2, $3, $4, NOW())
             ON CONFLICT (session_id)
             DO UPDATE SET history = $2, unread_count = EXCLUDED.unread_count, needs_intervention = EXCLUDED.needs_intervention, updated_at = NOW()`,
            [sessionId, JSON.stringify(history), unreadCount, needsIntervention]
        );
    } catch (error) {
        console.error('Error saving conversation session:', error.message);
    }
};
