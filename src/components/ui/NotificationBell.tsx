import { useMemo, useState } from 'react';
import { Bell, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react'; // Changed AlertCircle to AlertTriangle
import { SheetStatus, Role, SheetData } from '@/types';
import { useData } from '@/contexts/DataContext';
import { useAppState } from '@/contexts/AppStateContext';
import { useNavigate } from 'react-router-dom';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { t } from '@/lib/i18n';

export function NotificationBell() {
    const { sheets, currentUser } = useData();
    const { settings } = useAppState();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);

    const notifications = useMemo(() => {
        if (!currentUser) return [];

        return sheets
            .filter((sheet) => {
                // 1. Rejected Staging Sheets (For Staging Supervisor)
                if (currentUser.role === Role.STAGING_SUPERVISOR) {
                    // If I submitted it (or it belongs to staging flow) and it is rejected back to draft
                    // Assuming global visibility for team, so show all rejected drafts
                    return sheet.status === SheetStatus.DRAFT && !!sheet.rejectionReason;
                }

                // 2. Rejected Loading Sheets (For Loading Supervisor)
                if (currentUser.role === Role.LOADING_SUPERVISOR) {
                    // If it was rejected during loading verification
                    // It goes back to LOCKED usually (or Loading Pending?) - Logic depends on reject flow
                    // Based on standard flow: Locked -> Loading Pending -> (Reject) -> Locked
                    return sheet.status === SheetStatus.LOCKED && !!sheet.rejectionReason;
                }

                // 3. Pending Approvals (For Shift Lead / Admin)
                if (currentUser.role === Role.SHIFT_LEAD || currentUser.role === Role.ADMIN) {
                    return (
                        sheet.status === SheetStatus.STAGING_VERIFICATION_PENDING ||
                        sheet.status === SheetStatus.LOADING_VERIFICATION_PENDING
                    );
                }

                return false;
            })
            .sort(
                (a, b) =>
                    new Date(b.updatedAt || b.createdAt).getTime() -
                    new Date(a.updatedAt || a.createdAt).getTime()
            );
    }, [sheets, currentUser]);

    const handleItemClick = (sheet: SheetData) => {
        setOpen(false);
        const isStaging =
            sheet.status === SheetStatus.DRAFT ||
            sheet.status === SheetStatus.STAGING_VERIFICATION_PENDING;
        // Logic to determine path
        if (isStaging) {
            navigate(`/sheets/staging/${sheet.id}`);
        } else {
            navigate(`/sheets/loading/${sheet.id}`);
        }
    };

    if (notifications.length === 0) {
        return (
            <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground opacity-50 relative"
            >
                <Bell size={20} />
            </Button>
        );
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground relative"
                >
                    <Bell size={20} className={cn('transition-transform', open && 'rotate-12')} />
                    <span className="absolute top-1 right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-white dark:border-slate-950 flex items-center justify-center">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    </span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 mr-4" align="end">
                <div className="p-4 border-b border-border bg-muted/30">
                    <div className="flex items-center justify-between">
                        <h4 className="font-semibold">{t('notifications', settings.language)}</h4>
                        <Badge
                            variant="secondary"
                            className="bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300"
                        >
                            {notifications.length} {t('new', settings.language)}
                        </Badge>
                    </div>
                </div>
                <ScrollArea className="h-[300px]">
                    <div className="flex flex-col p-2 gap-1">
                        {notifications.map((sheet) => (
                            <button
                                key={sheet.id}
                                onClick={() => handleItemClick(sheet)}
                                className="flex items-start gap-3 p-3 text-left rounded-lg hover:bg-muted/50 transition-colors group relative overflow-hidden"
                            >
                                <div
                                    className={cn(
                                        'mt-1 p-1.5 rounded-full shrink-0',
                                        sheet.rejectionReason
                                            ? 'bg-red-100 text-red-600'
                                            : 'bg-blue-100 text-blue-600'
                                    )}
                                >
                                    {sheet.rejectionReason ? (
                                        <AlertTriangle size={14} />
                                    ) : (
                                        <CheckCircle size={14} />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <span className="font-medium text-sm truncate">
                                            Sheet #{sheet.id}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                                            {new Date(
                                                sheet.updatedAt || sheet.createdAt
                                            ).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                    <div className="text-xs text-muted-foreground truncate mt-0.5">
                                        {sheet.rejectionReason
                                            ? `Rejected: ${sheet.rejectionReason}`
                                            : 'Awaiting your approval'}
                                    </div>
                                    <div className="flex items-center gap-1 mt-2 text-[10px] font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                        Review Now <ArrowRight size={10} />
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </ScrollArea>
                <div className="p-2 border-t border-border bg-muted/30 text-center">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full h-8 text-xs text-muted-foreground"
                        onClick={() => setOpen(false)}
                    >
                        {t('mark_all_read', settings.language)}
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
