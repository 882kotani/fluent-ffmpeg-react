const express = require("express");
const multer = require("multer");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const path = require("path");
const cors = require("cors"); // CORSパッケージをインポート

const app = express();
const port = 5003;

// CORSを許可する設定
app.use(cors()); // 全てのリクエストを許可

app.use("/output", express.static(path.join(__dirname, "output")));

const upload = multer({ dest: "uploads/" });
app.use(express.json());

//---------切り取る----------//
app.post("/CutMp4", upload.single("video"), (req, res) => {
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
      combineVideos(req, res);
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

//--------- 圧縮する----------//
app.post("/Comp", upload.single("video"), (req, res) => {
  const inputFile = req.file.path;
  const bitrate = req.body.bitrate; // フォームから指定されたビットレートを取得
  const outputFile = "./output/output.mp4";

  // ffmpegを使ってビットレートを変更
  ffmpeg(inputFile)
    .videoCodec("libx264")
    .audioCodec("aac")
    .videoBitrate(bitrate)
    .audioBitrate("128k")
    .output(outputFile)
    .on("end", () => {
      console.log("ビットレート変更完了:", outputFile);

      // ファイルが存在するか確認してからダウンロード
      fs.access(outputFile, fs.constants.F_OK, (err) => {
        if (err) {
          console.error("出力ファイルが見つかりません:", err);
          return res.status(500).json({ message: "出力ファイルがありません" });
        }
        res.download(outputFile, "output.mp4", (err) => {
          if (err) {
            console.error("ダウンロードエラー:", err);
          } else {
            console.log("ダウンロード成功:", outputFile);
            // ダウンロード後にファイルを削除（非同期で処理）
            // setTimeout(() => {
            //   fs.unlink(outputFile, (unlinkErr) => {
            //     if (unlinkErr) {
            //       console.error("ファイル削除エラー:", unlinkErr);
            //     } else {
            //       console.log("ファイル削除成功:", outputFile);
            //     }
            //   });
            // }, 5000); // 5秒待ってから削除（安全策）
          }
        });
      });
    })
    .on("error", (err) => {
      console.error("エラー:", err);
      res.status(500).send("ビットレートの変更に失敗しました");
    })
    .run();
  // }
});

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
                      output: `output/final_output.mp4`, // ダウンロード用リンクを返す
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
  const filePath = path.resolve(__dirname, "output", "final_output.mp4");

  // ファイルが存在するかチェック
  if (fs.existsSync(filePath)) {
    res.download(filePath, "finaloutput.mp4", (err) => {
      if (err) {
        console.error("ダウンロードエラー:", err);
        res.status(500).json({ message: "ダウンロードエラー" });
      }
    });
  } else {
    res.status(404).json({ message: "ファイルが見つかりません" });
  }
});

app.listen(port, () => console.log(`サーバー起動: http://localhost:${port}`));
