import { useState } from 'react';
import { SheetStatus, Role } from '@/types';
import { useNavigate } from 'react-router-dom';
import { SheetHeader } from './shared/SheetHeader';
import { VerificationFooter as SharedVerificationFooter } from './shared/VerificationFooter';
import { Printer, ArrowLeft, Save, CheckCircle, AlertTriangle, Camera, X } from 'lucide-react';
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
            handleToggleRejection
        }
    } = useLoadingSheetLogic();

    if (loading || !currentSheet)
        return <div className="p-8 text-center text-slate-500">Loading Sheet Data...</div>;

    const { isLocked, isCompleted, isPendingVerification } = states;

    return (
        <div className="flex flex-col gap-4 max-w-5xl mx-auto pb-24 print:w-full print:max-w-none print:pb-0 print:gap-1">
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
            {/* EXCEL PRINT LAYOUT (Legacy Ported) */}
            {/* EXCEL PRINT LAYOUT (Restored 1-10 Grid Box Style) */}
            <div className="hidden print:block font-sans text-black bg-white w-full max-w-none">
                <style>{`
                    @media print {
                        @page { size: A4 landscape; margin: 5mm; }
                        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        tr { page-break-inside: avoid; }
                    }
                `}</style>

                <div className="w-full border border-black text-[10px]">
                    {/* HEADER */}
                    {/* HEADER */}
                    <table className="w-full border-collapse border border-black mb-1 table-fixed">
                        <colgroup>
                            <col className="w-[8%]" />{' '}
                            {/* 1: Shift/Trans/Dest/Dock (Short label) */}
                            <col className="w-[17%]" /> {/* 2: Value */}
                            <col className="w-[8%]" />{' '}
                            {/* 3: Date/Driver/Vehicle/Seal (Short label) */}
                            <col className="w-[17%]" /> {/* 4: Value */}
                            <col className="w-[15%]" />{' '}
                            {/* 5: Picking By/Picking Cross/Start/End (Long label) */}
                            <col className="w-[17%]" /> {/* 6: Value */}
                            <col className="w-[8%]" /> {/* 7: Emp code/End label */}
                            <col className="w-[10%]" /> {/* 8: Value */}
                        </colgroup>
                        <thead>
                            <tr>
                                <th
                                    colSpan={8}
                                    className="border border-black p-2 text-center text-xl font-bold bg-gray-50 uppercase"
                                >
                                    UCIA - FG WAREHOUSE
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td
                                    className="border border-black p-1 font-bold text-center bg-gray-100"
                                    colSpan={8}
                                >
                                    STAGING & LOADING CHECK SHEET
                                </td>
                            </tr>
                            {/* Row 1: 4 Items (1+1+1+1+1+1+1+1 items = 8 cols) */}
                            <tr>
                                <td className="border border-black p-1 font-bold bg-gray-50">
                                    Shift
                                </td>
                                <td className="border border-black p-1 font-medium">
                                    {header.shift}
                                </td>
                                <td className="border border-black p-1 font-bold bg-gray-50">
                                    Date
                                </td>
                                <td className="border border-black p-1 font-medium">
                                    {currentSheet.date}
                                </td>
                                <td className="border border-black p-1 font-bold bg-gray-50">
                                    Picking By *
                                </td>
                                <td className="border border-black p-1 font-medium">
                                    {currentSheet.pickingBy}
                                </td>
                                <td className="border border-black p-1 font-bold bg-gray-50">
                                    Emp. Code
                                </td>
                                <td className="border border-black p-1 font-medium">
                                    {header.pickingByEmpCode || '-'}
                                </td>
                            </tr>
                            {/* Row 2: 4 Items (2+2+2+2 cols = 8) */}
                            <tr>
                                <td className="border border-black p-1 font-bold bg-gray-50">
                                    Transporter
                                </td>
                                <td className="border border-black p-1 font-medium">
                                    {header.transporter}
                                </td>
                                <td className="border border-black p-1 font-bold bg-gray-50">
                                    Driver Name
                                </td>
                                <td className="border border-black p-1 font-medium">
                                    {header.driverName}
                                </td>
                                <td className="border border-black p-1 font-bold bg-gray-50">
                                    Picking Crosschecked By
                                </td>
                                <td className="border border-black p-1 font-medium">
                                    {currentSheet.pickingCrosscheckedBy}
                                </td>
                                <td className="border border-black p-1 font-bold bg-gray-50">
                                    Emp. Code
                                </td>
                                <td className="border border-black p-1 font-medium">
                                    {header.pickingCrosscheckedByEmpCode || '-'}
                                </td>
                            </tr>
                            {/* Row 3: 3 Items (Col alignment fixed) */}
                            <tr>
                                <td className="border border-black p-1 font-bold bg-gray-50">
                                    Destination
                                </td>
                                <td className="border border-black p-1 font-medium">
                                    {header.destination}
                                </td>
                                <td className="border border-black p-1 font-bold bg-gray-50">
                                    Vehicle No
                                </td>
                                <td className="border border-black p-1 font-medium uppercase">
                                    {header.vehicleNo}
                                </td>
                                <td className="border border-black p-1 font-bold bg-gray-50">
                                    Start Time
                                </td>
                                <td className="border border-black p-1 font-medium" colSpan={3}>
                                    {(() => {
                                        const t = currentSheet.loadingStartTime;
                                        if (!t) return '-';
                                        if (t.includes(':')) return t;
                                        const d = new Date(t);
                                        return isNaN(d.getTime())
                                            ? '-'
                                            : d.toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            });
                                    })()}
                                </td>
                            </tr>
                            {/* Row 4: 3 Items (Col alignment fixed) */}
                            <tr>
                                <td className="border border-black p-1 font-bold bg-gray-50">
                                    Loading Dock
                                </td>
                                <td className="border border-black p-1 font-medium">
                                    {header.loadingDock}
                                </td>
                                <td className="border border-black p-1 font-bold bg-gray-50">
                                    Seal No *
                                </td>
                                <td className="border border-black p-1 font-medium">
                                    {header.sealNo}
                                </td>
                                <td className="border border-black p-1 font-bold bg-gray-50">
                                    End Time
                                </td>
                                <td className="border border-black p-1 font-medium" colSpan={3}>
                                    {(() => {
                                        const t = currentSheet.loadingEndTime;
                                        if (!t) return '-';
                                        if (t.includes(':')) return t;
                                        const d = new Date(t);
                                        return isNaN(d.getTime())
                                            ? '-'
                                            : d.toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            });
                                    })()}
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    {/* MAIN DATA TABLE (Standard Items Only) */}
                    <table className="w-full border-collapse border border-black text-[9px] mb-2">
                        <colgroup>
                            <col className="w-[4%]" />
                            {/* Sr No */}
                            <col className="w-[16%]" />
                            {/* SKU Name */}

                            {/* Staging (3 cols) */}
                            <col className="w-[5%]" />
                            <col className="w-[5%]" />
                            <col className="w-[5%]" />

                            {/* Loading 1-10 (10 cols ~4.5% each) */}
                            <col className="w-[4.5%]" />
                            <col className="w-[4.5%]" />
                            <col className="w-[4.5%]" />
                            <col className="w-[4.5%]" />
                            <col className="w-[4.5%]" />
                            <col className="w-[4.5%]" />
                            <col className="w-[4.5%]" />
                            <col className="w-[4.5%]" />
                            <col className="w-[4.5%]" />
                            <col className="w-[4.5%]" />

                            {/* Summary (3 cols) */}
                            <col className="w-[5%]" />
                            <col className="w-[5%]" />
                            <col className="w-[5%]" />
                        </colgroup>
                        <thead>
                            <tr className="bg-gray-100">
                                <th
                                    rowSpan={2}
                                    className="border border-black p-1 text-center bg-gray-200"
                                >
                                    Sr.no
                                </th>
                                <th
                                    rowSpan={2}
                                    className="border border-black p-1 text-left px-2 bg-gray-200"
                                >
                                    SKU Name
                                </th>
                                <th
                                    colSpan={3}
                                    className="border border-black p-1 text-center bg-gray-300"
                                >
                                    STAGING
                                </th>
                                <th
                                    colSpan={10}
                                    className="border border-black p-1 text-center bg-gray-300"
                                >
                                    LOADING DETAILS (1-10)
                                </th>
                                <th
                                    rowSpan={2}
                                    className="border border-black p-1 text-center bg-gray-200"
                                >
                                    Loose
                                </th>
                                <th
                                    rowSpan={2}
                                    className="border border-black p-1 text-center bg-gray-200"
                                >
                                    Total
                                </th>
                                <th
                                    rowSpan={2}
                                    className="border border-black p-1 text-center bg-gray-200"
                                >
                                    Balance
                                </th>
                            </tr>
                            <tr className="bg-gray-100">
                                <th className="border border-black p-0.5 text-center">Full</th>
                                <th className="border border-black p-0.5 text-center">Loose</th>
                                <th className="border border-black p-0.5 text-center font-bold">
                                    Total
                                </th>

                                {/* 1-10 Headers */}
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                                    <th
                                        key={n}
                                        className="border border-black p-0.5 text-center bg-gray-300"
                                    >
                                        {n}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {/* Standard Loading Items with Multi-Row Logic */}
                            {currentSheet.loadingItems?.map((lItem, idx) => {
                                const sItem = currentSheet.stagingItems.find(
                                    (s) => s.srNo === lItem.skuSrNo
                                );
                                if (!sItem) return null;

                                // Calculate rows needed based on Full Pallets (10 per row)
                                const rowsNeeded = Math.max(
                                    1,
                                    Math.ceil((sItem.fullPlt || 0) / 10)
                                );

                                return Array.from({ length: rowsNeeded }).map((_, rIndex) => (
                                    <tr key={`l-${idx}-${rIndex}`} className="h-6">
                                        {/* Header Columns (RowSpan for first row only) */}
                                        {rIndex === 0 && (
                                            <>
                                                <td
                                                    rowSpan={rowsNeeded}
                                                    className="border border-black p-1 text-center"
                                                >
                                                    {lItem.skuSrNo}
                                                </td>
                                                <td
                                                    rowSpan={rowsNeeded}
                                                    className="border border-black p-1 px-1 font-medium truncate"
                                                >
                                                    {sItem.skuName}
                                                </td>
                                                <td
                                                    rowSpan={rowsNeeded}
                                                    className="border border-black p-1 text-center"
                                                >
                                                    {sItem.fullPlt}
                                                </td>
                                                <td
                                                    rowSpan={rowsNeeded}
                                                    className="border border-black p-1 text-center"
                                                >
                                                    {sItem.loose}
                                                </td>
                                                <td
                                                    rowSpan={rowsNeeded}
                                                    className="border border-black p-1 text-center font-bold bg-gray-50"
                                                >
                                                    {sItem.ttlCases}
                                                </td>
                                            </>
                                        )}

                                        {/* Loading Cells 1-10 for this Row (rIndex) */}
                                        {Array.from({ length: 10 }).map((_, cIndex) => {
                                            // Find cell matching this specific Row AND Column
                                            const cell = lItem.cells.find(
                                                (c) => (c.row || 0) === rIndex && c.col === cIndex
                                            );
                                            const hasVal = cell && cell.value > 0;

                                            // Gray out cells that are NOT required by the Total Pallet Count (sItem.fullPlt)
                                            const absoluteIndex = rIndex * 10 + cIndex;
                                            const isRequiredSlot =
                                                absoluteIndex < (sItem.fullPlt || 0);

                                            const bgClass = !isRequiredSlot
                                                ? 'bg-gray-300'
                                                : hasVal
                                                    ? 'bg-white font-bold'
                                                    : 'bg-white';

                                            return (
                                                <td
                                                    key={cIndex}
                                                    className={`border border-black p-0.5 text-center ${bgClass}`}
                                                >
                                                    {/* If grayed out (not required), show dash to prevent writing. Else show value. */}
                                                    {!isRequiredSlot
                                                        ? '-'
                                                        : cell?.value
                                                            ? cell.value
                                                            : ''}
                                                </td>
                                            );
                                        })}

                                        {/* Summary Columns (RowSpan for first row only) */}
                                        {rIndex === 0 && (
                                            <>
                                                <td
                                                    rowSpan={rowsNeeded}
                                                    className="border border-black p-1 text-center"
                                                >
                                                    {lItem.looseInput ?? ''}
                                                </td>
                                                <td
                                                    rowSpan={rowsNeeded}
                                                    className="border border-black p-1 text-center font-bold"
                                                >
                                                    {lItem.total}
                                                </td>
                                                <td
                                                    rowSpan={rowsNeeded}
                                                    className={`border border-black p-1 text-center font-bold ${lItem.balance !== 0 ? 'text-black bg-red-100' : ''}`}
                                                >
                                                    {lItem.balance}
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ));
                            })}
                        </tbody>
                    </table>

                    {/* ADDITIONAL ITEMS SECTION (Separate Table) */}
                    {(() => {
                        const filteredAdditionalItems =
                            currentSheet.additionalItems?.filter(
                                (item) =>
                                    (item.skuName && item.skuName.trim() !== '') || item.total > 0
                            ) || [];

                        if (filteredAdditionalItems.length === 0) return null;

                        return (
                            <div className="mb-2">
                                <div className="font-bold text-[9px] uppercase tracking-widest bg-gray-100 p-1 border border-black border-b-0">
                                    + Additional Items (Extras)
                                </div>
                                <table className="w-full border-collapse border border-black text-[9px]">
                                    <colgroup>
                                        <col className="w-[5%]" />
                                        {/* Sr */}
                                        <col className="w-[30%]" />
                                        {/* SKU - Wide */}

                                        {/* 1-10 Loading (10 cols) */}
                                        <col className="w-[5.5%]" />
                                        <col className="w-[5.5%]" />
                                        <col className="w-[5.5%]" />
                                        <col className="w-[5.5%]" />
                                        <col className="w-[5.5%]" />
                                        <col className="w-[5.5%]" />
                                        <col className="w-[5.5%]" />
                                        <col className="w-[5.5%]" />
                                        <col className="w-[5.5%]" />
                                        <col className="w-[5.5%]" />

                                        <col className="w-[5%]" />
                                        {/* Total */}
                                    </colgroup>
                                    <thead>
                                        <tr className="bg-gray-50">
                                            <th className="border border-black p-1 text-center">
                                                Sr.no
                                            </th>
                                            <th className="border border-black p-1 text-left px-2">
                                                SKU Name
                                            </th>
                                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                                                <th
                                                    key={n}
                                                    className="border border-black p-1 text-center bg-gray-300"
                                                >
                                                    {n}
                                                </th>
                                            ))}
                                            <th className="border border-black p-1 text-center">
                                                Total
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredAdditionalItems.map((aItem, idx) => (
                                            <tr key={`a-${idx}`} className="h-6">
                                                <td className="border border-black p-1 text-center text-gray-500">
                                                    A{idx + 1}
                                                </td>
                                                <td className="border border-black p-1 px-2 font-medium truncate">
                                                    {aItem.skuName}
                                                </td>

                                                {/* Loading Counts 1-10 */}
                                                {Array.from({ length: 10 }).map((_, i) => {
                                                    const val = aItem.counts[i] || 0;
                                                    return (
                                                        <td
                                                            key={i}
                                                            className={`border border-black p-0.5 text-center ${val > 0 ? 'bg-white font-bold' : 'bg-gray-300'}`}
                                                        >
                                                            {val > 0 ? val : '-'}
                                                        </td>
                                                    );
                                                })}

                                                <td className="border border-black p-1 text-center font-bold">
                                                    {aItem.total}
                                                </td>
                                            </tr>
                                        ))}
                                        <tr className="bg-gray-50 font-bold">
                                            <td
                                                colSpan={12}
                                                className="border border-black p-1 text-right px-2"
                                            >
                                                Total Extras:
                                            </td>
                                            <td className="border border-black p-1 text-center">
                                                {filteredAdditionalItems.reduce(
                                                    (acc, curr) => acc + curr.total,
                                                    0
                                                )}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        );
                    })()}

                    {/* NEW FOOTER LAYOUT */}
                    {/* NEW FOOTER LAYOUT */}
                    {/* Footer Section - Fixed Grid */}
                    <div
                        className="mt-2 border-2 border-black text-[10px]"
                        style={{ pageBreakInside: 'avoid', display: 'block' }}
                    >
                        {/* SUMMARY TOTALS & REMARKS SPLIT ROW - DIV BASED FOR COMPATIBILITY */}
                        <div style={{ display: 'flex', borderBottom: '2px solid black', width: '100%', minHeight: '120px' }}>
                            {/* LEFT SIDE: SUMMARY TOTALS */}
                            <div style={{ width: '40%', borderRight: '2px solid black', padding: '8px', backgroundColor: '#f9fafb' }}>
                                <div style={{ fontWeight: 'bold', fontSize: '12px', textTransform: 'uppercase', textDecoration: 'underline', marginBottom: '10px' }}>
                                    Summary Totals
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', fontWeight: 'bold' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Total Staging Qty</span>
                                        <span>{totals.totalStaging}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#1d4ed8' }}>
                                        <span>Total Loaded Cases (Main + Extras)</span>
                                        <span>{totals.grandTotalLoaded}</span>
                                    </div>
                                    <div style={{ borderTop: '1px dashed black', paddingTop: '4px', marginTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Balance to be Returned</span>
                                        <span style={{ color: totals.balance > 0 ? '#dc2626' : '#16a34a' }}>
                                            {totals.balance}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT SIDE: REMARKS & EXTRAS */}
                            <div style={{ width: '60%', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ flex: 1, borderBottom: '1px solid black', padding: '6px' }}>
                                    <div style={{ fontWeight: 'bold', textDecoration: 'underline', marginBottom: '4px' }}>
                                        Remarks (If any adjustment for shortage/excess, please mention details)
                                    </div>
                                    <div style={{ whiteSpace: 'pre-wrap' }}>
                                        {lists.returnedItems.map((item, i) => (
                                            <div key={i}>For {item.skuName} {item.balance} loose returned.</div>
                                        ))}
                                        {footer.remarks}
                                    </div>
                                </div>
                                <div style={{ flex: 1, padding: '6px' }}>
                                    <div style={{ fontWeight: 'bold', textDecoration: 'underline', marginBottom: '4px' }}>
                                        Cases Extra / Additional:
                                    </div>
                                    <div style={{ whiteSpace: 'pre-wrap' }}>
                                        {(currentSheet.additionalItems || [])
                                            .filter((i: any) => i.total > 0)
                                            .map((item: any, i: number) => (
                                                <div key={i}>For {item.skuName} {item.total} Cases Extra.</div>
                                            ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SIGNATURES ROW - USING FLEX FOR RELIABILITY */}
                        <div style={{ display: 'flex', borderBottom: '2px solid black', minHeight: '50px' }}>
                            <div style={{ width: '50%', borderRight: '2px solid black', display: 'flex' }}>
                                <div style={{ width: '35%', borderRight: '2px solid black', padding: '4px', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                                    Supervisor Name
                                </div>
                                <div style={{ flex: 1, padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', textAlign: 'center' }}>
                                    {header.supervisorName && (
                                        <div>
                                            <div>{header.supervisorName}</div>
                                            <div style={{ fontSize: '8px', fontWeight: 'normal' }}>(after loading completed)</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div style={{ width: '15%', borderRight: '2px solid black', padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', fontSize: '8px', fontWeight: 'bold' }}>
                                {lists.returnedItems.length > 0 && <div>Picking Sv sign return received</div>}
                            </div>
                            <div style={{ width: '35%', display: 'flex' }}>
                                <div style={{ width: '35%', borderRight: '2px solid black', padding: '4px', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                                    Supervisor Sign
                                </div>
                                <div style={{ flex: 1, padding: '4px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                                    <div style={{ borderTop: '1px solid #94a3b8', width: '80%', textAlign: 'center', fontSize: '8px', color: '#64748b' }}>
                                        (after loading completed)
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', minHeight: '50px' }}>
                            <div style={{ width: '50%', borderRight: '2px solid black', display: 'flex' }}>
                                <div style={{ width: '35%', borderRight: '2px solid black', padding: '4px', fontWeight: 'bold', display: 'flex', alignItems: 'center', backgroundColor: '#f1f5f9' }}>
                                    Name/Sign. SL
                                </div>
                                <div style={{ flex: 1, padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {(currentSheet.slName || currentSheet.slSign) && (
                                        <div style={{ maxHeight: '45px', overflow: 'hidden' }}>
                                            {currentSheet.slSign && currentSheet.slSign.length > 50 ? (
                                                <img src={currentSheet.slSign} alt="SL" style={{ height: '40px', width: 'auto', objectFit: 'contain' }} />
                                            ) : (
                                                <span className="font-cursive" style={{ fontSize: '20px' }}>{currentSheet.slSign || currentSheet.slName}</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div style={{ width: '15%', borderRight: '2px solid black', padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', fontSize: '8px', fontWeight: 'bold' }}>
                                {(currentSheet.additionalItems || []).some((i: any) => i.total > 0) && (
                                    <div>Approve Sign</div>
                                )}
                            </div>
                            <div style={{ width: '35%', display: 'flex' }}>
                                <div style={{ width: '35%', borderRight: '2px solid black', padding: '4px', fontWeight: 'bold', display: 'flex', alignItems: 'center', backgroundColor: '#f1f5f9' }}>
                                    Name/Sign. DEO
                                </div>
                                <div style={{ flex: 1, padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {footer.deoSign && (
                                        <div style={{ maxHeight: '45px', overflow: 'hidden' }}>
                                            {footer.deoSign.length > 50 ? (
                                                <img src={footer.deoSign} alt="DEO" style={{ height: '40px', width: 'auto', objectFit: 'contain' }} />
                                            ) : (
                                                <span className="font-cursive" style={{ fontSize: '20px' }}>{footer.deoSign}</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-2 text-[9px] text-right px-1 w-full text-gray-500 print:hidden">
                    Page 1 / 1
                </div>

                {/* ATTACHED IMAGES SECTION (New Page) */}
                {currentSheet.capturedImages && currentSheet.capturedImages.length > 0 && (
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
            </div>{' '}
            {/* End of Print Layout Container */}
            {/* MAIN FORM UI */}
            <RejectionSection
                reason={currentSheet.rejectionReason}
                rejectedItems={currentSheet.loadingItems
                    ?.filter((i) => i.isRejected)
                    .map((i) => {
                        const sItem = currentSheet.stagingItems.find((s) => s.srNo === i.skuSrNo);
                        return {
                            id: i.skuSrNo,
                            name: sItem?.skuName || 'Unknown SKU',
                            reason: i.rejectionReason
                        };
                    })}
            />
            {currentSheet.comments &&
                currentSheet.comments.length > 0 &&
                (isPendingVerification || currentSheet.status === SheetStatus.LOCKED) && (
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
                        if (field === 'svName') handlers.setSvName(value);
                        if (field === 'svSign') handlers.setSvSign(value);
                        if (field === 'slSign') handlers.setSlSign(value);
                        if (field === 'deoSign') handlers.setDeoSign(value);
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
        </div>
    );
}
