import { google } from "@ai-sdk/google";
import { streamText, generateText } from "ai";

import fs from "fs";
import path from "path";
import { honeypotConfig } from "../config/honeypot.config.js";

const LOG_FILE = path.join(process.cwd(), "debug_log.txt");

function logToFile(message) {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(LOG_FILE, `[${timestamp}] ${message}\n`);
}

export const chatController = async (req, res) => {
    logToFile("=== Chat Controller Called ===");
    logToFile("=== Chat Controller Called ===");
    logToFile(`Request Body: ${JSON.stringify(req.body)}`);
    console.log("=== Chat Controller Called ===");
    console.log("Request body:", JSON.stringify(req.body, null, 2));

    try {
        const { messages, agent_type } = req.body;

        if (!messages || messages.length === 0) {
            console.log("ERROR: No messages in request body");
            return res.status(400).json({ error: "No messages provided" });
        }

        // AUTO-DETECT: Check for scam keywords if not explicitly in honeypot mode
        if (agent_type !== 'honeypot') {
            const lastMessage = messages[messages.length - 1];
            if (lastMessage && lastMessage.role === 'user') {
                const text = lastMessage.content.toLowerCase();
                const scamKeywords = ['won a lottery', 'lottery', '5 crore', 'claim prize', 'won prize', 'congratulations'];

                const isScam = scamKeywords.some(keyword => text.includes(keyword));
                if (isScam) {
                    console.log("Auto-switching to Honeypot Mode due to scam keywords.");
                    logToFile("Auto-switching to Honeypot Mode due to scam keywords: " + text);
                    req.body.agent_type = 'honeypot'; // Mutate for subsequent logic (or just set a local var)
                    // We need to ensure we use this local decision. 
                    // Let's just update the variable used in the condition below, 
                    // BUT 'const { agent_type }' is a const destructuring.
                    // So we must re-assign or change our logic flow.
                }
            }
        }

        // Re-read agent_type or use a mutable variable
        let finalAgentType = req.body.agent_type || agent_type;
        // If we mutated req.body.agent_type above, it's safer to read it back, 
        // OR better: change the destructuring at the top to `let`. 
        // For minimal diff, I'll use a new variable check.

        // Actually, let's just do the check properly.

        let effectiveAgentType = agent_type;
        if (effectiveAgentType !== 'honeypot') {
            const lastMessage = messages[messages.length - 1];
            if (lastMessage && lastMessage.role === 'user') {
                const text = lastMessage.content.toLowerCase();
                // Keywords: lottery, won, 5 crore, prize, claim
                if (text.includes('lottery') || text.includes('5 crore') || text.includes('won') || text.includes('prize') || text.includes('claim')) {
                    console.log("Auto-switching to Honeypot Mode (Scam Detected)");
                    logToFile("Auto-switching to Honeypot Mode detected in: " + text);
                    effectiveAgentType = 'honeypot';
                }
            }
        }

        if (effectiveAgentType === 'honeypot') {
            logToFile(`Calling Gemini API for Honeypot Mode with ${messages.length} messages`);

            const result = await generateText({
                model: google("gemini-flash-latest"),
                messages,
                system: honeypotConfig.system_prompt,
            });

            console.log("Honeypot response generated:", result.text); // Keep this for raw debug
            // logToFile(`Honeypot response: ${result.text}`); // Commented out to reduce noise, rely on JSON logs below

            // Try to parse the response as JSON to ensure it's valid
            try {
                // Find JSON content if it's wrapped in markdown code blocks
                // Find JSON content. 
                // 1. Try to find content within ```json ... ``` or ``` ... ```
                // 2. If that fails, look for the first '{' and last '}'
                let jsonContent = result.text;
                const codeBlockMatch = result.text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
                if (codeBlockMatch) {
                    jsonContent = codeBlockMatch[1];
                } else {
                    const firstBrace = result.text.indexOf('{');
                    const lastBrace = result.text.lastIndexOf('}');
                    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                        jsonContent = result.text.substring(firstBrace, lastBrace + 1);
                    }
                }

                const jsonResponse = JSON.parse(jsonContent);
                return res.json(jsonResponse);
            } catch (e) {
                console.error("Failed to parse Honeypot JSON:", e);
                // Fallback: return the text as the agent_reply
                // If the model failed to output JSON, it likely just outputted the reply text.
                return res.json({
                    is_scam: true, // We are in honeypot mode, so it's safe to assume scam
                    scam_type: "suspected",
                    agent_reply: result.text, // Use the raw text as the reply
                    agent_stage: "engage",
                    extracted_intelligence: {
                        upi_ids: [],
                        bank_accounts: [],
                        bank_names: [],
                        ifsc_codes: [],
                        phone_numbers: [],
                        phishing_links: []
                    },
                    law_enforcement_ready: false,
                    error: "JSON_PARSE_FALLBACK"
                });
            }
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
