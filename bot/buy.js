import dotenv from "dotenv";
import { ProcessSendTransaction } from "./transaction.js";

dotenv.config();

const PRIVATE_KEY_BUYER = process.env.BUY_PRIVATE_KEYS.split(",");

// console.log("Buyer Private Keys:", PRIVATE_KEY_BUYER);

export async function processBuy({ amount, userid }) {
    console.log("Processing buy transaction for userid:", userid);
  
    for (let i = 0; i < PRIVATE_KEY_BUYER.length; i++) {
      const buyerPrivateKey = PRIVATE_KEY_BUYER[i];
  
      
  
      const adjustedAmount = calculatePriceWithDeviation(amount);
      console.log(`Processing transaction for ${buyerPrivateKey} with amount ${adjustedAmount}`);
  
      // Log the parameters before calling ProcessSendTransaction
      console.log("Calling ProcessSendTransaction with parameters:", {
        userid,
        action: "buy",
        buyerPrivateKey,
        amount: adjustedAmount,
      });
  
      await ProcessSendTransaction({
        userid,
        action: "buy",
        privateKey: buyerPrivateKey, // Make sure to pass privateKey correctly
        amount: adjustedAmount,
      });
console.log("buyerPrivateKey",buyerPrivateKey)
    }
  }
  

function calculatePriceWithDeviation(amount) {
  const deviation = 0.01;
  return amount * (1 + deviation);
}
