import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import ArticleDetail from './pages/ArticleDetail';
import ArticleEditor from './pages/ArticleEditor';
import Search from './pages/Search';
import Admin from './pages/Admin';

function App() {
  return (
    <Router>
      <div className="App">
        <header className="header">
          <div className="container">
            <Link to="/" className="logo">技术博客</Link>
            <nav className="nav">
              <Link to="/">首页</Link>
              <Link to="/search">搜索</Link>
              <Link to="/write">写文章</Link>
              <Link to="/admin">管理</Link>
            </nav>
          </div>
        </header>
        <main className="main">
          <div className="container">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/article/:slug" element={<ArticleDetail />} />
              <Route path="/write" element={<ArticleEditor />} />
              <Route path="/edit/:id" element={<ArticleEditor />} />
              <Route path="/search" element={<Search />} />
              <Route path="/admin" element={<Admin />} />
            </Routes>
          </div>
        </main>
        <footer className="footer">
          <div className="container">
            <p>&copy; 2024 技术博客 - 分享编程与技术心得</p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
