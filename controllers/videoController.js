import { spawn } from "child_process";

// ========================
// GET INFO
// ========================
export const getInfo = (req, res) => {
  const { url } = req.body;

  if (!url) return res.status(400).json({ error: "invalid URL" });

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
        }))
        .sort((a, b) => parseInt(b.quality) - parseInt(a.quality));

      res.json({
        title: data.title,
        thumbnail: data.thumbnail,
        formats
      });

    } catch {
      res.status(500).json({ error: "parse error" });
    }
  });
};

// ========================
// STREAM (🔥 المهم)
// ========================
export const streamVideo = (req, res) => {
  const { url, format_id } = req.query;

  if (!url) return res.status(400).send("missing url");

  const args = [
    "-f",
    format_id || "best",
    "-o",
    "-",
    url
  ];

  const yt = spawn("python", ["-m", "yt_dlp", ...args]);

  res.setHeader("Content-Type", "video/mp4");

  yt.stdout.pipe(res);

  yt.stderr.on("data", (d) => {
    console.log("yt-dlp:", d.toString());
  });
};