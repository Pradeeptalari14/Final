import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Database,
    Settings,
    Menu,
    Shield,
    LogOut,
    X,
    Users,
    FileText,
    WifiOff,
    BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAppState } from '@/contexts/AppStateContext';
import { Role, User, AppSettings } from '@/types';
import { t } from '@/lib/i18n';
import { NotificationBell } from '@/components/ui/NotificationBell';

export default function RootLayout() {
    const { currentUser, isOnline } = useData();
    const { devRole, setDevRole, settings, updateSettings } = useAppState();
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
        if (mobileOpen) {
            queueMicrotask(() => setMobileOpen(false));
        }
    }, [location.pathname, mobileOpen]);

    const handleSignOut = () => {
        setDevRole(null); // Force null to trigger redirect
    };

    // Determine Admin Label based on Role
    const adminLabel =
        currentUser?.role === Role.SHIFT_LEAD
            ? t('shift_lead', settings.language)
            : currentUser?.role === Role.STAGING_SUPERVISOR
                ? t('staging', settings.language)
                : currentUser?.role === Role.LOADING_SUPERVISOR
                    ? t('loading', settings.language)
                    : t('admin', settings.language);

    return (
        <div className="flex h-screen w-full bg-slate-50 dark:bg-background text-foreground overflow-hidden font-sans selection:bg-primary/30 print:h-auto print:overflow-visible transition-colors duration-300">
            {/* DESKTOP SIDEBAR (Hidden on mobile) */}
            <aside
                className={cn(
                    'hidden md:flex relative z-20 flex-col bg-white dark:bg-slate-900/80 backdrop-blur-xl transition-all duration-300 print:hidden border border-slate-200 dark:border-white/5 m-3 rounded-[32px] shadow-2xl',
                    collapsed ? 'w-20' : 'w-64'
                )}
            >
                <SidebarContent
                    collapsed={collapsed}
                    settings={settings}
                    currentUser={currentUser}
                    adminLabel={adminLabel}
                    location={location}
                    handleSignOut={handleSignOut}
                />
            </aside>

            {/* MOBILE SIDEBAR (Drawer) */}
            {mobileOpen && (
                <div className="fixed inset-0 z-50 md:hidden">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setMobileOpen(false)}
                    />
                    {/* Drawer */}
                    <aside className="absolute left-0 top-0 bottom-0 w-3/4 max-w-xs bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-white/10 shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
                        <SidebarContent
                            isMobile={true}
                            collapsed={collapsed}
                            settings={settings}
                            currentUser={currentUser}
                            adminLabel={adminLabel}
                            location={location}
                            handleSignOut={handleSignOut}
                            setMobileOpen={setMobileOpen}
                        />
                    </aside>
                </div>
            )}

            {/* Main Content */}
            <main className="flex-1 relative overflow-hidden flex flex-col print:h-auto print:overflow-visible">
                {/* Offline Banner */}
                {!isOnline && (
                    <div className="bg-red-500 text-white text-[10px] py-1 px-4 flex items-center justify-center gap-2 animate-in slide-in-from-top duration-300">
                        <WifiOff size={12} />
                        <span className="font-bold uppercase tracking-wider">
                            {t('offline_mode', settings.language)} - Data Sync Paused
                        </span>
                    </div>
                )}
                {/* Header */}
                <header className="h-16 bg-background/50 backdrop-blur flex items-center justify-between px-4 print:hidden shrink-0">
                    {/* Mobile Menu Toggle */}
                    <button
                        onClick={() => setMobileOpen(true)}
                        className="md:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <Menu size={24} />
                    </button>

                    {/* Desktop Collapse Toggle */}
                    <button
                        onClick={() => updateSettings({ sidebarCollapsed: !collapsed })}
                        className="hidden md:block p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <Menu size={20} />
                    </button>

                    <div className="flex items-center gap-4">
                        <NotificationBell />
                        <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center overflow-hidden border border-border">
                            <img
                                src="/unicharm-logo.png"
                                alt="Profile"
                                className="w-full h-full object-contain p-1"
                            />
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

interface SidebarContentProps {
    isMobile?: boolean;
    collapsed: boolean;
    settings: AppSettings;
    currentUser: User | null;
    adminLabel: string;
    location: { pathname: string; search: string };
    handleSignOut: () => void;
    setMobileOpen?: (open: boolean) => void;
}

function SidebarContent({
    isMobile = false,
    collapsed,
    settings,
    currentUser,
    adminLabel,
    location,
    handleSignOut,
    setMobileOpen
}: SidebarContentProps) {
    return (
        <>
            <div className="h-16 flex items-center px-6">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 flex items-center justify-center">
                        <img
                            src="/unicharm-logo.png"
                            alt="Logo"
                            className="w-full h-full object-contain"
                        />
                    </div>
                    {(!collapsed || isMobile) && (
                        <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white uppercase">
                            Unicharm
                        </span>
                    )}
                </div>
                {isMobile && setMobileOpen && (
                    <button
                        onClick={() => setMobileOpen(false)}
                        className="ml-auto text-muted-foreground hover:text-foreground"
                    >
                        <X size={24} />
                    </button>
                )}
            </div>

            <nav className="flex-1 p-4 pt-1 space-y-2 overflow-y-auto overflow-x-hidden custom-scrollbar">

                <NavItem
                    to="/"
                    icon={LayoutDashboard}
                    label={t('dashboard', settings.language)}
                    collapsed={collapsed && !isMobile}
                    active={location.pathname === '/'}
                />

                {/* USERS (Admin Only) */}
                {currentUser?.role === Role.ADMIN && (
                    <NavItem
                        to="/admin?section=users"
                        icon={Users}
                        label={t('users', settings.language)}
                        collapsed={collapsed && !isMobile}
                        active={
                            location.pathname === '/admin' &&
                            location.search.includes('section=users')
                        }
                    />
                )}

                {/* ADMIN DASHBOARD (Shield) */}
                <NavItem
                    to="/admin"
                    icon={Shield}
                    label={adminLabel}
                    collapsed={collapsed && !isMobile}
                    active={
                        location.pathname === '/admin' &&
                        !location.search.includes('section=users') &&
                        !location.search.includes('section=audit_logs') &&
                        !location.search.includes('section=reports')
                    }
                />

                {/* SETTINGS */}
                <NavItem
                    to="/settings"
                    icon={Settings}
                    label={t('settings', settings.language)}
                    collapsed={collapsed && !isMobile}
                    active={location.pathname === '/settings'}
                />

                {/* AUDIT LOGS */}
                {(currentUser?.role === Role.ADMIN || currentUser?.role === Role.SHIFT_LEAD) && (
                    <NavItem
                        to="/admin?section=audit_logs"
                        icon={FileText}
                        label={t('audit_logs', settings.language)}
                        collapsed={collapsed && !isMobile}
                        active={
                            location.pathname === '/admin' &&
                            location.search.includes('section=audit_logs')
                        }
                    />
                )}

                <NavItem
                    to="/reports"
                    icon={BarChart3}
                    label={t('reports', settings.language)}
                    collapsed={collapsed && !isMobile}
                    active={location.pathname === '/reports'}
                />

                {/* DATABASE (Moving to bottom as it was omitted from priority list but essential) */}
                <NavItem
                    to="/database"
                    icon={Database}
                    label={t('database', settings.language)}
                    collapsed={collapsed && !isMobile}
                    active={location.pathname === '/database'}
                />
            </nav>

            <div className="p-4 mt-auto">
                <div className={cn(
                    "flex items-center gap-0 p-1.5 rounded-full transition-all duration-500 group relative bg-white dark:bg-slate-900 border border-transparent",
                    collapsed && !isMobile ? "justify-center" : "hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:border-slate-100 dark:hover:border-white/5 hover:shadow-sm hover:w-full w-12 overflow-hidden mx-auto lg:mx-0"
                )}>
                    {/* Circle Initials */}
                    <div
                        className="h-9 w-9 rounded-full bg-indigo-600 flex items-center justify-center text-white shrink-0 font-black text-xs shadow-lg shadow-indigo-500/20 z-10"
                    >
                        {currentUser?.fullName?.charAt(0) || currentUser?.username?.charAt(0) || 'U'}
                    </div>

                    {/* Revealable Info & Logout (Only in expanded sidebar) */}
                    {(!collapsed || isMobile) && (
                        <div className="flex items-center justify-between min-w-0 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none group-hover:pointer-events-auto ml-3 w-0 group-hover:w-full transform group-hover:translate-x-0 -translate-x-4">
                            <div className="min-w-0 pr-2">
                                <p className="text-[11px] font-black text-slate-900 dark:text-white truncate tracking-tight">
                                    {currentUser?.fullName || currentUser?.username}
                                </p>
                                <p className="text-[8px] text-indigo-500 dark:text-indigo-400 font-black uppercase tracking-widest truncate">
                                    {currentUser?.role?.replace('_', ' ') || 'User'}
                                </p>
                            </div>

                            <button
                                onClick={handleSignOut}
                                className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all shrink-0 ml-auto"
                                title={t('sign_out', settings.language)}
                            >
                                <LogOut size={14} />
                            </button>
                        </div>
                    )}

                    {/* Floating Tooltip Only for Collapsed Sidebar */}
                    {collapsed && !isMobile && (
                        <div className="absolute left-full ml-4 px-3 py-2 bg-slate-900 text-white text-xs rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-[100] shadow-2xl border border-white/10 transition-all scale-95 group-hover:scale-100 origin-left flex items-center gap-3">
                            <div>
                                <p className="font-black text-[11px]">{currentUser?.fullName || currentUser?.username}</p>
                                <p className="text-[8px] text-indigo-400 font-bold uppercase tracking-[0.2em]">{currentUser?.role?.replace('_', ' ')}</p>
                            </div>
                            <div className="h-4 w-[1px] bg-white/20" />
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleSignOut();
                                }}
                                className="text-[9px] font-black uppercase text-rose-400 hover:text-rose-300 pointer-events-auto"
                            >
                                Sign Out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

function NavItem({
    to,
    icon: Icon,
    label,
    collapsed,
    active
}: {
    to: string;
    icon: React.ElementType;
    label: string;
    collapsed: boolean;
    active?: boolean;
}) {
    return (
        <NavLink
            to={to}
            className={({ isActive }) =>
                cn(
                    'flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group relative',
                    (active !== undefined ? active : isActive)
                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/10',
                    collapsed && 'justify-center'
                )
            }
        >
            <Icon
                size={20}
                className={cn(
                    'transition-transform group-hover:scale-110',
                    collapsed ? 'mx-auto' : ''
                )}
            />
            {!collapsed && <span className="font-medium truncate uppercase tracking-wider text-xs md:text-sm">{label}</span>}
            {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 border border-border">
                    {label}
                </div>
            )}
        </NavLink>
    );
}


