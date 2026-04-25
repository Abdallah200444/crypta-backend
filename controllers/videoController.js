import { fetchVideoInfoService } from "../services/ytDlpService.js";
import { spawn } from "child_process";

// INFO
export const getVideoInfo = async (req, res) => {
    try {
        const url = req.body?.url;

        if (!url) {
            return res.status(400).json({ error: "URL is required" });
        }

        const data = await fetchVideoInfoService(url);

        return res.status(200).json(data);

    } catch (error) {
        return res.status(500).json({
            error: "Failed to fetch video info"
        });
    }
};

// DOWNLOAD STREAM (FIX AUDIO)
export const streamVideo = (req, res) => {
    const { url, format_id } = req.query;

    if (!url) {
        return res.status(400).json({ error: "URL is required" });
    }

    res.setHeader(
        "Content-Disposition",
        'attachment; filename="video.mp4"'
    );

    const args = format_id
        ? ["-f", `${format_id}+bestaudio/best`, "-o", "-", url]
        : ["-f", "bv+ba/b", "-o", "-", url];

    const ytdlp = spawn("python", ["-m", "yt_dlp", ...args]);

    ytdlp.stdout.pipe(res);

    ytdlp.on("close", () => res.end());
};