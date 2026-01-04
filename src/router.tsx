import { createBrowserRouter } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';

// Lazy load all page components
import { LoadingFallback } from './components/ui/LoadingFallback';
import { LazyErrorBoundary } from './components/ui/LazyErrorBoundary';
import RootLayout from './layouts/RootLayout';

// Helper to retry lazy imports or force refresh on failure (common during deployments)
const lazyWithRetry = (componentImport: () => Promise<any>) =>
    lazy(async () => {
        const pageHasAlreadyBeenForceRefreshed = JSON.parse(
            window.sessionStorage.getItem('page-has-been-force-refreshed') || 'false'
        );

        try {
            return await componentImport();
        } catch (error) {
            if (!pageHasAlreadyBeenForceRefreshed) {
                // First failure: set flag and refresh once
                window.sessionStorage.setItem('page-has-been-force-refreshed', 'true');
                window.location.reload();
                return { default: () => null }; // Placeholder while reloading
            }

            // Second failure or already refreshed: bubble up to ErrorBoundary
            throw error;
        }
    });

const AdminDashboard = lazyWithRetry(() => import('./pages/AdminDashboard'));
const ReportsPage = lazyWithRetry(() => import('./pages/Reports'));
const DatabasePage = lazyWithRetry(() => import('./pages/Database'));
const DashboardOverview = lazyWithRetry(() => import('./pages/Dashboard'));
const SettingsPage = lazyWithRetry(() => import('./pages/Settings'));
const StagingSheet = lazyWithRetry(() => import('./components/sheets/StagingSheet'));
const LoadingSheet = lazyWithRetry(() => import('./components/sheets/LoadingSheet'));

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
                element: (
                    <LazyErrorBoundary>
                        <Suspense fallback={<LoadingFallback />}>
                            <DashboardOverview />
                        </Suspense>
                    </LazyErrorBoundary>
                )
            },
            {
                path: 'database',
                element: (
                    <LazyErrorBoundary>
                        <Suspense fallback={<LoadingFallback />}>
                            <DatabasePage />
                        </Suspense>
                    </LazyErrorBoundary>
                )
            },
            {
                path: 'reports',
                element: (
                    <LazyErrorBoundary>
                        <Suspense fallback={<LoadingFallback />}>
                            <ReportsPage />
                        </Suspense>
                    </LazyErrorBoundary>
                )
            },

            // ...

            {
                path: 'sheets/staging/:id',
                element: (
                    <LazyErrorBoundary>
                        <Suspense fallback={<LoadingFallback />}>
                            <StagingSheet />
                        </Suspense>
                    </LazyErrorBoundary>
                )
            },
            {
                path: 'sheets/loading/:id',
                element: (
                    <LazyErrorBoundary>
                        <Suspense fallback={<LoadingFallback />}>
                            <LoadingSheet />
                        </Suspense>
                    </LazyErrorBoundary>
                )
            },
            {
                path: 'settings',
                element: (
                    <LazyErrorBoundary>
                        <Suspense fallback={<LoadingFallback />}>
                            <SettingsPage />
                        </Suspense>
                    </LazyErrorBoundary>
                )
            },
            {
                path: 'admin',
                element: (
                    <LazyErrorBoundary>
                        <Suspense fallback={<LoadingFallback />}>
                            <AdminDashboard />
                        </Suspense>
                    </LazyErrorBoundary>
                )
            }
        ]
    }
]);
