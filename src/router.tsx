import { createBrowserRouter } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';

// Lazy load all page components
import { LoadingFallback } from './components/ui/LoadingFallback';
import { LazyErrorBoundary } from './components/ui/LazyErrorBoundary';
import RootLayout from './layouts/RootLayout';
import ErrorPage from './pages/ErrorPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Role } from './types';

// Helper to retry lazy imports or force refresh on failure (common during deployments)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const lazyWithRetry = (componentImport: () => Promise<{ default: React.ComponentType<any> }>) =>
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
const TVModePerformance = lazyWithRetry(() => import('./components/admin/analytics/TVModePerformance'));
const StagingSheet = lazyWithRetry(() => import('./components/sheets/StagingSheet'));
const LoadingSheet = lazyWithRetry(() => import('./components/sheets/LoadingSheet'));

export const router = createBrowserRouter([
    {
        path: '/login',
        element: <LoginPage />,
        errorElement: <ErrorPage />
    },
    {
        path: '/register',
        element: <RegisterPage />,
        errorElement: <ErrorPage />
    },
    {
        path: '/',
        element: (
            <ProtectedRoute>
                <RootLayout />
            </ProtectedRoute>
        ),
        errorElement: <ErrorPage />,
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
                path: 'tv-mode',
                element: (
                    <LazyErrorBoundary>
                        <ProtectedRoute allowedRoles={[Role.SUPER_ADMIN, Role.ADMIN, Role.STAGING_SUPERVISOR, Role.LOADING_SUPERVISOR, Role.SHIFT_LEAD]}>
                            <Suspense fallback={<LoadingFallback />}>
                                <TVModePerformance />
                            </Suspense>
                        </ProtectedRoute>
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
