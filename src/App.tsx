import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { DataProvider } from '@/contexts/DataContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { router } from './router';

function App() {
    return (
        <AuthProvider>
            <ToastProvider>
                <DataProvider>
                    <RouterProvider router={router} />
                </DataProvider>
            </ToastProvider>
        </AuthProvider>
    )
}

export default App
