import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";

import videoRoutes from "./routes/videoRoutes.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Routes
app.use("/api", videoRoutes);

// Health check
app.get("/", (req, res) => {
    res.json({ message: "Crypta Backend is running 🚀" });
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});