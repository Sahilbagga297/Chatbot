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
    logToFile(`Request Body: ${JSON.stringify(req.body)}`);
    console.log("=== Chat Controller Called ===");
    console.log("Request body:", JSON.stringify(req.body, null, 2));

    try {
        const { messages, agent_type } = req.body;

        if (!messages || messages.length === 0) {
            console.log("ERROR: No messages in request body");
            return res.status(400).json({ error: "No messages provided" });
        }

        // AUTO-DETECT: Check for scam signals if not explicitly in honeypot mode
        let effectiveAgentType = agent_type;
        if (effectiveAgentType !== 'honeypot') {
            const lastMessage = messages[messages.length - 1];
            if (lastMessage && lastMessage.role === 'user') {
                const text = lastMessage.content.toLowerCase();
                logToFile(`Checking for scam signals in: "${text}"`);

                // Use linguistic signals from config for robust detection
                const signals = honeypotConfig.scam_detection_guidelines.linguistic_signals;
                const allKeywords = [
                    ...signals.urgency,
                    ...signals.financial_request,
                    ...signals.authority_claims,
                    ...signals.reward_lures,
                    ...signals.links_and_actions
                ];

                const match = allKeywords.find(keyword => text.includes(keyword.toLowerCase()));

                if (match) {
                    console.log(`Auto-switching to Honeypot Mode (Scam Signal Detected: "${match}")`);
                    logToFile(`Auto-switching to Honeypot Mode detected signal "${match}" in: ${text}`);
                    effectiveAgentType = 'honeypot';
                } else if (text.includes('scheme') || ((text.includes('send') || text.includes('give')) && text.match(/\d+/))) {
                    console.log("Auto-switching to Honeypot Mode (Pattern Match)");
                    logToFile("Auto-switching to Honeypot Mode detected pattern in: " + text);
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

            console.log("Honeypot response generated:", result.text);

            try {
                // Find JSON content if it's wrapped in markdown code blocks or just text
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

                // Ensure all the new fields are present or defaulted
                const finalResponse = {
                    is_scam: jsonResponse.is_scam ?? true,
                    scam_types: jsonResponse.scam_types || [],
                    risk_score: jsonResponse.risk_score ?? 0,
                    confidence_level: jsonResponse.confidence_level || 'low',
                    agent_reply: jsonResponse.agent_reply || "...",
                    recommended_agent_mode: jsonResponse.recommended_agent_mode || 'honeypot',
                    extracted_intelligence: jsonResponse.extracted_intelligence || {
                        upi_ids: [],
                        bank_accounts: [],
                        bank_names: [],
                        ifsc_codes: [],
                        phone_numbers: [],
                        phishing_links: []
                    }
                };

                return res.json(finalResponse);
            } catch (e) {
                console.error("Failed to parse Honeypot JSON:", e);
                // Fallback for non-JSON or partial JSON
                return res.json({
                    is_scam: true,
                    scam_types: ["Suspected Scam"],
                    risk_score: 5,
                    confidence_level: "medium",
                    agent_reply: result.text.substring(0, 500),
                    recommended_agent_mode: "honeypot",
                    extracted_intelligence: {
                        upi_ids: [],
                        bank_accounts: [],
                        bank_names: [],
                        ifsc_codes: [],
                        phone_numbers: [],
                        phishing_links: []
                    },
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
