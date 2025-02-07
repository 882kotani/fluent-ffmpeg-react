const express = require("express");
const multer = require("multer");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

const app = express();
const port = 5000;

// CORSを許可
app.use(cors());

// Multer設定（ファイルの一時保存）
const upload = multer({ dest: "uploads/" });

app.post(
  "/merge",
  upload.fields([{ name: "file1" }, { name: "file2" }]),
  (req, res) => {
    if (!req.files || !req.files.file1 || !req.files.file2) {
      return res.status(400).send("MP4ファイルを2つアップロードしてください");
    }

    const file1 = req.files.file1[0].path;
    const file2 = req.files.file2[0].path;
    const outputFilePath = `uploads/output-${Date.now()}.mp4`;
    const fileListPath = `uploads/file-${Date.now()}.txt`;

    // file.txt を作成（ffmpeg concat用）
    const fileContent = `file '${path.resolve(file1)}'\nfile '${path.resolve(
      file2
    )}'\n`;
    fs.writeFileSync(fileListPath, fileContent);

    // ffmpegでMP4を結合（再エンコードなし）
    ffmpeg()
      .input(fileListPath)
      .inputOptions(["-f concat", "-safe 0"])
      .outputOptions(["-c copy"]) // 再エンコードなし
      .save(outputFilePath)
      .on("end", () => {
        res.download(outputFilePath, "merged.mp4", (err) => {
          if (err) console.error(err);
          // 不要なファイルを削除
          fs.unlinkSync(file1);
          fs.unlinkSync(file2);
          fs.unlinkSync(fileListPath);
          setTimeout(() => fs.unlinkSync(outputFilePath), 60000); // 1分後に削除
        });
      })
      .on("error", (err) => {
        console.error(err);
        res.status(500).send("動画の結合に失敗しました");
      });
  }
);

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
