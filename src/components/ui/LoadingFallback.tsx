import { Loader2 } from 'lucide-react';

export function LoadingFallback() {
    return (
        <div className="flex flex-col items-center justify-center h-[50vh] w-full text-slate-400 gap-3 animate-in fade-in duration-500">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm font-medium animate-pulse">Loading module...</p>
        </div>
    );
}
