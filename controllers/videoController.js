import { spawn } from "child_process";

// ========================
// INFO (نفسه تقريبًا)
// ========================
export const getInfo = (req, res) => {
  const { url } = req.body;

  if (!url || !url.startsWith("http")) {
    return res.status(400).json({ error: "invalid URL" });
  }

  const yt = spawn("python", [
    "-m",
    "yt_dlp",
    "-J",
    url
  ]);

  let output = "";

  yt.stdout.on("data", (d) => output += d.toString());

  yt.on("close", () => {
    try {
      const data = JSON.parse(output);

      const formats = (data.formats || [])
        .filter(f => f.vcodec !== "none" && f.height)
        .map(f => ({
          format_id: f.format_id,
          quality: `${f.height}p`,
          ext: f.ext,
          size: f.filesize
            ? `${(f.filesize / 1024 / 1024).toFixed(2)} MB`
            : null,
        }))
        .sort((a, b) => b.quality.localeCompare(a.quality));

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
// 🔥 STREAM (البديل النهائي)
// ========================
export const streamVideo = (req, res) => {
  const { url, format_id } = req.query;

  if (!url || !format_id) {
    return res.status(400).json({ error: "missing params" });
  }

  const yt = spawn("python", [
    "-m",
    "yt_dlp",
    "-f",
    `${format_id}+bestaudio/best`,
    "--merge-output-format",
    "mp4",
    "-o",
    "-",
    url
  ]);

  res.setHeader("Content-Type", "video/mp4");
  res.setHeader("Content-Disposition", "attachment; filename=video.mp4");

  yt.stdout.pipe(res);

  yt.stderr.on("data", (d) => {
    console.log("yt-dlp:", d.toString());
  });

  yt.on("error", () => {
    res.end();
  });
};