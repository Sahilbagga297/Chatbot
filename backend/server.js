import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import chatRoutes from "./routes/chat.routes.js";

import fs from "fs";
import path from "path";

dotenv.config();

const LOG_FILE = path.join(process.cwd(), "debug_log.txt");

function logToFile(message) {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(LOG_FILE, `[${timestamp}] ${message}\n`);
}

process.on('uncaughtException', (error) => {
    console.error('UNCAUGHT EXCEPTION:', error);
    logToFile(`FATAL ERROR (uncaughtException): ${error.message}\nStack: ${error.stack}`);
    // Optional: exit specifically if needed, but let's see if we can keep it alive or at least log it.
    // process.exit(1); 
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('UNHANDLED REJECTION:', reason);
    logToFile(`UNHANDLED REJECTION: ${reason instanceof Error ? reason.message : reason}\nStack: ${reason instanceof Error ? reason.stack : ''}`);
});

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api", chatRoutes);

// Health check
app.get("/", (req, res) => {
    res.send("Backend is running");
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
//dsdsd