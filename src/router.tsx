import { createBrowserRouter } from 'react-router-dom';
import RootLayout from './layouts/RootLayout';
import DashboardOverview from './pages/Dashboard';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';

import StagingSheet from './components/sheets/StagingSheet';
import LoadingSheet from './components/sheets/LoadingSheet';
import SettingsPage from './pages/Settings';
import DatabasePage from './pages/Database';
import AdminDashboard from './pages/AdminDashboard';
import ReportsPage from './pages/Reports';

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
                element: <ReportsPage />
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
                element: <AdminDashboard />
            }
        ]
    }
]);
