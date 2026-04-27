import { spawn } from "child_process";
import fs from "fs";
import path from "path";

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
  let errorOutput = "";

  yt.stdout.on("data", (d) => output += d.toString());
  yt.stderr.on("data", (d) => errorOutput += d.toString());

  yt.on("error", (err) => {
    console.error("Spawn error:", err);
    return res.status(500).json({ error: "Failed to start yt-dlp", details: err.message });
  });

  yt.on("close", (code) => {
    try {
      if (code !== 0) {
        console.error(`yt-dlp exited with code ${code}`);
        console.error("stderr:", errorOutput);
        return res.status(500).json({ error: `yt-dlp error: ${errorOutput}` });
      }

      const data = JSON.parse(output);

      // Filter formats to make sure we only present unique resolutions
      // To prevent downloading 4k regardless, we ensure format_id is correctly mapped
      const formatsMap = new Map();
      (data.formats || [])
        .filter(f => f.vcodec !== "none" && f.height)
        .forEach(f => {
          const quality = `${f.height}p`;
          const sizeBytes = f.filesize || f.filesize_approx || 0;
          const sizeMB = sizeBytes ? (sizeBytes / (1024 * 1024)).toFixed(1) + " MB" : "غير معروف";
          
          const formatData = {
            format_id: f.format_id,
            quality: quality,
            ext: f.ext,
            size: sizeMB
          };

          // If it doesn't exist, set it. If it exists, prefer mp4 over others.
          if (!formatsMap.has(quality) || (f.ext === "mp4" && formatsMap.get(quality).ext !== "mp4")) {
            formatsMap.set(quality, formatData);
          }
        });

      const formats = Array.from(formatsMap.values())
        .sort((a, b) => parseInt(b.quality) - parseInt(a.quality));

      res.json({
        title: data.title,
        thumbnail: data.thumbnail,
        formats
      });

    } catch (err) {
      console.error("Parse error. Output was:", output);
      console.error("Stderr was:", errorOutput);
      console.error("Exception:", err);
      res.status(500).json({ error: "parse error", details: err.message, output, errorOutput });
    }
  });
};

// ========================
// STREAM (🔥 المهم)
// ========================
export const streamVideo = (req, res) => {
  const { url, format_id } = req.query;

  if (!url) return res.status(400).send("missing url");

  const tempFileName = `video_${Date.now()}_${Math.floor(Math.random() * 10000)}.mp4`;
  const tempFilePath = path.join(process.cwd(), tempFileName);

  const args = [
    "-f",
    format_id ? `${format_id}+bestaudio/best` : "best",
    "--merge-output-format", "mp4",
    "-o", tempFilePath,
    url
  ];

  const yt = spawn("python", ["-m", "yt_dlp", ...args]);

  yt.on("close", (code) => {
    if (code === 0 && fs.existsSync(tempFilePath)) {
      res.download(tempFilePath, "video.mp4", (err) => {
        if (fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
      });
    } else {
      if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
      res.status(500).send("Error downloading video");
    }
  });

  // التنظيف عند الإلغاء
  req.on("close", () => {
    if (!yt.killed) yt.kill();
    setTimeout(() => {
      if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
    }, 10000); // إعطاء وقت لـ yt-dlp ليغلق قبل الحذف
  });
};