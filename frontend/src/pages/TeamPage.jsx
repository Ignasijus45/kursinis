import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { teamService } from '../services';
import ProjectBoard from '../components/ProjectBoard';
import AuditList from '../components/AuditList';

export default function TeamPage() {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [removing, setRemoving] = useState({});
  const [newColumn, setNewColumn] = useState('');
  const [creating, setCreating] = useState(false);
  const [latestBoard, setLatestBoard] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [membersRes, boardsRes] = await Promise.all([
          teamService.getMembers(teamId),
          teamService.getBoards(teamId)
        ]);
        setMembers(membersRes.data || []);
        setBoards(boardsRes.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Nepavyko gauti narių');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [teamId]);

  const handleRemove = async (userId) => {
    setRemoving((prev) => ({ ...prev, [userId]: true }));
    try {
      await teamService.removeMember(teamId, userId);
      setMembers((prev) => prev.filter((m) => m.user_id !== userId));
    } catch (err) {
      setError(err.response?.data?.message || 'Nepavyko pašalinti nario');
    } finally {
      setRemoving((prev) => ({ ...prev, [userId]: false }));
    }
  };

  // OWNER gali pašalinti kitus, bet ne save; front-end paliekame tik mygtuką, backend saugo
  const currentUserId = useMemo(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored).id : null;
    } catch {
      return null;
    }
  }, []);

  const isCurrentUserOwner = useMemo(
    () => !!members.find((m) => m.role === 'OWNER' && m.user_id === currentUserId),
    [members, currentUserId]
  );

  const handleCreateColumn = async (e) => {
    e.preventDefault();
    if (!newColumn.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const resp = await teamService.createColumn({ team_id: teamId, title: newColumn.trim() });
      const created = resp?.data;
      setBoards((prev) => [...prev, created]);
      setLatestBoard(created);
      setNewColumn('');
    } catch (err) {
      setError(err.response?.data?.message || 'Nepavyko sukurti lentos');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="projects-page">
      <div className="projects-header">
        <div className="projects-header__title">
          <span>Komanda</span>
          <small>ID: {teamId}</small>
        </div>
        <button className="logout-button" onClick={() => navigate('/projects')}>
          Atgal į projektus
        </button>
      </div>
      <div className="projects-container">
        <div className="projects-main">
          {loading ? (
            <div>Kraunama...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : (
            <div className="team-columns">
              <div className="members-list">
                <h2>Nariai</h2>
                {members.length === 0 ? (
                  <p>Narių nėra.</p>
                ) : (
                  <ul>
                    {members.map((m) => (
                      <li key={m.id}>
                        <div className="member-row">
                          <div className="member-main">
                            <strong>{m.full_name || m.username}</strong>
                            <span>{m.email}</span>
                          </div>
                          <div className="member-actions">
                            <span className="badge">{m.role}</span>
                            {isCurrentUserOwner && currentUserId && m.role !== 'OWNER' && (
                              <button
                                className="outline-button"
                                onClick={() => handleRemove(m.user_id)}
                                disabled={!!removing[m.user_id]}
                              >
                                {removing[m.user_id] ? 'Šalinama...' : 'Pašalinti'}
                              </button>
                            )}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="boards-list">
                <h2>Lentos</h2>
                {isCurrentUserOwner && (
                  <form className="board-form" onSubmit={handleCreateColumn}>
                    <input
                      type="text"
                      placeholder="Naujos lentos pavadinimas"
                      value={newColumn}
                      onChange={(e) => setNewColumn(e.target.value)}
                      required
                    />
                    <button type="submit" disabled={creating}>
                      {creating ? 'Kuriama...' : 'Pridėti lentą'}
                    </button>
                  </form>
                )}
                <ProjectBoard
                  teamId={teamId}
                  canManageBoards={isCurrentUserOwner}
                  incomingBoard={latestBoard}
                />
              </div>

              <div className="audit-panel">
                <AuditList userId={currentUserId} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
