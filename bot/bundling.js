import { ProcessSendTransaction} from "./transaction.js";
import dotenv from "dotenv";

dotenv.config();

const PRIVATE_KEY_BUNDLE = process.env.BUNDLE_PRIVATE_KEY; // Make sure this is a single string

export async function processBundle({ amount, duration, interval, userid }) {
  console.log(
    `Starting bundling process for duration: ${duration} seconds with interval: ${interval} seconds`
  );

  const startTime = Date.now();
  const endTime = startTime + duration * 1000;

  let iterationCount = 0; // Counter for loop iterations
  while (Date.now() < endTime) {
    iterationCount++;
    console.log(
      `Iteration ${iterationCount}: Concurrently processing buy and sell`
    );

    // Dynamically adjust amount
    const dynamicAmount = calculateDynamicAmount(amount, iterationCount);
    const sellingAmount = dynamicAmount * 0.9;
    try {
      // Send buy and sell transactions directly to processSolanaTransaction
      await Promise.all([
        ProcessSendTransaction({
          action: "buy",
          amount: dynamicAmount,
          privateKey: PRIVATE_KEY_BUNDLE,
          userid,
        }),
        ProcessSendTransaction({
          action: "sell",
          amount: sellingAmount,
          privateKey: PRIVATE_KEY_BUNDLE,
          userid,
        }),
        console.log(dynamicAmount, sellingAmount)
        // saveTransaction({
        //     publicKey: PUBLIC_KEY_BUNDLE,
        //     amount: calculateDynamicAmount,
        //     action: action,
        //     userId: userid
        // }),
      ]);
    } catch (error) {
      console.error(
        `Error processing transactions on iteration ${iterationCount}:`, error,
        error.message
      );
      // Optionally: continue to the next iteration or break depending on your strategy
    }

    // Wait for the interval duration before the next iteration
    await wait(interval * 1000);
  }

  console.log(`Bundling process completed after ${iterationCount} iterations.`);
}

// Mock function to calculate a dynamic amount (you can replace this with real logic)
function calculateDynamicAmount(baseAmount, iteration) {
  const priceFluctuation = Math.random() * 0.005; // Simulate random price changes (up to 5%)
  const direction = iteration % 2 === 0 ? 1 : -1; // Alternate between increasing and decreasing
  return baseAmount * (1 + direction * priceFluctuation); // Adjusted amount
}

// export async function saveTransaction({ publicKey, amount, action, userId }) {
//   const transaction = new Transaction({
//     publicKey,
//     amount,
//     action,
//     userId,
//   });

//   try {
//     await transaction.save(); // Ensure to save the instance of the transaction
//     console.log(`Transaction saved for ${publicKey}: Amount ${amount}`);
//   } catch (error) {
//     console.error("Error saving transaction:", error);
//   }
// }

// Utility function to wait for the given time
function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
