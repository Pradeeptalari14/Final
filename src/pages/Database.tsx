import { useNavigate } from "react-router-dom";
import { useData } from "@/contexts/DataContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Search, Filter, RefreshCw, Download } from "lucide-react";
import { SheetStatus } from "@/types";
import * as XLSX from 'xlsx';

export default function DatabasePage() {
    const { sheets, loading, refreshSheets, loadMoreArchived } = useData();
    const navigate = useNavigate();

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

    const handleExport = () => {
        const exportData = sheets.map(sheet => ({
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
                <h2 className="text-3xl font-bold text-white tracking-tight">Database</h2>
                <p className="text-slate-400">Manage staging and loading sheets.</p>
            </div>
            <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={() => refreshSheets()} className="border-white/10 text-slate-400 hover:text-white">
                    <RefreshCw size={16} />
                </Button>
                <Button variant="outline" onClick={handleExport} className="gap-2 border-white/10 text-green-400 hover:text-green-300 hover:bg-green-500/10">
                    <Download size={16} /> Export
                </Button>
                <Button onClick={() => navigate('/sheets/staging/new')} className="gap-2 bg-blue-600 hover:bg-blue-500">
                    <Plus size={16} /> New Sheet
                </Button>
            </div>


            {/* Filters */}
            <div className="flex gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input
                        className="w-full bg-slate-900/50 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        placeholder="Search sheets..."
                    />
                </div>
                <Button variant="outline" className="gap-2">
                    <Filter size={16} /> Filter
                </Button>
            </div>

            <div className="rounded-xl border border-white/5 overflow-hidden">
                <Table>
                    <TableHeader className="bg-slate-900/50">
                        <TableRow className="hover:bg-transparent">
                            <TableHead>ID</TableHead>
                            <TableHead>Supervisor</TableHead>
                            <TableHead>Destination</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sheets.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24 text-slate-500">
                                    No sheets found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            sheets.map((sheet) => (
                                <TableRow key={sheet.id}>
                                    <TableCell className="font-medium text-white">{sheet.id}</TableCell>
                                    <TableCell>{sheet.supervisorName}</TableCell>
                                    <TableCell>{sheet.destination}</TableCell>
                                    <TableCell>{new Date(sheet.date).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusVariant(sheet.status)}>
                                            {sheet.status.replace(/_/g, ' ')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm">View</Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex justify-center pt-4">
                <Button variant="ghost" onClick={() => loadMoreArchived()} className="text-slate-500 hover:text-white">
                    Load Older Sheets
                </Button>
            </div>
        </div >
    );
}
