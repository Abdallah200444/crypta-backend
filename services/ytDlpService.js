import { exec } from "child_process";

// تحويل الحجم لقراءة بشرية
const formatSize = (bytes) => {
    if (!bytes) return "غير معروف الحجم";

    const mb = bytes / (1024 * 1024);

    if (mb >= 1024) {
        return (mb / 1024).toFixed(2) + " GB";
    }

    return mb.toFixed(2) + " MB";
};

export const fetchVideoInfoService = (url) => {
    return new Promise((resolve, reject) => {
        exec(
            `python -m yt_dlp --no-warnings --dump-json "${url}"`,
            (err, stdout) => {
                if (err) return reject(err);

                try {
                    const data = JSON.parse(stdout);

                    const formats = (data.formats || [])
                        // نشيل فقط الأشياء الغير صالحة
                        .filter(f => f && f.format_id)

                        // نشيل storyboard
                        .filter(f => !f.format_note?.includes("storyboard"))

                        // تحويل البيانات
                        .map((f) => ({
                            format_id: f.format_id,

                            // تحسين الجودة
                            quality: f.height
                                ? `${f.height}p`
                                : f.format_note || "unknown",

                            ext: f.ext || "mp4",
                            hasAudio: f.acodec !== "none",

                            // 🔥 الحجم (مع fallback أوسع)
                            size: formatSize(
                                f.filesize ||
                                f.filesize_approx ||
                                f.filesize_total
                            )
                        }))

                        // إزالة التكرار بطريقة أذكى
                        .filter((v, i, arr) =>
                            arr.findIndex(x => x.quality === v.quality) === i
                        )

                        // ترتيب من الأعلى للأقل
                        .sort((a, b) => {
                            const numA = parseInt(a.quality) || 0;
                            const numB = parseInt(b.quality) || 0;
                            return numB - numA;
                        });

                    resolve({
                        title: data.title,
                        thumbnail: data.thumbnail,
                        duration: data.duration,
                        formats
                    });

                } catch (e) {
                    reject(new Error("Failed to parse yt-dlp output"));
                }
            }
        );
    });
};