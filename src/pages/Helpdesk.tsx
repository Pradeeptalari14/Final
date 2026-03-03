import { useState, useEffect } from 'react';
import { useData } from '@/contexts/DataContext';
import { Ticket, TicketPriority, TicketStatus, Role } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, AlertCircle, Clock, CheckCircle2, SearchX, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

export default function Helpdesk() {
    const { currentUser, users } = useData();
    const [tickets, setTickets] = useState<Ticket[]>(() => {
        const stored = localStorage.getItem('unicharm_tickets');
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {
                console.error("Failed to parse tickets", e);
                return [];
            }
        }
        return [];
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<TicketStatus | 'ALL'>('ALL');
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    // Form State
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newPriority, setNewPriority] = useState<TicketPriority>('MEDIUM');

    // Simulate DB save
    useEffect(() => {
        localStorage.setItem('unicharm_tickets', JSON.stringify(tickets));
    }, [tickets]);

    const isITorAdmin = currentUser?.role === Role.ADMIN || currentUser?.role === Role.SUPER_ADMIN;

    const filteredTickets = tickets.filter(t => {
        const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
        const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.id.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesScope = isITorAdmin ? true : t.reportedBy === currentUser?.id;
        return matchesStatus && matchesSearch && matchesScope;
    });

    const handleCreateTicket = () => {
        if (!newTitle.trim() || !newDesc.trim() || !currentUser) return;

        const ticket: Ticket = {
            id: `TKT-${Math.floor(1000 + Math.random() * 9000)}`,
            title: newTitle,
            description: newDesc,
            priority: newPriority,
            status: 'OPEN',
            reportedBy: currentUser.id,
            reportedAt: new Date().toISOString()
        };

        setTickets(prev => [ticket, ...prev]);
        setIsCreateOpen(false);
        setNewTitle('');
        setNewDesc('');
        setNewPriority('MEDIUM');
    };

    const updateStatus = (ticketId: string, newStatus: TicketStatus) => {
        setTickets(prev => prev.map(t => {
            if (t.id === ticketId) {
                return {
                    ...t,
                    status: newStatus,
                    ...(newStatus === 'RESOLVED' || newStatus === 'CLOSED' ? {
                        resolvedBy: currentUser?.id,
                        resolvedAt: new Date().toISOString()
                    } : {})
                };
            }
            return t;
        }));
    };

    const priorityColors = {
        'LOW': 'bg-slate-100 text-slate-700 border-slate-200',
        'MEDIUM': 'bg-blue-100 text-blue-700 border-blue-200',
        'HIGH': 'bg-orange-100 text-orange-700 border-orange-200',
        'CRITICAL': 'bg-red-100 text-red-700 border-red-200 animate-pulse'
    };

    const statusIcons = {
        'OPEN': <AlertCircle size={14} className="text-amber-500" />,
        'IN_PROGRESS': <Clock size={14} className="text-blue-500" />,
        'RESOLVED': <CheckCircle2 size={14} className="text-emerald-500" />,
        'CLOSED': <CheckCircle2 size={14} className="text-slate-400" />
    };

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                        <Activity className="text-indigo-600" /> Problem Resolution Platform
                    </h1>
                    <p className="text-sm font-medium text-slate-500 mt-1">
                        {isITorAdmin ? 'Manage and resolve reported issues.' : 'Report system issues to the IT team.'}
                    </p>
                </div>
                <Button
                    onClick={() => setIsCreateOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 font-bold gap-2"
                >
                    <Plus size={18} /> New Ticket
                </Button>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-white/5">
                <div className="relative w-full sm:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <Input
                        placeholder="Search tickets by ID or title..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-10 bg-slate-50 dark:bg-slate-800 border-none rounded-xl"
                    />
                </div>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
                    {(['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'] as const).map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status === 'ALL' ? 'ALL' : status as TicketStatus)}
                            className={cn(
                                "px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all whitespace-nowrap",
                                statusFilter === status
                                    ? "bg-white dark:bg-slate-700 text-indigo-600 shadow-sm"
                                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                            )}
                        >
                            {status.replace('_', ' ')}
                        </button>
                    ))}
                </div>
            </div>

            {/* Ticket List */}
            {filteredTickets.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-white/5 border-dashed">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 mb-4">
                        <SearchX size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">No Tickets Found</h3>
                    <p className="text-sm text-slate-500">Try adjusting your filters or create a new ticket.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTickets.map(ticket => {
                        const reporter = users.find(u => u.id === ticket.reportedBy);
                        return (
                            <div key={ticket.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-xl shadow-slate-200/20 dark:shadow-none transition-all hover:-translate-y-1 relative group flex flex-col">
                                <div className="flex justify-between items-start mb-4 gap-4">
                                    <div className="space-y-1 flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{ticket.id}</span>
                                            <span className={cn("px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded border", priorityColors[ticket.priority])}>
                                                {ticket.priority}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-slate-900 dark:text-white line-clamp-2 leading-tight">{ticket.title}</h3>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-white/5 shrink-0">
                                        {statusIcons[ticket.status]}
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">
                                            {ticket.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                </div>

                                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 mb-6 flex-1">
                                    {ticket.description}
                                </p>

                                <div className="flex items-center justify-between border-t border-slate-100 dark:border-white/5 pt-4 mt-auto">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold border border-indigo-200">
                                            {reporter?.fullName.charAt(0) || reporter?.username.charAt(0) || 'U'}
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-900 dark:text-white">{reporter?.fullName || reporter?.username || 'Unknown'}</p>
                                            <p className="text-[9px] text-slate-400">{new Date(ticket.reportedAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    {isITorAdmin && ticket.status !== 'CLOSED' && (
                                        <div className="flex items-center gap-2">
                                            {ticket.status === 'OPEN' && (
                                                <Button size="sm" variant="outline" onClick={() => updateStatus(ticket.id, 'IN_PROGRESS')} className="h-8 text-[10px] font-bold">
                                                    Start Work
                                                </Button>
                                            )}
                                            {ticket.status === 'IN_PROGRESS' && (
                                                <Button size="sm" onClick={() => updateStatus(ticket.id, 'RESOLVED')} className="h-8 text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white">
                                                    Resolve
                                                </Button>
                                            )}
                                            {ticket.status === 'RESOLVED' && (
                                                <Button size="sm" variant="outline" onClick={() => updateStatus(ticket.id, 'CLOSED')} className="h-8 text-[10px] font-bold">
                                                    Close
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Create Modal */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="sm:max-w-[500px] rounded-[2rem]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black">Submit IT Ticket</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-widest">Issue Title</label>
                            <Input
                                value={newTitle}
                                onChange={e => setNewTitle(e.target.value)}
                                placeholder="E.g. Scanner #4 not turning on"
                                className="h-12 bg-slate-50 border-slate-200 rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-widest">Description</label>
                            <textarea
                                value={newDesc}
                                onChange={e => setNewDesc(e.target.value)}
                                placeholder="Describe the issue in detail..."
                                className="w-full h-32 p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 custom-scrollbar resize-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-widest">Priority</label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as TicketPriority[]).map(p => (
                                    <button
                                        key={p}
                                        onClick={() => setNewPriority(p)}
                                        className={cn(
                                            "py-2 text-[10px] font-black uppercase tracking-widest rounded-xl border transition-all",
                                            newPriority === p
                                                ? priorityColors[p]
                                                : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                                        )}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateOpen(false)} className="rounded-xl font-bold">Cancel</Button>
                        <Button onClick={handleCreateTicket} className="rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white" disabled={!newTitle.trim() || !newDesc.trim()}>
                            Submit Ticket
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
