// Function to show custom keyboard with 4 buttons
export function showCustomKeyboard(bot, chatId) {
    const options = {
        reply_markup: {
            keyboard: [
                ['Buy', 'Sell'], 
                ['Withdraw', 'Bundle']
            ],
            resize_keyboard: true,
            one_time_keyboard: false
        }
    };
    bot.sendMessage(chatId, 'Please choose an action:', options);
}

// Function to remove the custom keyboard and return to the standard one
export function showStandardKeyboard(bot, chatId) {
    const options = {
        reply_markup: {
            remove_keyboard: true
        }
    };
    bot.sendMessage(chatId, 'You are back to the standard keyboard.', options);
}
