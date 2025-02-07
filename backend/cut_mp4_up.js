const express = require("express");
const multer = require("multer");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const path = require("path");
const cors = require("cors"); // CORSパッケージをインポート

const app = express();
const port = 5000;

// CORSを許可する設定
app.use(cors()); // 全てのリクエストを許可

const upload = multer({ dest: "uploads/" });

app.use(express.json());

app.post("/upload", upload.single("video"), (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ message: "ファイルがアップロードされていません" });
  }

  const inputFile = req.file.path;
  const cutRanges = JSON.parse(req.body.ranges);
  const tempFiles = [];
  let rangeIndex = 0;

  function cutVideo() {
    if (rangeIndex >= cutRanges.length) {
      createFileList();
      combineVideos(req, res); // ✅ ここで `req, res` を渡すように修正
      return;
    }

    const range = cutRanges[rangeIndex];
    const tempFile = path.resolve(
      __dirname,
      `uploads/temp_part${rangeIndex + 1}.mp4`
    );
    tempFiles.push(tempFile);

    ffmpeg()
      .input(inputFile)
      .outputOptions([
        `-ss ${range.start}`,
        `-t ${range.end - range.start}`,
        "-c:v copy",
        "-c:a copy",
      ])
      .output(tempFile)
      .on("end", () => {
        rangeIndex++;
        cutVideo();
      })
      .on("error", (err) =>
        res.status(500).json({ message: "エラー", error: err.message })
      )
      .run();
  }

  function createFileList() {
    const fileList = tempFiles.map((file) => `file '${file}'`).join("\n");
    fs.writeFileSync("uploads/file_list.txt", fileList);
  }

  function combineVideos(req, res) {
    const outputFile = "uploads/output.mp4";

    ffmpeg()
      .input("uploads/file_list.txt")
      .inputOptions(["-f concat", "-safe 0"])
      .outputOptions(["-c:v copy", "-c:a copy"])
      .output(outputFile)
      .on("end", () => {
        console.log("動画結合完了:", outputFile);

        // ダウンロードを開始
        res.download(outputFile, "processed_video.mp4", (err) => {
          if (err) {
            console.error("ダウンロードエラー:", err);
            if (!res.headersSent) {
              return res
                .status(500)
                .json({ message: "ダウンロードエラー", error: err.message });
            }
          } else {
            // ダウンロード後に一時ファイルを削除
            deleteTempFiles();
          }
        });
      })
      .on("error", (err) => {
        console.error("結合エラー:", err);
        if (!res.headersSent) {
          res.status(500).json({ message: "結合エラー", error: err.message });
        }
      })
      .run();
  }

  function deleteTempFiles() {
    tempFiles.forEach((file) => fs.unlink(file, () => {}));
    fs.unlink("uploads/file_list.txt", () => {});
    fs.unlink(inputFile, () => {});
  }

  cutVideo();
});

app.listen(port, () => console.log(`サーバー起動: http://localhost:${port}`));
