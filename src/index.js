import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { chatController } from './controllers/chatController.js';
import { initDB, pool } from './services/dbService.js';
import { createOrder, getOrders, updateOrderStatus } from './controllers/ordersController.js';
import { getConversationsList, getConversationHistory, updateConversation, sendManualMessage } from './controllers/conversationsController.js';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.get('/health', (req, res) => {
    res.send('CopyShow Chatbot API is running');
});

app.post('/chat', chatController);

// Orders Endpoints
app.post('/orders', createOrder);
app.get('/orders', getOrders);
app.put('/orders/:id/status', updateOrderStatus);

// Conversations CRM Endpoints
app.get('/conversations', getConversationsList);
app.get('/conversations/:session_id', getConversationHistory);
app.put('/conversations/:session_id', updateConversation);
app.post('/conversations/:session_id/send', sendManualMessage);

initDB()
    .then(() => {
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`Server v1.2.0 is running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('Failed to initialize DB, server not started:', err.message);
        process.exit(1);
    });

process.on('SIGTERM', async () => {
    await pool.end();
    process.exit(0);
});
