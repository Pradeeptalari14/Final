import { useState, useMemo } from 'react';
import { SheetData, SheetStatus } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Search,
    Calendar,
    RefreshCw,
    X,
    User,
    Layers,
    ArrowRight,
    Clock,
    Truck,
    MapPin,
    AlertCircle,
    ChevronRight,
    TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppState } from '@/contexts/AppStateContext';
import { t } from '@/lib/i18n';
import { useNavigate } from 'react-router-dom';

interface OperationsMonitorProps {
    sheets: SheetData[];
    onRefresh: () => Promise<void>;
}

export function OperationsMonitor({ sheets, onRefresh }: OperationsMonitorProps) {
    const navigate = useNavigate();
    const { settings } = useAppState();
    const [searchQuery, setSearchQuery] = useState('');
    const [supervisorFilter, setSupervisorFilter] = useState('ALL');
    const [shiftFilter, setShiftFilter] = useState('ALL');
    const [timeFilter, setTimeFilter] = useState<'ALL' | '30D' | '90D' | 'CUSTOM'>('ALL');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await onRefresh();
        setIsRefreshing(false);
    };

    // --- Computed Values ---
    const supervisors = useMemo(() => {
        const s = new Set<string>();
        sheets.forEach((sheet) => {
            if (sheet.supervisorName) s.add(sheet.supervisorName);
        });
        return Array.from(s).sort();
    }, [sheets]);

    const shifts = useMemo(() => {
        const s = new Set<string>();
        sheets.forEach((sheet) => {
            if (sheet.shift) s.add(sheet.shift);
        });
        return Array.from(s).sort();
    }, [sheets]);

    const filteredSheets = useMemo(() => {
        return sheets
            .filter((sheet) => {
                // 0. Time Filtering
                if (timeFilter !== 'ALL') {
                    const sheetTime = new Date(sheet.createdAt).getTime();
                    if (timeFilter === 'CUSTOM') {
                        if (startDate && sheetTime < new Date(startDate).getTime()) return false;
                        if (endDate && sheetTime > new Date(endDate).getTime()) return false;
                    } else {
                        const now = new Date();
                        const days = timeFilter === '30D' ? 30 : 90;
                        const threshold = new Date(now.setDate(now.getDate() - days)).getTime();
                        if (sheetTime < threshold) return false;
                    }
                }

                // Fallback: don't show completed sheets unless filtered by time
                if (sheet.status === SheetStatus.COMPLETED && timeFilter === 'ALL') return false;

                const matchesSearch =
                    searchQuery === '' ||
                    sheet.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (sheet.vehicleNo &&
                        sheet.vehicleNo.toLowerCase().includes(searchQuery.toLowerCase())) ||
                    (sheet.destination &&
                        sheet.destination.toLowerCase().includes(searchQuery.toLowerCase()));

                const matchesSupervisor =
                    supervisorFilter === 'ALL' || sheet.supervisorName === supervisorFilter;
                const matchesShift = shiftFilter === 'ALL' || sheet.shift === shiftFilter;

                return matchesSearch && matchesSupervisor && matchesShift;
            })
            .sort(
                (a, b) =>
                    new Date(b.updatedAt || b.createdAt).getTime() -
                    new Date(a.updatedAt || a.createdAt).getTime()
            );
    }, [sheets, searchQuery, supervisorFilter, shiftFilter, timeFilter, startDate, endDate]);

    const stats = useMemo(() => {
        const active = filteredSheets.filter((s) => s.status !== SheetStatus.COMPLETED);
        return {
            total: active.length,
            staging: active.filter(
                (s) =>
                    s.status === SheetStatus.DRAFT ||
                    s.status === SheetStatus.STAGING_VERIFICATION_PENDING
            ).length,
            audit: active.filter((s) => s.status === SheetStatus.LOCKED).length,
            loading: active.filter((s) => s.status === SheetStatus.LOADING_VERIFICATION_PENDING)
                .length
        };
    }, [filteredSheets]);

    // --- Helper Components ---
    const ProgressStepper = ({ status }: { status: SheetStatus }) => {
        const stages = [
            {
                id: 'STAGING',
                label: t('staging', settings.language),
                active: [
                    SheetStatus.DRAFT,
                    SheetStatus.STAGING_VERIFICATION_PENDING,
                    SheetStatus.LOCKED,
                    SheetStatus.LOADING_VERIFICATION_PENDING,
                    SheetStatus.COMPLETED
                ].includes(status)
            },
            {
                id: 'AUDIT',
                label: 'Audit',
                active: [
                    SheetStatus.LOCKED,
                    SheetStatus.LOADING_VERIFICATION_PENDING,
                    SheetStatus.COMPLETED
                ].includes(status)
            },
            {
                id: 'LOADING',
                label: t('loading', settings.language),
                active: [SheetStatus.LOADING_VERIFICATION_PENDING, SheetStatus.COMPLETED].includes(
                    status
                )
            },
            {
                id: 'DONE',
                label: t('completed', settings.language),
                active: status === SheetStatus.COMPLETED
            }
        ];

        return (
            <div className="flex items-center gap-1 w-full max-w-xs">
                {stages.map((stage, i) => (
                    <div key={stage.id} className="flex items-center flex-1 last:flex-none">
                        <div
                            className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${stage.active ? 'bg-primary' : 'bg-muted'}`}
                        />
                        {i < stages.length - 1 && (
                            <ChevronRight
                                size={10}
                                className={stages[i + 1].active ? 'text-primary' : 'text-muted'}
                            />
                        )}
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header Dashboard Section */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-6 rounded-2xl shadow-lg flex flex-col md:flex-row gap-6 items-center justify-between">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-black bg-gradient-to-br from-foreground to-foreground/50 bg-clip-text text-transparent flex items-center gap-2">
                            <TrendingUp className="text-primary" />{' '}
                            {t('operations_monitor', settings.language)}
                        </h2>
                        <p className="text-muted-foreground text-sm font-medium">
                            {t('total_operational_active', settings.language)}:{' '}
                            <span className="text-foreground">{stats.total}</span>
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3 justify-center md:justify-end">
                        <div className="px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center min-w-[100px]">
                            <p className="text-[10px] font-bold uppercase text-blue-500 opacity-70 mb-0.5">
                                {t('staging_active', settings.language)}
                            </p>
                            <p className="text-xl font-black text-blue-500">{stats.staging}</p>
                        </div>
                        <div className="px-4 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-center min-w-[100px]">
                            <p className="text-[10px] font-bold uppercase text-orange-500 opacity-70 mb-0.5">
                                {t('audit_pending', settings.language)}
                            </p>
                            <p className="text-xl font-black text-orange-500">{stats.audit}</p>
                        </div>
                        <div className="px-4 py-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center min-w-[100px]">
                            <p className="text-[10px] font-bold uppercase text-purple-500 opacity-70 mb-0.5">
                                {t('loading_active', settings.language)}
                            </p>
                            <p className="text-xl font-black text-purple-500">{stats.loading}</p>
                        </div>
                    </div>
                </div>

                <Button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="h-full rounded-2xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 flex flex-col items-center justify-center gap-2 py-6 transition-all active:scale-95"
                >
                    <RefreshCw className={isRefreshing ? 'animate-spin' : ''} size={24} />
                    <span className="font-bold text-xs uppercase tracking-widest">
                        {t('refresh', settings.language)}
                    </span>
                </Button>
            </div>

            {/* Filter Bar (No Blur for sharpness) */}
            <div className="flex flex-wrap items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm">
                <div className="relative flex-1 min-w-[200px]">
                    <Search
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        size={16}
                    />
                    <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-background/50 border border-border/50 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                        placeholder={t('search_placeholder', settings.language)}
                    />
                </div>

                <div className="flex items-center gap-2 bg-background/50 p-1.5 rounded-xl border border-border/50">
                    <User size={14} className="ml-2 text-muted-foreground" />
                    <select
                        value={supervisorFilter}
                        onChange={(e) => setSupervisorFilter(e.target.value)}
                        className="bg-transparent border-none text-xs outline-none pr-4 font-bold uppercase tracking-wider"
                    >
                        <option value="ALL">{t('all_supervisors', settings.language)}</option>
                        {supervisors.map((s) => (
                            <option key={s} value={s}>
                                {s}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-2 bg-background/50 p-1.5 rounded-xl border border-border/50">
                    <Layers size={14} className="ml-2 text-muted-foreground" />
                    <select
                        value={shiftFilter}
                        onChange={(e) => setShiftFilter(e.target.value)}
                        className="bg-transparent border-none text-xs outline-none pr-4 font-bold uppercase tracking-wider"
                    >
                        <option value="ALL">{t('all_shifts', settings.language)}</option>
                        {shifts.map((s) => (
                            <option key={s} value={s}>
                                {s}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex bg-background/50 p-1 rounded-xl border border-border/50">
                    {(['ALL', '30D', '90D', 'CUSTOM'] as const).map((range) => (
                        <button
                            key={range}
                            onClick={() => setTimeFilter(range)}
                            className={`px-3 py-1.5 rounded-lg text-[9px] uppercase font-black transition-all ${timeFilter === range ? 'bg-white dark:bg-slate-700 text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
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

                {timeFilter === 'CUSTOM' && (
                    <div className="flex items-center gap-1 animate-in slide-in-from-right-2 duration-300">
                        <div className="flex items-center bg-background/80 dark:bg-slate-900 rounded-xl border border-border/50 shadow-sm overflow-hidden group focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                            <div className="flex items-center gap-2 px-3 py-1.5 border-r border-border/50">
                                <Calendar className="w-3.5 h-3.5 text-primary" />
                                <div className="flex flex-col">
                                    <span className="text-[7px] uppercase font-bold text-muted-foreground leading-tight">
                                        Start Time
                                    </span>
                                    <input
                                        type="datetime-local"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="bg-transparent text-[11px] font-bold outline-none w-[145px] cursor-pointer"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5">
                                <Clock className="w-3.5 h-3.5 text-primary" />
                                <div className="flex flex-col">
                                    <span className="text-[7px] uppercase font-bold text-muted-foreground leading-tight">
                                        End Time
                                    </span>
                                    <input
                                        type="datetime-local"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="bg-transparent text-[11px] font-bold outline-none w-[145px] cursor-pointer"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {(searchQuery ||
                    supervisorFilter !== 'ALL' ||
                    shiftFilter !== 'ALL' ||
                    timeFilter !== 'ALL') && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setSearchQuery('');
                                setSupervisorFilter('ALL');
                                setShiftFilter('ALL');
                                setTimeFilter('ALL');
                                setStartDate('');
                                setEndDate('');
                            }}
                            className="text-muted-foreground hover:text-foreground h-9"
                        >
                            <X size={16} className="mr-2" /> {t('clear_filters', settings.language)}
                        </Button>
                    )}
            </div>

            {/* Main Content: List of Sheets */}
            <div className="grid grid-cols-1 gap-4 overflow-y-auto max-h-[calc(100vh-400px)] pr-2 custom-scrollbar">
                <AnimatePresence mode="popLayout">
                    {filteredSheets.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center justify-center p-20 text-muted-foreground"
                        >
                            <AlertCircle size={48} className="mb-4 opacity-20" />
                            <p className="font-bold text-lg">
                                {t('no_sheets_found', settings.language)}
                            </p>
                            <p className="text-sm">Try adjusting your search or filters</p>
                        </motion.div>
                    ) : (
                        filteredSheets.map((sheet) => (
                            <motion.div
                                key={sheet.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="group"
                            >
                                <Card
                                    className="relative overflow-hidden bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-100 dark:border-white/5 hover:border-slate-200 dark:hover:border-white/10 transition-all duration-300 shadow-md cursor-pointer"
                                    onClick={() => {
                                        const isStaging = [
                                            SheetStatus.DRAFT,
                                            SheetStatus.STAGING_VERIFICATION_PENDING
                                        ].includes(sheet.status);
                                        navigate(
                                            isStaging
                                                ? `/sheets/staging/${sheet.id}`
                                                : `/sheets/loading/${sheet.id}`
                                        );
                                    }}
                                >
                                    <CardContent className="p-0">
                                        <div className="flex flex-col lg:flex-row items-stretch min-h-[100px]">
                                            {/* Status Pillar */}
                                            <div
                                                className={`w-2 ${sheet.status === SheetStatus.COMPLETED
                                                    ? 'bg-emerald-500'
                                                    : sheet.status === SheetStatus.LOCKED
                                                        ? 'bg-orange-500'
                                                        : sheet.status ===
                                                            SheetStatus.LOADING_VERIFICATION_PENDING
                                                            ? 'bg-purple-500'
                                                            : 'bg-blue-500'
                                                    }`}
                                            />

                                            {/* Core Info */}
                                            <div className="flex-1 p-5 flex flex-col md:flex-row items-center gap-6">
                                                <div className="space-y-1 min-w-[140px]">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-black tracking-tighter text-muted-foreground uppercase">
                                                            ID
                                                        </span>
                                                        <span className="text-sm font-bold font-mono text-primary">
                                                            #{sheet.id.slice(0, 8)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <Clock
                                                            size={12}
                                                            className="text-muted-foreground"
                                                        />
                                                        <span className="text-[10px] font-medium text-muted-foreground">
                                                            {new Date(
                                                                sheet.updatedAt || sheet.createdAt
                                                            ).toLocaleTimeString([], {
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center text-primary shrink-0">
                                                            <MapPin size={18} />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-[10px] font-bold text-muted-foreground uppercase leading-none mb-1">
                                                                {t(
                                                                    'destination',
                                                                    settings.language
                                                                )}
                                                            </p>
                                                            <p className="font-bold truncate group-hover:text-primary transition-colors">
                                                                {sheet.destination || '---'}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center text-primary shrink-0">
                                                            <Truck size={18} />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-[10px] font-bold text-muted-foreground uppercase leading-none mb-1">
                                                                {t('vehicle_no', settings.language)}
                                                            </p>
                                                            <p className="font-bold truncate">
                                                                {sheet.vehicleNo || '---'}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center text-primary shrink-0">
                                                            <User size={18} />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-[10px] font-bold text-muted-foreground uppercase leading-none mb-1">
                                                                {t('supervisor', settings.language)}
                                                            </p>
                                                            <p className="font-bold truncate">
                                                                {sheet.supervisorName || '---'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Progress Stepper & Actions */}
                                            <div className="flex flex-col md:flex-row items-center gap-6 p-5 bg-black/5 border-l border-white/5 min-w-[320px]">
                                                <div className="space-y-2 w-full">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">
                                                            {t(
                                                                'current_progress',
                                                                settings.language
                                                            )}
                                                        </span>
                                                        <Badge
                                                            variant="outline"
                                                            className={`text-[10px] font-bold uppercase ${sheet.status ===
                                                                SheetStatus.COMPLETED
                                                                ? 'border-emerald-500/30 text-emerald-500'
                                                                : sheet.status ===
                                                                    SheetStatus.LOCKED
                                                                    ? 'border-orange-500/30 text-orange-500'
                                                                    : 'border-primary/30 text-primary'
                                                                }`}
                                                        >
                                                            {t(
                                                                sheet.status.toLowerCase() as string,
                                                                settings.language
                                                            ).replace(/_/g, ' ')}
                                                        </Badge>
                                                    </div>
                                                    <ProgressStepper status={sheet.status} />
                                                </div>

                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="shrink-0 h-10 w-10 rounded-xl p-0 border-white/10 hover:bg-primary hover:text-white transition-all"
                                                >
                                                    <ArrowRight size={18} />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
