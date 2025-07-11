import * as admin from "firebase-admin";
import * as readline from "readline";
import * as functions from "firebase-functions";
import express from "express";
import cors from "cors";
import serviceAccount from "./assets/config/plant-iot-firebase-dev.json";

/**
 * Initialize Firebase Admin SDK if not already initialized
 */
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });
}

// Terminal input helper
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question: string): Promise<string> {
  return new Promise((resolve) => rl.question(question, resolve));
}

/**
 * Creates a Firebase Auth user via CLI input
 */
async function createUserFromTerminal(): Promise<void> {
  try {
    console.log("🔧 Firebase User Creator\n");

    const phoneNumber = await ask("📱 Enter phone number (with +): ");
    const displayName = await ask("👤 Enter display name: ");

    const userRecord = await admin.auth().createUser({
      phoneNumber,
      displayName,
    });

    await admin.auth().setCustomUserClaims(userRecord.uid, {
      admin: false,
    });

    console.log("\n✅ User created successfully!");
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("❌ Error creating user:", err.message);
    } else {
      console.error("❌ Unknown error creating user:", err);
    }
  } finally {
    rl.close();
  }
}

// Express app for Firebase Functions
const app = express();
app.use(cors());
app.use(express.json());

/**
 * Endpoint to check if a phone number exists in Firebase Auth
 */
app.get("/check-phone", async (req, res) => {
  const phoneNumber = req.query.phoneNumber as string;

  if (!phoneNumber) {
    return res
      .status(400)
      .json({error: "phoneNumber query parameter required"});
  }

  try {
    const userRecord = await admin.auth().getUserByPhoneNumber(phoneNumber);
    return res.json({exists: !!userRecord});
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "auth/user-not-found"
    ) {
      return res.json({exists: false});
    }

    console.error("Error fetching user by phone:", error);
    return res.status(500).json({error: "Internal server error"});
  }
});

/**
 * Export API as Firebase Function
 */
export const api = functions.https.onRequest(app);

/**
 * If run directly from CLI, create user
 */
if (require.main === module) {
  createUserFromTerminal();
}
