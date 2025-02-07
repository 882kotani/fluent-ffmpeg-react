const express = require("express");
const multer = require("multer");
const ffmpeg = require("fluent-ffmpeg");
const path = require("path");
const fs = require("fs");

const app = express();
const port = 5000;

// ファイルのアップロード設定
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// ビットレート変更のエンドポイント
app.post("/convert", upload.single("video"), (req, res) => {
  const inputFile = req.file.path;
  const bitrate = req.body.bitrate || "700k"; // フォームから指定されたビットレートを取得
  const outputFile = "./output/output_" + Date.now() + ".mp4";

  // ffmpegを使ってビットレートを変更
  ffmpeg(inputFile)
    .videoCodec("libx264")
    .audioCodec("aac")
    .videoBitrate(bitrate) // ビデオのビットレートを指定
    .audioBitrate("128k") // 音声のビットレートを 128kbps に設定
    .output(outputFile)
    .on("end", () => {
      console.log("ビットレート変更完了:", outputFile);
      res.download(outputFile, "output.mp4", (err) => {
        if (err) {
          console.error("ファイルのダウンロードエラー:", err);
        } else {
          // 変換後のファイルを削除する
          fs.unlinkSync(inputFile);
          fs.unlinkSync(outputFile);
        }
      });
    })
    .on("error", (err) => {
      console.error("エラー:", err);
      res.status(500).send("ビットレートの変更に失敗しました");
    })
    .run();
});

// サーバー起動
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
