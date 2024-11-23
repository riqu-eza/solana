import { ProcessSendTransaction } from "./transaction.js";
import dotenv from "dotenv";

dotenv.config();

const PRIVATE_KEY_SELLER = process.env.SELL_PRIVATE_KEYS;



export async function processSell({ amount, userid }) {
  // Ensure the private key is a string
 
  console.log("Seller Public Key:", PRIVATE_KEY_SELLER);
  console.log("Amount:", amount);

  // Process the transaction
  return await ProcessSendTransaction({
    action: "sell",
    amount: amount,
    privatekey:PRIVATE_KEY_SELLER,
    userid,
  });
}
