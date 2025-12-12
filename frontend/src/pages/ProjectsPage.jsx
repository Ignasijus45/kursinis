import React, { useState, useEffect } from 'react';
import { projectService } from '../services';
import ProjectForm from '../components/ProjectForm';
import ProjectBoard from '../components/ProjectBoard';

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await projectService.getAll();
      setProjects(response.data);
    } catch (error) {
      console.error('Klaida gaunant projektus:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectCreated = () => {
    fetchProjects();
  };

  if (loading) return <div>Kraunama...</div>;

  return (
    <div className="projects-page">
      <div className="projects-container">
        <div className="projects-sidebar">
          <h2>Mano Projektai</h2>
          <ProjectForm onSuccess={handleProjectCreated} />
          
          <div className="projects-list">
            {projects.map(project => (
              <div
                key={project.id}
                className={`project-item ${selectedProject?.id === project.id ? 'active' : ''}`}
                onClick={() => setSelectedProject(project)}
              >
                <div
                  className="project-color"
                  style={{ backgroundColor: project.color }}
                />
                <span>{project.title}</span>
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
