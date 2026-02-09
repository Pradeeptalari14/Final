import { SecurityLog } from '@/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';;

interface UserActivityLogProps {
    logs: SecurityLog[];
}

export function UserActivityLog({ logs }: UserActivityLogProps) {
    if (logs.length === 0) return (
        <div className="py-8 text-center text-slate-500 text-sm">
            No recent activity.
        </div>
    );

    return (
        <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
            {logs.map((log) => (
                <div
                    key={log.id}
                    className="flex gap-4 items-start group border-b border-transparent hover:border-slate-100 last:border-0 pb-3 last:pb-0 transition-colors px-2 rounded-lg"
                >
                    <div className="mt-1">
                        <div
                            className={cn(
                                'h-2 w-2 rounded-full',
                                log.severity === 'HIGH' || log.severity === 'CRITICAL'
                                    ? 'bg-red-500'
                                    : log.severity === 'MEDIUM'
                                        ? 'bg-amber-500'
                                        : 'bg-emerald-500'
                            )}
                        />
                    </div>
                    <div className="flex-1">
                        <div className="text-sm text-slate-800 font-medium">
                            {log.action.replace(/_/g, ' ')}
                            <span className="text-xs text-slate-400 font-normal ml-2">
                                {format(new Date(log.timestamp), 'MMM d, HH:mm:ss')}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                            {log.details}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}
