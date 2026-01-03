import api from './api';

export const userService = {
  register: (email, username, password, full_name) =>
    api.post('/auth/register', { email, username, password, full_name }),
  
  login: (email, password) =>
    api.post('/auth/login', { email, password }),
  
  getProfile: (id) =>
    api.get(`/users/${id}`),
  
  updateProfile: (id, data) =>
    api.put(`/users/${id}`, data)
};

export const projectService = {
  getAll: () =>
    api.get('/projects'),
  
  getById: (id) =>
    api.get(`/projects/${id}`),
  
  create: (data) =>
    api.post('/projects', data),
  
  update: (id, data) =>
    api.put(`/projects/${id}`, data),
  
  delete: (id) =>
    api.delete(`/projects/${id}`),
  
  getMembers: (id) =>
    api.get(`/projects/${id}/members`),
  
  addMember: (id, user_id) =>
    api.post(`/projects/${id}/members`, { user_id })
};

export const taskService = {
  getByProject: (projectId) =>
    api.get(`/tasks/project/${projectId}`),

  getByBoard: (boardId) =>
    api.get(`/tasks/board/${boardId}`),
  
  getById: (id) =>
    api.get(`/tasks/${id}`),
  
  create: (data) =>
    api.post('/tasks', data),
  
  update: (id, data) =>
    api.put(`/tasks/${id}`, data),
  
  delete: (id) =>
    api.delete(`/tasks/${id}`),
  
  addComment: (id, content) =>
    api.post(`/tasks/${id}/comments`, { content }),

  deleteComment: (taskId, commentId) =>
    api.delete(`/tasks/${taskId}/comments/${commentId}`),
  
  createBoard: (data) =>
    api.post('/tasks/board', data),

  updateBoard: (id, data) =>
    api.put(`/columns/${id}`, data),

  deleteBoard: (id) =>
    api.delete(`/columns/${id}`),

  move: (id, data) =>
    api.patch(`/tasks/${id}/status`, data)
};

export const teamService = {
  create: (data) =>
    api.post('/teams', data),

  getAll: () =>
    api.get('/teams'),

  getMembers: (teamId) =>
    api.get(`/teams/${teamId}/members`),

  removeMember: (teamId, userId) =>
    api.delete(`/teams/${teamId}/members/${userId}`),

  getBoards: (teamId) =>
    api.get(`/teams/${teamId}/boards`),

  createColumn: (data) =>
    api.post('/columns', data),

  delete: (teamId) =>
    api.delete(`/teams/${teamId}`)
};

export const auditService = {
  getByProject: (projectId) =>
    api.get(`/audit/project/${projectId}`),

  getByUser: (userId) =>
    api.get(`/audit/user/${userId}`)
};
