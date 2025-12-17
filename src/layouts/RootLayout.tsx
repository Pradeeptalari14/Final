import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Database, Settings, Menu, Shield, LogOut, X, Users, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { Role } from '@/types';

export default function RootLayout() {
    const { devRole, setDevRole, currentUser, settings, updateSettings } = useData();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);

    const collapsed = settings.sidebarCollapsed;

    useEffect(() => {
        if (!devRole) {
            navigate('/login');
        }
    }, [devRole, navigate]);

    // Close mobile menu on route change
    useEffect(() => {
        setMobileOpen(false);
    }, [location.pathname]);

    const handleSignOut = () => {
        setDevRole(null as any); // Force null to trigger redirect
    };

    // Determine Admin Label based on Role
    const adminLabel = currentUser?.role === Role.SHIFT_LEAD ? "Shift Lead"
        : currentUser?.role === Role.STAGING_SUPERVISOR ? "Staging"
            : currentUser?.role === Role.LOADING_SUPERVISOR ? "Loading"
                : "Admin";

    const SidebarContent = ({ isMobile = false }) => (
        <>
            <div className="h-16 flex items-center px-6 border-b border-border">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 flex items-center justify-center">
                        <img src="/unicharm-logo.png" alt="Logo" className="w-full h-full object-contain" />
                    </div>
                    {(!collapsed || isMobile) && <span className="font-bold text-lg tracking-tight text-foreground">Unicharm</span>}
                </div>
                {isMobile && (
                    <button onClick={() => setMobileOpen(false)} className="ml-auto text-muted-foreground hover:text-foreground">
                        <X size={24} />
                    </button>
                )}
            </div>

            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                <NavItem
                    to="/"
                    icon={LayoutDashboard}
                    label="Dashboard"
                    collapsed={collapsed && !isMobile}
                    active={location.pathname === '/'}
                />
                <NavItem
                    to="/database"
                    icon={Database}
                    label="Database"
                    collapsed={collapsed && !isMobile}
                    active={location.pathname === '/database'}
                />
                <NavItem
                    to="/admin"
                    icon={Shield}
                    label={adminLabel}
                    collapsed={collapsed && !isMobile}
                    active={location.pathname === '/admin' && !location.search.includes('tab=users') && !location.search.includes('tab=audit_logs')}
                />
                <NavItem
                    to="/settings"
                    icon={Settings}
                    label="Settings"
                    collapsed={collapsed && !isMobile}
                    active={location.pathname === '/settings'}
                />

                {/* ADMIN ONLY EXTENSIONS */}
                {currentUser?.role === Role.ADMIN && (
                    <NavItem
                        to="/admin?tab=users"
                        icon={Users}
                        label="Users"
                        collapsed={collapsed && !isMobile}
                        active={location.pathname === '/admin' && location.search.includes('tab=users')}
                    />
                )}

                {(currentUser?.role === Role.ADMIN || currentUser?.role === Role.SHIFT_LEAD) && (
                    <NavItem
                        to="/admin?tab=audit_logs"
                        icon={FileText}
                        label="Audit Logs"
                        collapsed={collapsed && !isMobile}
                        active={location.pathname === '/admin' && location.search.includes('tab=audit_logs')}
                    />
                )}
            </nav>



            <div className="p-4 border-t border-border mt-auto">
                <button onClick={handleSignOut} className="flex items-center gap-3 w-full p-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/10 transition-all">
                    <LogOut size={20} />
                    {(!collapsed || isMobile) && <span className="font-medium">Sign Out</span>}
                </button>
            </div>
        </>
    );

    return (
        <div className="flex h-screen w-full bg-slate-50 dark:bg-background text-foreground overflow-hidden font-sans selection:bg-primary/30 print:h-auto print:overflow-visible transition-colors duration-300">

            {/* DESKTOP SIDEBAR (Hidden on mobile) */}
            <aside className={cn(
                "hidden md:flex relative z-20 flex-col border-r border-border bg-card/80 backdrop-blur-xl transition-all duration-300 print:hidden",
                collapsed ? "w-20" : "w-64"
            )}>
                <SidebarContent />
            </aside>

            {/* MOBILE SIDEBAR (Drawer) */}
            {mobileOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
                    {/* Drawer */}
                    <aside className="absolute left-0 top-0 bottom-0 w-3/4 max-w-xs bg-card border-r border-border shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
                        <SidebarContent isMobile={true} />
                    </aside>
                </div>
            )}

            {/* Main Content */}
            <main className="flex-1 relative overflow-hidden flex flex-col print:h-auto print:overflow-visible">
                {/* Header */}
                <header className="h-16 border-b border-border bg-background/50 backdrop-blur flex items-center justify-between px-4 md:px-8 print:hidden shrink-0">

                    {/* Mobile Menu Toggle */}
                    <button onClick={() => setMobileOpen(true)} className="md:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors">
                        <Menu size={24} />
                    </button>

                    {/* Desktop Collapse Toggle */}
                    <button onClick={() => updateSettings({ sidebarCollapsed: !collapsed })} className="hidden md:block p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors">
                        <Menu size={20} />
                    </button>

                    <div className="flex items-center gap-4">
                        <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center overflow-hidden border border-border">
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

function NavItem({ to, icon: Icon, label, collapsed, active }: { to: string, icon: React.ElementType, label: string, collapsed: boolean, active?: boolean }) {
    return (
        <NavLink
            to={to}
            className={({ isActive }) => cn(
                "flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group relative",
                (active !== undefined ? active : isActive)
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/10",
                collapsed && "justify-center"
            )}
        >
            <Icon size={20} className={cn("transition-transform group-hover:scale-110", collapsed ? "mx-auto" : "")} />
            {!collapsed && <span className="font-medium truncate">{label}</span>}
            {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 border border-border">
                    {label}
                </div>
            )}
        </NavLink>
    );
}
