import { useState } from "react";
import { useDropzone } from "react-dropzone";

export default function BitrateConverter() {
  const [file, setFile] = useState(null);
  const [bitrate, setBitrate] = useState(700);
  const [message, setMessage] = useState("");
  const [downloadUrl, setDownloadUrl] = useState(null);
  const port = 5003;

  const { getRootProps, getInputProps } = useDropzone({
    accept: "video/mp4",
    onDrop: (acceptedFiles) => {
      setFile(acceptedFiles[0]);
    },
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file) {
      setMessage("ファイルを選択してください。");
      return;
    }

    const formData = new FormData();
    formData.append("video", file);
    formData.append("bitrate", bitrate);

    try {
      const response = await fetch("http://localhost:" + port + "/Comp", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        setDownloadUrl(data.url);
        setMessage("変換成功！ダウンロードリンクをクリックしてください。");
      } else {
        setMessage(`エラー: ${data.error}`);
      }
    } catch (error) {
      setMessage("通信エラーが発生しました。");
    }
  };

  return (
    <div className="p-4 border rounded-md shadow-md w-96 mx-auto mt-10">
      <h2 className="text-xl font-bold mb-4">MP4 ビットレート変更</h2>
      <div
        {...getRootProps()}
        className="border p-4 text-center cursor-pointer bg-gray-100"
      >
        <input {...getInputProps()} />
        <p>ここにファイルをドラッグ＆ドロップしてください</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
        <input
          type="number"
          value={bitrate}
          onChange={(e) => setBitrate(e.target.value)}
          className="border p-2 w-full"
          placeholder="ビットレート (kbps)"
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded-md"
        >
          変換する
        </button>
      </form>
      {message && <p className="mt-4 text-red-500">{message}</p>}
      {downloadUrl && (
        <a
          href={downloadUrl}
          download
          className="block mt-4 text-blue-500 underline"
        >
          変換されたファイルをダウンロード
        </a>
      )}
    </div>
  );
}
