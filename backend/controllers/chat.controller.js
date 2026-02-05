import { google } from "@ai-sdk/google";
import { streamText } from "ai";

import fs from "fs";
import path from "path";

const LOG_FILE = path.join(process.cwd(), "debug_log.txt");

function logToFile(message) {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(LOG_FILE, `[${timestamp}] ${message}\n`);
}

export const chatController = async (req, res) => {
    logToFile("=== Chat Controller Called ===");
    console.log("=== Chat Controller Called ===");
    console.log("Request body:", JSON.stringify(req.body, null, 2));

    try {
        const { messages } = req.body;

        if (!messages || messages.length === 0) {
            console.log("ERROR: No messages in request body");
            return res.status(400).json({ error: "No messages provided" });
        }

        logToFile(`Calling Gemini API with ${messages.length} messages`);

        const result = streamText({
            model: google("gemini-flash-latest"),
            messages,
            system:
                "You are a helpful, concise chat assistant. Prefer short, clear messages. Use bullet points when listing items.",
        });

        console.log("streamText result created, starting to stream...");
        logToFile("streamText result created, starting to stream...");

        let totalChunks = 0;
        // Stream plain text to the client
        for await (const textPart of result.textStream) {
            totalChunks++;
            console.log(`Chunk ${totalChunks}:`, textPart.substring(0, 50));
            logToFile(`Chunk ${totalChunks}: ${textPart.substring(0, 50)}`);
            res.write(textPart);
        }

        console.log(`Streaming complete. Total chunks: ${totalChunks}`);
        logToFile(`Streaming complete. Total chunks: ${totalChunks}`);
        res.end();
    } catch (error) {
        console.error("Chat API Error:", error);
        logToFile(`Chat API Error: ${error.message}\nStack: ${error.stack}`);
        console.error("Error stack:", error.stack);
        res.status(500).json({ error: "Failed to generate response", details: error.message });
    }
};
