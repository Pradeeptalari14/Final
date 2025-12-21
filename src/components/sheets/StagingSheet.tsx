import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Printer, Calendar, UserCheck, Truck, Lock, ClipboardList, CheckCircle, AlertTriangle, Loader2, FileText, User, MapPin, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { SheetData, SheetStatus, StagingItem, Role } from '@/types';
import { Badge } from '@/components/ui/badge';
import { PrintableStagingSheet } from '@/components/print/PrintableStagingSheet';

const DismissibleAlert = ({ comments }: { comments: any[] }) => {
    const [isVisible, setIsVisible] = useState(true);
    if (!isVisible) return null;
    return (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-4 animate-in fade-in slide-in-from-top-2 relative">
            <button onClick={() => setIsVisible(false)} className="absolute top-2 right-2 text-red-400 hover:text-red-700"><X size={16} /></button>
            <div className="bg-red-100 p-2 rounded-lg h-fit text-red-600"><AlertTriangle size={20} /></div>
            <div>
                <h3 className="font-bold text-red-800 text-sm mb-1">Feedback / Shift Lead Message</h3>
                <div className="space-y-2">
                    {comments.map((comment, i) => (
                        <div key={i} className="text-sm text-red-700 border-l-2 border-red-300 pl-3">
                            <span className="font-semibold text-red-900 mr-2">{comment.author}</span>
                            <span className="text-red-400 text-xs">{new Date(comment.timestamp).toLocaleString()}</span>
                            <p className="mt-0.5">{comment.text}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const EMPTY_ITEM: StagingItem = {
    srNo: 0,
    skuName: '',
    casesPerPlt: 0,
    fullPlt: 0,
    loose: 0,
    ttlCases: 0
};

const RejectionSection = ({ reason, comments }: { reason?: string | null, comments?: any[] }) => {
    if (!reason) return null;
    return (
        <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg shadow-sm animate-in fade-in slide-in-from-top-2 print:hidden">
            <div className="flex items-start gap-4">
                <div className="p-2 bg-red-100 rounded-full text-red-600">
                    <AlertTriangle size={24} />
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-red-800 flex items-center gap-2">
                        <AlertTriangle size={20} className="hidden" />
                        ACTION REQUIRED: Sheet Rejected
                    </h3>
                    <div className="mt-2 text-red-700 font-medium">
                        <span className="uppercase text-xs font-bold text-red-500 tracking-wider block mb-1">Rejection Reason:</span>
                        <p className="text-base bg-white/50 p-3 rounded border border-red-200">{reason}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function StagingSheet() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addSheet, updateSheet, deleteSheet, sheets, refreshSheets, shift, currentUser, devRole, loading: dataLoading } = useData();
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
            // Determine ID: If previously saved (but nav pending), use that. Else if new, generate. Else existing.
            const isNew = id === 'new' && !formData.id;
            const targetId = isNew ? `SH-${Date.now()}` : (formData.id || id!);

            const sheetToSave: SheetData = {
                ...dataToSave as SheetData,
                id: targetId,
                updatedAt: new Date().toISOString(),
                status: dataToSave.status || SheetStatus.DRAFT
            };

            // If new, invoke addSheet (which does INSERT)
            if (isNew) {
                // Optimistically set ID to prevent double-save creating duplicates
                setFormData(prev => ({ ...prev, id: targetId }));

                const { error } = await addSheet(sheetToSave);
                if (error) throw error;
                // Navigate to the newly created sheet URL
                navigate(`/sheets/staging/${targetId}`, { replace: true });
            } else {
                // If update, invoke updateSheet (which does UPDATE)
                const { error } = await updateSheet(sheetToSave);
                if (error) throw error;
            }

        } catch (err: any) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this sheet? This cannot be undone.")) return;
        setLoading(true);
        try {
            const currentId = id === 'new' ? formData.id : id;
            if (currentId) {
                const { error } = await deleteSheet(currentId);
                if (error) throw error;
                navigate('/database');
            }
        } catch (error) {
            console.error("Delete failed", error);
        } finally {
            setLoading(false);
        }
    };


    const handleRequestVerification = () => {
        // Clear rejection reason on resubmit so it doesn't show as rejected in Dashboard
        const updated: Partial<SheetData> = {
            ...formData,
            status: SheetStatus.STAGING_VERIFICATION_PENDING,
            rejectionReason: undefined
        };
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
        window.print();
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
        <div className="bg-white min-h-screen text-slate-800 pb-24 print:pb-0 print:min-h-0 print:h-auto print:overflow-visible font-sans max-w-[1024px] print:max-w-none mx-auto shadow-xl print:shadow-none my-2 print:my-0 rounded-lg print:rounded-none overflow-hidden print:overflow-visible border border-slate-200 print:border-none">



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
                        <h1 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight">Staging Check Sheet</h1>
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
                    <Button variant="default" onClick={handlePrint} className="gap-2 bg-slate-900 text-white shadow-sm hover:bg-slate-800 transition-colors">
                        <Printer size={16} /> <span className="hidden sm:inline">Print / PDF</span>
                    </Button>
                </div>
            </div>

            <div className="print:hidden p-2 space-y-3 bg-slate-50/50 min-h-[calc(100vh-60px)]">

                {/* Rejection/Comments History - Show if Rejected OR if Verification Pending (so Lead can see history) */}
                {formData.comments && formData.comments.length > 0 && (formData.status === SheetStatus.DRAFT || formData.status === SheetStatus.STAGING_VERIFICATION_PENDING) && (
                    <DismissibleAlert comments={formData.comments} />
                )}

                {/* Sheet Details Form - Excel Style Grid */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex items-center gap-2">
                        <FileText size={16} className="text-slate-400" />
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Sheet Details</span>
                    </div>
                    <div className="p-2 md:p-3 grid grid-cols-1 md:grid-cols-3 gap-2">
                        {/* ROw 1: Shift, Supervisor Name, Destination */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1"><Calendar size={14} /> Shift</label>
                            <select
                                value={formData.shift}
                                onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                                disabled={formData.status === SheetStatus.LOCKED || formData.status === SheetStatus.STAGING_VERIFICATION_PENDING}
                                className="w-full border border-slate-200 bg-white p-1.5 rounded text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all font-medium appearance-none"
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
                                className="w-full border border-slate-200 bg-slate-100 p-1.5 rounded text-sm text-slate-500 outline-none font-medium cursor-not-allowed"
                                placeholder="Auto-filled"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1"><MapPin size={14} /> Destination</label>
                            <input
                                value={formData.destination}
                                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                                disabled={formData.status === SheetStatus.LOCKED || formData.status === SheetStatus.STAGING_VERIFICATION_PENDING}
                                className="w-full border border-slate-200 bg-white p-1.5 rounded text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-300"
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

                {/* Rejection Alert - Visible on Screen & Print */}
                <RejectionSection reason={formData.rejectionReason} comments={formData.comments} />

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
                                                className="w-full p-1.5 bg-transparent rounded hover:bg-white focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder:text-slate-300 text-slate-700 font-medium disabled:text-slate-500"
                                                placeholder="Enter SKU..."
                                            />
                                        </td>
                                        <td className="p-1 border-r border-slate-100">
                                            <input
                                                type="number"
                                                value={item.casesPerPlt || ''}
                                                onChange={(e) => updateItem(index, 'casesPerPlt', e.target.value)}
                                                disabled={formData.status === SheetStatus.LOCKED || formData.status === SheetStatus.STAGING_VERIFICATION_PENDING || formData.status === SheetStatus.COMPLETED}
                                                className="w-full p-1.5 text-center bg-transparent rounded hover:bg-white focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-slate-600 disabled:text-slate-400"
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
                                                className="w-full p-1.5 text-center bg-transparent rounded hover:bg-white focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-slate-600 bg-yellow-50/50 disabled:bg-transparent disabled:text-slate-400"
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

                <VerificationFooter formData={formData} setFormData={setFormData} onSave={handleSave} currentRole={currentRole} currentUser={currentUser} />
            </div>

            {/* Standard Footer Actions for Edit Mode */}
            {formData.status !== SheetStatus.LOCKED && formData.status !== SheetStatus.STAGING_VERIFICATION_PENDING && formData.status !== SheetStatus.COMPLETED && (
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)] flex justify-center gap-4 z-40 print:hidden animate-in slide-in-from-bottom-4">
                    <Button variant="outline" onClick={() => navigate(-1)} className="text-slate-500 hover:text-slate-900 border-slate-200">
                        Cancel
                    </Button>
                    {/* Delete Option for Drafts */}
                    {/* Delete Option for Drafts - Always show in edit footer */}
                    <Button variant="outline" onClick={handleDelete} disabled={loading} className="text-red-500 border-red-200 hover:bg-red-50">
                        {loading ? <Loader2 className="animate-spin" /> : <Trash2 size={16} className="mr-2" />} Delete
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

function VerificationFooter({ formData, setFormData, onSave, currentRole, currentUser }: { formData: Partial<SheetData>, setFormData: any, onSave: (data: any) => void, currentRole: Role | undefined, currentUser: any }) {
    const isShiftLead = currentRole === Role.SHIFT_LEAD || currentRole === Role.ADMIN;
    const isPending = formData.status === SheetStatus.STAGING_VERIFICATION_PENDING;

    // Checklist State
    const [checks, setChecks] = useState({ qty: false, condition: false, sign: false });

    const handleVerify = () => {
        if (!Object.values(checks).every(Boolean)) return;

        if (confirm("Are you sure you want to verify and lock this sheet?")) {
            const updated = {
                ...formData,
                status: SheetStatus.LOCKED, // Moves to Loading Pipeline
                lockedBy: currentUser?.username,
                lockedAt: new Date().toISOString(),
                slSign: currentUser?.fullName,  // Auto-sign with Lead's Name
                history: [...(formData.history || []), {
                    id: Date.now().toString(),
                    actor: currentUser?.username || 'Unknown',
                    action: 'STAGING_VERIFIED',
                    timestamp: new Date().toISOString(),
                    details: 'Verified and Locked State'
                }]
            };
            setFormData(updated);
            onSave(updated);
        }
    };

    const handleReject = () => {
        const reason = prompt("Please enter a reason for rejection (required):");
        if (reason) {
            const newComment = {
                id: Date.now().toString(),
                author: currentUser?.fullName || 'Shift Lead', // ideally fetch name
                text: `REJECTED: ${reason}`,
                timestamp: new Date().toISOString()
            };

            // Revert to DRAFT so it can be edited again
            const updated = {
                ...formData,
                status: SheetStatus.DRAFT,
                rejectionReason: reason, // For dashboard highlighting
                comments: [...(formData.comments || []), newComment],
                history: [...(formData.history || []), {
                    id: Date.now().toString(),
                    actor: currentUser?.username || 'Unknown',
                    action: 'STAGING_REJECTED',
                    timestamp: new Date().toISOString(),
                    details: `Rejected: ${reason}`
                }]
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

// PrintableStagingSheet moved to @/components/print/PrintableStagingSheet
