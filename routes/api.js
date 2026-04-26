import express from "express";
import { getInfo, streamVideo } from "../controllers/videoController.js";

const router = express.Router();

router.post("/info", getInfo);
router.get("/stream", streamVideo);

export default router;