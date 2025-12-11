import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Database, Settings, LogOut, Menu, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function RootLayout() {
    const [collapsed, setCollapsed] = useState(false);
    const { session, loading, signOut } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && !session) {
            navigate('/login');
        }
    }, [session, loading, navigate]);

    if (loading) return <div className="h-screen w-full flex items-center justify-center bg-slate-950 text-slate-400">Loading...</div>;

    return (
        <div className="flex h-screen w-full bg-slate-950 text-slate-200 overflow-hidden font-sans selection:bg-blue-500/30 print:h-auto print:overflow-visible">
            {/* Sidebar */}
            <aside className={cn(
                "relative z-20 flex flex-col border-r border-white/5 bg-slate-900/80 backdrop-blur-xl transition-all duration-300 print:hidden",
                collapsed ? "w-20" : "w-64"
            )}>
                <div className="h-16 flex items-center px-6 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xl">
                            U
                        </div>
                        {!collapsed && <span className="font-bold text-lg tracking-tight text-white">Unicharm</span>}
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <NavItem to="/" icon={LayoutDashboard} label="Dashboard" collapsed={collapsed} />
                    <NavItem to="/database" icon={Database} label="Database" collapsed={collapsed} />
                    <NavItem to="/admin" icon={Shield} label="Admin" collapsed={collapsed} />
                    <NavItem to="/settings" icon={Settings} label="Settings" collapsed={collapsed} />
                </nav>

                <div className="p-4 border-t border-white/5">
                    <button onClick={signOut} className="flex items-center gap-3 w-full p-3 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-all">
                        <LogOut size={20} />
                        {!collapsed && <span className="font-medium">Sign Out</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 relative overflow-hidden flex flex-col print:h-auto print:overflow-visible">
                {/* Header */}
                <header className="h-16 border-b border-white/5 bg-slate-900/50 backdrop-blur flex items-center justify-between px-8 print:hidden">
                    <button onClick={() => setCollapsed(!collapsed)} className="p-2 -ml-2 text-slate-400 hover:text-white transition-colors">
                        <Menu size={20} />
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="h-8 w-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-xs font-bold text-white">
                            {session?.user.email?.[0].toUpperCase()}
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="flex-1 overflow-auto bg-grid-white/[0.02] print:overflow-visible">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}

function NavItem({ to, icon: Icon, label, collapsed }: { to: string, icon: React.ElementType, label: string, collapsed: boolean }) {
    return (
        <NavLink
            to={to}
            className={({ isActive }) => cn(
                "flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group",
                isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
            )}
        >
            <Icon size={20} className={cn("transition-transform group-hover:scale-110", collapsed && "mx-auto")} />
            {!collapsed && <span className="font-medium">{label}</span>}
        </NavLink>
    );
}
