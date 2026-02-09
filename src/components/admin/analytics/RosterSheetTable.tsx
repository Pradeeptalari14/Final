import { useState, useMemo } from 'react';
import { Calendar, Search, MessageSquare, Phone, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RosterEntry } from './RosterUploader';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const PAGE_SIZE = 1000; // Show entire month/list by default

interface RosterSheetTableProps {
    entries: RosterEntry[];
    headers?: string[];
    density?: 'compact' | 'comfortable';
    title?: string;
    onChatClick?: (name: string) => void;
}

export function RosterSheetTable({ entries, headers = [], density, title, onChatClick }: RosterSheetTableProps) {
    const isCompact = density === 'compact';

    // -- 1. Date (Column Highlight) --
    const [highlightCol, setHighlightCol] = useState<string>("none");

    // -- 2. Staff (Row Search/Filter) --
    const [searchQuery, setSearchQuery] = useState("");

    // -- 3. Shift (Value Highlight) --
    const [highlightShift, setHighlightShift] = useState<string>("none");

    // Dynamic headers or defaults
    const displayHeaders = headers.length > 0 ? headers : ['Date', 'Shift', 'Staff Name', 'Role'];
    const isMatrix = displayHeaders.length > 8;

    // Filter Logic
    const filteredEntries = useMemo(() => {
        if (!searchQuery) return entries;
        const lowerQ = searchQuery.toLowerCase();
        return entries.filter(row => {
            return Object.values(row).some(val =>
                String(val).toLowerCase().includes(lowerQ)
            );
        });
    }, [entries, searchQuery]);

    // Unique Shift Values (for dropdown)
    const uniqueShifts = useMemo(() => {
        const set = new Set<string>();
        filteredEntries.slice(0, 100).forEach(row => {
            Object.values(row).forEach(val => {
                const s = String(val).trim();
                // Heuristic: short strings likley codes
                if (s && s.length <= 4 && isNaN(Number(s))) {
                    set.add(s);
                }
            });
        });
        return Array.from(set).sort();
    }, [filteredEntries]);

    // Show all up to PAGE_SIZE
    const currentData = filteredEntries.slice(0, PAGE_SIZE);
    const startIndex = 0;

    // Helper to extract initials
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div className="w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm flex flex-col h-full max-h-[800px]">
            {/* Toolbar */}
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-row items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50 shrink-0 overflow-x-auto custom-scrollbar">

                {/* Left: Title & Context */}
                <div className="flex items-center gap-3 shrink-0">
                    <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800 text-orange-600">
                        <Calendar size={18} />
                    </div>
                    {title && (
                        <div className="hidden sm:block">
                            <h3 className="text-sm font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 whitespace-nowrap">
                                {title}
                            </h3>
                            <p className="text-[10px] font-bold text-slate-400 whitespace-nowrap">
                                {filteredEntries.length} Records
                            </p>
                        </div>
                    )}
                </div>

                {/* Right: The "Three Wise" Controls */}
                <div className="flex flex-row items-center gap-2 shrink-0">

                    {/* 1. Date Highlight (Column) */}
                    <div className="flex items-center group bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 shadow-sm focus-within:ring-2 focus-within:ring-orange-500/20">
                        <span className="text-[10px] font-bold uppercase text-slate-400 mr-2 group-focus-within:text-orange-500 whitespace-nowrap hidden md:inline">Date:</span>
                        <select
                            className="h-7 text-xs bg-transparent font-medium outline-none w-24 text-slate-700 dark:text-slate-200 cursor-pointer"
                            value={highlightCol}
                            onChange={(e) => setHighlightCol(e.target.value)}
                        >
                            <option value="none">- Select -</option>
                            {displayHeaders.map(h => (
                                <option key={h} value={h}>{h}</option>
                            ))}
                        </select>
                    </div>

                    {/* 2. Shift Highlight (Cell Value) */}
                    <div className="flex items-center group bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 shadow-sm focus-within:ring-2 focus-within:ring-blue-500/20">
                        <span className="text-[10px] font-bold uppercase text-slate-400 mr-2 group-focus-within:text-blue-500 whitespace-nowrap hidden md:inline">Shift:</span>
                        <select
                            className="h-7 text-xs bg-transparent font-medium outline-none w-20 text-slate-700 dark:text-slate-200 cursor-pointer"
                            value={highlightShift}
                            onChange={(e) => setHighlightShift(e.target.value)}
                        >
                            <option value="none">- All -</option>
                            {uniqueShifts.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>

                    {/* 3. Employee Filter (Row Search) */}
                    <div className="flex items-center group bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 shadow-sm focus-within:ring-2 focus-within:ring-green-500/20 w-32 lg:w-48 transition-all">
                        <Search size={12} className="text-slate-400 mr-2 group-focus-within:text-green-500 shrink-0" />
                        <input
                            type="text"
                            placeholder="Find Employee..."
                            className="h-7 text-xs bg-transparent font-medium outline-none w-full text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                </div>
            </div>

            {/* Spreadsheet Table */}
            <div className="overflow-auto custom-scrollbar flex-1 relative">
                <table className="w-full text-left text-xs border-collapse relative">
                    <thead className="sticky top-0 z-40 shadow-sm">
                        <tr className="bg-slate-100 dark:bg-slate-800">
                            {/* Fixed Index Column */}
                            <th className={cn(
                                "border-r border-b border-slate-200 dark:border-slate-700 text-slate-400 font-bold uppercase text-center sticky top-0 left-0 bg-slate-100 dark:bg-slate-800 z-50",
                                isMatrix ? "w-8 px-1 py-2 text-[10px]" : "w-12 px-4 py-3"
                            )}>#</th>

                            {/* Dynamic Headers */}
                            {displayHeaders.map((header, i) => {
                                const isNameCol = header.toLowerCase().includes('name') || header.toLowerCase().includes('staff') || header.toLowerCase().includes('employee');
                                return (
                                    <th key={i} className={cn(
                                        "font-bold uppercase text-slate-500 border-r border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-slate-100 dark:bg-slate-800 whitespace-nowrap z-20 transition-colors duration-200",
                                        isMatrix ? "px-2 py-2 text-[10px] text-center min-w-[40px]" : "px-4 py-3",
                                        highlightCol === header && "bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-200 border-b-orange-300",
                                        // Sticky logic for Name column
                                        isNameCol && (isMatrix ? "sticky left-8 z-40 border-r-2 border-r-slate-300 dark:border-r-slate-600 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]" : "sticky left-12 z-40 border-r-2 border-r-slate-300 dark:border-r-slate-600 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]")
                                    )}>
                                        {header}
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {currentData.length === 0 ? (
                            <tr>
                                <td colSpan={displayHeaders.length + 1} className="px-4 py-8 text-center text-slate-400 italic">
                                    No roster data available. Upload an Excel sheet to begin.
                                </td>
                            </tr>
                        ) : (
                            currentData.map((row, i) => (
                                <tr key={i} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors relative">
                                    {/* Index Cell */}
                                    <td className={cn(
                                        "text-center border-r border-slate-100 dark:border-slate-800 font-mono text-slate-400 font-bold sticky left-0 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/50 z-30",
                                        isMatrix ? "px-1 py-1 text-[9px] w-8" : "px-2 py-3 text-[10px] w-12"
                                    )}>
                                        {startIndex + i + 1}
                                    </td>

                                    {/* Dynamic Data Cells */}
                                    {displayHeaders.map((header, j) => {
                                        let value = row[header];
                                        // Legacy Fallback
                                        if (header === 'Date' && !value) value = row.date;
                                        if (header === 'Shift' && !value) value = row.shift;
                                        if (header === 'Staff Name' && !value) value = row.staffName;
                                        if (header === 'Role' && !value) value = row.role;

                                        const valStr = String(value || "");
                                        const isColHighlighted = highlightCol === header;
                                        const isShiftHighlighted = highlightShift !== 'none' && valStr.trim() === highlightShift;
                                        const isNameCol = header.toLowerCase().includes('name') || header.toLowerCase().includes('staff') || header.toLowerCase().includes('employee');

                                        // Render Cell Content
                                        // If Name Column, wrap in Popover for "Teams-like" Profile Card
                                        const cellContent = (
                                            <span className="block truncate">
                                                {String(value || '-')}
                                            </span>
                                        );

                                        return (
                                            <td key={j} className={cn(
                                                "border-r border-slate-100 dark:border-slate-800 font-medium whitespace-nowrap transition-colors duration-200",
                                                isCompact ? "py-1" : "py-3",
                                                isMatrix ? "px-2 text-center text-[10px]" : "px-4",
                                                isColHighlighted && !isShiftHighlighted && "bg-orange-50 dark:bg-orange-900/20 text-slate-900 dark:text-white border-x-orange-200 dark:border-x-orange-800",
                                                isShiftHighlighted && "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-200 font-bold",
                                                !isColHighlighted && !isShiftHighlighted && "text-slate-700 dark:text-slate-300",
                                                isNameCol && "sticky z-20 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800/50 border-r-2 border-r-slate-300 dark:border-r-slate-600 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] text-left px-3 text-slate-900 dark:text-slate-100 font-bold cursor-pointer hover:text-blue-600 hover:underline decoration-blue-400 underline-offset-2",
                                                isNameCol && (isMatrix ? "left-8" : "left-12")
                                            )}>
                                                {isNameCol ? (
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <div className="w-full h-full flex items-center">{cellContent}</div>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-80 p-0 overflow-hidden rounded-xl border-slate-200 shadow-xl" align="start">
                                                            <div className="bg-slate-50 dark:bg-slate-900 p-6 border-b border-slate-200 dark:border-slate-800 text-center relative">
                                                                <div className="w-20 h-20 mx-auto bg-white dark:bg-slate-800 rounded-full border-4 border-white dark:border-slate-700 shadow-sm flex items-center justify-center text-2xl font-black text-slate-300 mb-3">
                                                                    {getInitials(valStr)}
                                                                </div>
                                                                <div className="absolute top-4 right-4 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-800" title="Available"></div>
                                                                <h4 className="text-lg font-bold text-slate-800 dark:text-white">{valStr}</h4>
                                                                <p className="text-xs font-medium text-slate-500 uppercase tracking-widest mt-1">Operations Staff</p>
                                                            </div>
                                                            <div className="p-4 grid grid-cols-3 gap-2 bg-white dark:bg-slate-950">
                                                                <Button variant="outline" className="flex flex-col items-center gap-1 h-auto py-3 border-slate-100 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-100 transition-all group"
                                                                    onClick={() => onChatClick?.(valStr)}
                                                                >
                                                                    <MessageSquare size={18} className="text-slate-400 group-hover:text-blue-500 mb-1" />
                                                                    <span className="text-[10px] uppercase font-bold text-slate-400 group-hover:text-blue-600">Chat</span>
                                                                </Button>
                                                                <Button variant="outline" className="flex flex-col items-center gap-1 h-auto py-3 border-slate-100 hover:bg-slate-50 hover:text-green-600 hover:border-green-100 transition-all group">
                                                                    <Phone size={18} className="text-slate-400 group-hover:text-green-500 mb-1" />
                                                                    <span className="text-[10px] uppercase font-bold text-slate-400 group-hover:text-green-600">Call</span>
                                                                </Button>
                                                                <Button variant="outline" className="flex flex-col items-center gap-1 h-auto py-3 border-slate-100 hover:bg-slate-50 hover:text-orange-600 hover:border-orange-100 transition-all group">
                                                                    <Mail size={18} className="text-slate-400 group-hover:text-orange-500 mb-1" />
                                                                    <span className="text-[10px] uppercase font-bold text-slate-400 group-hover:text-orange-600">Email</span>
                                                                </Button>
                                                            </div>
                                                            <div className="bg-slate-50 dark:bg-slate-900 px-4 py-2 text-[10px] text-center text-slate-400 border-t border-slate-100 dark:border-slate-800 font-medium">
                                                                Unicharm Operations &bull; Staff Profile
                                                            </div>
                                                        </PopoverContent>
                                                    </Popover>
                                                ) : (
                                                    cellContent
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="px-6 py-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-400 text-center uppercase tracking-widest font-bold flex justify-between">
                <span>{isMatrix ? 'Matrix View' : 'Sheet Mode'}</span>
                <span className="flex gap-4">
                    {highlightCol !== 'none' && <span className="text-orange-600">Col: {highlightCol}</span>}
                    {highlightShift !== 'none' && <span className="text-blue-600">Shift: {highlightShift}</span>}
                    {searchQuery && <span className="text-green-600">Find: &quot;{searchQuery}&quot;</span>}
                </span>
            </div>
        </div>
    );
}
