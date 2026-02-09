import { ShiftUser } from '@/types';
import { cn } from '@/lib/utils';;

interface UserKPIsProps {
    user: ShiftUser;
    userSheetsCount: number;
}

export function UserKPIs({ user, userSheetsCount }: UserKPIsProps) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
                <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-2 group-hover:text-blue-600 transition-colors">
                    Total Sheets
                </div>
                <div className="text-3xl font-black text-slate-800">
                    {userSheetsCount}
                </div>
                <div className="text-xs text-slate-400 mt-1">Assignments</div>
            </div>
            <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
                <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-2 group-hover:text-blue-600 transition-colors">
                    Total Cases
                </div>
                <div className="text-3xl font-black text-slate-800">
                    {user.casesHandled.toLocaleString()}
                </div>
                <div className="text-xs text-slate-400 mt-1">Items Loaded</div>
            </div>
            <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
                <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-2 group-hover:text-blue-600 transition-colors">
                    Avg Speed
                </div>
                <div className="text-3xl font-black text-blue-600">
                    {user.avgTime}
                    <span className="text-base font-normal text-slate-400 ml-1">
                        min
                    </span>
                </div>
                <div className="text-xs text-slate-400 mt-1">per sheet</div>
            </div>
            <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
                <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-2 group-hover:text-blue-600 transition-colors">
                    SLA Score
                </div>
                <div
                    className={cn(
                        'text-3xl font-black',
                        user.slaCompliance >= 90 ? 'text-emerald-600' : 'text-amber-500'
                    )}
                >
                    {user.slaCompliance}%
                </div>
                <div className="text-xs text-slate-400 mt-1">Target: &gt;90%</div>
            </div>
        </div>
    );
}
