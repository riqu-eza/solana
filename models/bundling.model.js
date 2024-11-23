// TransactionModel.js
const mongoose = require('mongoose');

// Define the schema for your transactions
const transactionSchema = new mongoose.Schema({
    publicKey: { type: String, required: true }, // Public key of the buyer
    amount: { type: Number, required: true },    // Adjusted amount for the transaction
    action: { type: String, enum: ['buy', 'sell'], required: true }, // Action type
    userId: { type: String, required: true },    // User ID associated with the transaction
    timestamp: { type: Date, default: Date.now }  // Timestamp of the transaction
});

// Create the model from the schema
const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
