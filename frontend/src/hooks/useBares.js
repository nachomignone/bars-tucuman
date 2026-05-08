import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getBares,
  getEstadisticas,
  createBar,
  updateBar,
  desactivarBar,
  deleteBar,
} from '../api/baresApi';

// ─── Queries ──────────────────────────────────────────────────────────────────

export const useGetBares = (filtros = {}) =>
  useQuery({
    queryKey: ['bares', filtros],
    queryFn: () => getBares(filtros),
  });

export const useGetEstadisticas = () =>
  useQuery({
    queryKey: ['estadisticas'],
    queryFn: getEstadisticas,
  });

// ─── Mutations ────────────────────────────────────────────────────────────────

const invalidarTodo = (qc) => {
  qc.invalidateQueries({ queryKey: ['bares'] });
  qc.invalidateQueries({ queryKey: ['estadisticas'] });
};

export const useCreateBar = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createBar,
    onSuccess: () => invalidarTodo(qc),
  });
};

export const useUpdateBar = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateBar,
    onSuccess: () => invalidarTodo(qc),
  });
};

export const useDesactivarBar = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: desactivarBar,
    onSuccess: () => invalidarTodo(qc),
  });
};

export const useDeleteBar = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteBar,
    onSuccess: () => invalidarTodo(qc),
  });
};
