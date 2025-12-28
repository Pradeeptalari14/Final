import { createBrowserRouter } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import RootLayout from './layouts/RootLayout';
import DashboardOverview from './pages/Dashboard';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';

// Eager load critical components
import StagingSheet from './components/sheets/StagingSheet';
import LoadingSheet from './components/sheets/LoadingSheet';
import SettingsPage from './pages/Settings';

// Lazy load heavy admin & data tables
import DatabasePage from './pages/Database';

// Lazy load heavy admin & data tables
import { LoadingFallback } from './components/ui/LoadingFallback';

// const DatabasePage = lazy(() => import('./pages/Database'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const ReportsPage = lazy(() => import('./pages/Reports'));

export const router = createBrowserRouter([
    {
        path: '/login',
        element: <LoginPage />
    },
    {
        path: '/register',
        element: <RegisterPage />
    },
    {
        path: '/',
        element: <RootLayout />,
        children: [
            {
                index: true,
                element: <DashboardOverview />
            },
            {
                path: 'database',
                element: <DatabasePage />
            },
            {
                path: 'reports',
                element: (
                    <Suspense fallback={<LoadingFallback />}>
                        <ReportsPage />
                    </Suspense>
                )
            },

            // ...

            {
                path: 'sheets/staging/:id',
                element: <StagingSheet />
            },
            {
                path: 'sheets/loading/:id',
                element: <LoadingSheet />
            },
            {
                path: 'settings',
                element: <SettingsPage />
            },
            {
                path: 'admin',
                element: (
                    <Suspense fallback={<LoadingFallback />}>
                        <AdminDashboard />
                    </Suspense>
                )
            }
        ]
    }
]);
