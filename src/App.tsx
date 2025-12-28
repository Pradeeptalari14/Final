import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { DataProvider } from '@/contexts/DataContext';
import { AppStateProvider } from '@/contexts/AppStateContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { Toaster } from 'sonner';
import { router } from './router';
import { queryClient, persister, PersistQueryClientProvider } from '@/lib/queryClient';
import { SyncManager } from '@/components/sync/SyncManager';

function App() {
    return (
        <PersistQueryClientProvider
            client={queryClient}
            persistOptions={{ persister, maxAge: 1000 * 60 * 60 * 24 * 7 }} // 7 days
        >
            <AuthProvider>
                <ToastProvider>
                    <AppStateProvider>
                        <DataProvider queryClient={queryClient}>
                            <SyncManager />
                            <RouterProvider router={router} />
                            <Toaster position="top-center" richColors />
                        </DataProvider>
                    </AppStateProvider>
                </ToastProvider>
            </AuthProvider>
        </PersistQueryClientProvider>
    );
}

export default App;
