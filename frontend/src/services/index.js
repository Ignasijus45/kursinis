import api from './api';

export const userService = {
  register: (email, username, password, full_name) =>
    api.post('/users/register', { email, username, password, full_name }),
  
  login: (email, password) =>
    api.post('/users/login', { email, password }),
  
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
  
  createBoard: (data) =>
    api.post('/tasks/board', data)
};
