import { useState, useEffect } from 'react';
import { LoginSession } from '@/types';
import { dataService } from '@/services/dataService';
import { formatDistanceToNow } from 'date-fns';
import { Monitor, Smartphone, Tablet, XCircle, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/contexts/ToastContext';
import { Badge } from '@/components/ui/badge';

interface UserSessionsListProps {
    userId: string;
}

export function UserSessionsList({ userId }: UserSessionsListProps) {
    const [sessions, setSessions] = useState<LoginSession[]>([]);
    const [loading, setLoading] = useState(true);
    const { addToast } = useToast();
    const currentSessionId = sessionStorage.getItem('unicharm_session_id');

    useEffect(() => {
        loadSessions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    const loadSessions = async () => {
        setLoading(true);
        try {
            const allSessions = await dataService.getActiveSessions();
            const userSessions = allSessions.filter(s => s.userId === userId);
            setSessions(userSessions);
        } catch (error) {
            console.error("Failed to load sessions:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleKillSession = async (sessionId: string) => {
        try {
            await dataService.killSession(sessionId);
            setSessions(prev => prev.filter(s => s.id !== sessionId));
            addToast('success', 'Session terminated successfully');
        } catch (error) {
            console.error(error);
            addToast('error', 'Failed to terminate session');
        }
    };

    if (loading) {
        return <div className="p-4 text-center text-xs text-slate-500 animate-pulse">Scanning active connections...</div>;
    }

    if (sessions.length === 0) {
        return (
            <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-center">
                <p className="text-xs text-slate-500 font-medium">No active connections found</p>
            </div>
        );
    }

    const getDeviceIcon = (type: string) => {
        if (type === 'Mobile') return <Smartphone size={16} className="text-blue-500" />;
        if (type === 'Tablet') return <Tablet size={16} className="text-purple-500" />;
        return <Monitor size={16} className="text-emerald-500" />;
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <ShieldCheck size={14} /> Concurrent Connections ({sessions.length})
                </h3>
            </div>

            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                {sessions.map(session => {
                    const isCurrent = session.id === currentSessionId;

                    return (
                        <div key={session.id} className={`p-3 rounded-lg border flex items-center justify-between transition-colors ${isCurrent
                                ? 'bg-emerald-50/50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-800'
                                : 'bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-700'
                            }`}>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                                    {getDeviceIcon(session.deviceType)}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                            {session.deviceOs} ({session.browser})
                                        </p>
                                        {isCurrent && (
                                            <Badge variant="outline" className="text-[9px] h-4 px-1.5 bg-emerald-100 text-emerald-700 border-none">
                                                This Device
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3 mt-1">
                                        <p className="text-[10px] text-slate-500 font-medium">
                                            Logged in: {formatDistanceToNow(new Date(session.loginTime), { addSuffix: true })}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {!isCurrent && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleKillSession(session.id)}
                                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full"
                                    title="Force Logout"
                                >
                                    <XCircle size={16} />
                                </Button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
