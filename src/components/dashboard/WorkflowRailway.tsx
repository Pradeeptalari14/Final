import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SheetData, SheetStatus } from '@/types';
import { FilePlus, Package, ClipboardCheck, Truck, PlayCircle, ShieldCheck, CheckCircle2, AlertOctagon, Filter } from 'lucide-react';

interface WorkflowRailwayProps {
    sheets: SheetData[];
}

export function WorkflowRailway({ sheets }: WorkflowRailwayProps) {
    const navigate = useNavigate();
    const [selectedUser, setSelectedUser] = useState<string>('ALL');

    // --- EXTRACT UNIQUE USERS ---
    const uniqueUsers = useMemo(() => {
        const names = new Set<string>();
        sheets.forEach(s => {
            if (s.supervisorName) names.add(s.supervisorName);
            if (s.loadingSvName) names.add(s.loadingSvName);
            if (s.lockedBy) names.add(s.lockedBy);
        });
        return Array.from(names).filter(n => n).sort();
    }, [sheets]);

    // --- FILTERED SHEETS LOGIC ---
    const filteredSheets = useMemo(() => {
        if (selectedUser === 'ALL') return sheets;
        return sheets.filter(s =>
            s.supervisorName === selectedUser ||
            s.loadingSvName === selectedUser ||
            s.lockedBy === selectedUser
        );
    }, [sheets, selectedUser]);

    // --- LOGIC CALCULATIONS ---
    const hasRejection = (s: SheetData) => s.rejectionReason && s.rejectionReason.trim() !== '';

    // Use filteredSheets for counts
    const counts = {
        new: filteredSheets.filter(s => s.status === SheetStatus.DRAFT && (!s.stagingItems || s.stagingItems.length <= 1) && !hasRejection(s)).length,
        staging: filteredSheets.filter(s => s.status === SheetStatus.DRAFT && s.stagingItems && s.stagingItems.length > 1 && !hasRejection(s)).length,
        audit: filteredSheets.filter(s => s.status === SheetStatus.STAGING_VERIFICATION_PENDING).length,
        ready: filteredSheets.filter(s => s.status === SheetStatus.LOCKED && !s.loadingStartTime && !hasRejection(s)).length,
        // Combined Loading/Loaded into single "loaded" (Matches user request: "Loading/Loaded === loaded only one")
        // Logic: Locked AND Started Loading (regardless of end time)
        loaded: filteredSheets.filter(s => s.status === SheetStatus.LOCKED && s.loadingStartTime && !hasRejection(s)).length,
        finalCheck: filteredSheets.filter(s => s.status === SheetStatus.LOADING_VERIFICATION_PENDING).length,
        dispatched: filteredSheets.filter(s => s.status === SheetStatus.COMPLETED).length,
        rejected: filteredSheets.filter(s => hasRejection(s)).length
    };

    // Grouping Stations by Role/Zone
    const zones = [
        {
            label: "STAGING",
            color: "blue",
            stations: [
                { id: 'new', label: 'New', count: counts.new, icon: FilePlus, filter: 'admin?tab=staging_db&filter=DRAFT' },
                { id: 'staging', label: 'In Progress', count: counts.staging, icon: Package, filter: 'admin?tab=staging_db&filter=DRAFT' }
            ]
        },
        {
            label: "SHIFT LEAD",
            color: "purple",
            stations: [
                { id: 'audit', label: 'Verify', count: counts.audit, icon: ClipboardCheck, filter: 'admin?tab=shift_lead_db&filter=STAGING_APPROVALS' }
            ]
        },
        {
            label: "LOADING TEAM",
            color: "indigo",
            stations: [
                { id: 'ready', label: 'Ready to Load', count: counts.ready, icon: Truck, filter: 'admin?tab=loading_db&filter=READY' },
                // Merged Station
                { id: 'loaded', label: 'Loaded', count: counts.loaded, icon: PlayCircle, filter: 'admin?tab=loading_db&filter=LOCKED' }
            ]
        },
        {
            label: "SHIFT LEAD",
            color: "orange",
            stations: [
                { id: 'check', label: 'Final Check', count: counts.finalCheck, icon: ShieldCheck, filter: 'admin?tab=shift_lead_db&filter=LOADING_APPROVALS' }
            ]
        },
        {
            label: "COMPLETED",
            color: "emerald",
            stations: [
                { id: 'done', label: 'Dispatched', count: counts.dispatched, icon: CheckCircle2, filter: 'admin?tab=history&filter=COMPLETED' }
            ]
        }
    ];

    return (
        <div className="w-full bg-slate-900 text-white p-4 rounded-xl shadow-xl border border-slate-700/50 relative overflow-hidden">
            {/* Background Circuitry Effect */}
            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900 via-slate-900 to-black" />

            {/* Header with Filter & Rejected Alert */}
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 px-2">
                <div className="flex items-center gap-4">
                    <h2 className="text-sm font-bold tracking-widest uppercase bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
                        Live Workflow Status
                    </h2>

                    {/* User Filter Dropdown */}
                    <div className="group relative">
                        <Filter size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <select
                            value={selectedUser}
                            onChange={(e) => setSelectedUser(e.target.value)}
                            className="pl-8 pr-4 py-1 text-xs bg-slate-800 border border-slate-600 rounded-full text-slate-300 focus:outline-none focus:border-blue-500 hover:bg-slate-700 transition-colors appearance-none cursor-pointer min-w-[150px]"
                        >
                            <option value="ALL">All Active Users ({uniqueUsers.length})</option>
                            <option disabled>──────────</option>
                            {uniqueUsers.map(u => (
                                <option key={u} value={u}>{u}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {counts.rejected > 0 && (
                    <button
                        onClick={() => navigate('/admin?tab=staging_db&filter=REJECTED')}
                        className="flex items-center gap-2 bg-red-950/50 border border-red-500/30 rounded-full py-0.5 px-3 hover:bg-red-900/60 transition-colors animate-pulse"
                    >
                        <AlertOctagon size={12} className="text-red-400" />
                        <span className="text-[10px] font-bold text-red-200 uppercase tracking-wider">{counts.rejected} Rejected</span>
                    </button>
                )}
            </div>

            {/* ZONED RAILWAY TRACK */}
            <div className="relative z-10 flex items-start justify-between gap-2 overflow-x-auto pb-4 scrollbar-hide">

                {/* Global Track Line (Background) */}
                <div className="absolute top-[42px] left-4 right-4 h-0.5 bg-slate-800 -z-10" />

                {zones.map((zone, zIndex) => (
                    <div key={zIndex} className="flex flex-col items-center gap-2 min-w-fit px-2 relative group-zone">
                        {/* Zone Label */}
                        <div className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-${zone.color}-500/20 bg-${zone.color}-500/5 text-${zone.color}-300 mb-2`}>
                            {zone.label}
                        </div>

                        {/* Stations in this Zone */}
                        <div className="flex gap-4">
                            {zone.stations.map((station) => {
                                const isNonZero = station.count > 0;
                                // Simplified color logic for demo - in production map to strict tailwind classes or safelist
                                let activeColorClass = 'border-slate-500 text-slate-400 bg-slate-900';
                                if (zone.color === 'blue') activeColorClass = 'border-blue-500/50 text-blue-400 bg-blue-900/20';
                                if (zone.color === 'purple') activeColorClass = 'border-purple-500/50 text-purple-400 bg-purple-900/20';
                                if (zone.color === 'indigo') activeColorClass = 'border-indigo-500/50 text-indigo-400 bg-indigo-900/20';
                                if (zone.color === 'orange') activeColorClass = 'border-orange-500/50 text-orange-400 bg-orange-900/20';
                                if (zone.color === 'emerald') activeColorClass = 'border-emerald-500/50 text-emerald-400 bg-emerald-900/20';

                                const inactiveColorClass = 'border-slate-700 text-slate-600 bg-slate-800/50';

                                return (
                                    <motion.button
                                        key={station.id}
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => navigate('/' + station.filter)}
                                        className="flex flex-col items-center gap-1.5 z-10"
                                    >
                                        <div className={`
                                            w-10 h-10 rounded-xl border flex items-center justify-center transition-all duration-300
                                            ${isNonZero ? activeColorClass + ' shadow-[0_0_15px_rgba(0,0,0,0.5)]' : inactiveColorClass}
                                        `}>
                                            <station.icon size={18} strokeWidth={isNonZero ? 2 : 1.5} />
                                            {isNonZero && (
                                                <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 flex items-center justify-center bg-white text-slate-900 rounded-full text-[9px] font-bold shadow-sm border border-slate-900">
                                                    {station.count}
                                                </span>
                                            )}
                                        </div>
                                        <span className={`text-[9px] font-bold uppercase tracking-wider ${isNonZero ? 'text-slate-300' : 'text-slate-700'}`}>
                                            {station.label}
                                        </span>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
