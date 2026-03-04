import { useState, useEffect, useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import {
    calculateStagingStats,
    calculateLoadingStats,
    calculateShiftLeadStats
} from '@/lib/performanceUtils';
import { Role, User } from '@/types';
import { LeaderboardPodium } from './components/LeaderboardPodium';
import {
    LayoutGrid,
    Truck,
    ShieldCheck,
    PieChart,
    ArrowLeft,
    Maximize2,
    Clock,
    Flame,
    TrendingUp,
    Users,
    Settings,
    X,
    Check,
    Play,
    Pause,
    LucideIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnalyticsCharts } from '../AnalyticsCharts';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';


type Category = 'STAGING' | 'LOADING' | 'SHIFT_LEAD' | 'DATABASE';

const CATEGORIES: { id: Category; label: string; icon: LucideIcon; color: string }[] = [
    { id: 'STAGING', label: 'Staging Specialists', icon: LayoutGrid, color: 'text-emerald-500 bg-emerald-500/10' },
    { id: 'LOADING', label: 'Loading Experts', icon: Truck, color: 'text-blue-500 bg-blue-500/10' },
    { id: 'SHIFT_LEAD', label: 'Operation Masters', icon: ShieldCheck, color: 'text-purple-500 bg-purple-500/10' },
    { id: 'DATABASE', label: 'Database Overview', icon: PieChart, color: 'text-amber-500 bg-amber-500/10' }
];

export default function TVModePerformance() {
    const { users, sheets } = useData();
    const navigate = useNavigate();

    // Config State
    const [enabledCategories, setEnabledCategories] = useState<Category[]>(['STAGING', 'LOADING', 'SHIFT_LEAD', 'DATABASE']);
    const [cycleDuration, setCycleDuration] = useState(15); // Seconds
    const [isPaused, setIsPaused] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    // Theme State - Default to 'light'
    const [theme, setTheme] = useState<'light' | 'dark'>('light');

    // View State
    const [activeIdx, setActiveIdx] = useState(0);
    const [progress, setProgress] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const activeCategory = CATEGORIES[activeIdx];

    // ------------------------------------------------------------------
    // 1. DATA FILTERING (LAST 7 DAYS - MATCHING REPORTS)
    // ------------------------------------------------------------------
    const filteredSheets = useMemo(() => {
        const now = new Date();
        const days = 7; // Default to 7 days to match AnalyticsHub default
        const threshold = new Date(now.setDate(now.getDate() - days));
        return sheets.filter((s) => new Date(s.date) >= threshold);
    }, [sheets]);

    // --- Data Processing ---
    const leaderboardData = useMemo(() => {
        const cat = activeCategory.id;

        let ranked: (User & { rankMetric: number | string, subMetric?: string })[] = [];

        // Use filteredSheets for calculations to match "Reports"
        const sourceData = filteredSheets;

        if (cat === 'STAGING') {
            ranked = users
                .filter(u => u.role === Role.STAGING_SUPERVISOR || u.role === Role.ADMIN)
                .map(u => {
                    const stats = calculateStagingStats(u, sourceData);
                    return {
                        ...u,
                        rankMetric: stats.totalQuantity,
                        subMetric: `${stats.totalStagingPlaces} Docks • ${stats.completionRate}% Rate`
                    };
                });
        } else if (cat === 'LOADING') {
            ranked = users
                .filter(u => u.role === Role.LOADING_SUPERVISOR || u.role === Role.ADMIN)
                .map(u => {
                    const stats = calculateLoadingStats(u, sourceData);
                    return {
                        ...u,
                        rankMetric: stats.totalVehicles,
                        subMetric: `${(stats.totalQuantity / 1000).toFixed(1)}k Qty • ${stats.avgTimeMinutes}m Avg`
                    };
                });
        } else {
            ranked = users
                .filter(u => u.role === Role.SHIFT_LEAD || u.role === Role.ADMIN)
                .map(u => {
                    const stats = calculateShiftLeadStats(u, sourceData);
                    return {
                        ...u,
                        rankMetric: stats.vehiclesDispatched,
                        subMetric: `${stats.totalQuantity} Qty • ${stats.avgLoadingTime}m Avg`
                    };
                });
        }

        return ranked
            .filter(u => Number(u.rankMetric) > 0)
            .sort((a, b) => Number(b.rankMetric) - Number(a.rankMetric));
    }, [activeCategory, users, filteredSheets]);

    // --- Auto Cycle Logic ---
    useEffect(() => {
        if (isPaused || enabledCategories.length === 0 || showSettings) return;

        const intervalMs = cycleDuration * 1000;
        const step = 100; // Progress bar steps (100 ticks)
        const stepInterval = intervalMs / step;

        const timer = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    // Find next enabled category
                    const currentId = CATEGORIES[activeIdx].id;
                    const validIds = CATEGORIES.filter(c => enabledCategories.includes(c.id));

                    if (validIds.length === 0) return 100;

                    const currentValidIdx = validIds.findIndex(c => c.id === currentId);
                    const nextValid = validIds[(currentValidIdx + 1) % validIds.length];
                    const nextGlobalIdx = CATEGORIES.findIndex(c => c.id === nextValid.id);

                    setActiveIdx(nextGlobalIdx);
                    return 0;
                }
                return prev + 1;
            });
        }, stepInterval);

        return () => clearInterval(timer);
    }, [activeIdx, enabledCategories, cycleDuration, isPaused, showSettings]);

    // Ensure we are viewing an enabled category if config changes
    // Synchronize state during render if current category becomes disabled
    const currentId = CATEGORIES[activeIdx].id;
    if (!enabledCategories.includes(currentId) && enabledCategories.length > 0) {
        const firstEnabled = CATEGORIES.find(c => enabledCategories.includes(c.id));
        if (firstEnabled) {
            setActiveIdx(CATEGORIES.indexOf(firstEnabled));
            setProgress(0);
        }
    }

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                setIsFullscreen(false);
            }
        }
    };

    const toggleCategory = (id: Category) => {
        setEnabledCategories(prev =>
            prev.includes(id)
                ? prev.filter(c => c !== id)
                : [...prev, id]
        );
    };

    return (
        <div className={cn(
            "fixed inset-0 overflow-hidden flex flex-col z-[100] font-sans transition-colors duration-500",
            theme === 'dark' ? "bg-slate-950 text-slate-50 dark" : "bg-slate-50 text-slate-900"
        )}>
            {/* Header Area */}
            <div className={cn(
                "p-8 pb-4 flex justify-between items-center border-b backdrop-blur-3xl shrink-0 transition-colors duration-500",
                theme === 'dark' ? "border-slate-800 bg-slate-900/80" : "border-slate-200 bg-white/80"
            )}>
                <div className="flex items-center gap-6">
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/admin')}
                        className={cn(
                            "rounded-full transition-colors",
                            theme === 'dark' ? "text-slate-400 hover:text-white hover:bg-white/10" : "text-slate-400 hover:text-slate-900 hover:bg-slate-100"
                        )}
                    >
                        <ArrowLeft size={24} />
                    </Button>
                    <div className="h-12 w-1 bg-indigo-500 rounded-full" />
                    <div>
                        <h1 className="text-3xl font-black tracking-tighter uppercase mb-1">
                            Operational Excellence <span className="text-indigo-500">Leaderboard</span>
                        </h1>
                        <div className="flex items-center gap-4 text-slate-400 font-bold text-xs uppercase tracking-[0.2em]">
                            <span className="flex items-center gap-2"><Clock size={14} className="text-indigo-400" /> {new Date().toLocaleDateString()}</span>
                            <span>•</span>
                            <span className="flex items-center gap-2"><Users size={14} className="text-blue-400" /> {users.length} Active Staff</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className={cn(
                        "flex p-1.5 rounded-2xl border shadow-inner transition-colors duration-500",
                        theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-slate-100 border-slate-200"
                    )}>
                        {CATEGORIES.map((cat, i) => (
                            <button
                                key={cat.id}
                                disabled={!enabledCategories.includes(cat.id)}
                                onClick={() => { setActiveIdx(i); setProgress(0); }}
                                className={cn(
                                    "px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 flex items-center gap-2",
                                    activeIdx === i
                                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 scale-105"
                                        : enabledCategories.includes(cat.id)
                                            ? (theme === 'dark' ? "text-slate-400 hover:text-slate-300" : "text-slate-500 hover:text-slate-700")
                                            : "text-slate-700 opacity-50 cursor-not-allowed" // Disabled state
                                )}
                            >
                                <cat.icon size={14} />
                                {cat.id.replace('_', ' ')}
                            </button>
                        ))}
                    </div>

                    <Button
                        variant="ghost"
                        onClick={() => setIsPaused(!isPaused)}
                        className={cn(
                            "h-11 w-11 rounded-full border transition-colors",
                            isPaused
                                ? "bg-amber-100 text-amber-600 border-amber-200 dark:bg-amber-900/20 dark:text-amber-500 dark:border-amber-500/20"
                                : (theme === 'dark' ? "bg-slate-800 border-slate-700 text-slate-400" : "bg-white border-slate-200 text-slate-400")
                        )}
                    >
                        {isPaused ? <Pause size={20} /> : <Play size={20} />}
                    </Button>

                    <Button
                        variant="ghost"
                        onClick={() => setShowSettings(true)}
                        className={cn(
                            "h-11 w-11 rounded-full border transition-colors",
                            theme === 'dark'
                                ? "border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-400"
                                : "border-slate-200 bg-white hover:bg-slate-50 text-slate-400"
                        )}
                    >
                        <Settings size={20} />
                    </Button>

                    <Button
                        variant="outline"
                        onClick={toggleFullscreen}
                        className={cn(
                            "rounded-xl h-11 px-6 font-black uppercase text-[10px] tracking-widest border transition-colors",
                            theme === 'dark'
                                ? "border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300"
                                : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                        )}
                    >
                        <Maximize2 size={16} className="mr-2" /> {isFullscreen ? 'Normal' : 'Fullscreen'}
                    </Button>
                </div>
            </div>

            {/* Progress Bar (Global Cycle) */}
            <div className={cn("h-1.5 w-full shrink-0 relative transition-colors", theme === 'dark' ? "bg-slate-900" : "bg-slate-100")}>
                <div
                    className={cn(
                        "absolute inset-y-0 left-0 transition-all duration-300 ease-linear shadow-[0_0_15px_rgba(99,102,241,0.5)]",
                        isPaused ? "bg-amber-500" : "bg-gradient-to-r from-indigo-500 via-blue-500 to-indigo-500"
                    )}
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col md:flex-row p-8 gap-8 overflow-hidden relative">

                {/* Left Side: Category Summary & Rankings */}
                <div className="flex-1 flex flex-col">
                    {/* Active Category Title */}
                    <div className="mb-8 animate-in fade-in slide-in-from-left duration-700">
                        <div className={cn("inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 text-sm font-black uppercase tracking-widest shadow-xl", activeCategory.color)}>
                            <activeCategory.icon size={18} />
                            {activeCategory.label}
                        </div>
                    </div>

                    {activeCategory.id === 'DATABASE' ? (
                        <div className={cn(
                            "flex-1 bg-white rounded-[2.5rem] border border-slate-200 shadow-xl relative overflow-hidden backdrop-blur-sm animate-in zoom-in-95 duration-500 transition-colors group",
                            theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
                        )}>
                            {/* Scaled Container to simulate 75% Zoom */}
                            <div className="absolute inset-0 w-[133.33%] h-[133.33%] origin-top-left scale-75 p-10 flex flex-col">
                                <div className={cn("absolute inset-0 -z-10", theme === 'dark' ? "bg-slate-950/50" : "bg-slate-50/50")} />
                                <AnalyticsCharts sheets={filteredSheets} fullHeight={true} />
                            </div>
                        </div>
                    ) : (
                        /* Rankings List */
                        <div className={cn(
                            "flex-1 rounded-[2.5rem] border p-8 flex flex-col shadow-xl relative overflow-hidden backdrop-blur-sm transition-colors",
                            theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
                        )}>
                            <div className="flex justify-between items-center mb-6 px-4">
                                <h4 className="text-slate-400 font-black uppercase text-xs tracking-[0.2em] flex items-center gap-2">
                                    <TrendingUp size={16} className="text-emerald-500" /> Current Rankings
                                </h4>
                                <span className={cn(
                                    "text-[10px] px-3 py-1 rounded-full border font-black uppercase tracking-widest transition-colors",
                                    isPaused
                                        ? "bg-amber-100 text-amber-600 border-amber-200 dark:bg-amber-900/20 dark:text-amber-500 dark:border-amber-500/20"
                                        : "bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-500/20"
                                )}>
                                    {isPaused ? 'Paused' : 'Live Updates'}
                                </span>
                            </div>

                            <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                                {leaderboardData.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4 opacity-50">
                                        <Flame size={64} strokeWidth={1} />
                                        <p className="font-bold uppercase tracking-widest">Gathering performance data...</p>
                                    </div>
                                ) : (
                                    leaderboardData.map((u, i) => (
                                        <div
                                            key={u.id}
                                            className={cn(
                                                "group flex items-center gap-6 p-4 rounded-3xl border transition-all duration-300",
                                                i < 3
                                                    ? (theme === 'dark'
                                                        ? "bg-slate-950 border-slate-800 shadow-lg scale-[1.02] border-l-4"
                                                        : "bg-slate-50 border-slate-200 shadow-md scale-[1.02] border-l-4")
                                                    : (theme === 'dark'
                                                        ? "bg-transparent border-slate-800 hover:bg-slate-800"
                                                        : "bg-transparent border-slate-100 hover:bg-slate-50"),
                                                i === 0 ? "border-l-amber-500" : i === 1 ? "border-l-slate-400" : i === 2 ? "border-l-orange-500" : ""
                                            )}
                                        >
                                            <div className={cn(
                                                "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shadow-sm shrink-0",
                                                i === 0 ? "bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-500" :
                                                    i === 1 ? "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300" :
                                                        i === 2 ? "bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-500" :
                                                            (theme === 'dark' ? "bg-slate-800 text-slate-500" : "bg-slate-100 text-slate-400")
                                            )}>
                                                {i + 1}
                                            </div>

                                            {/* User Photo */}
                                            <div className={cn(
                                                "w-12 h-12 rounded-full border-2 shadow-sm overflow-hidden shrink-0",
                                                theme === 'dark' ? "border-slate-700 bg-slate-800" : "border-white bg-slate-200"
                                            )}>
                                                {u.photoURL ? (
                                                    <img
                                                        src={u.photoURL}
                                                        alt={u.fullName || 'User'}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => {
                                                            e.currentTarget.style.display = 'none';
                                                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                                        }}
                                                    />
                                                ) : null}
                                                <div className={cn("w-full h-full flex items-center justify-center font-bold", u.photoURL ? "hidden" : "", theme === 'dark' ? "text-slate-500" : "text-slate-400")}>
                                                    {(u.fullName || u.username).charAt(0)}
                                                </div>
                                            </div>

                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h5 className={cn("font-black text-lg tracking-tight", theme === 'dark' ? "text-slate-200" : "text-slate-900")}>
                                                        {u.fullName || u.username}
                                                    </h5>
                                                    <span className={cn(
                                                        "text-[10px] font-bold px-2 py-0.5 rounded uppercase",
                                                        theme === 'dark' ? "text-slate-400 bg-slate-800" : "text-slate-500 bg-slate-100"
                                                    )}>
                                                        {u.empCode}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{u.subMetric}</p>
                                            </div>

                                            <div className="text-right">
                                                <div className={cn(
                                                    "text-2xl font-black group-hover:scale-110 transition-transform tabular-nums",
                                                    theme === 'dark' ? "text-white" : "text-slate-900"
                                                )}>
                                                    {u.rankMetric}
                                                </div>
                                                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                                    {activeCategory.id === 'STAGING' ? 'Cases' : activeCategory.id === 'LOADING' ? 'Vehicles' : 'Dispatched'}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Side: The Podium (Visual Highlight) */}
                {activeCategory.id !== 'DATABASE' && (
                    <div className="hidden lg:flex flex-col w-[500px] shrink-0">
                        <div className={cn(
                            "flex-1 rounded-[2.5rem] border flex flex-col items-center justify-center shadow-2xl relative p-8 transition-colors",
                            theme === 'dark' ? "bg-gradient-to-b from-slate-900 to-slate-950 border-slate-800" : "bg-gradient-to-b from-indigo-50 to-white border-slate-200"
                        )}>
                            <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />

                            <div className="mb-auto text-center relative z-10">
                                <h2 className={cn("text-xl font-black uppercase tracking-[0.3em] mb-2", theme === 'dark' ? "text-slate-600" : "text-slate-300")}>Hall of Fame</h2>
                                <div className={cn("h-1 w-20 mx-auto rounded-full", theme === 'dark' ? "bg-indigo-500/20" : "bg-indigo-100")} />
                            </div>

                            <div className="w-full relative z-10">
                                <LeaderboardPodium
                                    users={leaderboardData.slice(0, 3)}
                                    metricLabel={activeCategory.id === 'STAGING' ? 'Ttl Qty' : activeCategory.id === 'LOADING' ? 'Dispatched' : 'Vehicles'}
                                    theme={theme}
                                />
                            </div>

                            <div className="mt-auto pt-12 text-center text-slate-400 italic text-sm font-medium">
                                &ldquo;Consistent performance drives operational excellence&rdquo;
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* SETTINGS MODAL */}
            {showSettings && (
                <div className="absolute inset-0 z-[200] bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-8 animate-in fade-in duration-200">
                    <div className={cn(
                        "border p-8 rounded-[2rem] w-full max-w-lg shadow-2xl relative overflow-hidden",
                        theme === 'dark' ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
                    )}>
                        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-indigo-500/10 to-transparent pointer-events-none" />

                        <div className="flex justify-between items-center mb-8 relative z-10">
                            <h3 className={cn("text-2xl font-black uppercase tracking-tight flex items-center gap-3", theme === 'dark' ? "text-white" : "text-slate-900")}>
                                <Settings className="text-indigo-500" /> Display Settings
                            </h3>
                            <button onClick={() => setShowSettings(false)} className={cn("p-2 rounded-full transition-colors", theme === 'dark' ? "bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700")}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-8 relative z-10">
                            {/* Theme Selection */}
                            <div>
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Theme Preference</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setTheme('light')}
                                        className={cn(
                                            "flex items-center justify-center gap-2 p-3 rounded-xl border font-bold transition-all",
                                            theme === 'light' ? "bg-slate-100 border-indigo-500 text-indigo-600 ring-1 ring-indigo-500" : "border-slate-200 text-slate-500 hover:bg-slate-50"
                                        )}
                                    >
                                        Light Mode
                                    </button>
                                    <button
                                        onClick={() => setTheme('dark')}
                                        className={cn(
                                            "flex items-center justify-center gap-2 p-3 rounded-xl border font-bold transition-all",
                                            theme === 'dark' ? "bg-slate-800 border-indigo-500 text-indigo-400 ring-1 ring-indigo-500" : "border-slate-200 text-slate-500 hover:bg-slate-50"
                                        )}
                                    >
                                        Dark Mode
                                    </button>
                                </div>
                            </div>

                            {/* Slide Toggle Section */}
                            <div>
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Visible Slides</h4>
                                <div className="grid gap-3">
                                    {CATEGORIES.map(cat => (
                                        <div
                                            key={cat.id}
                                            onClick={() => toggleCategory(cat.id)}
                                            className={cn(
                                                "flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all duration-200",
                                                enabledCategories.includes(cat.id)
                                                    ? "bg-indigo-500/10 border-indigo-500/50 shadow-inner"
                                                    : (theme === 'dark' ? "bg-white/5 border-white/5 hover:border-white/10" : "bg-slate-50 border-slate-100 hover:border-slate-200")
                                            )}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={cn("p-2 rounded-lg", enabledCategories.includes(cat.id) ? "bg-indigo-500 text-white" : (theme === 'dark' ? "bg-slate-800 text-slate-500" : "bg-slate-200 text-slate-500"))}>
                                                    <cat.icon size={18} />
                                                </div>
                                                <span className={cn("font-bold", enabledCategories.includes(cat.id) ? (theme === 'dark' ? "text-white" : "text-indigo-900") : "text-slate-500")}>
                                                    {cat.label}
                                                </span>
                                            </div>
                                            {enabledCategories.includes(cat.id) && <Check size={18} className="text-indigo-400" />}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Duration Slider Section */}
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Cycle Duration</h4>
                                    <span className="text-sm font-black text-indigo-400 bg-indigo-400/10 px-3 py-1 rounded-full">{cycleDuration} seconds</span>
                                </div>
                                <div className="px-2">
                                    <input
                                        type="range"
                                        min="5"
                                        max="60"
                                        step="5"
                                        value={cycleDuration}
                                        onChange={(e) => setCycleDuration(Number(e.target.value))}
                                        className="w-full accent-indigo-500 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                                    />
                                    <div className="flex justify-between mt-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                        <span>5s</span>
                                        <span>30s</span>
                                        <span>60s</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className={cn("mt-8 pt-8 border-t flex gap-4", theme === 'dark' ? "border-white/5" : "border-slate-100")}>
                            <Button className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-12 rounded-xl" onClick={() => setShowSettings(false)}>
                                Done
                            </Button>
                        </div>
                    </div>
                </div>
            )}


            <style dangerouslySetInnerHTML={{
                __html: `
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.1); }
            ` }} />
        </div>
    );
}
