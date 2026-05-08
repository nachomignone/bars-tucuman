import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

export const getBares = (filtros = {}) =>
  api.get('/bares', { params: filtros }).then((r) => r.data);

export const getBarById = (id) =>
  api.get(`/bares/${id}`).then((r) => r.data);

export const createBar = (data) =>
  api.post('/bares', data).then((r) => r.data);

export const updateBar = ({ id, ...data }) =>
  api.put(`/bares/${id}`, data).then((r) => r.data);

export const desactivarBar = (id) =>
  api.patch(`/bares/${id}/desactivar`).then((r) => r.data);

export const deleteBar = (id) =>
  api.delete(`/bares/${id}`).then((r) => r.data);

export const getEstadisticas = () =>
  api.get('/bares/estadisticas/resumen').then((r) => r.data);
