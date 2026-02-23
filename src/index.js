import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { chatController } from './controllers/chatController.js';

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

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server v1.1.0 is running on port ${PORT}`);
});
