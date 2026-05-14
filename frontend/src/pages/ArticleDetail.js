import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import axios from 'axios';

function ArticleDetail() {
  const { slug } = useParams();
  const [article, setArticle] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArticle();
  }, [slug]);

  useEffect(() => {
    if (article?.id) {
      fetchComments();
    }
  }, [article?.id]);

  const fetchArticle = async () => {
    try {
      const res = await axios.get(`/api/articles/slug/${slug}`);
      setArticle(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const res = await axios.get('/api/comments', { params: { article_id: article.id } });
      setComments(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      await axios.post('/api/comments', {
        article_id: article.id,
        user_id: 1,
        content: newComment,
        parent_id: replyTo || 0
      });
      setNewComment('');
      setReplyTo(null);
      fetchComments();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div>加载中...</div>;
  if (!article) return <div>文章不存在</div>;

  return (
    <div>
      <div className="card">
        <h1>{article.title}</h1>
        <div className="article-meta">
          发布于 {new Date(article.published_at || article.created_at).toLocaleDateString()} · 
          浏览 {article.view_count} 次
        </div>
        <hr style={{ margin: '1.5rem 0' }} />
        <div className="markdown-content">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {article.content}
          </ReactMarkdown>
        </div>
      </div>

      <div className="card">
        <h3>评论 ({comments.length})</h3>
        <form onSubmit={handleSubmitComment} style={{ marginBottom: '1.5rem' }}>
          <div className="form-group">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={replyTo ? '回复评论...' : '写下你的评论...'}
              style={{ minHeight: '100px' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" className="btn btn-primary">
              {replyTo ? '回复' : '发表评论'}
            </button>
            {replyTo && (
              <button type="button" className="btn btn-secondary" onClick={() => setReplyTo(null)}>
                取消回复
              </button>
            )}
          </div>
        </form>

        {comments.filter(c => c.parent_id === 0).map(comment => (
          <div key={comment.id} className="comment">
            <div className="comment-header">
              <span className="comment-author">用户{comment.user_id}</span>
              <span className="comment-date">{new Date(comment.created_at).toLocaleString()}</span>
            </div>
            <p>{comment.content}</p>
            <button 
              className="btn btn-secondary" 
              style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
              onClick={() => setReplyTo(comment.id)}
            >
              回复
            </button>
            {comments.filter(c => c.parent_id === comment.id).map(reply => (
              <div key={reply.id} className="comment comment-reply">
                <div className="comment-header">
                  <span className="comment-author">用户{reply.user_id}</span>
                  <span className="comment-date">{new Date(reply.created_at).toLocaleString()}</span>
                </div>
                <p>{reply.content}</p>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ArticleDetail;
