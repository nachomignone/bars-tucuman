import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getBares,
  getEstadisticas,
  createBar,
  updateBar,
  desactivarBar,
  deleteBar,
} from '../api/baresApi';

// Query keys centralizados — evita strings sueltos en los componentes
export const QUERY_KEYS = {
  bares: (filtros) => ['bares', filtros],
  estadisticas: ['estadisticas'],
};

// ─── Queries (lectura) ──────────────────────────────────────────────────────

export const useGetBares = (filtros = {}) =>
  useQuery({
    queryKey: QUERY_KEYS.bares(filtros),
    queryFn: () => getBares(filtros),
  });

export const useGetEstadisticas = () =>
  useQuery({
    queryKey: QUERY_KEYS.estadisticas,
    queryFn: getEstadisticas,
  });

// ─── Mutations (escritura) ──────────────────────────────────────────────────

export const useCreateBar = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createBar,
    onSuccess: () => {
      // Invalida toda la lista y las estadísticas para que se refresquen solos
      queryClient.invalidateQueries({ queryKey: ['bares'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.estadisticas });
    },
  });
};

export const useUpdateBar = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateBar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bares'] });
    },
  });
};

export const useDesactivarBar = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: desactivarBar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bares'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.estadisticas });
    },
  });
};

export const useDeleteBar = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteBar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bares'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.estadisticas });
    },
  });
};
