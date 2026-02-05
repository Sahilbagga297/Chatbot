import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import chatRoutes from "./routes/chat.routes.js";

dotenv.config();

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
