import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import connectDB from '../config/config.js';
import fetch from 'node-fetch';
import bot from "../bot/bot.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3030;

// Middleware
app.use(bodyParser.json());

// Connect to the database
connectDB().then(() => {
    setWebhook(); // Set the webhook after connecting to the DB
});

// Set the webhook function using Fetch API
const setWebhook = async () => {
    const url = `${process.env.BASE_URL}/webhook`; // BASE_URL should be your ngrok or server URL
    const token = process.env.TELEGRAM_API_TOKEN;

    try {
        const response = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: url }),
        });

        const data = await response.json();
        if (data.ok) {
            console.log(`Webhook set to ${url}`);
        } else {
            console.error('Error setting webhook:', data.description);
        }
    } catch (error) {
        console.error('Error setting webhook:', error);
    }
};

// Telegram webhook route
app.post('/webhook', (req, res) => {
    const update = req.body;
    bot.processUpdate(update); // Pass the update to the bot's processUpdate method
    console.log('Received update:', update); // Log the received update for debugging
    res.sendStatus(200);
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
