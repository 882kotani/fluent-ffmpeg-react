import React, { useState } from "react";

function Genmp4() {
  const [image, setImage] = useState(null);
  const [audio, setAudio] = useState(null);
  const [loading, setLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);
  const port = 5003;

  // 画像ファイルの変更処理
  const handleImageChange = (e) => {
    setImage(e.target.files[0]);
  };

  // 音声ファイルの変更処理
  const handleAudioChange = (e) => {
    setAudio(e.target.files[0]);
  };

  // フォーム送信時の処理
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 画像と音声が選ばれているかチェック
    if (!image || !audio) {
      alert("画像と音声を両方選択してください。");
      return;
    }

    const formData = new FormData();
    formData.append("image", image);
    formData.append("audio", audio);

    setLoading(true);

    try {
      // サーバーにファイルを送信
      const response = await fetch("http://localhost:" + port + "/Genmp4", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("動画生成に失敗しました");
      }

      // サーバーから動画のファイルパスを取得
      const data = await response.json();

      // 動画のURLを設定
      setVideoUrl(`http://localhost:` + port + `/${data.output}`); // 動画のURLをフルパスで設定

      setLoading(false);
    } catch (error) {
      console.error("Error:", error);
      alert("動画生成中にエラーが発生しました。");
      setLoading(false);
    }
  };

  return (
    <div className="Genmp4">
      <h1>画像と音声から動画を生成</h1>

      <form onSubmit={handleSubmit}>
        <div>
          <label>画像ファイル</label>
          <input type="file" onChange={handleImageChange} />
        </div>
        <div>
          <label>音声ファイル</label>
          <input type="file" onChange={handleAudioChange} />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? "生成中..." : "動画生成"}
        </button>
      </form>

      {loading && <p>動画生成中...少々お待ちください。</p>}

      {videoUrl && (
        <div>
          <h2>生成された動画のプレビュー</h2>
          <video controls width="600">
            <source src={videoUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          <br />
          <a href="http://localhost:${port}/download" download>
            ダウンロード
          </a>
        </div>
      )}
    </div>
  );
}

export default Genmp4;
