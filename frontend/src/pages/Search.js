import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    setSearched(true);
    try {
      const res = await axios.get('/api/search', { params: { q: query } });
      setResults(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="card">
        <h2>搜索文章</h2>
        <form onSubmit={handleSearch} className="search-box">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="输入关键词搜索..."
          />
          <button type="submit" className="btn btn-primary">搜索</button>
        </form>

        {loading && <div>搜索中...</div>}
        
        {searched && !loading && (
          <>
            <p style={{ marginBottom: '1rem' }}>
              找到 {results.length} 篇相关文章
            </p>
            {results.length === 0 ? (
              <p>没有找到相关文章</p>
            ) : (
              results.map(article => (
                <div key={article.id} className="article-item">
                  <Link to={`/article/${article.slug}`} className="article-title">
                    {article.title}
                  </Link>
                  <div className="article-meta">
                    {new Date(article.created_at).toLocaleDateString()}
                  </div>
                  <p className="article-excerpt">
                    {article.excerpt || article.content.substring(0, 200)}...
                  </p>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Search;
