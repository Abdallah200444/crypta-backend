import express from "express";
import cors from "cors";
import videoRoutes from "./routes/videoRoutes.js";

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use("/api", videoRoutes);

// Health check route (اختياري لكنه مفيد)
app.get("/", (req, res) => {
    res.json({ message: "Crypta Backend is running 🚀" });
});

// Port
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});