import Anthropic from '@anthropic-ai/sdk';
import { getSystemPrompt } from '../config/systemPrompt.js';
import { getSheetData, formatDataForPrompt } from '../services/googleSheetService.js';
import { getSession, saveSession } from '../services/conversationService.js';
import dotenv from 'dotenv';

dotenv.config();

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

export const chatController = async (req, res) => {
    try {
        const { message, session_id } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }
        if (!session_id) {
            return res.status(400).json({ error: 'session_id is required (use the customer phone number)' });
        }

        // Fetch dynamic data from Google Sheets
        let dynamicPrompt = "";
        try {
            const sheetData = await getSheetData();
            dynamicPrompt = formatDataForPrompt(sheetData);
        } catch (error) {
            console.error('Error fetching dynamic data for prompt:', error);
            // Non-blocking error, proceed with static prompt
        }

        // Load conversation session from PostgreSQL
        const session = await getSession(session_id);
        const history = session ? session.history : [];
        const status = session ? session.status : 'active';
        let unreadCount = session ? session.unread_count : 0;
        let needsIntervention = session ? session.needs_intervention : false;

        // Build messages array: existing history + new user message
        const messages = [...history, { role: 'user', content: message }];

        // If the bot is paused, we just save the user message, increment unread, and return null
        if (status === 'paused') {
            unreadCount += 1;
            await saveSession(session_id, messages, unreadCount, needsIntervention);
            return res.json({ reply: null, saleClosed: false, saleDetails: null });
        }

        const response = await anthropic.messages.create({
            model: "claude-sonnet-4-5-20250929",
            max_tokens: 1024,
            system: getSystemPrompt(dynamicPrompt),
            messages: messages,
        });

        const replyText = response.content[0].text;
        let reply = replyText;
        let saleClosed = false;
        let saleDetails = null;

        // Extraer bloque JSON si la venta está cerrada o se necesita intervención
        const jsonMatch = replyText.match(/```json\n?([\s\S]*?)\n?```/);
        if (jsonMatch) {
            try {
                const parsedData = JSON.parse(jsonMatch[1]);
                if (parsedData.SALE_CLOSED) {
                    saleClosed = true;
                    saleDetails = {
                        items: parsedData.items,
                        total_price: parsedData.total_price
                    };
                }
                if (parsedData.NEEDS_INTERVENTION) {
                    needsIntervention = true;
                }
                // Remover el bloque JSON de la respuesta que ve el cliente
                reply = replyText.replace(/```json\n?[\s\S]*?\n?```/, '').trim();
            } catch (e) {
                console.error('Error parsing JSON from Claude:', e);
            }
        }

        // Append the assistant reply to the history and save back to DB
        const updatedHistory = [
            ...messages,
            { role: 'assistant', content: reply }
        ];

        await saveSession(session_id, updatedHistory, unreadCount, needsIntervention);

        res.json({ reply, saleClosed, saleDetails });
    } catch (error) {
        console.error('Error interacting with Claude:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
};
