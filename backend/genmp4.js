const express = require("express");
const multer = require("multer");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const path = require("path");
const cors = require("cors"); // CORSのインポート

const app = express();
const port = 5000;
app.use(cors()); // この行を追加

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const upload = multer({ dest: "uploads/" });

app.use(express.json());

// MP4生成エンドポイント
app.post(
  "/Genmp4",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "audio", maxCount: 1 },
  ]),
  (req, res) => {
    const { image, audio } = req.files;

    if (!image || !audio) {
      return res
        .status(400)
        .json({ message: "画像または音声ファイルが不足しています" });
    }

    const imagePath = image[0].path;
    const audioPath = audio[0].path;

    // MP3の長さを取得するためにffmpegのプロパティを利用
    ffmpeg.ffprobe(audioPath, (err, metadata) => {
      if (err) {
        return res.status(500).json({
          message: "音声ファイルのメタデータ取得エラー",
          error: err.message,
        });
      }

      const audioDuration = metadata.format.duration; // 音声の長さ（秒単位）

      const generatedOutputFile = path.resolve(
        __dirname,
        "uploads",
        "generated_output.mp4"
      );
      const finalOutputFile = path.resolve(
        __dirname,
        "output",
        "final_output.mp4"
      );

      // 画像と音声からMP4動画を生成
      ffmpeg()
        .input(imagePath)
        .inputOptions(["-loop 1"]) // 画像をループさせて音声の長さに合わせる
        .input(audioPath)
        .audioCodec("aac") // 音声のコーデック指定
        .videoCodec("libx264") // 動画のコーデック指定
        .outputOptions([
          "-pix_fmt yuv420p", // ピクセルフォーマットを指定（互換性のため）
          "-shortest", // 音声の長さに合わせて動画を調整
          "-r 30", // フレームレートを指定（例：30fps）
          "-s 1280x720", // 解像度指定
        ])
        .output(generatedOutputFile)
        .on("end", () => {
          console.log("動画生成完了:", generatedOutputFile);

          // 生成されたMP4から後ろ7秒間をカット
          ffmpeg.ffprobe(generatedOutputFile, (err, metadata) => {
            if (err) {
              console.error("動画のメタデータ取得エラー:", err);
              return;
            }

            const videoDuration = metadata.format.duration; // 動画の長さ（秒）
            const cutEndTime = Math.max(0, videoDuration - 7); // 後ろ7秒をカットするための終了時間

            // 動画をカットして出力
            ffmpeg()
              .input(generatedOutputFile)
              .outputOptions([`-t ${cutEndTime}`]) // 後ろ7秒をカット
              .output(finalOutputFile)
              .on("end", () => {
                console.log("動画カット完了:", finalOutputFile);

                // 生成された一時ファイルを削除
                fs.unlink(generatedOutputFile, (err) => {
                  if (err) {
                    console.error("ファイル削除エラー:", err);
                  } else {
                    console.log("一時ファイル削除完了:", generatedOutputFile);
                  }
                });

                // 最終動画が作成された場合
                fs.exists(finalOutputFile, (exists) => {
                  if (exists) {
                    res.json({
                      message: "最終動画が作成されました",
                      output: `uploads/final_output.mp4`, // ダウンロード用リンクを返す
                    });
                  } else {
                    res.status(500).json({
                      message: "最終動画が作成されていません",
                    });
                  }
                });
              })
              .on("error", (err) => {
                console.error("エラー:", err);
                res
                  .status(500)
                  .json({ message: "動画カットエラー", error: err.message });
              })
              .run();
          });
        })
        .on("error", (err) => {
          console.error("動画生成エラー:", err);
          res
            .status(500)
            .json({ message: "動画生成エラー", error: err.message });
        })
        .run();
    });
  }
);

app.get("/download", (req, res) => {
  const filePath = path.resolve(__dirname, "uploads", "final_output.mp4");

  // ファイルが存在するかチェック
  if (fs.existsSync(filePath)) {
    res.download(filePath, "output.mp4", (err) => {
      if (err) {
        console.error("ダウンロードエラー:", err);
        res.status(500).json({ message: "ダウンロードエラー" });
      }
    });
  } else {
    res.status(404).json({ message: "ファイルが見つかりません" });
  }
});

app.listen(port, () => {
  console.log(`サーバー起動: http://localhost:${port}`);
});
