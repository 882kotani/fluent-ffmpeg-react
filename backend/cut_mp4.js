const ffmpeg = require("fluent-ffmpeg");

const inputFile = "./mp4/input.mp4"; // 変換するMP4ファイル
const outputFile = "output.mp4"; // 出力するMP3ファイル
const start_time = "00:00:10";
const during_time = 20; //切り取る時間

//mp4の時間を指定して切り取る
ffmpeg(inputFile)
  .setStartTime(start_time) // 10秒から開始
  .setDuration(during_time) // 30秒間のクリップを作成
  .output(outputFile)
  .on("end", () => console.log("動画の切り取り完了:", outputFile))
  .on("error", (err) => console.error("エラー:", err))
  .run();
