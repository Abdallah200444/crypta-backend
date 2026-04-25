import express from "express";
import { getVideoInfo, streamVideo } from "../controllers/videoController.js";

const router = express.Router();

router.post("/info", getVideoInfo);
router.get("/stream", streamVideo);

export default router;