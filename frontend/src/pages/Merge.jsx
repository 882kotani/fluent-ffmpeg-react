import React, { useState } from "react";

const App = () => {
  const [file1, setFile1] = useState(null);
  const [file2, setFile2] = useState(null);
  const [mergedVideo, setMergedVideo] = useState(null);
  const port = 5002;

  const handleFileChange1 = (e) => {
    setFile1(e.target.files[0]);
  };

  const handleFileChange2 = (e) => {
    setFile2(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file1 || !file2) {
      alert("MP4ファイルを2つ選択してください。");
      return;
    }

    const formData = new FormData();
    formData.append("file1", file1);
    formData.append("file2", file2);

    try {
      const response = await fetch("http://localhost:" + port + "/merge", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("結合に失敗しました");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setMergedVideo(url);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <h1>MP4 結合アプリ</h1>
      <div>
        <label>動画1: </label>
        <input type="file" accept="video/mp4" onChange={handleFileChange1} />
      </div>
      <div>
        <label>動画2: </label>
        <input type="file" accept="video/mp4" onChange={handleFileChange2} />
      </div>
      <button onClick={handleUpload}>結合</button>
      {mergedVideo && (
        <div>
          <h2>結合された動画</h2>
          <video controls src={mergedVideo} width="600" />
          <a href={mergedVideo} download="merged.mp4">
            ダウンロード
          </a>
        </div>
      )}
    </div>
  );
};

export default App;
