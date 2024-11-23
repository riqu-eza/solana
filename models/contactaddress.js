import mongoose from 'mongoose';

const contAddr = new mongoose.Schema({
    contactAddress: { type: String, required: true },
    userid: { type: String, required: true }, // User's Telegram ID
}, { 
    timestamps: true // This adds 'createdAt' and 'updatedAt' automatically
});

const ContactAddress = mongoose.model('ContactAddress', contAddr);

export default ContactAddress; // Export the model with ES module syntax
