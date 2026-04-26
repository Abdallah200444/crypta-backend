import express from "express";
import { getInfo, streamVideo } from "../controllers/api.js";

const router = express.Router();

router.post("/info", getInfo);

// 🔥 الجديد فقط
router.get("/stream", streamVideo);

export default router;