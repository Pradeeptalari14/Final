import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Database, Settings, Menu, Shield, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { useData } from '@/contexts/DataContext';
import { Role } from '@/types';

export default function RootLayout() {
    const { devRole, setDevRole, currentUser, settings, updateSettings } = useData();
    const navigate = useNavigate();

    const collapsed = settings.sidebarCollapsed;

    useEffect(() => {
        if (!devRole) {
            navigate('/login');
        }
    }, [devRole, navigate]);

    const handleSignOut = () => {
        setDevRole(null as any); // Force null to trigger redirect
    };

    // Determine Admin Label based on Role
    const adminLabel = currentUser?.role === Role.SHIFT_LEAD ? "Shift Lead"
        : currentUser?.role === Role.STAGING_SUPERVISOR ? "Staging"
            : currentUser?.role === Role.LOADING_SUPERVISOR ? "Loading"
                : "Admin";

    return (
        <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans selection:bg-primary/30 print:h-auto print:overflow-visible transition-colors duration-300">
            {/* Sidebar */}
            <aside className={cn(
                "relative z-20 flex flex-col border-r border-border bg-card/80 backdrop-blur-xl transition-all duration-300 print:hidden",
                collapsed ? "w-20" : "w-64"
            )}>
                <div className="h-16 flex items-center px-6 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 flex items-center justify-center">
                            <img src="/unicharm-logo.png" alt="Logo" className="w-full h-full object-contain" />
                        </div>
                        {!collapsed && <span className="font-bold text-lg tracking-tight text-foreground">Unicharm</span>}
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <NavItem to="/" icon={LayoutDashboard} label="Dashboard" collapsed={collapsed} />
                    <NavItem to="/database" icon={Database} label="Database" collapsed={collapsed} />
                    <NavItem to="/admin" icon={Shield} label={adminLabel} collapsed={collapsed} />
                    <NavItem to="/settings" icon={Settings} label="Settings" collapsed={collapsed} />
                </nav>

                <div className="p-4 border-t border-border">
                    <button onClick={handleSignOut} className="flex items-center gap-3 w-full p-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/10 transition-all">
                        <LogOut size={20} />
                        {!collapsed && <span className="font-medium">Sign Out</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 relative overflow-hidden flex flex-col print:h-auto print:overflow-visible">
                {/* Header */}
                <header className="h-16 border-b border-border bg-background/50 backdrop-blur flex items-center justify-between px-8 print:hidden">
                    <button onClick={() => updateSettings({ sidebarCollapsed: !collapsed })} className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors">
                        <Menu size={20} />
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center overflow-hidden">
                            <img src="/unicharm-logo.png" alt="Profile" className="w-full h-full object-contain p-1" />
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
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/10"
            )}
        >
            <Icon size={20} className={cn("transition-transform group-hover:scale-110", collapsed && "mx-auto")} />
            {!collapsed && <span className="font-medium">{label}</span>}
        </NavLink>
    );
}
