import { SheetData, SheetStatus } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Package, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface UserHistoryTableProps {
    userSheets: SheetData[];
}

export function UserHistoryTable({ userSheets }: UserHistoryTableProps) {
    if (userSheets.length === 0) return (
        <div className="py-8 text-center text-slate-500 text-sm">
            No sheet history available for this user.
        </div>
    );

    return (
        <div className="max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
            <div className="space-y-3">
                {userSheets.map((sheet) => (
                    <div
                        key={sheet.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-colors group"
                    >
                        <div className="flex items-center gap-3">
                            <div
                                className={`p-2 rounded-lg ${sheet.status === SheetStatus.COMPLETED
                                    ? 'bg-emerald-50 text-emerald-600'
                                    : 'bg-blue-50 text-blue-600'
                                    }`}
                            >
                                <Package size={16} />
                            </div>
                            <div>
                                <div className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                    Sheet #{sheet.id.slice(-6)}
                                    <Badge
                                        variant="outline"
                                        className="text-[10px] h-5 px-1.5 font-normal"
                                    >
                                        {format(new Date(sheet.createdAt), 'MMM d, HH:mm')}
                                    </Badge>
                                </div>
                                <div className="text-xs text-slate-500 mt-0.5 flex gap-3">
                                    <span className="flex items-center gap-1">
                                        <Clock size={10} />
                                        {sheet.loadingStartTime
                                            ? `${sheet.loadingStartTime.slice(0, 5)} - ${sheet.loadingEndTime?.slice(0, 5) || '...'}`
                                            : 'Not started'}
                                    </span>
                                    <span>•</span>
                                    <span>
                                        {
                                            (sheet.loadingItems || []).reduce(
                                                (acc, i) => acc + i.total,
                                                0
                                            )
                                        }{' '}
                                        cases
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <Badge
                                className={`${sheet.status === SheetStatus.COMPLETED
                                    ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                    : 'bg-blue-100 text-blue-700 border-blue-200'
                                    }`}
                            >
                                {sheet.status.replace(/_/g, ' ')}
                            </Badge>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
