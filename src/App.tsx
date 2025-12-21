import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { DataProvider } from '@/contexts/DataContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { router } from './router';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            refetchOnWindowFocus: false,
        },
    },
});

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <ToastProvider>
                    <DataProvider queryClient={queryClient}>
                        <RouterProvider router={router} />
                    </DataProvider>
                </ToastProvider>
            </AuthProvider>
        </QueryClientProvider>
    )
}

export default App
