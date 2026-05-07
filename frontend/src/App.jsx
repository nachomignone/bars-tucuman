import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard from './pages/Dashboard';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000, // 30 segundos antes de considerar datos desactualizados
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <Dashboard />
  </QueryClientProvider>
);

export default App;
