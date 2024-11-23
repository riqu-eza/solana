import { Connection, Keypair, VersionedTransaction, PublicKey } from "@solana/web3.js";
import bs58 from "bs58";
import dotenv from "dotenv";
import ContactAddress from "../models/contactaddress.js";

dotenv.config();

const RPC_ENDPOINT = "https://api.mainnet-beta.solana.com";
const connection = new Connection(RPC_ENDPOINT, "confirmed");


async function fetchWithRetry(url, options, retries = 3, backoff = 1000) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, options);
            if (response.ok) return await response.arrayBuffer();
            throw new Error(`API Error: ${response.status} - ${response.statusText}`);
        } catch (error) {
            if (i < retries - 1) {
                console.log(`Retrying... (${i + 1}/${retries})`);
                await new Promise((res) => setTimeout(res, backoff * (i + 1)));
            } else {
                throw error;
            }
        }
    }
}

export async function ProcessSendTransaction({ userid, action, privateKey, amount }) {
    async function getLatestContactAddress(userid) {
        const contactAddress = await ContactAddress.findOne({ userid: userid.toString() }).sort({ createdAt: -1 }).exec();
        if (!contactAddress) throw new Error("No contact address found for the user.");
        return contactAddress.contactAddress;
    }
    
    console.log("private", privateKey, amount,userid)
    const payer = Keypair.fromSecretKey(bs58.decode(privateKey));

    try {
        const { blockhash,  } = await connection.getLatestBlockhash();

        // Validate balance
        
        // Contract address validation
        const contractAddress = await getLatestContactAddress(userid);
        const contractAccountInfo = await connection.getAccountInfo(new PublicKey(contractAddress));
        if (!contractAccountInfo) throw new Error("Invalid or non-existent contract address.");

        // Prepare request
        const requestBody = {
            publicKey: payer.publicKey.toBase58(),
            action: action,
            mint: contractAddress,
            denominatedInSol: "false",
            amount: amount,
            slippage: 1,
            priorityFee: 0.00001,
            pool: "pump",
        };

        console.log("Sending request to PumpPortal API...");
        const response = await fetch(`https://pumpportal.fun/api/trade-local`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorDetails = await response.text();
            throw new Error(`API Error: ${response.status} - ${response.statusText} - ${errorDetails}`);
        }

        const data = await response.arrayBuffer();
        const tx = VersionedTransaction.deserialize(new Uint8Array(data));
        tx.recentBlockhash = blockhash;
        tx.sign([payer]);

        const signature = await connection.sendTransaction(tx);
        console.log("Transaction successful with signature:", signature);
        return signature;
    } catch (error) {
        if (error.message.includes("Insufficient balance")) {
            console.error(`Skipping transaction for ${payer.publicKey.toBase58()}: ${error.message}`);
        } else {
            console.error("Unexpected error during transaction:", error);
        }
        throw error;
    }
}

