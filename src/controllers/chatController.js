import Anthropic from '@anthropic-ai/sdk';
import { getSystemPrompt } from '../config/systemPrompt.js';
import { getSheetData, formatDataForPrompt } from '../services/googleSheetService.js';
import dotenv from 'dotenv';

dotenv.config();

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

export const chatController = async (req, res) => {
    try {
        const { message, history } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
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

        // Format history for Anthropic API if provided
        const messages = history ? [...history, { role: 'user', content: message }] : [{ role: 'user', content: message }];

        const response = await anthropic.messages.create({
            model: "claude-sonnet-4-5-20250929",
            max_tokens: 1024,
            system: getSystemPrompt(dynamicPrompt),
            messages: messages,
        });

        const reply = response.content[0].text;

        res.json({ reply });
    } catch (error) {
        console.error('Error interacting with Claude:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
};
