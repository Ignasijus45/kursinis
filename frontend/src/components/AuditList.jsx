import React, { useEffect, useState } from 'react';
import { auditService } from '../services';

export default function AuditList({ userId, projectId }) {
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAudit = async () => {
      try {
        let res;
        if (projectId) {
          res = await auditService.getByProject(projectId);
        } else if (userId) {
          res = await auditService.getByUser(userId);
        }
        setItems(res?.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Nepavyko gauti istorijos');
      } finally {
        setLoading(false);
      }
    };
    fetchAudit();
  }, [userId, projectId]);

  if (loading) return <div>Kraunama istorija...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="audit-list">
      <h3>Veiklos istorija</h3>
      {items.length === 0 ? (
        <p>Įrašų nėra.</p>
      ) : (
        <ul>
          {items.map((a) => (
            <li key={a.id}>
              <div className="audit-row">
                <div>
                  <strong>{a.action}</strong> <span className="muted">{a.entity_type}</span>
                  {a.user_id && <div className="muted small">User: {a.user_id}</div>}
                  {a.details && <div className="muted small">{JSON.stringify(a.details)}</div>}
                </div>
                <span className="muted small">{new Date(a.created_at).toLocaleString()}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
