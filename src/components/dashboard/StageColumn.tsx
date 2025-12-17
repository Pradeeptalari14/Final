import { useNavigate } from 'react-router-dom';
import { SheetData } from '@/types';

interface StageColumnProps {
    title: string;
    color: string;
    items: SheetData[];
    linkTo?: string;
    filters?: any[];
    density?: 'compact' | 'comfortable';
    fullWidth?: boolean;
    hideItems?: boolean;
}

export function StageColumn({ title, color, items, linkTo, filters, density, fullWidth, hideItems }: StageColumnProps) {
    const navigate = useNavigate();
    const isCompact = density === 'compact';

    // Dynamic grid for filters
    const filterGridClass = fullWidth
        ? filters && filters.length === 4 ? 'grid-cols-2 md:grid-cols-4'
            : filters && filters.length === 6 ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6'
                : filters && filters.length === 5 ? 'grid-cols-2 md:grid-cols-5' // Fallback for 5 items
                    : 'grid-cols-2 md:grid-cols-4 lg:grid-cols-5' // Default
        : 'grid-cols-2';

    return (
        <div className={`rounded-lg border ${color} ${isCompact ? 'p-2' : 'p-3'} flex flex-col gap-2 transition-colors h-full relative group hover:bg-slate-50 dark:hover:bg-white/[0.02]`}>
            <div className={`flex items-center justify-between border-b border-slate-200 dark:border-white/5 ${isCompact ? 'pb-1' : 'pb-2'}`}>
                <h3 className="text-xs font-bold uppercase tracking-wider opacity-70">{title}</h3>
                {items.length > 0 && !hideItems && <span className="text-xs font-mono opacity-50">{items.length}</span>}
            </div>

            {filters && filters.length > 0 && (
                <div className={`grid ${filterGridClass} ${isCompact ? 'gap-1' : 'gap-2'}`}>
                    {filters.map((f, i) => {
                        // Make the first item span 2 columns (Header)
                        const isMainHeader = !fullWidth && i === 0;
                        // Make the last item span 2 columns if it's an orphan (to fill gap)
                        const isLastOddItem = !fullWidth && i === filters.length - 1 && (filters.length - 1) % 2 !== 0;

                        return (
                            <button
                                key={i}
                                onClick={(e) => { e.stopPropagation(); navigate(f.link); }}
                                className={`
                                flex ${isMainHeader ? 'flex-row items-center justify-start gap-3 pl-3' : 'flex-col items-center justify-center'} 
                                ${isCompact ? 'p-1' : 'p-2'} rounded 
                                transition-all hover:scale-[1.02] active:scale-[0.98] 
                                border border-white/5 shadow-sm
                                ${f.color} 
                                ${fullWidth ? 'min-h-[50px]' : ''}
                                ${isMainHeader ? 'col-span-2 min-h-[40px]' : ''}
                                ${isLastOddItem ? 'col-span-2' : ''}
                            `}
                            >
                                <div className={isMainHeader ? "text-left pl-3" : "text-center"}>
                                    <span className={`font-bold leading-none block ${fullWidth || isMainHeader ? 'text-base' : 'text-sm'}`}>{f.count}</span>
                                    <span className={`text-[9px] opacity-80 uppercase leading-none mt-1 block ${isMainHeader ? 'text-left' : 'text-center'}`}>{f.label}</span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Click overlap handler for entire card if linkTo is present but not clicking a filter */}
            {linkTo && (
                <div
                    className="absolute inset-0 z-0 cursor-pointer"
                    onClick={() => navigate(linkTo)}
                    title={`Go to ${title}`}
                />
            )}

            {/* Ensure buttons stay above the card link */}
            <style>{`
                button { position: relative; z-index: 10; }
            `}</style>
        </div>
    );
}
