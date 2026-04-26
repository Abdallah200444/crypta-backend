import { spawn } from "child_process";
import fs from "fs";
import path from "path";

// ========================
// DOWNLOAD DIRECTORY
// ========================
const DOWNLOAD_DIR = path.resolve("downloads");

if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR);
}

// ========================
// INFO
// ========================
export const getInfo = (req, res) => {
  const { url } = req.body;

  if (!url || !url.startsWith("http")) {
    return res.status(400).json({ error: "invalid URL" });
  }

  const cmd = spawn("python", [
    "-m",
    "yt_dlp",
    "--no-playlist",
    "--geo-bypass",
    "-J",
    url,
  ]);

  let output = "";

  cmd.stdout.on("data", (data) => {
    output += data.toString();
  });

  cmd.on("close", () => {
    try {
      const data = JSON.parse(output);

      const formats = (data.formats || [])
        .filter((f) => f.vcodec !== "none" && f.height)
        .map((f) => ({
          format_id: f.format_id,
          quality: `${f.height}p`,
          ext: f.ext,
          size: f.filesize
            ? `${(f.filesize / 1024 / 1024).toFixed(2)} MB`
            : null,
        }))
        .sort((a, b) => parseInt(b.quality) - parseInt(a.quality));

      return res.json({
        title: data.title,
        thumbnail: data.thumbnail,
        duration: data.duration,
        formats,
      });
    } catch {
      return res.status(500).json({ error: "parse error" });
    }
  });
};

// ========================
// DOWNLOAD (FIXED FINAL)
// ========================
export const startDownload = (req, res) => {
  const { url, format_id } = req.body;

  if (!url || !url.startsWith("http")) {
    return res.status(400).json({ error: "invalid URL" });
  }

  const id = Date.now().toString();
  const filePath = path.join(DOWNLOAD_DIR, `${id}.mp4`);

  if (!format_id) {
    return res.status(400).json({ error: "format_id required" });
  }

  // 🔥 مهم جداً: نستخدم format_id فقط بدون أي fallback
  const yt = spawn("python", [
    "-m",
    "yt_dlp",
    "-f",
    `${format_id}+bestaudio/best`,
    "--merge-output-format",
    "mp4",
    "-o",
    filePath,
    url,
  ]);

  yt.stderr.on("data", (data) => {
    console.log("yt-dlp:", data.toString());
  });

  yt.on("close", (code) => {
    if (code !== 0) {
      console.log("download failed");
    }
  });

  return res.json({
    id,
    downloadUrl: `/file/${id}`,
  });
};

// ========================
// FILE SERVE
// ========================
export const getFile = (req, res) => {
  const { id } = req.params;

  const filePath = path.join(DOWNLOAD_DIR, `${id}.mp4`);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "file not ready" });
  }

  res.download(filePath, "video.mp4", () => {
    fs.unlink(filePath, () => {});
  });
};