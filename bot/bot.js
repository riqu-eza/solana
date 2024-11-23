import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import { processBuy } from './buy.js';
import { processSell } from './selling.js';
import { processBundle } from './bundling.js';
import ContactAddress from '../models/contactaddress.js';
import { processWithdraw } from './withdraw.js';

dotenv.config();

const token = process.env.TELEGRAM_API_TOKEN;
const bot = new TelegramBot(token, { polling: true });

let userInputs = {}; // Temporary storage for user inputs

console.log("Bot is up and running...");

// Inline keyboard for /start command
const startKeyboard = {
  reply_markup: {
    inline_keyboard: [
      [{ text: 'Buy', callback_data: 'buy' }],
      [{ text: 'Sell', callback_data: 'sell' }],
      [{ text: 'Withdraw', callback_data: 'withdraw' }],
      [{ text: 'Bundle', callback_data: 'bundle' }],
      [{ text: 'Help', callback_data: 'help' }],
      [{ text: 'Add Contact Address', callback_data: 'addContactAddress' }],
      [{ text: 'Remove Contact Address', callback_data: 'removeContactAddress' }],
    ]
  }
};

// Prompt user to enter contact address
const handleAddContactAddress = (userId) => {
  bot.sendMessage(userId, 'Please enter your contact address:');
  userInputs[userId] = { action: 'addContactAddress', userId };
};

// Start command handler
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, 'Welcome! Please select an action:', startKeyboard);
});

// Handle callback queries
bot.on('callback_query', (callbackQuery) => {
  const msg = callbackQuery.message;
  const action = callbackQuery.data;
  const userId = msg.chat.id;

  if (['buy', 'sell', 'withdraw', 'bundle'].includes(action)) {
    if (action === 'bundle') {
      bot.sendMessage(userId, `Please enter the amount for ${action}:`);
      userInputs[userId] = { action, userId, step: 'amount' }; // Add step tracking for bundle
    } else {
      bot.sendMessage(userId, `Please enter the amount for ${action}:`);
      userInputs[userId] = { action, userId };
    }
  } else if (action === 'addContactAddress') {
    handleAddContactAddress(userId);
  } else if (action === 'removeContactAddress') {
    bot.sendMessage(userId, 'Please confirm removing contact address:');
  }

  // Acknowledge callback
  bot.answerCallbackQuery(callbackQuery.id);
});

// Handle messages for amount or address input
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  const userAction = userInputs[chatId]?.action;

  if (userAction) {
    const userInput = msg.text;

    if (userAction === 'addContactAddress') {
      saveContactAddress(chatId, userInput);
      bot.sendMessage(chatId, 'Contact address saved successfully!');
      delete userInputs[chatId];
    } else if (userAction === 'bundle') {
      handleBundleInputs(chatId, userInput);
    } else if (!isNaN(userInput) && parseFloat(userInput) > 0) {
      const amount = parseFloat(userInput);

      if (amount && chatId) {
        switch (userAction) {
          case 'buy':
            processBuy({ amount: amount, userid: chatId });
            break;
          case 'sell':
            processSell({chatId, amount, bot});
            break;
          case 'withdraw':
            processWithdraw({chatId, amount, bot});
            break;
          default:
            bot.sendMessage(chatId, 'Unknown action.');
        }
      } else {
        bot.sendMessage(chatId, 'Failed to process action: invalid amount or user ID.');
      }
      delete userInputs[chatId];
    } else {
      bot.sendMessage(chatId, 'Please enter a valid amount.');
    }
  }
});

const handleBundleInputs = (chatId, userInput) => {
  const userInputData = userInputs[chatId];

  if (userInputData.step === 'amount') {
    if (!isNaN(userInput) && parseFloat(userInput) > 0) {
      userInputs[chatId].amount = parseFloat(userInput);
      userInputs[chatId].step = 'duration';
      bot.sendMessage(chatId, 'Please enter the duration (in minutes):');
    } else {
      bot.sendMessage(chatId, 'Please enter a valid amount.');
    }
  } else if (userInputData.step === 'duration') {
    if (!isNaN(userInput) && parseInt(userInput) > 0) {
      userInputs[chatId].duration = parseInt(userInput) * 60; // Convert minutes to seconds
      userInputs[chatId].step = 'interval';
      bot.sendMessage(chatId, 'Please enter the interval (in seconds):');
    } else {
      bot.sendMessage(chatId, 'Please enter a valid duration.');
    }
  } else if (userInputData.step === 'interval') {
    if (!isNaN(userInput) && parseInt(userInput) > 0) {
      userInputs[chatId].interval = parseInt(userInput);

      // All inputs are collected
      const { amount, duration, interval } = userInputs[chatId];

      // Pass parameters to processBundle
      processBundle({ amount, duration, interval, userid: chatId });

      bot.sendMessage(chatId, `Bundling process started with amount: ${amount}, duration: ${duration / 60} mins, interval: ${interval} secs.`);
      delete userInputs[chatId];
    } else {
      bot.sendMessage(chatId, 'Please enter a valid interval.');
    }
  }
};

// Save contact address in database
const saveContactAddress = async (userId, contactAddress) => {
  console.log("saving",contactAddress ,"for",userId )
  try {
    await ContactAddress.create({ contactAddress, userid: userId });
  } catch (error) {
    console.error('Error saving contact address:', error);
    bot.sendMessage(userId, 'There was an error saving your contact address.');
  }
};

export default bot; // Export bot for use in other files
