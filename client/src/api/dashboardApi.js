import axios from 'axios';

const BASE = '/api';

export const listDashboards = () =>
  axios.get(`${BASE}/dashboards`).then((r) => r.data);

export const createDashboard = (name) =>
  axios.post(`${BASE}/dashboards`, { name }).then((r) => r.data);

export const getDashboard = (id) =>
  axios.get(`${BASE}/dashboards/${id}`).then((r) => r.data);

export const saveLayout = (id, name, widgets) =>
  axios.put(`${BASE}/dashboards/${id}/layout`, { name, widgets }).then((r) => r.data);

export const deleteDashboard = (id) =>
  axios.delete(`${BASE}/dashboards/${id}`).then((r) => r.data);

export const uploadImage = (file) => {
  const form = new FormData();
  form.append('image', file);
  return axios.post(`${BASE}/upload`, form).then((r) => r.data);
};
