import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import axios from 'axios';

function ArticleEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    excerpt: '',
    slug: '',
    category_id: '',
    status: 'draft'
  });
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [newTagName, setNewTagName] = useState('');
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [preview, setPreview] = useState(false);

  const fetchDraft = useCallback(async () => {
    try {
      const res = await axios.get('/api/drafts/1');
      if (res.data && res.data.content) {
        setFormData(prev => ({
          ...prev,
          title: res.data.title || '',
          content: res.data.content || ''
        }));
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const saveDraft = useCallback(async () => {
    if (!formData.title && !formData.content) return;
    setSaving(true);
    try {
      await axios.post('/api/drafts', {
        user_id: 1,
        title: formData.title,
        content: formData.content,
        data: JSON.stringify(formData)
      });
      setLastSaved(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }, [formData]);

  useEffect(() => {
    if (id) {
      fetchArticle();
    } else {
      fetchDraft();
    }
    fetchCategories();
    fetchTags();
  }, [id, fetchDraft]);

  useEffect(() => {
    const timer = setTimeout(() => {
      saveDraft();
    }, 3000);
    return () => clearTimeout(timer);
  }, [formData.title, formData.content, saveDraft]);

  const fetchArticle = async () => {
    try {
      const res = await axios.get(`/api/articles/${id}`);
      setFormData(res.data);
    } catch (err) {
      console.error(err);
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

  const toggleTag = (tagId) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const createTag = async () => {
    if (!newTagName.trim()) return;
    try {
      const res = await axios.post('/api/tags', {
        name: newTagName,
        slug: newTagName.toLowerCase().replace(/\s+/g, '-')
      });
      setTags(prev => [...prev, res.data]);
      setSelectedTags(prev => [...prev, res.data.id]);
      setNewTagName('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e, status) => {
    e.preventDefault();
    try {
      const data = { ...formData, status, author_id: 1 };
      if (id) {
        await axios.put(`/api/articles/${id}`, data);
      } else {
        await axios.post('/api/articles', data);
        await axios.delete('/api/drafts/1');
      }
      navigate('/admin');
    } catch (err) {
      console.error(err);
    }
  };

  const generateSlug = () => {
    const slug = formData.title.toLowerCase().replace(/\s+/g, '-').replace(/\//g, '-');
    setFormData(prev => ({ ...prev, slug }));
  };

  return (
    <div className="card">
      <h2>{id ? '编辑文章' : '写文章'}</h2>
      
      <div className="draft-indicator" style={{ marginBottom: '1rem' }}>
        {saving ? (
          <>
            <div className="spinner"></div>
            <span>正在保存草稿...</span>
          </>
        ) : lastSaved ? (
          <span>草稿已保存于 {lastSaved.toLocaleTimeString()}</span>
        ) : null}
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <button 
          className={`btn ${!preview ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setPreview(false)}
        >
          编辑
        </button>
        <button 
          className={`btn ${preview ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setPreview(true)}
        >
          预览
        </button>
      </div>

      {!preview ? (
        <form>
          <div className="form-group">
            <label>标题</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="输入文章标题"
            />
          </div>

          <div className="grid">
            <div className="form-group">
              <label>Slug (SEO URL)</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  placeholder="article-slug"
                />
                <button type="button" className="btn btn-secondary" onClick={generateSlug}>
                  生成
                </button>
              </div>
            </div>
            <div className="form-group">
              <label>分类</label>
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
              >
                <option value="">选择分类</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>摘要</label>
            <textarea
              name="excerpt"
              value={formData.excerpt}
              onChange={handleChange}
              placeholder="文章摘要"
              style={{ minHeight: '80px' }}
            />
          </div>

          <div className="form-group">
            <label>标签</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
              {tags.map(tag => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  style={{
                    padding: '0.3rem 0.8rem',
                    borderRadius: '20px',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor: selectedTags.includes(tag.id) ? '#667eea' : '#e9ecef',
                    color: selectedTags.includes(tag.id) ? 'white' : '#495057'
                  }}
                >
                  {tag.name}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="输入新标签名称"
                style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
              />
              <button type="button" className="btn btn-secondary" onClick={createTag}>
                添加标签
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>内容 (Markdown)</label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              placeholder="使用 Markdown 编写文章内容..."
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={(e) => handleSubmit(e, 'draft')}
            >
              保存草稿
            </button>
            <button 
              type="button" 
              className="btn btn-success"
              onClick={(e) => handleSubmit(e, 'published')}
            >
              发布文章
            </button>
          </div>
        </form>
      ) : (
        <div className="markdown-content">
          <h1>{formData.title || '无标题'}</h1>
          <hr style={{ margin: '1.5rem 0' }} />
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {formData.content || '暂无内容'}
          </ReactMarkdown>
          {selectedTags.length > 0 && (
            <div style={{ marginTop: '1.5rem' }}>
              <div className="tags">
                {selectedTags.map(tagId => {
                  const tag = tags.find(t => t.id === tagId);
                  return tag ? <span key={tagId} className="tag">{tag.name}</span> : null;
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ArticleEditor;
