import express from "express";
import { getInfo, startDownload, getFile } from "../controllers/api.js";

const router = express.Router();

router.post("/info", getInfo);
router.post("/download", startDownload);
router.get("/file/:id", getFile);

export default router;