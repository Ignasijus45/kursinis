import React, { useState, useEffect } from 'react';
import { taskService } from '../services';

export default function Comments({ task }) {
  const [items, setItems] = useState(task.comments || []);
  const [content, setContent] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setInitialLoading(true);
      setError(null);
      try {
        const res = await taskService.getById(task.id);
        if (!active) return;
        setItems(res.data?.comments || []);
      } catch (err) {
        if (!active) return;
        setError(err.response?.data?.message || 'Nepavyko įkelti komentarų');
      } finally {
        if (active) setInitialLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [task.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await taskService.addComment(task.id, content.trim());
      setItems((prev) => [...prev, res.data]);
      setContent('');
    } catch (err) {
      setError(err.response?.data?.message || 'Nepavyko pridėti komentaro');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (commentId) => {
    try {
      await taskService.deleteComment(task.id, commentId);
      setItems((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err) {
      setError(err.response?.data?.message || 'Nepavyko ištrinti komentaro');
    }
  };

  return (
    <div className="comments">
      <h4>Komentarai</h4>
      {error && <div className="error-message">{error}</div>}
      {initialLoading && <div className="muted small">Kraunami komentarai...</div>}
      <ul>
        {items.map((c) => (
          <li key={c.id} className="comment-row">
            <div className="comment-content">
              <strong>{c.user_id || 'User'}</strong>
              <p>{c.content}</p>
            </div>
            <button className="outline-button" onClick={() => handleDelete(c.id)}>
              Ištrinti
            </button>
          </li>
        ))}
        {items.length === 0 && <li className="empty">Komentarų nėra</li>}
      </ul>

      <form className="comment-form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Parašykite komentarą"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Siunčiama...' : 'Pridėti'}
        </button>
      </form>
    </div>
  );
}
