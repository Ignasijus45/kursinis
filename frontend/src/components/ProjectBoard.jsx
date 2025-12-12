import React, { useState, useEffect } from 'react';
import { projectService } from '../services';

export default function ProjectBoard({ projectId }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await projectService.getById(projectId);
        setTasks(response.data);
      } catch (error) {
        console.error('Klaida gaunant uždavinius:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [projectId]);

  if (loading) return <div>Kraunama...</div>;

  return (
    <div className="project-board">
      <h1>Projektų lenta</h1>
      {tasks.length === 0 ? (
        <p>Nėra uždavinių</p>
      ) : (
        <div className="boards-container">
          {tasks.map(board => (
            <div key={board.id} className="board">
              <h2>{board.title}</h2>
              <div className="tasks-list">
                {board.tasks?.map(task => (
                  <div key={task.id} className="task-card">
                    <h3>{task.title}</h3>
                    <p>{task.description}</p>
                    <span className={`priority ${task.priority}`}>
                      {task.priority}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
