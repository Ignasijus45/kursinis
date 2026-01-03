import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { teamService, taskService } from '../services';
import Comments from './Comments';

export default function ProjectBoard({ projectId, teamId, canManageBoards = true, incomingBoard }) {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [creatingBoard, setCreatingBoard] = useState(false);
  const [error, setError] = useState(null);
  const [taskDrafts, setTaskDrafts] = useState({});
  const [taskLoading, setTaskLoading] = useState({});
  const [taskErrors, setTaskErrors] = useState({});
  const [editingBoardId, setEditingBoardId] = useState(null);
  const [boardDrafts, setBoardDrafts] = useState({});
  const [boardErrors, setBoardErrors] = useState({});
  const [taskEditDrafts, setTaskEditDrafts] = useState({});
  const [taskEditLoading, setTaskEditLoading] = useState({});
  const [taskEditErrors, setTaskEditErrors] = useState({});
  const [boardDeleting, setBoardDeleting] = useState({});
  const [taskDeleting, setTaskDeleting] = useState({});
  const [taskDeleteErrors, setTaskDeleteErrors] = useState({});
  const isTeamBoard = Boolean(teamId);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        if (isTeamBoard) {
          const response = await teamService.getBoards(teamId);
          const boardsWithTasks = await Promise.all(
            (response.data || []).map(async (b) => {
              try {
                const taskRes = await taskService.getByBoard(b.id);
                return { ...b, tasks: taskRes.data || [] };
              } catch (err) {
                console.error('Klaida gaunant komandos lentos užduotis:', err);
                return { ...b, tasks: [] };
              }
            })
          );
          setBoards(boardsWithTasks);
        } else {
          const response = await taskService.getByProject(projectId);
          const mapped = (response.data || []).map((b) => ({
            ...b,
            tasks: b.tasks || []
          }));
          setBoards(mapped);
        }
      } catch (error) {
        console.error('Klaida gaunant uždavinius:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [projectId, teamId, isTeamBoard]);

  // Įtraukti naujai sukurtą lentą nedelsiant (komandose kuria TeamPage)
  useEffect(() => {
    if (!incomingBoard || !incomingBoard.id) return;
    setBoards((prev) => {
      if (prev.some((b) => b.id === incomingBoard.id)) return prev;
      return [...prev, { ...incomingBoard, tasks: incomingBoard.tasks || [] }];
    });
  }, [incomingBoard]);

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    setBoards((prev) => {
      const updated = prev.map((b) => ({ ...b, tasks: [...(b.tasks || [])] }));
      const sourceBoard = updated.find((b) => b.id === source.droppableId);
      const destBoard = updated.find((b) => b.id === destination.droppableId);
      if (!sourceBoard || !destBoard) return prev;

      const [moved] = sourceBoard.tasks.splice(source.index, 1);
      if (!moved) return prev;

      // Update local task props
      moved.board_id = destBoard.id;
      moved.position = destination.index;
      destBoard.tasks.splice(destination.index, 0, moved);

      // Reindex positions in both boards
      sourceBoard.tasks = sourceBoard.tasks.map((t, idx) => ({ ...t, position: idx }));
      destBoard.tasks = destBoard.tasks.map((t, idx) => ({ ...t, position: idx }));

      // Persist move (fire and forget)
      taskService.move(draggableId, {
        board_id: destBoard.id,
        position: destination.index
      }).catch((err) => {
        console.error('Nepavyko perkelti uždavinio:', err);
      });

      return updated;
    });
  };

  const handleBoardSave = async (boardId) => {
    const draft = boardDrafts[boardId];
    if (!draft || !draft.title || !draft.title.trim()) {
      setBoardErrors((prev) => ({ ...prev, [boardId]: 'Pavadinimas privalomas' }));
      return;
    }
    setBoardErrors((prev) => ({ ...prev, [boardId]: null }));
    try {
      await taskService.updateBoard(boardId, { title: draft.title.trim() });
      setBoards((prev) =>
        prev.map((b) => (b.id === boardId ? { ...b, title: draft.title.trim() } : b))
      );
      setEditingBoardId(null);
    } catch (err) {
      setBoardErrors((prev) => ({
        ...prev,
        [boardId]: err.response?.data?.message || 'Nepavyko atnaujinti lentos'
      }));
    }
  };

  const handleTaskDelete = async (taskId, boardId) => {
    const confirmed = window.confirm('Ar tikrai norite ištrinti šią užduotį?');
    if (!confirmed) return;
    setTaskDeleting((prev) => ({ ...prev, [taskId]: true }));
    setTaskDeleteErrors((prev) => ({ ...prev, [taskId]: null }));
    try {
      await taskService.delete(taskId);
      setBoards((prev) =>
        prev.map((b) =>
          b.id === boardId
            ? { ...b, tasks: (b.tasks || []).filter((t) => t.id !== taskId) }
            : b
        )
      );
    } catch (err) {
      setTaskDeleteErrors((prev) => ({
        ...prev,
        [taskId]: err.response?.data?.message || 'Nepavyko ištrinti užduoties'
      }));
    } finally {
      setTaskDeleting((prev) => ({ ...prev, [taskId]: false }));
    }
  };

  const handleBoardDelete = async (boardId) => {
    if (isTeamBoard && !canManageBoards) {
      alert('Tik komandos savininkas gali ištrinti lentą');
      return;
    }
    const confirmed = window.confirm('Ar tikrai norite ištrinti šią lentą?');
    if (!confirmed) return;
    setBoardDeleting((prev) => ({ ...prev, [boardId]: true }));
    setBoardErrors((prev) => ({ ...prev, [boardId]: null }));
    try {
      await taskService.deleteBoard(boardId);
      setBoards((prev) => prev.filter((b) => b.id !== boardId));
    } catch (err) {
      setBoardErrors((prev) => ({
        ...prev,
        [boardId]: err.response?.data?.message || 'Nepavyko ištrinti lentos'
      }));
    } finally {
      setBoardDeleting((prev) => ({ ...prev, [boardId]: false }));
    }
  };

  const handleTaskEditSave = async (taskId, boardId) => {
    const draft = taskEditDrafts[taskId] || {};
    if (!draft.title || !draft.title.trim()) {
      setTaskEditErrors((prev) => ({ ...prev, [taskId]: 'Pavadinimas privalomas' }));
      return;
    }
    setTaskEditLoading((prev) => ({ ...prev, [taskId]: true }));
    setTaskEditErrors((prev) => ({ ...prev, [taskId]: null }));
    try {
      const res = await taskService.update(taskId, {
        title: draft.title.trim(),
        description: draft.description?.trim() || ''
      });
      const updated = res?.data;
      setBoards((prev) =>
        prev.map((b) =>
          b.id === boardId
            ? {
                ...b,
                tasks: (b.tasks || []).map((t) => (t.id === taskId ? { ...t, ...updated } : t))
              }
            : b
        )
      );
      setTaskEditDrafts((prev) => ({ ...prev, [taskId]: null }));
    } catch (err) {
      setTaskEditErrors((prev) => ({
        ...prev,
        [taskId]: err.response?.data?.message || 'Nepavyko atnaujinti užduoties'
      }));
    } finally {
      setTaskEditLoading((prev) => ({ ...prev, [taskId]: false }));
    }
  };

  const handleTaskSubmit = async (e, boardId) => {
    e.preventDefault();
    const draft = taskDrafts[boardId] || {};

    if (!draft.title || !draft.title.trim()) {
      setTaskErrors((prev) => ({ ...prev, [boardId]: 'Pavadinimas privalomas' }));
      return;
    }

    setTaskLoading((prev) => ({ ...prev, [boardId]: true }));
    setTaskErrors((prev) => ({ ...prev, [boardId]: null }));

    try {
      const res = await taskService.create({
        board_id: boardId,
        title: draft.title.trim(),
        description: draft.description?.trim() || ''
      });

      const created = res?.data;
      setBoards((prev) =>
        prev.map((b) =>
          b.id === boardId
            ? { ...b, tasks: [...(b.tasks || []), created] }
            : b
        )
      );
      setTaskDrafts((prev) => ({ ...prev, [boardId]: { title: '', description: '' } }));
    } catch (err) {
      setTaskErrors((prev) => ({
        ...prev,
        [boardId]: err.response?.data?.message || 'Nepavyko sukurti užduoties'
      }));
    } finally {
      setTaskLoading((prev) => ({ ...prev, [boardId]: false }));
    }
  };

  if (loading) return <div>Kraunama...</div>;

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="project-board">
        <h1>{isTeamBoard ? 'Komandos lentos' : 'Projektų lenta'}</h1>
        {!isTeamBoard && (
          <form
            className="board-form"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!newBoardTitle.trim()) return;
              setCreatingBoard(true);
              setError(null);
              try {
                const res = await taskService.createBoard({
                  project_id: projectId,
                  title: newBoardTitle.trim()
                });
                const created = res?.data;
                setBoards((prev) => [...prev, { ...created, tasks: [] }]);
                setNewBoardTitle('');
              } catch (err) {
                setError(err.response?.data?.message || 'Nepavyko sukurti lentos');
              } finally {
                setCreatingBoard(false);
              }
            }}
          >
            <input
              type="text"
              placeholder="Naujos lentos pavadinimas"
              value={newBoardTitle}
              onChange={(e) => setNewBoardTitle(e.target.value)}
              required
            />
            <button type="submit" disabled={creatingBoard}>
              {creatingBoard ? 'Kuriama...' : 'Pridėti lentą'}
            </button>
          </form>
        )}
        {error && <div className="error-message">{error}</div>}
        {boards.length === 0 ? (
          <p>Nėra lentų</p>
        ) : (
          <div className="boards-container">
            {boards.map(board => (
              <Droppable droppableId={board.id} key={board.id}>
                {(provided) => (
                  <div
                    className="board"
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                  >
                    <div className="board-header">
                      {editingBoardId === board.id ? (
                        <>
                          <input
                            type="text"
                            value={boardDrafts[board.id]?.title ?? board.title}
                            onChange={(e) =>
                              setBoardDrafts((prev) => ({
                                ...prev,
                                [board.id]: { title: e.target.value }
                              }))
                            }
                          />
                          <div className="board-header-actions">
                            <button type="button" onClick={() => handleBoardSave(board.id)}>
                              Išsaugoti
                            </button>
                            <button type="button" onClick={() => setEditingBoardId(null)}>
                              Atšaukti
                            </button>
                          </div>
                          {boardErrors[board.id] && (
                            <div className="error-message">{boardErrors[board.id]}</div>
                          )}
                        </>
                      ) : (
                        <>
                          <h2>{board.title}</h2>
                          <div className="board-header-actions">
                            <button
                              type="button"
                              className="outline-button"
                              onClick={() => {
                                setEditingBoardId(board.id);
                                setBoardDrafts((prev) => ({
                                  ...prev,
                                  [board.id]: { title: board.title }
                                }));
                              }}
                            >
                              Redaguoti
                            </button>
                            {(!isTeamBoard || canManageBoards) && (
                              <button
                                type="button"
                                className="outline-button danger"
                                onClick={() => handleBoardDelete(board.id)}
                                disabled={!!boardDeleting[board.id]}
                              >
                                {boardDeleting[board.id] ? 'Trinama...' : 'Ištrinti'}
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
              <form
                className="task-form"
                onSubmit={(e) => handleTaskSubmit(e, board.id)}
              >
                <input
                  type="text"
                  placeholder="Užduoties pavadinimas"
                  value={taskDrafts[board.id]?.title || ''}
                  onChange={(e) =>
                    setTaskDrafts((prev) => ({
                      ...prev,
                      [board.id]: { ...(prev[board.id] || {}), title: e.target.value }
                    }))
                  }
                  required
                />
                <textarea
                  placeholder="Aprašymas (nebūtina)"
                  rows={2}
                  value={taskDrafts[board.id]?.description || ''}
                  onChange={(e) =>
                    setTaskDrafts((prev) => ({
                      ...prev,
                      [board.id]: { ...(prev[board.id] || {}), description: e.target.value }
                    }))
                  }
                />
                {taskErrors[board.id] && (
                  <div className="error-message">{taskErrors[board.id]}</div>
                )}
                <button type="submit" disabled={taskLoading[board.id]}>
                  {taskLoading[board.id] ? 'Kuriama...' : 'Pridėti užduotį'}
                </button>
              </form>
              <div className="tasks-list">
                {board.tasks?.map((task, index) => (
                  <Draggable key={task.id} draggableId={task.id} index={index}>
                    {(prov) => (
                      <div
                        className="task-card"
                        ref={prov.innerRef}
                        {...prov.draggableProps}
                        {...prov.dragHandleProps}
                      >
                        {taskEditDrafts[task.id] ? (
                          <div className="task-edit">
                            <input
                              type="text"
                              value={taskEditDrafts[task.id]?.title || ''}
                              onChange={(e) =>
                                setTaskEditDrafts((prev) => ({
                                  ...prev,
                                  [task.id]: {
                                    ...(prev[task.id] || {}),
                                    title: e.target.value
                                  }
                                }))
                              }
                            />
                            <textarea
                              rows={3}
                              value={taskEditDrafts[task.id]?.description || ''}
                              onChange={(e) =>
                                setTaskEditDrafts((prev) => ({
                                  ...prev,
                                  [task.id]: {
                                    ...(prev[task.id] || {}),
                                    description: e.target.value
                                  }
                                }))
                              }
                            />
                            {taskEditErrors[task.id] && (
                              <div className="error-message">{taskEditErrors[task.id]}</div>
                            )}
                            {taskDeleteErrors[task.id] && (
                              <div className="error-message">{taskDeleteErrors[task.id]}</div>
                            )}
                            <div className="task-edit-actions">
                              <button
                                type="button"
                                onClick={() => handleTaskEditSave(task.id, board.id)}
                                disabled={taskEditLoading[task.id]}
                              >
                                {taskEditLoading[task.id] ? 'Saugoma...' : 'Išsaugoti'}
                              </button>
                              <button
                                type="button"
                                className="outline-button"
                                onClick={() => setTaskEditDrafts((prev) => ({ ...prev, [task.id]: null }))}
                              >
                                Atšaukti
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <h3>{task.title}</h3>
                            <p>{task.description}</p>
                            <span className={`priority ${task.priority}`}>
                              {task.priority}
                            </span>
                            <div className="task-actions">
                              <button
                                type="button"
                                className="outline-button"
                                onClick={() =>
                                  setTaskEditDrafts((prev) => ({
                                    ...prev,
                                    [task.id]: {
                                      title: task.title,
                                      description: task.description || ''
                                    }
                                  }))
                                }
                              >
                                Redaguoti
                              </button>
                              <button
                                type="button"
                                className="outline-button danger"
                                onClick={() => handleTaskDelete(task.id, board.id)}
                                disabled={!!taskDeleting[task.id]}
                              >
                                {taskDeleting[task.id] ? 'Trinama...' : 'Ištrinti'}
                              </button>
                            </div>
                            {taskDeleteErrors[task.id] && (
                              <div className="error-message">{taskDeleteErrors[task.id]}</div>
                            )}
                            <Comments task={task} />
                          </>
                        )}
                      </div>
                    )}
                  </Draggable>
                ))}
                      {provided.placeholder}
                      {(!board.tasks || board.tasks.length === 0) && (
                        <p className="empty">Nėra užduočių</p>
                      )}
                    </div>
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        )}
      </div>
    </DragDropContext>
  );
}
