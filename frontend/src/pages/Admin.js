import React, { useState, useEffect } from 'react';
import { Link, Routes, Route, useLocation } from 'react-router-dom';
import axios from 'axios';

function Admin() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('articles');
  const [articles, setArticles] = useState([]);
  const [comments, setComments] = useState([]);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState({ name: '', slug: '' });

  useEffect(() => {
    const path = location.pathname.split('/').pop();
    if (['articles', 'comments', 'users', 'categories'].includes(path)) {
      setActiveTab(path);
    }
  }, [location]);

  useEffect(() => {
    if (activeTab === 'articles') fetchArticles();
    if (activeTab === 'comments') fetchComments();
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'categories') fetchCategories();
  }, [activeTab]);

  const fetchArticles = async () => {
    try {
      const res = await axios.get('/api/articles');
      setArticles(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchComments = async () => {
    try {
      const res = await axios.get('/api/comments');
      setComments(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get('/api/users');
      setUsers(res.data);
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

  const deleteArticle = async (id) => {
    if (!window.confirm('确定删除这篇文章吗？')) return;
    try {
      await axios.delete(`/api/articles/${id}`);
      fetchArticles();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteComment = async (id) => {
    if (!window.confirm('确定删除这条评论吗？')) return;
    try {
      await axios.delete(`/api/comments/${id}`);
      fetchComments();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm('确定删除这个用户吗？')) return;
    try {
      await axios.delete(`/api/users/${id}`);
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteCategory = async (id) => {
    if (!window.confirm('确定删除这个分类吗？')) return;
    try {
      await axios.delete(`/api/categories/${id}`);
      fetchCategories();
    } catch (err) {
      console.error(err);
    }
  };

  const addCategory = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/categories', newCategory);
      setNewCategory({ name: '', slug: '' });
      fetchCategories();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <h2 style={{ marginBottom: '1.5rem' }}>后台管理</h2>
      
      <nav className="admin-nav">
        <Link to="/admin/articles" className={activeTab === 'articles' ? 'active' : ''}>文章管理</Link>
        <Link to="/admin/comments" className={activeTab === 'comments' ? 'active' : ''}>评论管理</Link>
        <Link to="/admin/users" className={activeTab === 'users' ? 'active' : ''}>用户管理</Link>
        <Link to="/admin/categories" className={activeTab === 'categories' ? 'active' : ''}>分类管理</Link>
      </nav>

      <div className="card">
        <Routes>
          <Route path="articles" element={
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3>文章列表</h3>
                <Link to="/write" className="btn btn-primary">写文章</Link>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>标题</th>
                    <th>状态</th>
                    <th>浏览</th>
                    <th>创建时间</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {articles.map(article => (
                    <tr key={article.id}>
                      <td>
                        <Link to={`/article/${article.slug}`}>{article.title}</Link>
                      </td>
                      <td>
                        <span className={`status-badge status-${article.status}`}>
                          {article.status === 'published' ? '已发布' : '草稿'}
                        </span>
                      </td>
                      <td>{article.view_count}</td>
                      <td>{new Date(article.created_at).toLocaleDateString()}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <Link to={`/edit/${article.id}`} className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>编辑</Link>
                          <button className="btn btn-danger" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={() => deleteArticle(article.id)}>删除</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          } />
          
          <Route path="comments" element={
            <>
              <h3>评论列表</h3>
              <table>
                <thead>
                  <tr>
                    <th>内容</th>
                    <th>用户</th>
                    <th>状态</th>
                    <th>时间</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {comments.map(comment => (
                    <tr key={comment.id}>
                      <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {comment.content}
                      </td>
                      <td>用户{comment.user_id}</td>
                      <td>
                        <span className="status-badge status-published">已通过</span>
                      </td>
                      <td>{new Date(comment.created_at).toLocaleDateString()}</td>
                      <td>
                        <button className="btn btn-danger" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={() => deleteComment(comment.id)}>删除</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          } />
          
          <Route path="users" element={
            <>
              <h3>用户列表</h3>
              <table>
                <thead>
                  <tr>
                    <th>用户名</th>
                    <th>邮箱</th>
                    <th>角色</th>
                    <th>注册时间</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id}>
                      <td>{user.username}</td>
                      <td>{user.email}</td>
                      <td>{user.role}</td>
                      <td>{new Date(user.created_at).toLocaleDateString()}</td>
                      <td>
                        <button className="btn btn-danger" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={() => deleteUser(user.id)}>删除</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          } />
          
          <Route path="categories" element={
            <>
              <h3>分类管理</h3>
              <form onSubmit={addCategory} style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="分类名称"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
                />
                <input
                  type="text"
                  placeholder="Slug"
                  value={newCategory.slug}
                  onChange={(e) => setNewCategory({ ...newCategory, slug: e.target.value })}
                  style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
                />
                <button type="submit" className="btn btn-primary">添加分类</button>
              </form>
              <table>
                <thead>
                  <tr>
                    <th>分类名称</th>
                    <th>Slug</th>
                    <th>创建时间</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map(cat => (
                    <tr key={cat.id}>
                      <td>{cat.name}</td>
                      <td>{cat.slug}</td>
                      <td>{new Date(cat.created_at).toLocaleDateString()}</td>
                      <td>
                        <button className="btn btn-danger" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={() => deleteCategory(cat.id)}>删除</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          } />
          
          <Route path="*" element={<div>请选择管理菜单</div>} />
        </Routes>
      </div>
    </div>
  );
}

export default Admin;
