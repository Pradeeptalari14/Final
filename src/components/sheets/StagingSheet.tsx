import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { SheetData, SheetStatus, StagingItem, Role } from '@/types';
import { Badge } from '@/components/ui/badge';

const EMPTY_ITEM: StagingItem = {
    srNo: 0,
    skuName: '',
    casesPerPlt: 0,
    fullPlt: 0,
    loose: 0,
    ttlCases: 0
};

export default function StagingSheet() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addSheet, updateSheet, sheets } = useData();
    const { session, user } = useAuth();

    const [formData, setFormData] = useState<Partial<SheetData>>({
        shift: 'A',
        date: new Date().toISOString().split('T')[0],
        destination: '',
        supervisorName: user?.user_metadata?.fullName || '',
        loadingDoc: '',
        stagingItems: Array.from({ length: 5 }, (_, i) => ({ ...EMPTY_ITEM, srNo: i + 1 })),
        status: SheetStatus.DRAFT
    });

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (id && id !== 'new') {
            const existing = sheets.find(s => s.id === id);
            if (existing) setFormData(existing);
        }
    }, [id, sheets]);

    const handleSave = async () => {
        setLoading(true);
        try {
            const sheetToSave: SheetData = {
                ...formData as SheetData,
                id: formData.id || Date.now().toString(),
                createdBy: formData.createdBy || session?.user.email || 'system',
                createdAt: formData.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                stagingItems: formData.stagingItems?.filter(i => i.skuName) || []
            };

            if (id === 'new' || !formData.id) {
                await addSheet(sheetToSave);
            } else {
                await updateSheet(sheetToSave);
            }
            navigate('/database');
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const updateItem = (index: number, field: keyof StagingItem, value: string | number) => {
        const newItems = [...(formData.stagingItems || [])];
        newItems[index] = { ...newItems[index], [field]: value };

        // Auto-calc Total
        if (field === 'fullPlt' || field === 'casesPerPlt' || field === 'loose') {
            const item = newItems[index];
            const cases = Number(item.casesPerPlt) || 0;
            const full = Number(item.fullPlt) || 0;
            const loose = Number(item.loose) || 0;
            newItems[index].ttlCases = (cases * full) + loose;
        }

        setFormData({ ...formData, stagingItems: newItems });
    };

    return (
        <div className="pb-20">
            {/* Printable View - Hidden by default, visible only when printing */}
            <div className="hidden print:block">
                <PrintableStagingSheet data={formData} />
            </div>

            {/* Standard UI - Hidden when printing */}
            <div className="print:hidden p-4 md:p-8 max-w-5xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
                        <ArrowLeft size={16} /> Back
                    </Button>
                    <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-sm px-3 py-1 bg-slate-900 border-white/10">
                            {formData.status}
                        </Badge>
                        <Button variant="outline" onClick={() => window.print()} className="gap-2 border-white/10">
                            <Printer size={16} /> Print
                        </Button>
                        <Button onClick={handleSave} disabled={loading} className="gap-2 bg-emerald-600 hover:bg-emerald-500">
                            <Save size={16} /> {loading ? 'Saving...' : 'Save Sheet'}
                        </Button>
                    </div>
                </div>

                {/* Rejection/Comments History */}
                {formData.comments && formData.comments.length > 0 && (
                    <Card className="border-red-500/20 bg-red-950/10">
                        <CardHeader>
                            <CardTitle className="text-red-400 text-sm">Feedback / Rejection History</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {formData.comments.map((comment, i) => (
                                <div key={i} className="text-sm border-l-2 border-red-500/30 pl-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-semibold text-slate-200">{comment.author}</span>
                                        <span className="text-slate-500 text-xs">
                                            {new Date(comment.timestamp).toLocaleString()}
                                        </span>
                                    </div>
                                    <p className="text-slate-300">{comment.text}</p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}

                <Card className="border-white/5 bg-slate-900/40">
                    <CardHeader>
                        <CardTitle>Sheet Details</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-slate-400 uppercase">Supervisor Name</label>
                            <input
                                value={formData.supervisorName}
                                onChange={(e) => setFormData({ ...formData, supervisorName: e.target.value })}
                                className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-slate-400 uppercase">Destination</label>
                            <input
                                value={formData.destination}
                                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                                className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-slate-400 uppercase">Date</label>
                            <input
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-white"
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-white/5 bg-slate-900/40">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Staging Items</CardTitle>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setFormData({ ...formData, stagingItems: [...(formData.stagingItems || []), { ...EMPTY_ITEM, srNo: (formData.stagingItems?.length || 0) + 1 }] })}
                        >
                            <Plus size={16} /> Add Item
                        </Button>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-400 uppercase bg-slate-950/50">
                                <tr>
                                    <th className="px-4 py-3 rounded-l-lg">SKU Name</th>
                                    <th className="px-4 py-3 text-center">Cases/Plt</th>
                                    <th className="px-4 py-3 text-center">Full Plt</th>
                                    <th className="px-4 py-3 text-center">Loose Cases</th>
                                    <th className="px-4 py-3 text-center rounded-r-lg">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {formData.stagingItems?.map((item, index) => (
                                    <tr key={index} className="group hover:bg-white/5">
                                        <td className="px-2 py-2">
                                            <input
                                                value={item.skuName}
                                                onChange={(e) => updateItem(index, 'skuName', e.target.value)}
                                                placeholder="Enter SKU..."
                                                className="w-full bg-transparent border-none focus:ring-0 text-white placeholder-slate-600"
                                            />
                                        </td>
                                        <td className="px-2 py-2">
                                            <input
                                                type="number"
                                                value={item.casesPerPlt}
                                                onChange={(e) => updateItem(index, 'casesPerPlt', e.target.value)}
                                                className="w-full bg-transparent border-none focus:ring-0 text-white text-center"
                                            />
                                        </td>
                                        <td className="px-2 py-2">
                                            <input
                                                type="number"
                                                value={item.fullPlt}
                                                onChange={(e) => updateItem(index, 'fullPlt', e.target.value)}
                                                className="w-full bg-transparent border-none focus:ring-0 text-white text-center"
                                            />
                                        </td>
                                        <td className="px-2 py-2">
                                            <input
                                                type="number"
                                                value={item.loose}
                                                onChange={(e) => updateItem(index, 'loose', e.target.value)}
                                                className="w-full bg-transparent border-none focus:ring-0 text-white text-center bg-yellow-500/10 rounded"
                                            />
                                        </td>
                                        <td className="px-4 py-2 text-center font-bold text-emerald-400">
                                            {item.ttlCases}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>

                <VerificationFooter formData={formData} setFormData={setFormData} onSave={handleSave} />
            </div>
        </div>
    );
}

function VerificationFooter({ formData, setFormData, onSave }: { formData: Partial<SheetData>, setFormData: any, onSave: () => void }) {
    const { user } = useAuth();
    const { devRole } = useData();

    // Determine effective role (use devRole if set, otherwise fallback to user metadata)
    const currentRole = devRole || user?.user_metadata?.role;
    const isShiftLead = currentRole === Role.SHIFT_LEAD || currentRole === Role.ADMIN;

    const handleVerify = () => {
        if (confirm("Are you sure you want to verify and lock this sheet?")) {
            setFormData({ ...formData, status: SheetStatus.LOCKED });
            setTimeout(onSave, 100);
        }
    };

    const handleReject = () => {
        const reason = prompt("Please enter a reason for rejection (required):");
        if (reason) {
            const newComment = {
                id: Date.now().toString(),
                author: user?.user_metadata?.fullName || 'Shift Lead',
                text: `REJECTED: ${reason}`,
                timestamp: new Date().toISOString()
            };

            // Revert to DRAFT so it can be edited again
            setFormData({
                ...formData,
                status: SheetStatus.DRAFT,
                comments: [...(formData.comments || []), newComment]
            });
            setTimeout(onSave, 100);
        }
    };

    if (!isShiftLead) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-900 border-t border-white/10 backdrop-blur-lg print:hidden">
            <div className="max-w-5xl mx-auto flex items-center justify-between">
                <div>
                    <h4 className="text-sm font-semibold text-white">Shift Lead Verification</h4>
                    <p className="text-xs text-slate-400">Review the items above. Locking prevents further changes.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={handleReject} className="text-red-400 border-red-400/20 hover:bg-red-950/50">
                        Reject
                    </Button>
                    <Button onClick={handleVerify} className="bg-blue-600 hover:bg-blue-500 gap-2">
                        Verify & Lock Sheet
                    </Button>
                </div>
            </div>
        </div>
    );
}

function PrintableStagingSheet({ data }: { data: Partial<SheetData> }) {
    return (
        <div className="bg-white text-black p-8 max-w-[210mm] mx-auto min-h-screen">
            <div className="flex justify-between items-start mb-8 border-b-2 border-black pb-4">
                <div>
                    <h1 className="text-2xl font-bold uppercase tracking-tight">Staging Operations Sheet</h1>
                    <p className="text-sm text-gray-600">Unicharm Operations Facility</p>
                </div>
                <div className="text-right">
                    <div className="text-sm font-bold">Sheet #{data.id?.slice(-6) || 'N/A'}</div>
                    <div className="text-sm text-gray-500">Date: {data.date}</div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                    <div className="text-xs font-bold uppercase text-gray-500 mb-1">Supervisor</div>
                    <div className="border p-2 bg-gray-50">{data.supervisorName || '—'}</div>
                </div>
                <div>
                    <div className="text-xs font-bold uppercase text-gray-500 mb-1">Destination</div>
                    <div className="border p-2 bg-gray-50">{data.destination || '—'}</div>
                </div>
            </div>

            <div className="mb-8">
                <h3 className="text-sm font-bold uppercase text-gray-500 mb-2">Staging Manifest</h3>
                <table className="w-full text-sm border-collapse border border-black">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="border border-black px-3 py-2 text-left">SR No.</th>
                            <th className="border border-black px-3 py-2 text-left">SKU Name</th>
                            <th className="border border-black px-3 py-2 text-right">Cases/Plt</th>
                            <th className="border border-black px-3 py-2 text-right">Full Plt</th>
                            <th className="border border-black px-3 py-2 text-right">Loose</th>
                            <th className="border border-black px-3 py-2 text-right font-bold w-24">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.stagingItems?.filter(i => i.skuName).map((item, i) => (
                            <tr key={i}>
                                <td className="border border-black px-3 py-2 text-center text-gray-500">{i + 1}</td>
                                <td className="border border-black px-3 py-2 font-medium">{item.skuName}</td>
                                <td className="border border-black px-3 py-2 text-right">{item.casesPerPlt}</td>
                                <td className="border border-black px-3 py-2 text-right">{item.fullPlt}</td>
                                <td className="border border-black px-3 py-2 text-right">{item.loose}</td>
                                <td className="border border-black px-3 py-2 text-right font-bold">{item.ttlCases}</td>
                            </tr>
                        ))}
                        {(!data.stagingItems || data.stagingItems.filter(i => i.skuName).length === 0) && (
                            <tr>
                                <td colSpan={6} className="border border-black px-3 py-8 text-center text-gray-400 italic">No staging items recorded.</td>
                            </tr>
                        )}
                    </tbody>
                    <tfoot className="bg-gray-50 font-bold">
                        <tr>
                            <td colSpan={5} className="border border-black px-3 py-2 text-right uppercase text-xs">Grand Total</td>
                            <td className="border border-black px-3 py-2 text-right">
                                {data.stagingItems?.reduce((sum, i) => sum + (Number(i.ttlCases) || 0), 0)}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <div className="mt-12 grid grid-cols-2 gap-12 text-sm">
                <div className="border-t border-black pt-2">
                    <div className="font-bold">Supervisor Signature</div>
                    <div className="text-gray-500 text-xs mt-1">Confirmed correct quantity and quality.</div>
                </div>
                <div className="border-t border-black pt-2">
                    <div className="font-bold">Loading Supervisor Signature</div>
                    <div className="text-gray-500 text-xs mt-1">Received in good condition.</div>
                </div>
            </div>

            <div className="fixed bottom-4 left-0 w-full text-center text-[10px] text-gray-400">
                Generated by Unicharm Operations System • {new Date().toLocaleString()}
            </div>
        </div>
    );
}
