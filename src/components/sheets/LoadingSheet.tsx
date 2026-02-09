import { cn } from '@/lib/utils';
import { SheetStatus, Role } from '@/types';
import { useNavigate } from 'react-router-dom';
import { SheetHeader } from './shared/SheetHeader';
import { VerificationFooter as SharedVerificationFooter } from './shared/VerificationFooter';
import { Printer, ArrowLeft, Save, CheckCircle, RefreshCw, Loader2, AlertTriangle } from 'lucide-react';
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

import { LiveClock } from '@/components/shared/LiveClock';
import { DismissibleAlert } from '@/components/shared/DismissibleAlert';
import { Skeleton, SkeletonPatterns } from '@/components/ui/SkeletonLoader';

export default function LoadingSheet() {
    const navigate = useNavigate();
    const {
        currentSheet,
        loading,
        actionLoading,
        currentUser,
        states,
        errors,
        validationError,
        dismissValidationError,
        header,
        footer,
        camera: { videoRef, canvasRef, cameraActive, startCamera, stopCamera, capturePhoto, initialCaption },
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
            refreshSheets,
            setSvName,
            setSvSign,
            setSlSign,
            setDeoSign
        }
    } = useLoadingSheetLogic();


    const handleAddPhoto = (label: string, skuName?: string) => {
        const fullCaption = skuName ? `${label}: ${skuName}` : label;
        startCamera(fullCaption);
    };

    if (loading || !currentSheet) {
        return (
            <div className="flex flex-col gap-4 w-full px-4 pb-24 animate-in fade-in duration-500">
                <Skeleton className="h-20 w-full rounded-xl border border-slate-200" />
                <div className="bg-white shadow-xl shadow-slate-200 rounded-xl overflow-hidden border border-slate-200">
                    <SkeletonPatterns.SheetHeader />
                    <div className="p-8">
                        <SkeletonPatterns.TableRows rows={10} />
                    </div>
                </div>
            </div>
        );
    }

    const { isLocked, isCompleted, isPendingVerification } = states;

    // Dynamic Camera Options
    const cameraOptions = ['Evidence'];
    if (lists.returnedItems.length > 0) cameraOptions.push('Loose Returned');
    if (lists.overLoadedItems.length > 0 || lists.extraItemsWithQty.length > 0) cameraOptions.push('Extra Loaded');

    const getNextPhotoType = () => {
        const images = currentSheet?.capturedImages || [];
        // 1. Evidence is always P0
        const hasEvidence = images.some(img => typeof img !== 'string' && img.caption === 'Evidence');
        if (!hasEvidence) return 'Evidence';

        // 2. Loose Returned if applicable
        if (lists.returnedItems.length > 0) {
            const hasLoose = images.some(img => typeof img !== 'string' && img.caption.includes('Loose Returned'));
            if (!hasLoose) return 'Loose Returned';
        }

        // 3. Extra Loaded if applicable
        if (lists.overLoadedItems.length > 0 || lists.extraItemsWithQty.length > 0) {
            const hasExtra = images.some(img => typeof img !== 'string' && img.caption.includes('Extra Loaded'));
            if (!hasExtra) return 'Extra Loaded';
        }

        // Default (or just open modal to let them pick)
        return 'Evidence';
    };

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
                        onClick={() => refreshSheets()}
                        title="Refresh Data"
                        className="bg-white border border-slate-300 text-slate-500 p-2 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                        <RefreshCw size={18} className={cn(loading && "animate-spin")} />
                    </button>
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
                            onClick={() => handleSaveProgress()}
                            disabled={actionLoading}
                            className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            Save Progress
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
                        {currentSheet.capturedImages.map((img, i) => {
                            const url = typeof img === 'string' ? img : img.url;
                            return (
                                <div key={i} className="border border-black p-1 text-center break-inside-avoid page-break-inside-avoid">
                                    <div className="mb-2 text-base font-bold text-slate-900 border-b border-slate-200 pb-1 uppercase tracking-wide">
                                        {typeof img !== 'string' ? img.caption : `Evidence ${i + 1}`}
                                    </div>
                                    <img
                                        src={url}
                                        className="w-full h-auto object-contain max-h-[80vh] mx-auto"
                                        alt={`Evidence ${i + 1}`}
                                    />
                                </div>
                            );
                        })}
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
                    onAddPhoto={handleAddPhoto}
                />

                <AdditionalItemsSection
                    additionalItems={currentSheet.additionalItems || []}
                    isLocked={states.isLocked}
                    status={currentSheet.status}
                    totalAdditional={totals.totalAdditional}
                    onItemChange={handleAdditionalChange}
                    onAddPhoto={handleAddPhoto}
                    currentRole={currentUser?.role}
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

                {footer.capturedImages && footer.capturedImages.length > 0 && (
                    <div className="p-6 border-b border-slate-200 bg-white">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                            Captured Photos ({footer.capturedImages.length})
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {footer.capturedImages.map((img, idx) => {
                                const isObj = typeof img !== 'string';
                                const url = isObj ? img.url : img;
                                const caption = isObj ? img.caption : `Image ${idx + 1}`;

                                return (
                                    <div key={idx} className="relative group rounded-lg overflow-hidden border border-slate-200 shadow-sm aspect-video bg-black">
                                        <img
                                            src={url}
                                            alt={`Evidence ${idx + 1}`}
                                            className="w-full h-full object-contain"
                                        />
                                        <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-sm p-2">
                                            <p className="text-white text-[10px] font-bold text-center uppercase tracking-wide truncate">
                                                {caption}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
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
                            onClick={() => handleSaveProgress()}
                            disabled={actionLoading}
                            className="px-6 py-2.5 bg-white text-slate-700 border border-slate-300 rounded-lg flex items-center gap-2 cursor-pointer hover:bg-slate-50 transition-colors font-bold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {actionLoading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                            Save Progress
                        </button>
                        <button
                            type="button"
                            onClick={() => startCamera(getNextPhotoType())}
                            className={cn(
                                "px-6 py-2.5 border rounded-lg flex items-center gap-2 cursor-pointer transition-colors font-bold",
                                "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200"
                            )}
                        >
                            {states.isPhotoComplete ? "Add More Photos" : "Add Photo"}
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={!states.isDataComplete || !states.isPhotoComplete || actionLoading}
                            className={cn(
                                "px-8 py-2.5 rounded-lg flex items-center gap-2 font-bold shadow-lg transition-colors",
                                (states.isDataComplete && states.isPhotoComplete && !actionLoading)
                                    ? "bg-green-600 text-white hover:bg-green-700"
                                    : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                            )}
                        >
                            {actionLoading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                            Request Verification
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
                options={cameraOptions}
                initialCaption={initialCaption}
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
