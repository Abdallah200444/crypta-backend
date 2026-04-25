import { exec } from "child_process";

export const downloadVideoService = (url, format_id) => {
    return new Promise((resolve, reject) => {

        const command = format_id
            ? `python -m yt_dlp -f "${format_id}+bestaudio/best" -o "temp/%(title)s.%(ext)s" "${url}"`
            : `python -m yt_dlp -f "bv+ba/b" -o "temp/%(title)s.%(ext)s" "${url}"`;

        exec(command, (err) => {
            if (err) return reject(err);
            resolve("downloaded");
        });

    });
};