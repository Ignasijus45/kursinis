import React, { useEffect, useState } from 'react';
import { auditService } from '../services';

export default function ActivityFeed({ teamId, limit = 20 }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionFilter, setActionFilter] = useState('ALL');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await auditService.getByTeam(teamId);
        const data = Array.isArray(res.data) ? res.data.slice(0, limit) : [];
        setItems(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Nepavyko gauti veiksmų istorijos');
      } finally {
        setLoading(false);
      }
    };
    if (teamId) fetchData();
  }, [teamId, limit]);

  if (loading) return <div>Kraunama veiksmų istorija...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!items.length) return <div className="empty">Nėra veiksmų</div>;

  const actions = Array.from(new Set(items.map((i) => i.action))).filter(Boolean);
  const filteredItems =
    actionFilter === 'ALL' ? items : items.filter((i) => i.action === actionFilter);

  return (
    <div className="activity-feed">
      <h3>Paskutiniai veiksmai</h3>
      <div className="activity-filter">
        <label htmlFor="actionFilter">Filtras:</label>
        <select
          id="actionFilter"
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
        >
          <option value="ALL">Visi</option>
          {actions.map((act) => (
            <option key={act} value={act}>
              {act}
            </option>
          ))}
        </select>
      </div>
      <ul>
        {filteredItems.map((item) => (
          <li key={item.id}>
            <div className="activity-main">
              <strong>{item.action}</strong>
              <small>{new Date(item.created_at).toLocaleString()}</small>
            </div>
            <div className="activity-meta">
              {item.username && <span className="badge">{item.username}</span>}
              <span className="muted">{item.entity_type}</span>
              {item.details && (
                <code className="activity-details">
                  {typeof item.details === 'string' ? item.details : JSON.stringify(item.details)}
                </code>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
