import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    errorType: 'chunk' | 'other' | null;
}

export class LazyErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        errorType: null
    };

    public static getDerivedStateFromError(error: Error): State {
        // Check if it's a dynamic import failure
        const isChunkError = error.name === 'ChunkLoadError' ||
            error.message.includes('Failed to fetch dynamically imported module') ||
            error.message.includes('Loading chunk');

        return {
            hasError: true,
            errorType: isChunkError ? 'chunk' : 'other'
        };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Lazy loading error caught:', error, errorInfo);
    }

    private handleRefresh = () => {
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            if (this.state.errorType === 'chunk') {
                return (
                    <div className="flex flex-col items-center justify-center p-8 min-h-[400px] text-center space-y-4">
                        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-full">
                            <RefreshCcw className="w-10 h-10 text-amber-600 animate-spin-once" />
                        </div>
                        <h2 className="text-xl font-semibold">New Version Available</h2>
                        <p className="text-muted-foreground max-w-md mx-auto">
                            A newer version of the application is available. Please refresh the page to continue.
                        </p>
                        <Button onClick={this.handleRefresh} className="gap-2">
                            <RefreshCcw size={16} />
                            Refresh Application
                        </Button>
                    </div>
                );
            }

            return (
                <div className="flex flex-col items-center justify-center p-8 min-h-[400px] text-center space-y-4">
                    <div className="p-4 bg-destructive/10 rounded-full">
                        <AlertCircle className="w-10 h-10 text-destructive" />
                    </div>
                    <h2 className="text-xl font-semibold">Something went wrong</h2>
                    <p className="text-muted-foreground">
                        An error occurred while loading this section.
                    </p>
                    <Button onClick={this.handleRefresh} variant="outline">
                        Try Again
                    </Button>
                </div>
            );
        }

        return this.props.children;
    }
}
