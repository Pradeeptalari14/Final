import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'pulse' | 'shimmer';
}

/**
 * Skeleton Loader Component
 * Provides a premium, animated placeholder for loading states.
 */
export function Skeleton({
    className,
    variant = 'pulse',
    ...props
}: SkeletonProps) {
    return (
        <div
            className={cn(
                "rounded-md bg-muted/50",
                variant === 'pulse' && "animate-pulse",
                variant === 'shimmer' && "relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent",
                className
            )}
            {...props}
        />
    );
}

/**
 * Pre-defined Skeleton patterns for common UI layouts
 */
export const SkeletonPatterns = {
    Card: () => (
        <div className="space-y-3 p-4 border rounded-xl bg-card/50">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-20 w-full" />
            <div className="flex justify-between items-center pt-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-24 rounded-full" />
            </div>
        </div>
    ),
    TableRows: ({ rows = 5 }: { rows?: number }) => (
        <div className="space-y-4">
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-grow">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-4/5" />
                    </div>
                    <Skeleton className="h-8 w-16" />
                </div>
            ))}
        </div>
    ),
    SheetHeader: () => (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-6 border-b bg-card/30">
            <div className="space-y-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
            </div>
        </div>
    )
};
