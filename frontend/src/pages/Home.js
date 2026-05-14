import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

function Home() {
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArticles();
    fetchCategories();
    fetchTags();
  }, [selectedCategory, selectedTag]);

  const fetchArticles = async () => {
    try {
      const params = { status: 'published' };
      if (selectedCategory) params.category_id = selectedCategory;
      if (selectedTag) params.tag_id = selectedTag;
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

  const fetchTags = async () => {
    try {
      const res = await axios.get('/api/tags');
      setTags(res.data);
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
          <div style={{ marginBottom: '0.5rem' }}>
            <select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd', marginRight: '1rem' }}
            >
              <option value="">全部分类</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div className="tags">
            <button
              onClick={() => setSelectedTag('')}
              style={{
                padding: '0.3rem 0.8rem',
                borderRadius: '20px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: !selectedTag ? '#667eea' : '#e9ecef',
                color: !selectedTag ? 'white' : '#495057'
              }}
            >
              全部标签
            </button>
            {tags.map(tag => (
              <button
                key={tag.id}
                onClick={() => setSelectedTag(tag.id)}
                style={{
                  padding: '0.3rem 0.8rem',
                  borderRadius: '20px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: selectedTag === tag.id ? '#667eea' : '#e9ecef',
                  color: selectedTag === tag.id ? 'white' : '#495057'
                }}
              >
                {tag.name}
              </button>
            ))}
          </div>
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
