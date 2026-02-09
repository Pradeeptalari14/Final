import { Layers, Package, CheckCircle, LayoutGrid, List, Search, Calendar, Clock } from 'lucide-react';
import { t } from '@/lib/i18n';
import { useAppState } from '@/contexts/AppStateContext';

interface DatabaseFiltersProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    stageFilter: 'ALL' | 'STAGING' | 'LOADING' | 'COMPLETED';
    setStageFilter: (filter: 'ALL' | 'STAGING' | 'LOADING' | 'COMPLETED') => void;
    timeFilter: 'ALL' | '30D' | '90D' | 'CUSTOM';
    setTimeFilter: (filter: 'ALL' | '30D' | '90D' | 'CUSTOM') => void;
    startDate: string;
    setStartDate: (date: string) => void;
    endDate: string;
    setEndDate: (date: string) => void;
    viewMode: 'list' | 'board';
    setViewMode: (mode: 'list' | 'board') => void;
}

export function DatabaseFilters({
    searchQuery,
    setSearchQuery,
    stageFilter,
    setStageFilter,
    timeFilter,
    setTimeFilter,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    viewMode,
    setViewMode
}: DatabaseFiltersProps) {
    const { settings } = useAppState();

    return (
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
            <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Layers className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="text-2xl font-extrabold tracking-tight text-foreground">
                        {t('full_database', settings.language)}
                    </h3>
                </div>
                <p className="text-sm text-muted-foreground/80 font-medium">
                    {t('database_desc', settings.language)}
                </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
                {/* Time Filtering Toggle */}
                <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200/50 dark:border-white/5 shadow-inner">
                    {(['ALL', '30D', '90D', 'CUSTOM'] as const).map((range) => (
                        <button
                            key={range}
                            onClick={() => setTimeFilter(range)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] uppercase font-extrabold transition-all ${timeFilter === range ? 'bg-white dark:bg-slate-700 text-primary shadow-sm ring-1 ring-slate-200 dark:ring-white/10' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                        >
                            {range === 'ALL'
                                ? 'All Time'
                                : range === '30D'
                                    ? '30 Days'
                                    : range === '90D'
                                        ? '3 Months'
                                        : 'Custom'}
                        </button>
                    ))}
                </div>

                {/* Custom DateTime Inputs */}
                {timeFilter === 'CUSTOM' && (
                    <div className="flex items-center gap-1 animate-in slide-in-from-right-2 duration-300">
                        <div className="flex items-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden group focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                            <div className="flex items-center gap-2 px-3 py-1.5 border-r border-slate-100 dark:border-white/5">
                                <Calendar className="w-4 h-4 text-primary" />
                                <div className="flex flex-col">
                                    <span className="text-[9px] uppercase font-extrabold text-slate-400 leading-tight">
                                        Start Time
                                    </span>
                                    <input
                                        type="datetime-local"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="bg-transparent text-[12px] font-bold outline-none w-[160px] cursor-pointer"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-3 px-4 py-2">
                                <Clock className="w-4 h-4 text-primary" />
                                <div className="flex flex-col">
                                    <span className="text-[9px] uppercase font-extrabold text-slate-400 leading-tight">
                                        End Time
                                    </span>
                                    <input
                                        type="datetime-local"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="bg-transparent text-[12px] font-bold outline-none w-[160px] cursor-pointer"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modern Stage Filters */}
                <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-xl border border-slate-200/50 dark:border-white/5 shadow-inner">
                    <FilterButton
                        active={stageFilter === 'ALL'}
                        onClick={() => setStageFilter('ALL')}
                        icon={<LayoutGrid size={14} />}
                        label={t('all', settings.language)}
                    />
                    <FilterButton
                        active={stageFilter === 'STAGING'}
                        onClick={() => setStageFilter('STAGING')}
                        icon={<Layers size={14} />}
                        label={t('staging', settings.language)}
                    />
                    <FilterButton
                        active={stageFilter === 'LOADING'}
                        onClick={() => setStageFilter('LOADING')}
                        icon={<Package size={14} />}
                        label={t('loading', settings.language)}
                    />
                    <FilterButton
                        active={stageFilter === 'COMPLETED'}
                        onClick={() => setStageFilter('COMPLETED')}
                        icon={<CheckCircle size={14} />}
                        label={t('completed', settings.language)}
                    />
                </div>

                {/* View Toggle */}
                <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-xl border border-slate-200/50 dark:border-white/5 shadow-inner ml-2">
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow text-primary' : 'text-slate-400 hover:text-slate-600'}`}
                        title="List View"
                    >
                        <List size={16} />
                    </button>
                    <button
                        onClick={() => setViewMode('board')}
                        className={`p-2 rounded-lg transition-all ${viewMode === 'board' ? 'bg-white shadow text-primary' : 'text-slate-400 hover:text-slate-600'}`}
                        title="Board View"
                    >
                        <LayoutGrid size={16} />
                    </button>
                </div>

                <div className="relative group flex-grow md:flex-grow-0">
                    <Search
                        size={16}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors"
                    />
                    <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-xl pl-11 pr-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary focus:outline-none w-full md:w-64 transition-all shadow-sm"
                        placeholder={t('search_placeholder', settings.language)}
                    />
                </div>
            </div>
        </div>
    );
}

function FilterButton({
    active,
    onClick,
    icon,
    label
}: {
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
}) {
    return (
        <button
            onClick={onClick}
            className={`
                flex items-center gap-2 px-5 py-2 text-[12px] font-extrabold uppercase tracking-wider rounded-lg transition-all 
                ${active
                    ? 'bg-white dark:bg-slate-700 shadow-sm text-primary ring-1 ring-slate-200 dark:ring-white/10 scale-[1.02]'
                    : 'text-muted-foreground hover:text-foreground hover:bg-slate-200/50 dark:hover:bg-white/5'
                }
            `}
        >
            {icon}
            {label}
        </button>
    );
}
