import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectService, teamService } from '../services';
import ProjectForm from '../components/ProjectForm';
import ProjectBoard from '../components/ProjectBoard';
import TeamForm from '../components/TeamForm';

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [teams, setTeams] = useState(() => {
    try {
      const cached = localStorage.getItem('teams-cache');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [selectedProjectId, setSelectedProjectId] = useState(() => {
    try {
      return localStorage.getItem('selected-project-id');
    } catch {
      return null;
    }
  });
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Persisted user info (if available) to show who is logged in
  const currentUser = useMemo(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchProjects(), fetchTeams()]).finally(() => setLoading(false));
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await projectService.getAll();
      setProjects(response.data);
    } catch (error) {
      console.error('Klaida gaunant projektus:', error);
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await teamService.getAll();
      const list = response.data || [];
      setTeams(list);
      try {
        localStorage.setItem('teams-cache', JSON.stringify(list));
      } catch (e) {
        console.warn('Nepavyko išsaugoti teams cache', e);
      }
    } catch (error) {
      console.error('Klaida gaunant komandas:', error);
      // Paliekame cache, jei toks yra, kad vartotojas matytų bent jau sukurtas komandas
    }
  };

  useEffect(() => {
    if (!projects || projects.length === 0) return;
    const storedId = selectedProjectId;
    if (!storedId) return;
    const found = projects.find((p) => p.id === storedId);
    if (found) {
      setSelectedProject(found);
    } else {
      try {
        localStorage.removeItem('selected-project-id');
      } catch {}
      setSelectedProjectId(null);
      setSelectedProject(null);
    }
  }, [projects, selectedProjectId]);

  const handleProjectCreated = () => {
    fetchProjects();
  };

  const handleTeamCreated = (team) => {
    if (team?.id) {
      setTeams((prev) => [team, ...prev.filter((t) => t.id !== team.id)]);
      try {
        const next = [team, ...teams.filter((t) => t.id !== team.id)];
        localStorage.setItem('teams-cache', JSON.stringify(next));
      } catch {}
    }
    fetchTeams();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) return <div>Kraunama...</div>;

  return (
    <div className="projects-page">
      <div className="projects-header">
        <div className="projects-header__title">
          <span>📋 Projektų valdymas</span>
          {currentUser?.email && <small>{currentUser.email}</small>}
        </div>
        <button className="logout-button" onClick={handleLogout}>
          Atsijungti
        </button>
      </div>
      <div className="projects-container">
        <div className="projects-sidebar">
          <h2>Mano Projektai</h2>
          <ProjectForm onSuccess={handleProjectCreated} />
          <TeamForm onSuccess={handleTeamCreated} />
          
          <h3>Mano Komandos</h3>
          <div className="projects-list">
            {teams.map(team => (
              <div
                key={team.id}
                className="project-item"
                onClick={() => navigate(`/teams/${team.id}`)}
              >
                <span>{team.name}</span>
                <button
                  className="outline-button danger small-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    const confirmed = window.confirm('Ar tikrai ištrinti komandą?');
                    if (!confirmed) return;
                    teamService.delete(team.id)
                      .then(() => {
                        setTeams((prev) => prev.filter((t) => t.id !== team.id));
                        localStorage.setItem('teams-cache', JSON.stringify(teams.filter((t) => t.id !== team.id)));
                      })
                      .catch((err) => {
                        console.error('Klaida trinant komandą:', err);
                        alert(err.response?.data?.message || 'Nepavyko ištrinti komandos');
                      });
                  }}
                >
                  🗑
                </button>
              </div>
            ))}
            {teams.length === 0 && <div className="small muted">Komandų nėra</div>}
          </div>

          <h3>Mano Projektai</h3>
          <div className="projects-list">
            {projects.map(project => (
              <div
                key={project.id}
                className={`project-item ${selectedProject?.id === project.id ? 'active' : ''}`}
                onClick={() => {
                  setSelectedProject(project);
                  setSelectedProjectId(project.id);
                  try {
                    localStorage.setItem('selected-project-id', project.id);
                  } catch {}
                }}
              >
                <div
                  className="project-color"
                  style={{ backgroundColor: project.color }}
                />
                <span>{project.title}</span>
                <button
                  className="outline-button danger small-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    const confirmed = window.confirm('Ar tikrai ištrinti projektą?');
                    if (!confirmed) return;
                    projectService.delete(project.id)
                      .then(() => {
                        setProjects((prev) => prev.filter((p) => p.id !== project.id));
                        if (selectedProject?.id === project.id) {
                          setSelectedProject(null);
                          setSelectedProjectId(null);
                          try {
                            localStorage.removeItem('selected-project-id');
                          } catch {}
                        }
                      })
                      .catch((err) => {
                        console.error('Klaida trinant projektą:', err);
                        alert(err.response?.data?.message || 'Nepavyko ištrinti projekto');
                      });
                  }}
                >
                  🗑
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="projects-main">
          {selectedProject ? (
            <ProjectBoard projectId={selectedProject.id} />
          ) : (
            <div className="no-project-selected">
              <p>Pasirinkite projektą arba sukurkite naują</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
