import { useRouteError, isRouteErrorResponse, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

export default function ErrorPage() {
    const error = useRouteError();
    const navigate = useNavigate();

    let errorMessage: string;
    let errorTitle: string;

    if (isRouteErrorResponse(error)) {
        // Handle standard HTTP errors (404, 401, 503, etc.)
        errorTitle = `${error.status} ${error.statusText}`;
        errorMessage = error.data?.message || 'The page you requested could not be found.';
    } else if (error instanceof Error) {
        // Handle unexpected application errors
        errorTitle = 'Unexpected Application Error';
        errorMessage = error.message;
    } else if (typeof error === 'string') {
        errorTitle = 'Application Error';
        errorMessage = error;
    } else {
        errorTitle = 'Unknown Error';
        errorMessage = 'An unrecoverable error has occurred.';
        console.error(error);
    }

    return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white p-4">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="w-24 h-24 bg-rose-100 dark:bg-rose-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertTriangle size={48} className="text-rose-500" />
                </div>

                <div className="space-y-2">
                    <h1 className="text-3xl font-black uppercase tracking-tight">{errorTitle}</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">
                        {errorMessage}
                    </p>
                </div>

                <div className="flex flex-col gap-3 pt-6">
                    <Button onClick={() => window.location.reload()} variant="outline" className="w-full gap-2 py-6">
                        <RefreshCw size={18} />
                        Reload Page
                    </Button>
                    <Button onClick={() => navigate('/')} className="w-full gap-2 py-6 bg-indigo-600 hover:bg-indigo-500 text-white">
                        <Home size={18} />
                        Return to Dashboard
                    </Button>
                </div>
            </div>
        </div>
    );
}
