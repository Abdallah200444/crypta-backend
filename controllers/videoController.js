import { exec } from "child_process";
import fs from "fs";
import path from "path";

// ========================
// INFO
// ========================
export const getInfo = (req, res) => {
  const { url } = req.body;

  if (!url || !url.startsWith("http")) {
    return res.status(400).json({ error: "invalid URL" });
  }

  const cmd = `python -m yt_dlp --no-playlist --geo-bypass -J "${url}"`;

  exec(cmd, { maxBuffer: 1024 * 1024 * 50 }, (err, stdout) => {
    if (err) {
      return res.status(500).json({ error: "yt-dlp failed" });
    }

    try {
      const data = JSON.parse(stdout);

      const seen = new Set();

      const formats = (data.formats || [])
        .filter(f =>
          f.ext !== "mhtml" &&
          f.vcodec !== "none" &&
          f.height
        )
        .filter(f => {
          if (seen.has(f.height)) return false;
          seen.add(f.height);
          return true;
        })
        .sort((a, b) => (b.height || 0) - (a.height || 0))
        .map(f => ({
          format_id: f.format_id,
          quality: `${f.height}p`,
          ext: f.ext,
          size: f.filesize
            ? `${(f.filesize / 1024 / 1024).toFixed(2)} MB`
            : null,
        }));

      res.json({
        title: data.title,
        thumbnail: data.thumbnail,
        duration: data.duration,
        formats,
      });

    } catch {
      res.status(500).json({ error: "parse error" });
    }
  });
};

// ========================
// DOWNLOAD
// ========================
export const streamVideo = (req, res) => {
  const { url } = req.query;

  if (!url || !url.startsWith("http")) {
    return res.status(400).json({ error: "invalid URL" });
  }

  const filePath = path.resolve(`video_${Date.now()}.mp4`);

  const cmd = `python -m yt_dlp --no-playlist --geo-bypass -f "bestvideo+bestaudio/best" --merge-output-format mp4 -o "${filePath}" "${url}"`;

  exec(cmd, (err) => {
    if (err) {
      return res.status(500).json({ error: "download failed" });
    }

    res.download(filePath, "video.mp4", () => {
      fs.unlink(filePath, () => {});
    });
  });
};