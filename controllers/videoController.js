import { exec } from "child_process";

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
      console.log("yt-dlp error:", err);
      return res.status(500).json({
        error: err.message,
      });
    }

    try {
      const data = JSON.parse(stdout);

      const seen = new Set();

      const formats = (data.formats || [])
        .filter(
          (f) =>
            f.ext !== "mhtml" &&
            f.vcodec !== "none" &&
            f.height
        )
        .filter((f) => {
          if (seen.has(f.height)) return false;
          seen.add(f.height);
          return true;
        })
        .sort((a, b) => (b.height || 0) - (a.height || 0))
        .map((f) => ({
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
    } catch (e) {
      console.log("parse error:", e);
      res.status(500).json({ error: "parse error" });
    }
  });
};

// ========================
// DOWNLOAD (STREAM FIXED)
// ========================
export const streamVideo = (req, res) => {
  const { url } = req.query;

  if (!url || !url.startsWith("http")) {
    return res.status(400).json({ error: "invalid URL" });
  }

  const cmd = `python -m yt_dlp -f "bestvideo+bestaudio/best" --merge-output-format mp4 -o - "${url}"`;

  const process = exec(cmd, { maxBuffer: 1024 * 1024 * 100 });

  res.setHeader("Content-Disposition", 'attachment; filename="video.mp4"');
  res.setHeader("Content-Type", "application/octet-stream");

  process.stdout.pipe(res);

  process.stderr.on("data", (data) => {
    console.log("yt-dlp:", data.toString());
  });
};