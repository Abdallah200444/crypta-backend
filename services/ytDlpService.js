import { exec } from "child_process";

const runCommand = (cmd) =>
  new Promise((resolve, reject) => {
    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        console.error("YT-DLP ERROR:", stderr || err.message);
        return reject(err);
      }
      resolve(stdout);
    });
  });

export const fetchVideoInfoService = async (url) => {
  try {
    const output = await runCommand(`yt-dlp --dump-json "${url}"`);

    const data = JSON.parse(output);

    const formats = (data.formats || [])
      .filter(f => f && f.vcodec && f.vcodec !== "none")
      .map(f => ({
        format_id: f.format_id,
        quality: f.height ? `${f.height}p` : "unknown",
        ext: f.ext,
        hasAudio: f.acodec !== "none",
        size: f.filesize
          ? (f.filesize / 1024 / 1024).toFixed(2) + " MB"
          : "غير معروف"
      }));

    return {
      title: data.title,
      thumbnail: data.thumbnail,
      duration: data.duration,
      formats
    };

  } catch (e) {
    throw new Error("Failed to fetch video info");
  }
};