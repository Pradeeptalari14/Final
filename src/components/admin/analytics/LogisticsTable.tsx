import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Truck, MapPin, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SheetStatus } from '@/types';

export interface LogisticsEntry {
    id: string;
    date: string;
    vehicleNo: string;
    destination: string;
    status: string;
    totalQty: number;
    loadedQty: number;
    supervisor?: string;
}

interface LogisticsTableProps {
    title: string;
    entries: LogisticsEntry[];
    emptyMessage?: string;
    color?: 'blue' | 'emerald' | 'amber' | 'slate';
    density?: 'compact' | 'comfortable';
}

const PAGE_SIZE = 10;

export function LogisticsTable({ title, entries, emptyMessage = 'No vehicles found.', color = 'blue', density }: LogisticsTableProps) {
    const isCompact = density === 'compact';
    const [currentPage, setCurrentPage] = useState(1);

    const totalPages = Math.ceil(entries.length / PAGE_SIZE);
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const currentData = entries.slice(startIndex, startIndex + PAGE_SIZE);

    const handlePrev = () => setCurrentPage(p => Math.max(1, p - 1));
    const handleNext = () => setCurrentPage(p => Math.min(totalPages, p + 1));

    const getColorClass = (c: string) => {
        switch (c) {
            case 'emerald': return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800';
            case 'amber': return 'text-amber-600 bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800';
            case 'slate': return 'text-slate-600 bg-slate-50 dark:bg-slate-900/20 border-slate-100 dark:border-slate-800';
            default: return 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800';
        }
    };

    return (
        <div className="w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-3">
                    <div className={cn(isCompact ? "p-1.5 rounded-md" : "p-2 rounded-lg", getColorClass(color))}>
                        <Truck size={isCompact ? 14 : 18} />
                    </div>
                    <div>
                        <h3 className={`${isCompact ? 'text-[10px]' : 'text-sm'} font-black uppercase tracking-wider text-slate-700 dark:text-slate-200`}>
                            {title}
                        </h3>
                        {!isCompact && (
                            <p className="text-[10px] font-bold text-slate-400">
                                {entries.length} Vehicles Listed
                            </p>
                        )}
                    </div>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePrev}
                            disabled={currentPage === 1}
                            className="h-7 w-7 p-0 rounded-full"
                        >
                            <ChevronLeft size={14} />
                        </Button>
                        <span className="text-[10px] font-bold text-slate-500">
                            {currentPage} / {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleNext}
                            disabled={currentPage === totalPages}
                            className="h-7 w-7 p-0 rounded-full"
                        >
                            <ChevronRight size={14} />
                        </Button>
                    </div>
                )}
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                    <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30">
                            <th className="py-3 pl-6 font-bold text-slate-400 uppercase text-[10px]">Date/Time</th>
                            <th className="py-3 font-bold text-slate-400 uppercase text-[10px]">Vehicle No</th>
                            <th className="py-3 font-bold text-slate-400 uppercase text-[10px]">Destination</th>
                            <th className="py-3 font-bold text-slate-400 uppercase text-[10px] text-center">Load (Cases)</th>
                            <th className="py-3 font-bold text-slate-400 uppercase text-[10px] text-center">Progress</th>
                            <th className="py-3 pr-6 font-bold text-slate-400 uppercase text-[10px] text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                        {currentData.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="py-8 text-center text-slate-400 italic font-medium">
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            currentData.map((row) => (
                                <tr key={row.id} className="group hover:bg-indigo-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className={`${isCompact ? 'py-1.5' : 'py-3'} pl-6`}>
                                        <div className="flex flex-col">
                                            <span className={`font-bold text-slate-700 dark:text-slate-200 ${isCompact ? 'text-[10px]' : ''}`}>
                                                {new Date(row.date).toLocaleDateString()}
                                            </span>
                                            <span className={`${isCompact ? 'text-[8px]' : 'text-[10px]'} text-slate-400 flex items-center gap-1`}>
                                                <Clock size={isCompact ? 8 : 10} />
                                                {new Date(row.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </td>
                                    <td className={`${isCompact ? 'py-1.5 text-[10px]' : 'py-3'} font-mono font-bold text-indigo-600 dark:text-indigo-400`}>
                                        {row.vehicleNo || 'N/A'}
                                    </td>
                                    <td className={`${isCompact ? 'py-1.5 text-[10px]' : 'py-3'}`}>
                                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium truncate max-w-[120px]">
                                            <MapPin size={isCompact ? 10 : 12} className="text-slate-400" />
                                            {row.destination}
                                        </div>
                                    </td>
                                    <td className={`${isCompact ? 'py-1.5 text-[10px]' : 'py-3'} text-center`}>
                                        <div className="flex flex-col items-center">
                                            <span className="font-bold text-slate-700 dark:text-slate-200">
                                                {row.loadedQty}
                                            </span>
                                            {!isCompact && (
                                                <span className="text-[9px] text-slate-400">
                                                    / {row.totalQty} (Target)
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className={`${isCompact ? 'py-1.5' : 'py-3'}`}>
                                        <div className={`${isCompact ? 'w-16' : 'w-24'} mx-auto bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden`}>
                                            <div
                                                className={cn("h-full rounded-full transition-all duration-500",
                                                    row.loadedQty >= row.totalQty ? "bg-emerald-500" : "bg-indigo-500"
                                                )}
                                                style={{ width: `${Math.min(100, (row.loadedQty / (row.totalQty || 1)) * 100)}%` }}
                                            />
                                        </div>
                                    </td>
                                    <td className={`${isCompact ? 'py-1.5' : 'py-3'} pr-6 text-right`}>
                                        <Badge variant="outline" className={cn(
                                            isCompact ? "px-1 py-0 text-[7px]" : "font-bold uppercase tracking-wider text-[9px]",
                                            (row.status === SheetStatus.COMPLETED) ? "border-emerald-200 bg-emerald-50 text-emerald-700" :
                                                (row.status === SheetStatus.LOCKED || row.status === SheetStatus.LOADING_VERIFICATION_PENDING) ? "border-amber-200 bg-amber-50 text-amber-700" :
                                                    "border-slate-200 bg-slate-50 text-slate-500"
                                        )}>
                                            {row.status.replace(/_/g, ' ')}
                                        </Badge>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
