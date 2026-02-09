import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export const LiveClock = () => {
    const [t, setT] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => setT(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);
    return (
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg text-slate-600 font-mono text-xs font-bold border border-slate-200 shadow-sm">
            <Clock size={14} className="text-indigo-500" />
            {t.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>
    );
};
