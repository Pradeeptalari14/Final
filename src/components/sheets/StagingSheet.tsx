import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Printer, Calendar, UserCheck, Truck, Lock, ClipboardList, CheckCircle, AlertTriangle, Loader2, FileText, User, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
    const { addSheet, updateSheet, sheets, refreshSheets, shift, currentUser, devRole, loading: dataLoading } = useData();
    const { session } = useAuth();

    // Determine effective role
    const currentRole = (devRole || currentUser?.role) as Role | undefined;

    const [formData, setFormData] = useState<Partial<SheetData>>({
        shift: shift || 'A',
        date: new Date().toISOString().split('T')[0],
        destination: '',
        supervisorName: currentUser?.fullName || currentUser?.username || '',
        empCode: currentUser?.empCode || '',
        loadingDockNo: '',
        loadingDoc: '',
        stagingItems: Array.from({ length: 5 }, (_, i) => ({ ...EMPTY_ITEM, srNo: i + 1 })),
        status: SheetStatus.DRAFT
    });

    const [loading, setLoading] = useState(false);
    const [isPreview, setIsPreview] = useState(false);
    const isDirty = useRef(false);
    const prevId = useRef(id);

    useEffect(() => {
        // Reset dirty state if navigating to a different sheet
        if (id !== prevId.current) {
            isDirty.current = false;
            prevId.current = id;
        }

        if (id && id !== 'new') {
            const existing = sheets.find(s => s.id === id);
            if (existing && !isDirty.current) {
                setFormData(existing);
            } else if (!existing && !dataLoading) {
                // If not found in current cache, try refreshing
                refreshSheets();
            }
        } else if (id === 'new' && currentUser && !isDirty.current) {
            setFormData(prev => ({
                ...prev,
                supervisorName: prev.supervisorName || currentUser.fullName || currentUser.username || '',
                empCode: prev.empCode || currentUser.empCode || ''
            }));
        }
    }, [id, sheets, currentUser, dataLoading, refreshSheets]);

    const handleSave = async (dataToSave: Partial<SheetData> = formData) => {
        if (loading) return; // Strict lock
        setLoading(true);
        try {
            // ID Format: SH-TIMESTAMP (numeric only) -> e.g. SH-1736423423423
            const newId = `SH-${Date.now()}`;
            const sheetToSave: SheetData = {
                ...dataToSave as SheetData,
                id: dataToSave.id || newId,
                createdBy: dataToSave.createdBy || session?.user.email || 'system',
                createdAt: dataToSave.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                // Fix: Keep rows if they have SKU OR any numeric data entered
                stagingItems: dataToSave.stagingItems?.filter(i => i.skuName || i.ttlCases > 0 || i.casesPerPlt > 0 || i.fullPlt > 0 || i.loose > 0) || []
            };

            if (id === 'new' || !dataToSave.id) {
                await addSheet(sheetToSave);
            } else {
                await updateSheet(sheetToSave);
            }
            if (!isPreview) navigate('/database');
        } catch (e: any) {
            console.error(e);
            alert(`Failed to save sheet: ${e.message || 'Unknown error'}. Please check your connection and try again.`);
        } finally {
            setLoading(false);
        }
    };

    const handleRequestVerification = () => {
        const updated: Partial<SheetData> = { ...formData, status: SheetStatus.STAGING_VERIFICATION_PENDING };
        setFormData(updated);
        handleSave(updated);
    };

    const updateItem = (index: number, field: keyof StagingItem, value: string | number) => {
        if (formData.status === SheetStatus.LOCKED || formData.status === SheetStatus.COMPLETED) return;

        const newItems = [...(formData.stagingItems || [])];
        newItems[index] = { ...newItems[index], [field]: value };
        isDirty.current = true;

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

    const handlePrint = () => {
        setIsPreview(true);
    };

    // Loading / Not Found Handling
    if (id && id !== 'new' && (!formData.id || formData.id !== id)) {
        if (dataLoading) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400">
                    <Loader2 className="animate-spin mr-2" /> Loading Sheet Data...
                </div>
            );
        }
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-500 gap-4">
                <div className="bg-red-50 p-4 rounded-full text-red-400 mb-2"><AlertTriangle size={32} /></div>
                <h2 className="text-xl font-bold text-slate-700">Sheet Not Found</h2>
                <p className="max-w-md text-center">We couldn't find the sheet #{id}. It might have been deleted or you don't have permission to view it.</p>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => navigate('/database')}>Go Back</Button>
                    <Button onClick={() => refreshSheets()}>Retry Loading</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white min-h-screen text-slate-800 pb-24 print:pb-0 print:min-h-0 print:h-auto print:overflow-visible font-sans max-w-[1280px] print:max-w-none mx-auto shadow-2xl print:shadow-none my-4 print:my-0 rounded-xl print:rounded-none overflow-hidden print:overflow-visible border border-slate-200 print:border-none">

            {/* IN-APP PRINT PREVIEW OVERLAY */}
            {isPreview && (
                <div className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-sm flex flex-col h-screen print:hidden">
                    <div className="flex justify-between items-center p-4 border-b border-white/10 bg-slate-900 text-white">
                        <div className="flex items-center gap-2">
                            <div className="bg-blue-600 p-2 rounded-lg"><Printer size={20} /></div>
                            <h2 className="text-lg font-bold">Print Preview</h2>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="ghost" className="text-slate-400 hover:text-white" onClick={() => setIsPreview(false)}>Close Preview</Button>
                            <Button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-500"><Printer className="mr-2" size={16} /> Print Now</Button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-auto p-8 flex justify-center bg-slate-800/50">
                        <div className="bg-white shadow-2xl pointer-events-none select-none origin-top scale-[0.8] md:scale-100 transition-transform">
                            <PrintableStagingSheet data={formData} />
                        </div>
                    </div>
                </div>
            )}

            {/* HIDDEN PRINTABLE VIEW (For actual printing) */}
            <div className="hidden print:block">
                <PrintableStagingSheet data={formData} />
            </div>

            {/* Top Bar */}
            <div className="print:hidden bg-white border-b border-slate-200 p-4 md:px-8 flex justify-between items-center sticky top-0 z-30 shadow-sm backdrop-blur-md bg-white/90">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => navigate(-1)} className="text-slate-500 hover:text-slate-900 gap-2 hover:bg-slate-100">
                        <ArrowLeft size={18} /> Back
                    </Button>
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">Staging Check Sheet</h1>
                        <Badge variant="outline" className={`text-xs px-2.5 py-0.5 font-bold uppercase ${formData.status === SheetStatus.LOCKED ? 'bg-purple-100 text-purple-700 border-purple-200' :
                            formData.status === SheetStatus.COMPLETED ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                formData.status?.includes('PENDING') ? 'bg-orange-100 text-orange-700 border-orange-200' :
                                    'bg-slate-100 text-slate-600 border-slate-200'
                            }`}>
                            {formData.status?.replace(/_/g, ' ')}
                        </Badge>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handlePrint} className="gap-2 border-slate-200 hover:bg-slate-50 text-slate-700">
                        <Printer size={16} /> <span className="hidden sm:inline">Print Preview</span>
                    </Button>
                </div>
            </div>

            <div className="print:hidden p-2 md:p-4 space-y-4 bg-slate-50/50 min-h-[calc(100vh-80px)]">
                {/* Rejection/Comments History */}
                {formData.comments && formData.comments.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-4 animate-in fade-in slide-in-from-top-2">
                        <div className="bg-red-100 p-2 rounded-lg h-fit text-red-600"><AlertTriangle size={20} /></div>
                        <div>
                            <h3 className="font-bold text-red-800 text-sm mb-1">Feedback / Rejection History</h3>
                            <div className="space-y-2">
                                {formData.comments.map((comment, i) => (
                                    <div key={i} className="text-sm text-red-700 border-l-2 border-red-300 pl-3">
                                        <span className="font-semibold text-red-900 mr-2">{comment.author}</span>
                                        <span className="text-red-400 text-xs">{new Date(comment.timestamp).toLocaleString()}</span>
                                        <p className="mt-0.5">{comment.text}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Sheet Details Form - Excel Style Grid */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex items-center gap-2">
                        <FileText size={16} className="text-slate-400" />
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Sheet Details</span>
                    </div>
                    <div className="p-3 md:p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                        {/* ROw 1: Shift, Supervisor Name, Destination */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1"><Calendar size={14} /> Shift</label>
                            <select
                                value={formData.shift}
                                onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                                disabled={formData.status === SheetStatus.LOCKED || formData.status === SheetStatus.STAGING_VERIFICATION_PENDING}
                                className="w-full border border-slate-200 bg-white p-2.5 rounded-lg text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all font-medium appearance-none"
                            >
                                <option value="A">A</option>
                                <option value="B">B</option>
                                <option value="C">C</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1"><User size={14} /> Supervisor Name</label>
                            <input
                                value={formData.supervisorName}
                                disabled={true} // Always disabled as per request
                                className="w-full border border-slate-200 bg-slate-100 p-2.5 rounded-lg text-sm text-slate-500 outline-none font-medium cursor-not-allowed"
                                placeholder="Auto-filled"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1"><MapPin size={14} /> Destination</label>
                            <input
                                value={formData.destination}
                                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                                disabled={formData.status === SheetStatus.LOCKED || formData.status === SheetStatus.STAGING_VERIFICATION_PENDING}
                                className="w-full border border-slate-200 bg-white p-2.5 rounded-lg text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-300"
                                placeholder="Enter Destination"
                            />
                        </div>

                        {/* Row 2: Date, Emp Code, Loading Dock No */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1"><Calendar size={14} /> Date</label>
                            <input
                                type="text" // Text input for custom format display
                                value={formData.date ? new Date(formData.date).toLocaleDateString('en-GB') : ''} // dd/mm/yyyy
                                disabled={true} // Always disabled
                                className="w-full border border-slate-200 bg-slate-100 p-2.5 rounded-lg text-sm text-slate-500 outline-none font-medium cursor-not-allowed"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1"><UserCheck size={14} /> Emp Code</label>
                            <input
                                value={formData.empCode}
                                disabled={true} // Always disabled
                                className="w-full border border-slate-200 bg-slate-100 p-2.5 rounded-lg text-sm text-slate-500 outline-none font-medium cursor-not-allowed"
                                placeholder="Auto-filled"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1"><Truck size={14} /> Loading Dock No</label>
                            <input
                                value={formData.loadingDockNo}
                                onChange={(e) => setFormData({ ...formData, loadingDockNo: e.target.value })}
                                disabled={formData.status === SheetStatus.LOCKED || formData.status === SheetStatus.STAGING_VERIFICATION_PENDING}
                                className="w-full border border-slate-200 bg-white p-2.5 rounded-lg text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-300"
                                placeholder="Enter Dock No"
                            />
                        </div>
                    </div>
                </div>

                {/* Staging Table - Excel Look */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-md overflow-hidden flex flex-col">
                    <div className="bg-slate-800 text-white px-4 py-3 flex justify-between items-center">
                        <span className="font-bold tracking-wide text-sm flex items-center gap-2"><ClipboardList size={16} /> STAGING SHEET</span>
                        <span className="text-xs text-slate-400 bg-slate-900/50 px-2 py-0.5 rounded border border-white/10">{formData.stagingItems?.length || 0} Items</span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm min-w-[800px]">
                            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                                <tr>
                                    <th className="p-3 w-12 text-center font-bold text-xs uppercase tracking-wider text-slate-400 border-r border-slate-100">Sr.No</th>
                                    <th className="p-3 text-left font-bold text-xs uppercase tracking-wider border-r border-slate-100">SKU Name</th>
                                    <th className="p-3 w-32 text-center font-bold text-xs uppercase tracking-wider border-r border-slate-100">Cases/PLT</th>
                                    <th className="p-3 w-32 text-center font-bold text-xs uppercase tracking-wider border-r border-slate-100">Full PLT</th>
                                    <th className="p-3 w-32 text-center font-bold text-xs uppercase tracking-wider border-r border-slate-100">Loose</th>
                                    <th className="p-3 w-32 text-center font-bold text-xs uppercase tracking-wider bg-blue-50 text-blue-800 border-l border-blue-100">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {formData.stagingItems?.map((item, index) => (
                                    <tr key={index} className="group hover:bg-blue-50/20 transition-colors">
                                        <td className="p-2 text-center text-slate-400 font-mono text-xs border-r border-slate-100 bg-slate-50/30">
                                            {index + 1}
                                        </td>
                                        <td className="p-1 border-r border-slate-100">
                                            <input
                                                value={item.skuName}
                                                onChange={(e) => updateItem(index, 'skuName', e.target.value)}
                                                disabled={formData.status === SheetStatus.LOCKED || formData.status === SheetStatus.STAGING_VERIFICATION_PENDING || formData.status === SheetStatus.COMPLETED}
                                                className="w-full p-2 bg-transparent rounded hover:bg-white focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder:text-slate-300 text-slate-700 font-medium disabled:text-slate-500"
                                                placeholder="Enter SKU..."
                                            />
                                        </td>
                                        <td className="p-1 border-r border-slate-100">
                                            <input
                                                type="number"
                                                value={item.casesPerPlt || ''}
                                                onChange={(e) => updateItem(index, 'casesPerPlt', e.target.value)}
                                                disabled={formData.status === SheetStatus.LOCKED || formData.status === SheetStatus.STAGING_VERIFICATION_PENDING || formData.status === SheetStatus.COMPLETED}
                                                className="w-full p-2 text-center bg-transparent rounded hover:bg-white focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-slate-600 disabled:text-slate-400"
                                            />
                                        </td>
                                        <td className="p-1 border-r border-slate-100">
                                            <input
                                                type="number"
                                                value={item.fullPlt || ''}
                                                onChange={(e) => updateItem(index, 'fullPlt', e.target.value)}
                                                disabled={formData.status === SheetStatus.LOCKED || formData.status === SheetStatus.STAGING_VERIFICATION_PENDING || formData.status === SheetStatus.COMPLETED}
                                                className="w-full p-2 text-center bg-transparent rounded hover:bg-white focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-slate-600 disabled:text-slate-400"
                                            />
                                        </td>
                                        <td className="p-1 border-r border-slate-100">
                                            <input
                                                type="number"
                                                value={item.loose || ''}
                                                onChange={(e) => updateItem(index, 'loose', e.target.value)}
                                                disabled={formData.status === SheetStatus.LOCKED || formData.status === SheetStatus.STAGING_VERIFICATION_PENDING || formData.status === SheetStatus.COMPLETED}
                                                className="w-full p-2 text-center bg-transparent rounded hover:bg-white focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-slate-600 bg-yellow-50/50 disabled:bg-transparent disabled:text-slate-400"
                                            />
                                        </td>
                                        <td className="p-2 text-center font-bold text-blue-700 bg-blue-50/30 border-l border-blue-100">
                                            {item.ttlCases || '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-slate-50 border-t border-slate-200 font-bold">
                                <tr>
                                    <td colSpan={5} className="p-3 text-right text-slate-500 text-xs uppercase tracking-wider">Grand Total (Cases)</td>
                                    {/* Only showing Total Cases summation as requested */}
                                    <td className="p-3 text-center text-blue-700 border-l border-slate-200 bg-blue-50 text-lg">
                                        {formData.stagingItems?.reduce((sum, i) => sum + (Number(i.ttlCases) || 0), 0)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>

                <div className="flex justify-center pb-8">
                    {formData.status !== SheetStatus.LOCKED && formData.status !== SheetStatus.STAGING_VERIFICATION_PENDING && (
                        <Button
                            variant="outline"
                            onClick={() => setFormData({ ...formData, stagingItems: [...(formData.stagingItems || []), { ...EMPTY_ITEM, srNo: (formData.stagingItems?.length || 0) + 1 }] })}
                            className="w-full md:w-auto border-dashed border-slate-300 text-slate-500 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50 transition-all gap-2 py-6"
                        >
                            <Plus size={18} /> Add New Row
                        </Button>
                    )}
                </div>

                <VerificationFooter formData={formData} setFormData={setFormData} onSave={handleSave} currentRole={currentRole} />
            </div>

            {/* Standard Footer Actions for Edit Mode */}
            {formData.status !== SheetStatus.LOCKED && formData.status !== SheetStatus.STAGING_VERIFICATION_PENDING && formData.status !== SheetStatus.COMPLETED && (
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)] flex justify-center gap-4 z-40 print:hidden animate-in slide-in-from-bottom-4">
                    <Button variant="outline" onClick={() => navigate(-1)} className="text-slate-500 hover:text-slate-900 border-slate-200">
                        Cancel
                    </Button>
                    <Button onClick={handleRequestVerification} className="px-8 bg-purple-600 hover:bg-purple-500 text-white shadow-lg">
                        <Lock className="mr-2" size={16} /> Request Verification
                    </Button>
                    <Button onClick={() => handleSave()} disabled={loading} className="px-8 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all">
                        {loading ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" size={18} />} Save Draft
                    </Button>
                </div>
            )}
        </div>
    );
}

function VerificationFooter({ formData, setFormData, onSave, currentRole }: { formData: Partial<SheetData>, setFormData: any, onSave: (data: any) => void, currentRole: Role | undefined }) {
    const isShiftLead = currentRole === Role.SHIFT_LEAD || currentRole === Role.ADMIN;
    const isPending = formData.status === SheetStatus.STAGING_VERIFICATION_PENDING;

    // Checklist State
    const [checks, setChecks] = useState({ qty: false, condition: false, sign: false });

    const handleVerify = () => {
        if (!Object.values(checks).every(Boolean)) return;

        if (confirm("Are you sure you want to verify and lock this sheet?")) {
            const updated = { ...formData, status: SheetStatus.LOCKED, lockedBy: currentRole };
            setFormData(updated);
            onSave(updated);
        }
    };

    const handleReject = () => {
        const reason = prompt("Please enter a reason for rejection (required):");
        if (reason) {
            const newComment = {
                id: Date.now().toString(),
                author: 'Shift Lead', // ideally fetch name
                text: `REJECTED: ${reason}`,
                timestamp: new Date().toISOString()
            };

            // Revert to DRAFT so it can be edited again
            // Revert to DRAFT so it can be edited again
            const updated = {
                ...formData,
                status: SheetStatus.DRAFT,
                comments: [...(formData.comments || []), newComment]
            };
            setFormData(updated);
            onSave(updated);
        }
    };

    if (!isPending || !isShiftLead) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-purple-50 border-t border-purple-200 shadow-2xl flex flex-col items-center gap-4 z-50 print:hidden animate-in slide-in-from-bottom-4">
            {/* Verification Checklist */}
            <div className="w-full max-w-2xl bg-white border border-purple-200 rounded-xl p-4 shadow-sm">
                <h4 className="text-xs font-bold text-purple-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <ClipboardList size={14} /> Verification Checklist (Staging Level)
                </h4>
                <div className="grid sm:grid-cols-3 gap-3">
                    <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer p-2 hover:bg-purple-50 rounded-lg transition-colors border border-transparent hover:border-purple-100">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${checks.qty ? 'bg-purple-600 border-purple-600 text-white' : 'bg-white border-slate-300'}`}>
                            {checks.qty && <CheckCircle size={12} strokeWidth={4} />}
                        </div>
                        <input type="checkbox" className="hidden" checked={checks.qty} onChange={() => setChecks(prev => ({ ...prev, qty: !prev.qty }))} />
                        <span className="font-medium">Qty Matches</span>
                    </label>

                    <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer p-2 hover:bg-purple-50 rounded-lg transition-colors border border-transparent hover:border-purple-100">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${checks.condition ? 'bg-purple-600 border-purple-600 text-white' : 'bg-white border-slate-300'}`}>
                            {checks.condition && <CheckCircle size={12} strokeWidth={4} />}
                        </div>
                        <input type="checkbox" className="hidden" checked={checks.condition} onChange={() => setChecks(prev => ({ ...prev, condition: !prev.condition }))} />
                        <span className="font-medium">Pallet OK</span>
                    </label>

                    <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer p-2 hover:bg-purple-50 rounded-lg transition-colors border border-transparent hover:border-purple-100">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${checks.sign ? 'bg-purple-600 border-purple-600 text-white' : 'bg-white border-slate-300'}`}>
                            {checks.sign && <CheckCircle size={12} strokeWidth={4} />}
                        </div>
                        <input type="checkbox" className="hidden" checked={checks.sign} onChange={() => setChecks(prev => ({ ...prev, sign: !prev.sign }))} />
                        <span className="font-medium">Sup. Sign</span>
                    </label>
                </div>
            </div>

            <div className="flex gap-4">
                <Button variant="outline" onClick={handleReject} className="text-red-500 border-red-200 hover:bg-red-50">
                    <AlertTriangle className="mr-2" size={16} /> Reject
                </Button>
                <Button
                    onClick={handleVerify}
                    disabled={!Object.values(checks).every(Boolean)}
                    className={`bg-purple-600 hover:bg-purple-500 text-white gap-2 transition-all ${!Object.values(checks).every(Boolean) ? 'opacity-50 cursor-not-allowed' : 'shadow-lg hover:scale-105'}`}
                >
                    <Lock size={16} /> Verify & Lock Sheet
                </Button>
            </div>
        </div>
    );
}

function PrintableStagingSheet({ data }: { data: Partial<SheetData> }) {
    return (
        <div className="bg-white text-black p-0 max-w-[210mm] mx-auto font-sans text-[10px] leading-tight">
            <style>{`
                @media print {
                    @page { size: A4; margin: 5mm; }
                    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
            `}</style>
            <div className="w-full border border-black">
                {/* Header Table with Equal Columns */}
                <table className="w-full border-collapse border border-black mb-1 table-fixed">
                    <colgroup>
                        <col className="w-[16.66%]" />
                        <col className="w-[16.66%]" />
                        <col className="w-[16.66%]" />
                        <col className="w-[16.66%]" />
                        <col className="w-[16.66%]" />
                        <col className="w-[16.66%]" />
                    </colgroup>
                    <tbody>
                        <tr>
                            <td colSpan={6} className="border border-black p-2 text-center text-xl font-bold bg-gray-50 uppercase">UCIA - FG WAREHOUSE</td>
                        </tr>
                        <tr>
                            <td colSpan={6} className="border border-black p-1 text-center font-bold text-lg">Staging Check Sheet</td>
                        </tr>
                        {/* Row 1: Shift, Name, Destination */}
                        <tr>
                            <td className="border border-black p-1 font-bold bg-gray-50 text-center">Shift</td>
                            <td className="border border-black p-1 text-center font-medium">{data.shift}</td>
                            <td className="border border-black p-1 font-bold bg-gray-50 text-center">Name of SV / SG</td>
                            <td className="border border-black p-1 text-center font-medium break-words">{data.supervisorName}</td>
                            <td className="border border-black p-1 font-bold bg-gray-50 text-center">Destination</td>
                            <td className="border border-black p-1 text-center font-medium break-words">{data.destination}</td>
                        </tr>
                        {/* Row 2: Date, Emp Code, Loading Dock */}
                        <tr>
                            <td className="border border-black p-1 font-bold bg-gray-50 text-center">Date</td>
                            <td className="border border-black p-1 text-center font-medium">{data.date}</td>
                            <td className="border border-black p-1 font-bold bg-gray-50 text-center">Emp. Code</td>
                            <td className="border border-black p-1 text-center font-medium">{data.empCode}</td>
                            <td className="border border-black p-1 font-bold bg-gray-50 text-center">Loading Dock No</td>
                            <td className="border border-black p-1 text-center font-medium">{data.loadingDockNo}</td>
                        </tr>
                    </tbody>
                </table>

                {/* Staging Details */}
                <div className="w-full border-t border-black mt-2">
                    <div className="font-bold text-center bg-gray-200 border-b border-black p-1 uppercase tracking-wider">STAGING DETAILS</div>
                    <table className="w-full text-[10px] border-collapse">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="border border-black p-1 w-12 text-center">Sr. No.</th>
                                <th className="border border-black p-1 text-left px-2">SKU Name</th>
                                <th className="border border-black p-1 w-16 text-center">Cases/PLT</th>
                                <th className="border border-black p-1 w-16 text-center">Full PLT</th>
                                <th className="border border-black p-1 w-16 text-center">Loose</th>
                                <th className="border border-black p-1 w-20 text-center font-bold">TTL Cases</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.stagingItems?.map((item, i) => (
                                <tr key={i}>
                                    <td className="border border-black p-1 text-center text-gray-600">{i + 1}</td>
                                    <td className="border border-black p-1 px-2 font-medium">{item.skuName}</td>
                                    <td className="border border-black p-1 text-center">{item.casesPerPlt || ''}</td>
                                    <td className="border border-black p-1 text-center">{item.fullPlt || ''}</td>
                                    <td className="border border-black p-1 text-center">{item.loose || ''}</td>
                                    <td className="border border-black p-1 text-center font-bold bg-gray-50">{item.ttlCases || ''}</td>
                                </tr>
                            ))}
                            <tr className="bg-gray-50 font-bold border-t-2 border-black">
                                <td colSpan={5} className="border border-black p-2 text-right uppercase">Total Staging Qty</td>
                                <td className="border border-black p-2 text-center text-lg">{data.stagingItems?.reduce((sum, i) => sum + (Number(i.ttlCases) || 0), 0)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Footer Signatures matching Excel */}
                <div className="grid grid-cols-3 gap-0 border-t border-black mt-4 text-center">
                    <div className="border-r border-black p-8 flex flex-col justify-end h-24">
                        <div className="border-t border-black pt-1 w-2/3 mx-auto font-bold text-xs uppercase">Picked By</div>
                    </div>
                    <div className="border-r border-black p-8 flex flex-col justify-end h-24">
                        <div className="border-t border-black pt-1 w-2/3 mx-auto font-bold text-xs uppercase">Checked By</div>
                    </div>
                    <div className="p-8 flex flex-col justify-end h-24">
                        <div className="border-t border-black pt-1 w-2/3 mx-auto font-bold text-xs uppercase">Supervisor Sign</div>
                    </div>
                </div>
            </div>

            <div className="mt-2 text-[9px] text-gray-400 flex justify-between px-1">
                <span>UCIA-OPS-FORM-001</span>
                <span>Generated: {new Date().toLocaleString()}</span>
            </div>
        </div>
    );
}
