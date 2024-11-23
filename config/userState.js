// userState.js

const userStates = {}; // Object to hold user states
const userContactAddresses = {}; // Object to hold user contact addresses

// Set contact address for a user
const setContactAddress = (chatId, address) => {
    userContactAddresses[chatId] = address;
};

// Get contact address for a user
const getContactAddress = (chatId) => {
    return userContactAddresses[chatId];
};

// Remove contact address for a user
const removeContactAddress = (chatId) => {
    delete userContactAddresses[chatId];
};

// Set user state for a chatId
const setState = (chatId, state, action = null, amount = null) => {
    // Initialize user state with more properties
    userStates[chatId] = {
        state,
        action,
        amount,
        contactAddress: userContactAddresses[chatId], // Optional: Store contact address here
    };
};

// Get user state for a chatId
const getState = (chatId) => {
    return userStates[chatId];
};

// Remove user state for a chatId
const removeState = (chatId) => {
    delete userStates[chatId];
};

module.exports = {
    setContactAddress,
    getContactAddress,
    removeContactAddress,
    setState,
    getState,
    removeState
};
