import React from 'react';
import { Plus, Printer, Lock, Save, Trash2, ArrowLeft, Loader2, AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SheetStatus, Role } from '@/types';
import { Badge } from '@/components/ui/badge';
import { PrintableStagingSheet } from '@/components/print/PrintableStagingSheet';
import { SheetHeader } from './shared/SheetHeader';
import { VerificationFooter as SharedVerificationFooter } from './shared/VerificationFooter';
import { StagingItemsTable } from './staging/StagingItemsTable';
import { StagingMobileCards } from './staging/StagingMobileCards';
import { useStagingSheetLogic } from '@/hooks/useStagingSheetLogic';
import { RejectionSection } from './shared/RejectionSection';
import { FileSpreadsheet } from 'lucide-react';
import { exportStagingToExcel } from '@/lib/excelExport';

const DismissibleAlert = ({ comments }: { comments: any[] }) => {
    const [isVisible, setIsVisible] = React.useState(true);
    if (!isVisible) return null;
    return (
        <div className="bg-white border-l-4 border-red-500 rounded-lg shadow-sm p-4 flex gap-4 animate-in fade-in slide-in-from-top-2 relative mb-4">
            <button onClick={() => setIsVisible(false)} className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 transition-colors"><X size={16} /></button>
            <div className="bg-red-50 p-2.5 rounded-full h-fit text-red-500 shrink-0"><AlertTriangle size={20} /></div>
            <div className="flex-1">
                <h3 className="font-bold text-slate-800 text-sm mb-2 flex items-center gap-2">
                    Shift Lead Feedback
                    <span className="text-[10px] font-normal uppercase tracking-wider bg-red-50 text-red-600 px-2 py-0.5 rounded-sm border border-red-100">Review Required</span>
                </h3>
                <div className="space-y-3">
                    {comments.map((comment, i) => (
                        <div key={i} className="text-sm text-slate-600 bg-slate-50 p-3 rounded-md border border-slate-100">
                            <div className="flex justify-between items-start mb-1">
                                <span className="font-bold text-slate-900 text-xs uppercase tracking-wide">{comment.author}</span>
                                <span className="text-slate-400 text-[10px]">{new Date(comment.timestamp).toLocaleString()}</span>
                            </div>
                            <p className="leading-relaxed text-slate-700">{comment.text}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};



export default function StagingSheet() {
    const {
        formData,
        loading,
        handleHeaderChange,
        handleSave,
        handleDelete,
        handleRequestVerification,
        updateItem,
        addItem,
        handleVerificationAction,
        handleToggleRejection,
        currentRole,
        navigate,
        id,
        dataLoading,
        refreshSheets
    } = useStagingSheetLogic();

    const handlePrint = () => {
        window.print();
    };

    const onRequestVerification = () => {
        const errors: string[] = [];
        if (!formData.shift) errors.push("Shift");
        if (!formData.destination) errors.push("Destination");
        if (!formData.loadingDockNo) errors.push("Loading Dock");

        if (errors.length > 0) {
            alert(`Please fill in the following mandatory fields before requesting verification:\n- ${errors.join('\n- ')}`);
            return;
        }

        handleRequestVerification();
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
        <div className="bg-white min-h-screen text-slate-800 print:pb-0 print:min-h-0 print:h-auto print:overflow-visible font-sans max-w-[1024px] print:max-w-none mx-auto shadow-2xl shadow-slate-200/50 print:shadow-none my-2 print:my-0 rounded-xl print:rounded-none overflow-hidden print:overflow-visible border border-slate-100 print:border-none relative">

            {/* HIDDEN PRINTABLE VIEW (For actual printing) */}
            <div className="hidden print:block">
                <PrintableStagingSheet data={formData as any} />
            </div>

            {/* Top Bar */}
            <div className="print:hidden border-b border-slate-200/80 p-4 md:px-8 flex justify-between items-center sticky top-0 z-30 shadow-sm backdrop-blur-xl bg-white/80">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => navigate(-1)} className="text-slate-500 hover:text-slate-900 gap-2 hover:bg-slate-100/80 rounded-full px-4">
                        <ArrowLeft size={18} /> Back
                    </Button>
                    <div className="flex items-center gap-3">
                        <h1 className="text-lg md:text-xl font-extrabold text-slate-900 tracking-tight">Staging Sheet</h1>
                        <Badge variant="secondary" className={`text-xs px-2.5 py-0.5 font-bold uppercase shadow-none ${formData.status === SheetStatus.LOCKED ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                            formData.status === SheetStatus.COMPLETED ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                                formData.status?.includes('PENDING') ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                                    'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}>
                            {formData.status?.replace(/_/g, ' ')}
                        </Badge>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => exportStagingToExcel(formData, formData.stagingItems || [])} className="gap-2 text-slate-600 border-slate-200 hover:bg-slate-50 shadow-sm">
                        <FileSpreadsheet size={16} /> <span className="hidden sm:inline">Export Excel</span>
                    </Button>
                    <Button variant="default" onClick={handlePrint} className="gap-2 bg-slate-900 text-white shadow-md hover:bg-slate-800 transition-all hover:shadow-lg hover:-translate-y-0.5">
                        <Printer size={16} /> <span className="hidden sm:inline">Print / PDF</span>
                    </Button>
                </div>
            </div>

            <div className="print:hidden p-3 md:p-6 space-y-6 bg-slate-50/50 min-h-[calc(100vh-80px)]">

                {/* Rejection/Comments History */}
                {formData.comments && formData.comments.length > 0 && (formData.status === SheetStatus.DRAFT || formData.status === SheetStatus.STAGING_VERIFICATION_PENDING) && (
                    <DismissibleAlert comments={formData.comments} />
                )}

                <RejectionSection
                    reason={formData.rejectionReason}
                    rejectedItems={formData.stagingItems?.filter(i => i.isRejected).map(i => ({
                        id: i.srNo,
                        name: i.skuName,
                        reason: i.rejectionReason
                    }))}
                />

                <SheetHeader
                    data={formData as any}
                    onChange={handleHeaderChange}
                    isLocked={formData.status === SheetStatus.LOCKED || formData.status === SheetStatus.STAGING_VERIFICATION_PENDING}
                    isCompleted={formData.status === SheetStatus.COMPLETED}
                    type="staging"
                />

                {/* Staging Items Data Grid */}
                <StagingItemsTable
                    items={formData.stagingItems || []}
                    status={formData.status as SheetStatus}
                    onUpdateItem={updateItem}
                    currentRole={currentRole}
                    onToggleRejection={handleToggleRejection}
                />

                {/* Mobile View */}
                <StagingMobileCards
                    items={formData.stagingItems || []}
                    status={formData.status as SheetStatus}
                    onUpdateItem={updateItem}
                />

                <div className="flex justify-center pb-8">
                    {formData.status !== SheetStatus.LOCKED && formData.status !== SheetStatus.STAGING_VERIFICATION_PENDING && (
                        <Button
                            variant="outline"
                            onClick={addItem}
                            className="w-full md:w-auto border border-dashed border-slate-300 text-slate-500 hover:text-indigo-600 hover:border-indigo-400 hover:bg-indigo-50/50 hover:shadow-sm transition-all duration-300 gap-2 py-8 px-12 rounded-xl text-base font-medium group"
                        >
                            <div className="bg-slate-100 group-hover:bg-indigo-100 p-2 rounded-full transition-colors">
                                <Plus size={18} className="text-slate-400 group-hover:text-indigo-500" />
                            </div>
                            Add New Row
                        </Button>
                    )}
                </div>

                <SharedVerificationFooter
                    status={formData.status as SheetStatus}
                    isShiftLead={currentRole === Role.SHIFT_LEAD || currentRole === Role.ADMIN}
                    onApprove={handleVerificationAction}
                    isStaging={true}
                />

                {/* Spacer to prevent Sticky Footer from blocking content */}
                <div className="h-24 print:hidden" />
            </div>

            {/* Sticky Card Footer Actions for Edit Mode */}
            {formData.status !== SheetStatus.LOCKED && formData.status !== SheetStatus.STAGING_VERIFICATION_PENDING && formData.status !== SheetStatus.COMPLETED && (
                <div className="sticky bottom-0 w-full p-4 bg-white/90 backdrop-blur-xl border-t border-slate-200 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)] flex justify-center gap-4 z-40 print:hidden animate-in slide-in-from-bottom-2">
                    <Button variant="outline" onClick={() => navigate(-1)} className="text-slate-500 hover:text-slate-900 border-slate-200 hover:bg-slate-100/50">
                        Cancel
                    </Button>
                    <Button variant="outline" onClick={handleDelete} disabled={loading} className="text-red-500 border-red-200 hover:bg-red-50/50">
                        {loading ? <Loader2 className="animate-spin" /> : <Trash2 size={16} className="mr-2" />} Delete
                    </Button>
                    <Button onClick={onRequestVerification} className="px-8 bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/20">
                        <Lock className="mr-2" size={16} /> Request Verification
                    </Button>
                    <Button onClick={() => handleSave()} disabled={loading} className="px-8 bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:-translate-y-0.5 transition-all">
                        {loading ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" size={18} />} Save Draft
                    </Button>
                </div>
            )}
        </div>
    );
}
