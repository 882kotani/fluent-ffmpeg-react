import React from "react";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import CutMp4 from "./pages/CutMp4"; // CutMp4 コンポーネントを正しくインポート
import Comp from "./pages/Comp";
import Merge from "./pages/Merge";
import Genmp4 from "./pages/Genmp4";

const Home = () => <h2>Home Page</h2>;

const App = () => {
  return (
    <Router>
      <nav>
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/CutMp4">切り取る</Link>
          </li>
          <li>
            <Link to="/Comp">圧縮する</Link>
          </li>
          <li>
            <Link to="/Merge">結合する</Link>
          </li>
          <li>
            <Link to="/Genmp4">mp4を作る</Link>
          </li>
        </ul>
      </nav>

      {/* v6 では Switch を Routes に変更し、element を使用 */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/CutMp4" element={<CutMp4 />} />
        <Route path="/Comp" element={<Comp />} />
        <Route path="/Merge" element={<Merge />} />
        <Route path="/Genmp4" element={<Genmp4 />} />
      </Routes>
    </Router>
  );
};

export default App;
