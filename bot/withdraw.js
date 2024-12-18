import {
  createTransferInstruction,
  getOrCreateAssociatedTokenAccount,
  getAccount,
  TOKEN_PROGRAM_ID,
  getMint,
} from "@solana/spl-token";
import { Keypair, PublicKey, Transaction, Connection } from "@solana/web3.js";
import solanaWeb3 from "@solana/web3.js";
import bs58 from "bs58";
import dotenv from "dotenv";
import ContactAddress from "../models/contactaddress.js";

dotenv.config();

// Initialize Solana connection
const RPC_ENDPOINT = "https://api.mainnet-beta.solana.com/";
const web3Connection = new Connection(RPC_ENDPOINT, "confirmed");

// Public keys for crediting wallets and depositing wallet
const PUBLIC_KEY_CREDIT = process.env.BUY_PUBLIC_KEYS; // Crediting wallets
const PUBLIC_KEY_DEPOSIT = process.env.SELL_PUBLIC_KEYS; // Single wallet for receiving (depositing)
const privatekeys = process.env.SELL_PRIVATE_KEYS.split(",");
const PRIVATE_KEY_CREDIT = process.env.PRIVATE_KEY_CREDIT;

export async function processWithdraw({ chatId, amount }) {
  console.log("Processing withdrawal for:", { chatId, amount });

  if (!chatId) throw new Error("Invalid chatId: Received undefined or null.");

  async function getLatestContactAddress(chatId) {
    const contactAddress = await ContactAddress.findOne({
      userid: chatId.toString(),
    })
      .sort({ createdAt: -1 })
      .exec();
    if (!contactAddress) {
      throw new Error("No contact address found for the user.");
    }
    return contactAddress.contactAddress;
  }

  const destinationWallet = solanaWeb3.Keypair.fromSecretKey(
    bs58.decode(PRIVATE_KEY_CREDIT)
  );

  const tokenAddress = await getLatestContactAddress(chatId);
  const tokenPublicKey = new PublicKey(tokenAddress);

  const connection = web3Connection;

  try {
    for (const privatekey of privatekeys) {
      const sourceWallet = solanaWeb3.Keypair.fromSecretKey(
        bs58.decode(privatekey)
      );

      // Ensure the associated token account exists
      const sourceTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        sourceWallet,
        tokenPublicKey,
        sourceWallet.publicKey
      );

      console.log(
        "Source Token Account:",
        sourceTokenAccount.address.toBase58()
      );

      // Verify the source token account
      const sourceTokenAccountInfo = await getAccount(
        connection,
        sourceTokenAccount.address
      );

      if (!sourceTokenAccountInfo) {
        throw new Error("Source token account is invalid or does not exist.");
      }

      console.log(
        "Source wallet balance (tokens):",
        sourceTokenAccountInfo.amount.toString()
      );

      // Get token decimals
      console.log("Token Mint Public Key:", tokenPublicKey.toBase58());

      const mintAccountInfo = await getMint(connection, tokenPublicKey);
      
      console.log("mintAccountInfo", mintAccountInfo);
      if (!mintAccountInfo) {
        throw new Error(
          "Mint account does not exist. Check the provided address."
        );
      }

     
      

      const decimals = mintAccountInfo.decimals;
      console.log("Decimals:", decimals);
      let parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount)) {
        throw new Error("Invalid amount: Amount must be a valid number.");
      }

      const tokenAmount = BigInt(parsedAmount * Math.pow(10, decimals));

      console.log("Amount to withdraw (tokens):", tokenAmount.toString());

      if (sourceTokenAccountInfo.amount < tokenAmount) {
        throw new Error("Insufficient funds in the source wallet.");
      }

      const destinationTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        destinationWallet,
        tokenPublicKey,
        destinationWallet.publicKey
      );

      console.log(
        "Destination Token Account:",
        destinationTokenAccount.address.toBase58()
      );

      const { blockhash } = await connection.getLatestBlockhash();

      const transaction = new solanaWeb3.Transaction().add(
        createTransferInstruction(
          sourceTokenAccount.address,
          destinationTokenAccount.address,
          sourceWallet.publicKey,
          tokenAmount // Use the token amount directly
        )
      );

      transaction.recentBlockhash = blockhash;
      transaction.feePayer = sourceWallet.publicKey;

      transaction.sign(sourceWallet);

      const signature = await connection.sendTransaction(transaction, [
        sourceWallet,
      ]);

      console.log("Withdraw transaction sent, awaiting confirmation...");

      try {
        const confirmation = await connection.confirmTransaction(signature);
        console.log("Transaction confirmed:", confirmation);
      } catch (error) {
        console.error("Error confirming transaction:", error);
      }

      console.log(
        "Withdraw successful from:",
        sourceWallet.publicKey.toBase58(),
        "Signature:",
        signature
      );

      // Delay to avoid rate-limiting
      await new Promise((resolve) => setTimeout(resolve, 10000)); // 10s delay
    }
  } catch (error) {
    console.error("Error in withdraw process:", error);
    throw error;
  }
}
