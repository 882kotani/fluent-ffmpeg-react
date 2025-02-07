const ffmpeg = require("fluent-ffmpeg");

const inputFile = "./mp4/input.mp4"; // 変換するMP4ファイル
const volumeIncreaseDb = 6;

//レベルを上げる

ffmpeg(inputFile)
  .audioFilters(`volume=${volumeIncreaseDb}dB`) // dB 単位で音量調整
  .output(outputFile)
  .on("end", () =>
    console.log(`音量を ${volumeIncreaseDb}dB 上げました:`, outputFile)
  )
  .on("error", (err) => console.error("エラー:", err))
  .run();
