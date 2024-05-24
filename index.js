const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

const app = express();
app.use(bodyParser.json());

// Use /tmp directory for the SQLite database
const dbPath = path.join('./data', 'usernumbers.db');

// Initialize the database
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        return console.error(err.message);
    }
    console.log('Connected to the SQLite database');
});

// Initialize the database and create index
db.serialize(() => {
  db.run("CREATE TABLE IF NOT EXISTS users (phone_number TEXT PRIMARY KEY, chat_id TEXT)");
  db.run("CREATE INDEX IF NOT EXISTS idx_phone_number ON users (phone_number)");
});

// Bot start command handler
bot.onText(/\/start/, (msg) => {

    // Check if the phone number is already registered, don't show the keyboard
    db.get("SELECT chat_id FROM users WHERE chat_id = ?", [msg.chat.id], (err, row) => {
        if (err) {
            return bot.sendMessage(msg.chat.id, "An error occurred. Please try again later.");
        }

        if (row) {
            return bot.sendMessage(msg.chat.id, "You are already registered.", {
                reply_markup: {
                    remove_keyboard: true
                }
            });
        }

            // If the phone number is not registered, show the keyboard
        bot.sendMessage(msg.chat.id, "Welcome! Please share your phone number.", {
            reply_markup: {
                keyboard: [[{
                    text: "Share my phone number",
                    request_contact: true,
                }]],
                // one_time_keyboard: true,
                resize_keyboard: true,
            }
        });
    });
    

});

// Handle contact sharing
bot.on('contact', (msg) => {
    const chatId = msg.chat.id;
    const phoneNumber = msg.contact.phone_number;

    // First check if the phone number is already registered
    db.get("SELECT chat_id FROM users WHERE phone_number = ?", [phoneNumber], (err, row) => {
        if (err) {
            return bot.sendMessage(chatId, "An error occurred. Please try again later.");
        }

        if (row) {
            return bot.sendMessage(chatId, "This phone number is already registered.");
        }

        // Save the phone number and chat id
        db.serialize(() => {
            const stmt = db.prepare("INSERT INTO users (phone_number, chat_id) VALUES (?, ?)");
            stmt.run(phoneNumber, chatId);
            stmt.finalize();
        });

        bot.sendMessage(chatId, "Thank you! You will now receive sms messages.", {
            reply_markup: {
                remove_keyboard: true
            }
        });
    });
});

// Endpoint to send messages
app.post('/api/send-message', (req, res) => {
    const { phone, message } = req.body;

    db.serialize(() => {
        db.get("SELECT chat_id FROM users WHERE phone_number = ?", [phone], (err, row) => {
        
            console.log(`phone: ${phone}`, `message: ${message}`, `row: ${row}`);
            // If the phone number is not found, return a 404
            if (err) {
                return res.status(500).send({ error: 'Internal server error' });
            }

            if (!row) {
                return res.status(404).send({ error: 'Phone number not found' });
            }

            // Send the message to the chat id
            bot.sendMessage(row.chat_id, message)
                .then(() => {
                    return res.status(200).send({ message: 'Message sent' });
                })
                .catch((err) => {
                    console.error(err);
                    return res.status(500).send({ error: 'Failed to send message' });
                });
        });
    });
});

// Start the Express server
const PORT = process.env.APP_PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});