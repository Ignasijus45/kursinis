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
  getByProject: (projectId, params) =>
    api.get(`/tasks/project/${projectId}`, { params }),

  getByBoard: (boardId, params) =>
    api.get(`/tasks/board/${boardId}`, { params }),
  
  getById: (id) =>
    api.get(`/tasks/${id}`),
  
  create: (data) =>
    api.post('/tasks', data),
  
  update: (id, data) =>
    api.put(`/tasks/${id}`, data),
  
  delete: (id) =>
    api.delete(`/tasks/${id}`),

  archive: (id, archived = true) =>
    api.patch(`/tasks/${id}/archive`, { archived }),
  
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

  archiveBoard: (id, archived = true) =>
    api.patch(`/columns/${id}/archive`, { archived }),

  move: (id, data) =>
    api.patch(`/tasks/${id}/status`, data),

  exportBoard: (boardId) =>
    api.get(`/export/board/${boardId}`),

  importBoard: (data) =>
    api.post('/export/board', data)
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

  getBoards: (teamId, params) =>
    api.get(`/teams/${teamId}/boards`, { params }),

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
,

  getByTeam: (teamId) =>
    api.get(`/audit/team/${teamId}`)
};
