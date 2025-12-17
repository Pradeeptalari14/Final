
import { useState } from "react";
import { SheetData, SheetStatus, User } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlayCircle, Clock, CheckCircle, RefreshCcw } from "lucide-react";

interface LiveOperationsMonitorProps {
    sheets: SheetData[];
    users: User[];
    onRefresh: () => Promise<void>;
}

export function LiveOperationsMonitor({ sheets, users, onRefresh }: LiveOperationsMonitorProps) {
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await onRefresh();
        setIsRefreshing(false);
    };

    // 1. Get Active Sheets
    const activeSheets = sheets.filter(s => s.status !== SheetStatus.COMPLETED);

    // 2. Map Users to Sheets
    const activeOperations = activeSheets.map(sheet => {
        // Find supervisor details if possible (optional, sheet has supervisorName already)
        return {
            id: sheet.id,
            type: sheet.status === SheetStatus.DRAFT ? 'Staging' : 'Loading',
            supervisor: sheet.supervisorName,
            status: sheet.status,
            timestamp: sheet.updatedAt || sheet.createdAt,
            destination: sheet.destination
        };
    });

    if (activeOperations.length === 0) {
        return (
            <Card className="bg-slate-50 dark:bg-slate-900/50 border-dashed">
                <CardContent className="flex flex-col items-center justify-center p-8 text-slate-500">
                    <CheckCircle className="mb-2 opacity-50" size={32} />
                    <p className="font-semibold">All Systems Idle</p>
                    <p className="text-sm">No active workflows currently in progress.</p>
                    <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="mt-4">
                        <RefreshCcw size={16} className={`mr - 2 ${isRefreshing ? 'animate-spin' : ''} `} />
                        Check Again
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="pb-3 border-b border-border flex flex-row items-center justify-between space-y-0">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    Live Operations
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="h-8 w-8 p-0">
                    <RefreshCcw size={16} className={isRefreshing ? 'animate-spin' : ''} />
                    <span className="sr-only">Refresh</span>
                </Button>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y divide-border">
                    {activeOperations.map(op => (
                        <div key={op.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className={`p - 2 rounded - full ${op.type === 'Staging' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20' : 'bg-orange-100 text-orange-600 dark:bg-orange-900/20'} `}>
                                    <PlayCircle size={20} />
                                </div>
                                <div>
                                    <div className="font-bold text-sm flex items-center gap-2">
                                        {op.supervisor}
                                        <Badge variant="outline" className="text-[10px] font-normal h-5">
                                            {op.type}
                                        </Badge>
                                    </div>
                                    <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                                        <span className="font-mono">#{op.id.slice(0, 8)}</span>
                                        <span>•</span>
                                        <span>{op.destination || 'No Dest'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="text-right">
                                <Badge className={`mb - 1 ${op.type === 'Staging' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-orange-500 hover:bg-orange-600'} `}>
                                    {op.status.replace(/_/g, ' ')}
                                </Badge>
                                <div className="text-[10px] text-muted-foreground flex items-center justify-end gap-1">
                                    <Clock size={10} />
                                    {new Date(op.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
