import { useState } from 'react';
import { SheetStatus, Role } from '@/types';
import { useNavigate } from 'react-router-dom';
import { SheetHeader } from './shared/SheetHeader';
import { VerificationFooter as SharedVerificationFooter } from './shared/VerificationFooter';
import {
    Printer,
    ArrowLeft,
    Save,
    CheckCircle,
    AlertTriangle,
    Camera,
    X
} from 'lucide-react';
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

const DismissibleAlert = ({ comments }: { comments: any[] }) => {
    const [isVisible, setIsVisible] = useState(true);
    if (!isVisible) return null;
    return (
        <div className="bg-white border-l-4 border-red-500 rounded-lg shadow-sm p-4 flex gap-4 animate-in fade-in slide-in-from-top-2 relative mb-4 print:hidden">
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



export default function LoadingSheet() {
    const navigate = useNavigate();
    const {
        currentSheet, loading, currentUser, states, errors,
        header, footer, camera, totals, lists, handlers
    } = useLoadingSheetLogic();

    if (loading || !currentSheet) return <div className="p-8 text-center text-slate-500">Loading Sheet Data...</div>;

    const { isLocked, isCompleted, isPendingVerification } = states;

    return (
        <div className="flex flex-col gap-4 max-w-5xl mx-auto pb-24 print:w-full print:max-w-none print:pb-0 print:gap-1">
            {/* Screen Header */}
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200 print:hidden">
                <div className="flex items-center gap-4">
                    <button type="button" onClick={() => navigate(-1)} className="text-slate-500 hover:text-blue-600"><ArrowLeft size={20} /></button>
                    <div>
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            Loading Check Sheet
                            {isPendingVerification && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full border border-purple-200">VERIFICATION PENDING</span>}
                        </h2>
                        <p className="text-xs text-slate-400 font-mono">ID: {currentSheet.id}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button type="button" onClick={() => exportLoadingToExcel(header, currentSheet.loadingItems || [], currentSheet.stagingItems || [])} className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-slate-50 transition-colors"><FileSpreadsheet size={16} /> Export Excel</button>
                    <button type="button" onClick={() => window.print()} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm hover:bg-slate-800 transition-colors"><Printer size={16} /> Print / PDF</button>
                    {!isLocked && <button type="button" onClick={handlers.handleSaveProgress} className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-slate-50 transition-colors"><Save size={16} /> Save Progress</button>}
                </div>
            </div>

            {/* EXCEL PRINT LAYOUT (Legacy Ported) */}
            <div className="hidden print:block font-sans text-[10px] w-full text-black bg-white p-4 print:p-0 overflow-auto">
                <div className="min-w-[800px]">
                    <table className="w-full border-collapse border border-black mb-1 table-fixed text-[10px]">
                        <colgroup>
                            <col className="w-[10%]" /><col className="w-[23%]" />
                            <col className="w-[10%]" /><col className="w-[23%]" />
                            <col className="w-[14%]" /><col className="w-[20%]" />
                        </colgroup>
                        <thead><tr><th colSpan={6} className="border border-black p-1 text-center text-xl font-bold bg-white">UCIA - FG WAREHOUSE</th></tr></thead>
                        <tbody>
                            <tr><td className="border border-black p-1 font-bold text-center bg-gray-100" colSpan={6}>Staging & Loading Check Sheet</td></tr>
                            <tr>
                                <td className="border border-black p-1 font-bold">Shift</td><td className="border border-black p-1 font-bold">{header.shift}</td>
                                <td className="border border-black p-1 font-bold">Date</td><td className="border border-black p-1 font-medium">{currentSheet.date}</td>
                                <td className="border border-black p-1 font-bold">Name of the SV / SG</td><td className="border border-black p-1 font-medium">{currentSheet.supervisorName}</td>
                            </tr>
                            <tr>
                                <td className="border border-black p-1 font-bold">Emp.code</td><td className="border border-black p-1 font-medium">{currentSheet.empCode}</td>
                                <td className="border border-black p-1 font-bold">Transporter</td><td className="border border-black p-1 font-bold">{header.transporter}</td>
                                <td className="border border-black p-1 font-bold">Loading Start Time</td><td className="border border-black p-1 font-medium">{header.startTime}</td>
                            </tr>
                            <tr>
                                <td className="border border-black p-1 font-bold">Picking By</td><td className="border border-black p-1 font-bold">{header.pickingBy}</td>
                                <td className="border border-black p-1 font-bold">Destination</td><td className="border border-black p-1 font-medium">{header.destination}</td>
                                <td className="border border-black p-1 font-bold">Loading End Time</td><td className="border border-black p-1 font-medium">{header.endTime}</td>
                            </tr>
                        </tbody>
                    </table>

                    {/* Staging & Loading Table (Print) */}
                    <table className="w-full border-collapse border border-black text-[9px] mb-1">
                        <thead>
                            <tr className="bg-gray-200">
                                <th rowSpan={2} className="border border-black p-1 w-8">Sr.No</th>
                                <th rowSpan={2} className="border border-black p-1">SKU Name</th>
                                <th colSpan={3} className="border border-black p-1">STAGING DETAILS</th>
                                <th colSpan={10} className="border border-black p-1">LOADING DETAILS (CELLS 1-10)</th>
                                <th rowSpan={2} className="border border-black p-1 w-10">Lse</th>
                                <th rowSpan={2} className="border border-black p-1 w-12">Tot</th>
                                <th rowSpan={2} className="border border-black p-1 w-12">Bal</th>
                            </tr>
                            <tr className="bg-gray-100">
                                <th className="border border-black p-1 w-8">Cs/P</th><th className="border border-black p-1 w-8">Full</th><th className="border border-black p-1 w-10">TTL</th>
                                {Array.from({ length: 10 }).map((_, i) => <th key={i} className="border border-black p-1 w-4">{i + 1}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {currentSheet.loadingItems?.map((lItem) => {
                                const sItem = currentSheet.stagingItems.find(s => s.srNo === lItem.skuSrNo);
                                if (!sItem || !sItem.skuName) return null;
                                const rowsNeeded = Math.max(1, Math.ceil(sItem.fullPlt / 10));
                                return Array.from({ length: rowsNeeded }).map((_, rIndex) => (
                                    <tr key={`${lItem.skuSrNo}-${rIndex}`}>
                                        {rIndex === 0 && (
                                            <>
                                                <td rowSpan={rowsNeeded} className="border border-black p-1 text-center">{lItem.skuSrNo}</td>
                                                <td rowSpan={rowsNeeded} className="border border-black p-1">{sItem.skuName}</td>
                                                <td rowSpan={rowsNeeded} className="border border-black p-1 text-center">{sItem.casesPerPlt}</td>
                                                <td rowSpan={rowsNeeded} className="border border-black p-1 text-center">{sItem.fullPlt}</td>
                                                <td rowSpan={rowsNeeded} className="border border-black p-1 text-center font-bold">{sItem.ttlCases}</td>
                                            </>
                                        )}
                                        {Array.from({ length: 10 }).map((_, cIndex) => {
                                            const cell = lItem.cells.find(c => c.row === rIndex && c.col === cIndex);
                                            return <td key={cIndex} className="border border-black p-1 text-center">{cell?.value || ''}</td>;
                                        })}
                                        {rIndex === 0 && (
                                            <>
                                                <td rowSpan={rowsNeeded} className="border border-black p-1 text-center">{lItem.looseInput || ''}</td>
                                                <td rowSpan={rowsNeeded} className="border border-black p-1 text-center font-bold">{lItem.total}</td>
                                                <td rowSpan={rowsNeeded} className={`border border-black p-1 text-center font-bold ${lItem.balance !== 0 ? 'text-red-600' : ''}`}>{lItem.balance}</td>
                                            </>
                                        )}
                                    </tr>
                                ));
                            })}
                        </tbody>
                    </table>

                    {/* Print Summary & Remarks */}
                    <div className="border border-black border-t-0 flex">
                        <div className="w-[40%] border-r border-black flex flex-col text-[9px]">
                            <div className="flex justify-between border-b border-black p-1 font-bold"><span>Total Staging Qty</span><span>{totals.totalStaging}</span></div>
                            <div className="flex justify-between border-b border-black p-1 font-bold"><span>Actual Loaded Qty</span><span>{totals.grandTotalLoaded}</span></div>
                            <div className="flex justify-between p-1 font-bold"><span>Balance to be returned</span><span>{totals.balance}</span></div>
                        </div>
                        <div className="w-[60%] p-1 flex flex-col">
                            <div className="font-bold text-xs">Remarks</div>
                            <div className="mt-1 text-[9px] italic">
                                {lists.returnedItems.map((item, idx) => <p key={idx}>For {currentSheet.stagingItems.find(s => s.srNo === item.skuSrNo)?.skuName} {item.balance} loose returned.</p>)}
                                {lists.overLoadedItems.map((item, idx) => <p key={idx}>For {currentSheet.stagingItems.find(s => s.srNo === item.skuSrNo)?.skuName} {Math.abs(item.balance)} Cases Extra loaded.</p>)}
                                {lists.extraItemsWithQty.map((item, idx) => <p key={idx}>For {item.skuName} {item.total} Cases Extra loaded.</p>)}
                                {footer.remarks}
                            </div>
                        </div>
                    </div>

                    <div className="flex border border-black border-t-0 text-xs">
                        <div className="w-1/4 border-r border-black p-1"><div>Supervisor Name:</div><div className="font-bold">{footer.svName}</div></div>
                        <div className="w-1/4 border-r border-black p-1"><div>Supervisor Sign:</div><div className="font-script text-sm">{footer.svSign}</div></div>
                        <div className="w-1/4 border-r border-black p-1"><div>SL Sign:</div><div className="font-script text-sm">{footer.slSign}</div></div>
                        <div className="w-1/4 p-1"><div>DEO Sign:</div><div className="font-script text-sm">{footer.deoSign}</div></div>
                    </div>
                    {footer.capturedImage && <div className="mt-4"><img src={footer.capturedImage} className="max-w-full h-auto" /></div>}
                </div>
            </div>

            {/* MAIN FORM UI */}
            <RejectionSection
                reason={currentSheet.rejectionReason}
                rejectedItems={currentSheet.loadingItems?.filter(i => i.isRejected).map(i => {
                    const sItem = currentSheet.stagingItems.find(s => s.srNo === i.skuSrNo);
                    return {
                        id: i.skuSrNo,
                        name: sItem?.skuName || 'Unknown SKU',
                        reason: i.rejectionReason
                    };
                })}
            />
            {currentSheet.comments && currentSheet.comments.length > 0 && (isPendingVerification || currentSheet.status === SheetStatus.LOCKED) && (
                <DismissibleAlert comments={currentSheet.comments} />
            )}

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
                    onChange={handlers.handleHeaderChange}
                    isLocked={isLocked}
                    isCompleted={isCompleted}
                    errors={errors}
                    type="loading"
                />

                <LoadingItemsTable
                    currentSheet={currentSheet}
                    isLocked={isLocked}
                    displayedStagingItems={lists.displayedStagingItems}
                    onCellChange={handlers.handleLoadingCellChange}
                    onCellBlur={handlers.handleCellBlur}
                    onLooseChange={handlers.handleLooseChange}
                    onToggleRejection={handlers.handleToggleRejection}
                    currentRole={currentUser?.role}
                />

                <AdditionalItemsSection
                    additionalItems={currentSheet.additionalItems || []}
                    isLocked={isLocked}
                    status={currentSheet.status as SheetStatus}
                    totalAdditional={totals.totalAdditional}
                    onItemChange={handlers.handleAdditionalChange}
                />

                <LoadingSummary
                    totalStaging={totals.totalStaging}
                    grandTotalLoaded={totals.grandTotalLoaded}
                    balance={totals.balance}
                    remarks={footer.remarks}
                    onRemarksChange={handlers.setRemarks}
                    isLocked={isLocked}
                    returnedItems={lists.returnedItems}
                    overLoadedItems={lists.overLoadedItems}
                    extraItemsWithQty={lists.extraItemsWithQty}
                    currentSheet={currentSheet}
                />

                {footer.capturedImage && (
                    <div className="p-6 border-b border-slate-200 bg-white">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">Captured Photo</h3>
                        <div className="max-w-md rounded-lg overflow-hidden border border-slate-200 shadow-sm">
                            <img src={footer.capturedImage} alt="Loading Proof" className="w-full h-auto object-cover" />
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
                        if (field === 'svName') handlers.setSvName(value);
                        if (field === 'svSign') handlers.setSvSign(value);
                        if (field === 'slSign') handlers.setSlSign(value);
                        if (field === 'deoSign') handlers.setDeoSign(value);
                    }}
                />

                {!isLocked && !isCompleted && !camera.cameraActive && !isPendingVerification && (
                    <div className="fixed bottom-0 left-0 w-full p-4 bg-white/90 backdrop-blur-md border-t border-slate-200 shadow flex justify-center gap-4 z-50 lg:pl-64 no-print text-xs">
                        <button type="button" onClick={handlers.handleSaveProgress} className="px-6 py-2.5 bg-white text-slate-700 border border-slate-300 rounded-lg flex items-center gap-2 cursor-pointer hover:bg-slate-50 transition-colors font-bold shadow-sm"><Save size={18} /> Save Progress</button>
                        <button type="button" onClick={camera.startCamera} className="px-6 py-2.5 bg-slate-100 text-slate-700 border border-slate-300 rounded-lg flex items-center gap-2 cursor-pointer hover:bg-slate-200 transition-colors pointer-events-auto"><Camera size={18} /> Add Photo</button>
                        <button type="button" onClick={handlers.handleSubmit} className="px-8 py-2.5 bg-green-600 text-white rounded-lg flex items-center gap-2 font-bold shadow-lg cursor-pointer hover:bg-green-700 transition-colors pointer-events-auto"><CheckCircle size={18} /> Request Verification</button>
                    </div>
                )}

                {currentSheet && (
                    <SharedVerificationFooter
                        status={currentSheet.status as SheetStatus}
                        isShiftLead={currentUser?.role === Role.SHIFT_LEAD || currentUser?.role === Role.ADMIN}
                        onApprove={handlers.handleVerificationAction}
                        isStaging={false}
                    />
                )}
            </div>

            <CameraCaptureModal
                cameraActive={camera.cameraActive}
                videoRef={camera.videoRef}
                onStop={camera.stopCamera}
                onCapture={camera.capturePhoto}
            />
            <canvas ref={camera.canvasRef} className="hidden" />
        </div>
    );
}
