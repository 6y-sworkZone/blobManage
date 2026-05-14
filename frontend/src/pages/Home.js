import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

function Home() {
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArticles();
    fetchCategories();
  }, [selectedCategory]);

  const fetchArticles = async () => {
    try {
      const params = { status: 'published' };
      if (selectedCategory) params.category_id = selectedCategory;
      const res = await axios.get('/api/articles', { params });
      setArticles(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get('/api/categories');
      setCategories(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div>加载中...</div>;

  return (
    <div>
      <div className="card">
        <h2>文章列表</h2>
        <div style={{ marginBottom: '1rem' }}>
          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
          >
            <option value="">全部分类</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
        {articles.length === 0 ? (
          <p>暂无文章</p>
        ) : (
          articles.map(article => (
            <div key={article.id} className="article-item">
              <Link to={`/article/${article.slug}`} className="article-title">
                {article.title}
              </Link>
              <div className="article-meta">
                {new Date(article.created_at).toLocaleDateString()} · 浏览 {article.view_count} 次
              </div>
              <p className="article-excerpt">{article.excerpt || article.content.substring(0, 200)}...</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Home;
