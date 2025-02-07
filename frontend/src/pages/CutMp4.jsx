import { useState, useRef } from "react";
import { useDropzone } from "react-dropzone"; // react-dropzoneをインポート

function VideoCutter() {
  const [file, setFile] = useState(null);
  const [ranges, setRanges] = useState([{ start: "", end: "" }]);
  const [videoUrl, setVideoUrl] = useState(null); // 動画のプレビュー用URL
  const videoRef = useRef(null); // <video>タグへの参照を作成
  const port = 5003;

  // useDropzoneの設定
  const { getRootProps, getInputProps } = useDropzone({
    accept: "video/mp4", // MP4ファイルのみを受け付け
    onDrop: (acceptedFiles) => {
      const selectedFile = acceptedFiles[0];
      if (selectedFile) {
        setFile(selectedFile);
        // ファイルが選択されたら、そのURLを生成
        setVideoUrl(URL.createObjectURL(selectedFile));
      }
    },
  });

  const handleRangeChange = (index, field, value) => {
    const newRanges = [...ranges];
    newRanges[index][field] = value;
    setRanges(newRanges);
  };

  const addRange = () => {
    setRanges([...ranges, { start: "", end: "" }]);
  };

  const removeRange = (index) => {
    setRanges(ranges.filter((_, i) => i !== index));
  };

  // 現在の再生時間を取得してstartまたはendに設定
  const setTimeRange = (index, type) => {
    if (videoRef.current) {
      const currentTime = videoRef.current.currentTime;
      const newRanges = [...ranges];
      newRanges[index][type] = currentTime.toFixed(2); // 小数点2桁にフォーマット
      setRanges(newRanges);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file) return alert("ファイルを選択してください。");

    const formData = new FormData();
    formData.append("video", file);
    formData.append("ranges", JSON.stringify(ranges));

    try {
      const response = await fetch("http://localhost:" + port + "/CutMp4", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("ファイルの処理に失敗しました");
      }

      const blob = await response.blob(); // サーバーからのファイルを取得
      const downloadUrl = window.URL.createObjectURL(blob); // ダウンロード用URLを生成

      // ダウンロード用リンクを作成してクリック
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = "processed_video.mp4"; // ダウンロードするファイル名
      link.click(); // リンクをクリックしてダウンロードを開始

      // リソースの解放
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("エラー:", error);
      alert("エラーが発生しました。");
    }
  };

  return (
    <div>
      <h1>MP4 動画カットツール</h1>
      <form onSubmit={handleSubmit}>
        {/* ドラッグアンドドロップエリア */}
        <div {...getRootProps()} style={dropzoneStyle}>
          <input {...getInputProps()} />
          <p>ここに動画ファイルをドラッグ＆ドロップ</p>
        </div>

        {/* 動画のプレビュー */}
        {videoUrl && (
          <div>
            <h2>動画プレビュー</h2>
            <video ref={videoRef} width="500" controls>
              <source src={videoUrl} type="video/mp4" />
              お使いのブラウザは動画をサポートしていません。
            </video>
          </div>
        )}

        {/* スタート、ストップボタン */}
        {ranges.map((range, index) => (
          <div key={index}>
            <h3>範囲 {index + 1}</h3>
            <div>
              <button
                type="button"
                onClick={() => setTimeRange(index, "start")}
              >
                スタート時刻
              </button>
              <span>開始時刻: {range.start}s</span>
            </div>
            <div>
              <button type="button" onClick={() => setTimeRange(index, "end")}>
                ストップ時刻
              </button>
              <span>終了時刻: {range.end}s</span>
            </div>
            <button type="button" onClick={() => removeRange(index)}>
              削除
            </button>
          </div>
        ))}
        <button type="button" onClick={addRange}>
          範囲を追加
        </button>
        <button type="submit">送信</button>
      </form>
    </div>
  );
}

// ドラッグアンドドロップエリアのスタイル
const dropzoneStyle = {
  border: "2px dashed #ccc",
  borderRadius: "8px",
  padding: "20px",
  textAlign: "center",
  cursor: "pointer",
  marginBottom: "20px",
};

export default VideoCutter;
