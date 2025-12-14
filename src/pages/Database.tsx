import { useNavigate, useSearchParams } from "react-router-dom";
import { useData } from "@/contexts/DataContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Search, Filter, RefreshCw, Download, X } from "lucide-react";
import { SheetStatus } from "@/types";
import * as XLSX from 'xlsx';

export default function DatabasePage() {
    const { sheets, loading, refreshSheets, loadMoreArchived } = useData();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeFilter = searchParams.get('filter');

    if (loading) return <div className="p-8 text-slate-400">Loading Database...</div>;

    const getStatusVariant = (status: SheetStatus) => {
        switch (status) {
            case SheetStatus.COMPLETED: return "success";
            case SheetStatus.LOCKED: return "info";
            case SheetStatus.STAGING_VERIFICATION_PENDING: return "warning";
            case SheetStatus.LOADING_VERIFICATION_PENDING: return "warning";
            default: return "secondary";
        }
    };

    // Filter Logic
    const filteredSheets = sheets.filter(sheet => {
        if (!activeFilter) return true;

        // Exact Status Match
        if (Object.values(SheetStatus).includes(activeFilter as SheetStatus)) {
            return sheet.status === activeFilter;
        }

        // Custom Filters for Shift Lead Dashboard
        if (activeFilter === 'REJECTED_STAGING') {
            return (sheet.status === SheetStatus.DRAFT || sheet.status === SheetStatus.STAGING_VERIFICATION_PENDING) &&
                sheet.rejectionReason && sheet.rejectionReason.trim() !== '';
        }
        if (activeFilter === 'REJECTED_LOADING') {
            return (sheet.status === SheetStatus.LOCKED || sheet.status === SheetStatus.LOADING_VERIFICATION_PENDING) &&
                sheet.rejectionReason && sheet.rejectionReason.trim() !== '';
        }

        // Add more custom filters as needed (e.g., READY, LOCKED for Admin if not handled by status)
        if (activeFilter === 'READY') return sheet.status === SheetStatus.LOCKED;

        return true;
    });

    const clearFilter = () => {
        setSearchParams({});
    };

    const handleExport = () => {
        const exportData = filteredSheets.map(sheet => ({
            ID: sheet.id,
            Date: new Date(sheet.date).toLocaleDateString(),
            Supervisor: sheet.supervisorName,
            Destination: sheet.destination,
            Vehicle: sheet.vehicleNo || 'N/A',
            Status: sheet.status,
            Cases: sheet.stagingItems?.reduce((acc, item) => acc + (item.ttlCases || 0), 0) || 0
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Operations");
        XLSX.writeFile(wb, "operations_data.xlsx");
    };

    return (
        <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-foreground tracking-tight">Database</h2>
                    <p className="text-muted-foreground">Manage staging and loading sheets.</p>
                </div>
                {activeFilter && (
                    <Button variant="ghost" onClick={clearFilter} className="text-red-400 hover:text-red-300 hover:bg-red-900/10 gap-2">
                        <X size={16} /> Clear Filter
                    </Button>
                )}
            </div>
            <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={() => refreshSheets()} className="border-border text-muted-foreground hover:text-foreground">
                    <RefreshCw size={16} />
                </Button>
                <Button variant="outline" onClick={handleExport} className="gap-2 border-border text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10">
                    <Download size={16} /> Export
                </Button>
                <Button onClick={() => navigate('/sheets/staging/new')} className="gap-2 bg-blue-600 hover:bg-blue-500">
                    <Plus size={16} /> New Sheet
                </Button>
            </div>


            {/* Filters */}
            <div className="flex gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                    <input
                        className="w-full bg-background border border-input rounded-lg pl-10 pr-4 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        placeholder="Search sheets..."
                    />
                </div>
                <Button variant="outline" className="gap-2">
                    <Filter size={16} /> Filter
                </Button>
            </div>

            <div className="rounded-xl border border-border overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="text-foreground font-bold">ID</TableHead>
                            <TableHead className="text-foreground font-bold">Supervisor</TableHead>
                            <TableHead className="text-foreground font-bold">Destination</TableHead>
                            <TableHead className="text-foreground font-bold">Date</TableHead>
                            <TableHead className="text-foreground font-bold">Status</TableHead>
                            <TableHead className="text-right text-foreground font-bold">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredSheets.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24 text-slate-500">
                                    No sheets found matching filter.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredSheets.map((sheet) => (
                                <TableRow
                                    key={sheet.id}
                                    className="cursor-pointer hover:bg-white/5"
                                    onClick={() => {
                                        const isStaging = sheet.status === SheetStatus.DRAFT || sheet.status === SheetStatus.STAGING_VERIFICATION_PENDING;
                                        navigate(isStaging ? `/sheets/staging/${sheet.id}` : `/sheets/loading/${sheet.id}`);
                                    }}
                                >
                                    <TableCell className="font-medium text-foreground">{sheet.id}</TableCell>
                                    <TableCell>{sheet.supervisorName}</TableCell>
                                    <TableCell>{sheet.destination}</TableCell>
                                    <TableCell>{new Date(sheet.date).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={getStatusVariant(sheet.status)}>
                                                {sheet.status.replace(/_/g, ' ')}
                                            </Badge>
                                            {sheet.rejectionReason && (
                                                <Badge variant="destructive" className="text-[10px] px-1.5 py-0.5">REJECTED</Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const isStaging = sheet.status === SheetStatus.DRAFT || sheet.status === SheetStatus.STAGING_VERIFICATION_PENDING;
                                                navigate(isStaging ? `/sheets/staging/${sheet.id}` : `/sheets/loading/${sheet.id}`);
                                            }}
                                        >
                                            View
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex justify-center pt-4">
                <Button variant="ghost" onClick={() => loadMoreArchived()} className="text-slate-500 hover:text-slate-900">
                    Load Older Sheets
                </Button>
            </div>
        </div >
    );
}
