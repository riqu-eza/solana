import { ProcessSendTransaction } from "./transaction.js";
import dotenv from "dotenv";

dotenv.config();

const PRIVATE_KEY_SELLER = process.env.SELL_PRIVATE_KEYS;

export async function processSell({ amount, chatId }) {
  console.log("selluserid", chatId);
  // Ensure the private key is a string
 const  userid = chatId;
  console.log("Seller Public Key:", PRIVATE_KEY_SELLER);
  console.log("Amount:", amount);

  // Process the transaction
  return await ProcessSendTransaction({
    action: "sell",
    amount: amount,
    privateKey: PRIVATE_KEY_SELLER,
    userid,
  });
}
