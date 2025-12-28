import { useState, useEffect } from 'react';
import { SheetStatus, Role, Comment } from '@/types';
import { useNavigate } from 'react-router-dom';
import { SheetHeader } from './shared/SheetHeader';
import { VerificationFooter as SharedVerificationFooter } from './shared/VerificationFooter';
import { Printer, ArrowLeft, Save, CheckCircle, AlertTriangle, Camera, X, Clock } from 'lucide-react';
import { useLoadingSheetLogic } from '@/hooks/useLoadingSheetLogic';

// Sub-components
import { CameraCaptureModal } from './loading/CameraCaptureModal';
import { SignaturePad } from './loading/SignaturePad';
import { LoadingSummary } from './loading/LoadingSummary';
import { AdditionalItemsSection } from './loading/AdditionalItemsSection';
import { LoadingItemsTable } from './loading/LoadingItemsTable';
import { RejectionSection } from './shared/RejectionSection';
import { FileSpreadsheet } from 'lucide-react';
import { exportLoadingToExcel } from '@/lib/excelExport';
import { PrintableLoadingSheet } from '@/components/print/PrintableLoadingSheet';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const LiveClock = () => {
    const [t, setT] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => setT(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);
    return (
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg text-slate-600 font-mono text-xs font-bold border border-slate-200 shadow-sm">
            <Clock size={14} className="text-indigo-500" />
            {t.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>
    );
};

const DismissibleAlert = ({ comments }: { comments: Comment[] }) => {
    const [isVisible, setIsVisible] = useState(true);
    if (!isVisible) return null;
    return (
        <div className="bg-white border-l-4 border-red-500 rounded-lg shadow-sm p-4 flex gap-4 animate-in fade-in slide-in-from-top-2 relative mb-4 print:hidden">
            <button
                onClick={() => setIsVisible(false)}
                className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 transition-colors"
            >
                <X size={16} />
            </button>
            <div className="bg-red-50 p-2.5 rounded-full h-fit text-red-500 shrink-0">
                <AlertTriangle size={20} />
            </div>
            <div className="flex-1">
                <h3 className="font-bold text-slate-800 text-sm mb-2 flex items-center gap-2">
                    Shift Lead Feedback
                    <span className="text-[10px] font-normal uppercase tracking-wider bg-red-50 text-red-600 px-2 py-0.5 rounded-sm border border-red-100">
                        Review Required
                    </span>
                </h3>
                <div className="space-y-3">
                    {comments.map((comment, i) => (
                        <div
                            key={i}
                            className="text-sm text-slate-600 bg-slate-50 p-3 rounded-md border border-slate-100"
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className="font-bold text-slate-900 text-xs uppercase tracking-wide">
                                    {comment.author}
                                </span>
                                <span className="text-slate-400 text-[10px]">
                                    {new Date(comment.timestamp).toLocaleString()}
                                </span>
                            </div>
                            <p className="leading-relaxed text-slate-700">{comment.text}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default function LoadingSheet() {
    const navigate = useNavigate();
    const {
        currentSheet,
        loading,
        currentUser,
        states,
        errors,
        validationError,
        dismissValidationError,
        header,
        footer,
        camera: { videoRef, canvasRef, cameraActive, startCamera, stopCamera, capturePhoto },
        totals,
        lists,
        handlers: {
            handleHeaderChange,
            handleLoadingCellChange,
            handleCellBlur,
            handleLooseChange,
            handleAdditionalChange,
            handleSaveProgress,
            handleSubmit,
            handleVerificationAction,
            handleToggleRejection,
            setSvName,
            setSvSign,
            setSlSign,
            setDeoSign
        }
    } = useLoadingSheetLogic();


    if (loading || !currentSheet)
        return <div className="p-8 text-center text-slate-500">Loading Sheet Data...</div>;

    const { isLocked, isCompleted, isPendingVerification } = states;

    return (
        <div className="flex flex-col gap-4 w-full px-4 pb-24 print:w-full print:max-w-none print:pb-0 print:gap-1">
            {/* Screen Header */}
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200 print:hidden">
                <div className="flex items-center gap-4">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="text-slate-500 hover:text-blue-600"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            Loading Check Sheet
                            {isPendingVerification && (
                                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full border border-purple-200">
                                    VERIFICATION PENDING
                                </span>
                            )}
                        </h2>
                        <p className="text-xs text-slate-400 font-mono">ID: {currentSheet.id}</p>
                    </div>
                    <div className="h-8 w-px bg-slate-200 mx-2 hidden sm:block"></div>
                    <LiveClock />
                </div>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() =>
                            exportLoadingToExcel(
                                header,
                                currentSheet.loadingItems || [],
                                currentSheet.stagingItems || []
                            )
                        }
                        className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-slate-50 transition-colors"
                    >
                        <FileSpreadsheet size={16} /> Export Excel
                    </button>
                    <button
                        type="button"
                        onClick={() => window.print()}
                        className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm hover:bg-slate-800 transition-colors"
                    >
                        <Printer size={16} /> Print / PDF
                    </button>
                    {!isLocked && (
                        <button
                            type="button"
                            onClick={handleSaveProgress}
                            className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-slate-50 transition-colors"
                        >
                            <Save size={16} /> Save Progress
                        </button>
                    )}
                </div>
            </div>

            {/* ACTUAL HIDDEN PRINT LAYOUT (For browser print) */}
            <div className="hidden print:block">
                <PrintableLoadingSheet
                    currentSheet={currentSheet}
                    header={header}
                    totals={totals}
                    lists={lists}
                    footer={footer}
                />
            </div>
            {/* ATTACHED IMAGES SECTION (New Page) */}
            {currentSheet?.capturedImages && currentSheet.capturedImages.length > 0 && (
                <div className="mt-4 print-break-before hidden print:block">
                    <div className="font-bold text-sm mb-2 uppercase border-b border-black pb-1">
                        ATTACHED IMAGES ({currentSheet.capturedImages.length})
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                        {currentSheet.capturedImages.map((imgUrl, i) => (
                            <div key={i} className="border border-black p-1">
                                <img
                                    src={imgUrl}
                                    className="w-full h-auto object-contain max-h-[90vh]"
                                    alt={`Evidence ${i + 1}`}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {/* MAIN FORM UI */}
            <RejectionSection
                reason={currentSheet?.rejectionReason}
                rejectedItems={currentSheet?.loadingItems
                    ?.filter((i) => i.isRejected)
                    .map((i) => {
                        const sItem = currentSheet?.stagingItems.find((s) => s.srNo === i.skuSrNo);
                        return {
                            id: i.skuSrNo,
                            name: sItem?.skuName || 'Unknown SKU',
                            reason: i.rejectionReason
                        };
                    })}
            />
            {
                currentSheet?.comments &&
                currentSheet.comments.length > 0 &&
                (isPendingVerification || currentSheet.status === SheetStatus.LOCKED) && (
                    <DismissibleAlert comments={currentSheet.comments} />
                )
            }
            <div className="bg-white shadow-xl shadow-slate-200 rounded-xl overflow-hidden border border-slate-200 print:hidden">
                <SheetHeader
                    data={{
                        shift: header.shift,
                        date: currentSheet.date,
                        supervisorName: header.supervisorName,
                        pickingBy: header.pickingBy,
                        destination: header.destination,
                        loadingDockNo: header.loadingDock,
                        transporter: header.transporter,
                        empCode: header.empCode,
                        vehicleNo: header.vehicleNo,
                        driverName: header.driverName,
                        sealNo: header.sealNo,
                        regSerialNo: header.regSerialNo,
                        loadingStartTime: header.startTime,
                        loadingEndTime: header.endTime,
                        pickingCrosscheckedBy: header.pickingCrosscheckedBy
                    }}
                    onChange={handleHeaderChange}
                    isLocked={isLocked}
                    isCompleted={isCompleted}
                    errors={errors}
                    type="loading"
                />

                <LoadingItemsTable
                    currentSheet={currentSheet}
                    isLocked={isLocked}
                    onCellChange={handleLoadingCellChange}
                    onCellBlur={handleCellBlur}
                    onLooseChange={handleLooseChange}
                    onToggleRejection={handleToggleRejection}
                    currentRole={currentUser?.role}
                />

                <AdditionalItemsSection
                    additionalItems={currentSheet.additionalItems || []}
                    isLocked={isLocked}
                    status={currentSheet.status as SheetStatus}
                    totalAdditional={totals.totalAdditional}
                    onItemChange={handleAdditionalChange}
                />

                <LoadingSummary
                    totalStaging={totals.totalStaging}
                    grandTotalLoaded={totals.grandTotalLoaded}
                    balance={totals.balance}
                    returnedItems={lists.returnedItems}
                    overLoadedItems={lists.overLoadedItems}
                    extraItemsWithQty={lists.extraItemsWithQty}
                    currentSheet={currentSheet}
                />

                {footer.capturedImage && (
                    <div className="p-6 border-b border-slate-200 bg-white">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                            Captured Photo
                        </h3>
                        <div className="max-w-md rounded-lg overflow-hidden border border-slate-200 shadow-sm">
                            <img
                                src={footer.capturedImage}
                                alt="Loading Proof"
                                className="w-full h-auto object-cover"
                            />
                        </div>
                    </div>
                )}

                <SignaturePad
                    svName={footer.svName}
                    svSign={footer.svSign}
                    slSign={footer.slSign}
                    deoSign={footer.deoSign}
                    isLocked={isLocked}
                    onChange={(field, value) => {
                        if (field === 'svName') setSvName(value);
                        if (field === 'svSign') setSvSign(value);
                        if (field === 'slSign') setSlSign(value);
                        if (field === 'deoSign') setDeoSign(value);
                    }}
                />

                {!isLocked && !isCompleted && !cameraActive && !isPendingVerification && (
                    <div className="fixed bottom-0 left-0 w-full p-4 bg-white/90 backdrop-blur-md border-t border-slate-200 shadow flex justify-center gap-4 z-50 lg:pl-64 no-print text-xs">
                        <button
                            type="button"
                            onClick={handleSaveProgress}
                            className="px-6 py-2.5 bg-white text-slate-700 border border-slate-300 rounded-lg flex items-center gap-2 cursor-pointer hover:bg-slate-50 transition-colors font-bold shadow-sm"
                        >
                            <Save size={18} /> Save Progress
                        </button>
                        <button
                            type="button"
                            onClick={startCamera}
                            className="px-6 py-2.5 bg-slate-100 text-slate-700 border border-slate-300 rounded-lg flex items-center gap-2 cursor-pointer hover:bg-slate-200 transition-colors pointer-events-auto"
                        >
                            <Camera size={18} /> Add Photo
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            className="px-8 py-2.5 bg-green-600 text-white rounded-lg flex items-center gap-2 font-bold shadow-lg cursor-pointer hover:bg-green-700 transition-colors pointer-events-auto"
                        >
                            <CheckCircle size={18} /> Request Verification
                        </button>
                    </div>
                )}

                {currentSheet && (
                    <SharedVerificationFooter
                        status={currentSheet.status as SheetStatus}
                        isShiftLead={
                            currentUser?.role === Role.SHIFT_LEAD ||
                            currentUser?.role === Role.ADMIN
                        }
                        onApprove={handleVerificationAction}
                        isStaging={false}
                    />
                )}
            </div>
            <CameraCaptureModal
                cameraActive={cameraActive}
                videoRef={videoRef}
                onStop={stopCamera}
                onCapture={capturePhoto}
            />
            <canvas ref={canvasRef} className="hidden" />

            <Dialog open={!!validationError} onOpenChange={dismissValidationError}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-red-600 flex items-center gap-2">
                            <AlertTriangle size={20} />
                            {validationError?.title}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="whitespace-pre-wrap text-sm text-slate-700 font-medium">
                            {validationError?.message}
                        </p>
                    </div>
                    <DialogFooter>
                        <Button onClick={dismissValidationError} className="w-full bg-slate-900">
                            OK
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
