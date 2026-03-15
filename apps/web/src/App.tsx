import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <DashboardPage />
  </QueryClientProvider>
);

export default App;
