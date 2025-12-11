import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { SheetData, SheetStatus, LoadingItemData, Role } from '@/types';
import { Badge } from '@/components/ui/badge';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from "@/contexts/ToastContext";

// 1. Define Validation Schema
const toggleSheetSchema = z.object({
    vehicleNo: z.string().min(4, "Vehicle No must be at least 4 characters"),
    sealNo: z.string().min(3, "Seal No is required"),
    regSerialNo: z.string().min(3, "Container No is required"),
    // You can add logic for loading items here, but kept simpler for now
});

type FormData = z.infer<typeof toggleSheetSchema>;

export default function LoadingSheet() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { updateSheet, sheets } = useData();
    const { addToast } = useToast();

    const [sheet, setSheet] = useState<SheetData | null>(null);
    const [loadingItems, setLoadingItems] = useState<LoadingItemData[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    // 2. Initialize Form
    const form = useForm<FormData>({
        resolver: zodResolver(toggleSheetSchema),
        defaultValues: {
            vehicleNo: '',
            sealNo: '',
            regSerialNo: ''
        }
    });

    // Load Data
    useEffect(() => {
        if (id) {
            const existing = sheets.find(s => s.id === id);
            if (existing) {
                setSheet(existing);
                setLoadingItems(existing.loadingItems || []);
                // Reset form with db values
                form.reset({
                    vehicleNo: existing.vehicleNo || '',
                    sealNo: existing.sealNo || '',
                    regSerialNo: existing.regSerialNo || ''
                });
            }
        }
    }, [id, sheets, form]);

    const updateLoadingItem = (index: number, field: keyof LoadingItemData, value: number) => {
        const newItems = [...loadingItems];
        if (field === 'looseInput') {
            newItems[index] = { ...newItems[index], looseInput: value, total: value };
        }
        setLoadingItems(newItems);
    };

    // 3. Handle Save (Wrapped in form.handleSubmit)
    const onSmartSave = async (data: FormData, complete: boolean = false, forceStatus?: SheetStatus, comment?: string) => {
        if (!sheet) return;
        setIsSaving(true);
        try {
            let nextStatus = sheet.status;
            if (forceStatus) {
                nextStatus = forceStatus;
            } else if (complete) {
                nextStatus = SheetStatus.LOADING_VERIFICATION_PENDING;
            } else {
                nextStatus = SheetStatus.LOCKED;
            }

            const updatedSheet: SheetData = {
                ...sheet,
                vehicleNo: data.vehicleNo,
                sealNo: data.sealNo,
                regSerialNo: data.regSerialNo,
                loadingItems,
                status: nextStatus,
                updatedAt: new Date().toISOString(),
                comments: comment ? [...(sheet.comments || []), {
                    id: Date.now().toString(),
                    author: 'Shift Lead',
                    text: `REJECTED: ${comment}`,
                    timestamp: new Date().toISOString()
                }] : sheet.comments
            };

            await updateSheet(updatedSheet);
            addToast('success', complete ? 'Verification Requested!' : 'Draft Saved');
            navigate('/database');
        } catch (e) {
            console.error(e);
            addToast('error', 'Failed to save sheet');
        } finally {
            setIsSaving(false);
        }
    };

    // Wrapper for button clicks to trigger form validation
    const handleSaveClick = (complete: boolean) => {
        form.handleSubmit((data) => onSmartSave(data, complete))();
    };

    // Passed to Footer for Verification actions (Skip validation on Reject)
    const handleVerificationUpdate = (complete: boolean, forceStatus?: SheetStatus, comment?: string) => {
        // We use current form values but don't force strict validation for Rejections
        // For approvals, we want to ensure data is valid (though verification is read-only usually)
        onSmartSave(form.getValues(), complete, forceStatus, comment);
    };

    if (!sheet) return <div className="p-8 text-slate-400">Loading Sheet Data...</div>;

    // Temporary object for printing
    const currentSheetState: SheetData = {
        ...sheet,
        ...form.getValues(),
        loadingItems
    };

    return (
        <div className="pb-20">
            {/* Printable View */}
            <div className="hidden print:block">
                <PrintableLoadingSheet sheet={currentSheetState} />
            </div>

            {/* Standard UI */}
            <div className="print:hidden p-4 md:p-8 max-w-5xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
                        <ArrowLeft size={16} /> Back
                    </Button>
                    <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-sm px-3 py-1 bg-slate-900 border-white/10">
                            {sheet.status}
                        </Badge>
                        <Button variant="outline" onClick={() => window.print()} className="gap-2 border-white/10">
                            <Printer size={16} /> Print
                        </Button>
                        <Button onClick={() => handleSaveClick(false)} variant="secondary" disabled={isSaving}>
                            Save Draft
                        </Button>
                        <Button onClick={() => handleSaveClick(true)} disabled={isSaving} className="gap-2 bg-purple-600 hover:bg-purple-500">
                            <Save size={16} /> Request Verification
                        </Button>
                    </div>
                </div>

                <Card className="border-white/5 bg-slate-900/40">
                    <CardHeader>
                        <CardTitle>Logistics Details (Validated)</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-slate-400 uppercase">
                                Vehicle No <span className="text-red-400">*</span>
                            </label>
                            <input
                                {...form.register('vehicleNo')}
                                className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                placeholder="MH-12-AB-1234"
                            />
                            {form.formState.errors.vehicleNo && (
                                <p className="text-xs text-red-400">{form.formState.errors.vehicleNo.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-slate-400 uppercase">
                                Seal No <span className="text-red-400">*</span>
                            </label>
                            <input
                                {...form.register('sealNo')}
                                className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                placeholder="SL-9999"
                            />
                            {form.formState.errors.sealNo && (
                                <p className="text-xs text-red-400">{form.formState.errors.sealNo.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-slate-400 uppercase">
                                Container No <span className="text-red-400">*</span>
                            </label>
                            <input
                                {...form.register('regSerialNo')}
                                className="w-full bg-slate-950 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                placeholder="CN-5555"
                            />
                            {form.formState.errors.regSerialNo && (
                                <p className="text-xs text-red-400">{form.formState.errors.regSerialNo.message}</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-white/5 bg-slate-900/40">
                    <CardHeader>
                        <CardTitle>Loading Matrix</CardTitle>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-400 uppercase bg-slate-950/50">
                                <tr>
                                    <th className="px-4 py-3 rounded-l-lg">SKU</th>
                                    <th className="px-4 py-3 text-center">Staged Qty</th>
                                    <th className="px-4 py-3 text-center">Loaded Qty</th>
                                    <th className="px-4 py-3 text-center rounded-r-lg">Balance</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loadingItems.map((item, index) => {
                                    const stagedItem = sheet.stagingItems?.find(s => s.srNo === item.skuSrNo);
                                    return (
                                        <tr key={index} className="group hover:bg-white/5">
                                            <td className="px-4 py-2 font-medium text-slate-300">
                                                {stagedItem?.skuName || `Item #${item.skuSrNo}`}
                                            </td>
                                            <td className="px-4 py-2 text-center text-slate-400">
                                                {stagedItem?.ttlCases || 0}
                                            </td>
                                            <td className="px-2 py-2">
                                                <input
                                                    type="number"
                                                    value={item.total}
                                                    onChange={(e) => updateLoadingItem(index, 'looseInput', Number(e.target.value))}
                                                    className="w-full bg-slate-950 border border-white/10 rounded px-2 py-1 text-center text-white focus:ring-2 ring-blue-500/50 outline-none"
                                                />
                                            </td>
                                            <td className="px-4 py-2 text-center font-bold text-yellow-400">
                                                {(stagedItem?.ttlCases || 0) - item.total}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>

                {/* Rejection/Comments History */}
                {sheet.comments && sheet.comments.length > 0 && (
                    <Card className="border-red-500/20 bg-red-950/10">
                        <CardHeader>
                            <CardTitle className="text-red-400 text-sm">Feedback / Rejection History</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {sheet.comments.map((comment, i) => (
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

                <VerificationFooter sheet={sheet} onUpdate={handleVerificationUpdate} />
            </div>
        </div>
    );
}

function VerificationFooter({ sheet, onUpdate }: { sheet: SheetData, onUpdate: (complete: boolean, forceStatus?: SheetStatus, comment?: string) => void }) {
    const { user } = useAuth();
    const { devRole } = useData();

    // Determine effective role
    const currentRole = devRole || user?.user_metadata?.role;
    const isShiftLead = currentRole === Role.SHIFT_LEAD || currentRole === Role.ADMIN;
    const isPendingVerification = sheet.status === SheetStatus.LOADING_VERIFICATION_PENDING;

    if (!isShiftLead || !isPendingVerification) return null;

    const handleVerify = () => {
        if (confirm("Are you sure you want to verify and complete this loading sheet?")) {
            onUpdate(true, SheetStatus.COMPLETED);
        }
    };

    const handleReject = () => {
        const reason = prompt("Please enter a reason for rejection (required):");
        if (reason) {
            // Revert to LOCKED (which effectively means Loading in Progress/Draft)
            onUpdate(false, SheetStatus.LOCKED, reason);
        }
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-900 border-t border-white/10 backdrop-blur-lg z-50 print:hidden">
            <div className="max-w-5xl mx-auto flex items-center justify-between">
                <div>
                    <h4 className="text-sm font-semibold text-white">Loading Verification</h4>
                    <p className="text-xs text-slate-400">Review logistics and loading matrix. Completing this finalizes the shipment.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={handleReject} className="text-red-400 border-red-400/20 hover:bg-red-950/50">
                        Reject
                    </Button>
                    <Button onClick={handleVerify} className="bg-purple-600 hover:bg-purple-500 gap-2">
                        Verify & Complete Shipment
                    </Button>
                </div>
            </div>
        </div>
    );
}

function PrintableLoadingSheet({ sheet }: { sheet: SheetData }) {
    return (
        <div className="bg-white text-black p-8 max-w-[210mm] mx-auto min-h-screen">
            <div className="flex justify-between items-start mb-8 border-b-2 border-black pb-4">
                <div>
                    <h1 className="text-2xl font-bold uppercase tracking-tight">Final Loading Matrix</h1>
                    <p className="text-sm text-gray-600">Unicharm Operations Facility</p>
                </div>
                <div className="text-right">
                    <div className="text-sm font-bold">Sheet #{sheet.id?.slice(-6) || 'N/A'}</div>
                    <div className="text-sm text-gray-500">Date: {sheet.date}</div>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-6 mb-8 border border-black p-4 bg-gray-50">
                <div>
                    <div className="text-[10px] font-bold uppercase text-gray-500 mb-1">Vehicle No</div>
                    <div className="font-bold text-lg">{sheet.vehicleNo || '—'}</div>
                </div>
                <div>
                    <div className="text-[10px] font-bold uppercase text-gray-500 mb-1">Container No</div>
                    <div className="font-bold text-lg">{sheet.regSerialNo || '—'}</div>
                </div>
                <div>
                    <div className="text-[10px] font-bold uppercase text-gray-500 mb-1">Seal No</div>
                    <div className="font-bold text-lg">{sheet.sealNo || '—'}</div>
                </div>
            </div>

            <div className="mb-8">
                <h3 className="text-sm font-bold uppercase text-gray-500 mb-2">Loading Manifest</h3>
                <table className="w-full text-sm border-collapse border border-black">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="border border-black px-3 py-2 text-left">SKU Name</th>
                            <th className="border border-black px-3 py-2 text-right">Staged Qty</th>
                            <th className="border border-black px-3 py-2 text-right">Loaded Qty</th>
                            <th className="border border-black px-3 py-2 text-right font-bold w-32">Balance (Short/Excess)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sheet.loadingItems?.map((item, index) => {
                            const stagedItem = sheet.stagingItems?.find(s => s.srNo === item.skuSrNo);
                            const balance = (stagedItem?.ttlCases || 0) - item.total;
                            return (
                                <tr key={index}>
                                    <td className="border border-black px-3 py-2 font-medium">
                                        {stagedItem?.skuName || `Item #${item.skuSrNo}`}
                                    </td>
                                    <td className="border border-black px-3 py-2 text-right">
                                        {stagedItem?.ttlCases || 0}
                                    </td>
                                    <td className="border border-black px-3 py-2 text-right font-bold">
                                        {item.total}
                                    </td>
                                    <td className={`border border-black px-3 py-2 text-right font-bold ${balance !== 0 ? 'text-red-600' : 'text-gray-900'}`}>
                                        {balance}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="mt-12 grid grid-cols-2 gap-12 text-sm">
                <div className="border-t border-black pt-2">
                    <div className="font-bold">Loading Supervisor Signature</div>
                    <div className="text-gray-500 text-xs mt-1">Confirmed vehicle and loading details.</div>
                </div>
                <div className="border-t border-black pt-2">
                    <div className="font-bold">Driver Signature</div>
                    <div className="text-gray-500 text-xs mt-1">Confirmed receipt of goods.</div>
                </div>
            </div>

            <div className="fixed bottom-4 left-0 w-full text-center text-[10px] text-gray-400">
                Generated by Unicharm Operations System • {new Date().toLocaleString()}
            </div>
        </div>
    );
}

