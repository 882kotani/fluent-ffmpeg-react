const ffmpeg = require("fluent-ffmpeg");

const inputFile = "./mp4/input.mp4"; // 変換するMP4ファイル
const outputFile = "output.mp4"; // 出力するMP3ファイル

// ffmpeg(inputFile)
//   .noVideo() // 映像を無効化
//   .audioCodec("libmp3lame") // MP3 コーデックを指定
//   .audioBitrate("192k") // ビットレート指定（任意）
//   .output(outputFile)
//   .on("end", () => {
//     console.log("音声のMP3変換が完了しました:", outputFile);
//   })
//   .on("error", (err) => {
//     console.error("音声変換中にエラーが発生:", err);
//   })
//   .run();

//動画を結合①（再エンコードしている）
// ffmpeg();
// .input("./mp4/input.mp4")
// .input("./mp4/input2.mp4")
// .videoCodec("libx264")
// .audioCodec("aac")
// .output(outputFile)
// .on("end", () => console.log("動画結合完了:", outputFile))
// .on("error", (err) => console.error("エラー:", err))
// .run();

//動画を結合①（再エンコードなし）
// ffmpeg()
//   .input("file.txt")
//   .inputOptions(["-f concat", "-safe 0"])
//   .output(outputFile)
//   .on("end", () => console.log("動画結合完了:", outputFile))
//   .on("error", (err) => console.error("エラー:", err))
//   .run();

// JPG + MP3 から MP4 を生成

// const imageFile = "test.jpg";
// const audioFile = "output.mp3";

// ffmpeg()
//   .input(imageFile)
//   .inputOptions([
//     "-loop 1", // 画像をループして音声の長さに合わせる
//   ])
//   .input(audioFile)
//   .audioCodec("aac") // 音声のコーデック指定
//   .videoCodec("libx264") // 動画のコーデック指定
//   .outputOptions([
//     "-pix_fmt yuv420p", // ピクセルフォーマットを指定（互換性のため）
//     "-shortest", // 音声の長さに合わせて動画を調整
//     "-r 30", // フレームレートを指定（例：30fps）
//     "-s 1280x720", // 解像度を指定（例：1280x720）
//   ])
//   .output(outputFile)
//   .on("end", () => console.log("MP4 作成完了:", outputFile))
//   .on("error", (err) => console.error("エラー:", err))
//   .run();
