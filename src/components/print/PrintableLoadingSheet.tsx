import { SheetData, LoadingItem, AdditionalItem } from '@/types';

interface LoadingItemWithSku extends LoadingItem {
    skuName: string;
}

interface PrintableLoadingSheetProps {
    currentSheet: SheetData;
    header: any;
    totals: any;
    lists: any;
    footer: any;
}

export function PrintableLoadingSheet({
    currentSheet,
    header,
    totals,
    lists,
    footer
}: PrintableLoadingSheetProps) {
    const RenderSignature = (val: string, alt: string) => {
        if (!val) return null;
        if (val.startsWith('data:image')) {
            return (
                <img
                    src={val}
                    alt={alt}
                    style={{ height: '50px', objectFit: 'contain' }}
                />
            );
        }
        return (
            <span className="font-script text-2xl px-2 border-b border-black/10 min-w-[80px] text-center italic">
                {val}
            </span>
        );
    };

    return (
        <div className="font-sans text-black bg-white w-full max-w-none">
            <style>{`
                @media print {
                    @page { size: A4 landscape; margin: 2mm; }
                    body { 
                        -webkit-print-color-adjust: exact; 
                        print-color-adjust: exact; 
                        width: 99%;
                        zoom: 102%;
                    }
                    tr { page-break-inside: avoid; }
                }

                /* Mobile/Web Preview Fixes */
                @media screen {
                    .print-preview-container {
                        background: white;
                    }
                }
            `}</style>

            <div className="w-full border border-black text-[10px] print-preview-container">
                {/* HEADER */}
                <table className="w-full border-collapse border border-black mb-1 table-fixed text-[10px]">
                    <colgroup>
                        <col className="w-[8%]" />
                        <col className="w-[17%]" />
                        <col className="w-[8%]" />
                        <col className="w-[17%]" />
                        <col className="w-[15%]" />
                        <col className="w-[17%]" />
                        <col className="w-[8%]" />
                        <col className="w-[10%]" />
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
                                className="border border-black p-1 font-bold text-center bg-gray-100 uppercase tracking-wider"
                                colSpan={8}
                            >
                                STAGING & LOADING CHECK SHEET (ID: {currentSheet.id})
                            </td>
                        </tr>
                        <tr>
                            <td className="border border-black p-1 font-bold bg-gray-50 uppercase text-[9px]">Shift</td>
                            <td className="border border-black p-1 font-bold text-[11px]">{header.shift}</td>
                            <td className="border border-black p-1 font-bold bg-gray-50 uppercase text-[9px]">Date</td>
                            <td className="border border-black p-1 font-bold text-[11px]">{currentSheet.date}</td>
                            <td className="border border-black p-1 font-bold bg-gray-50 uppercase text-[9px]">Picking By *</td>
                            <td className="border border-black p-1 font-bold text-[11px]">{header.pickingBy}</td>
                            <td className="border border-black p-1 font-bold bg-gray-50 uppercase text-[9px]">Emp. Code</td>
                            <td className="border border-black p-1 font-bold text-[11px]">{header.empCode || '-'}</td>
                        </tr>
                        <tr>
                            <td className="border border-black p-1 font-bold bg-gray-50 uppercase text-[9px]">Transporter</td>
                            <td className="border border-black p-1 font-bold text-[11px]">{header.transporter}</td>
                            <td className="border border-black p-1 font-bold bg-gray-50 uppercase text-[9px]">Driver Name</td>
                            <td className="border border-black p-1 font-bold text-[11px]">{header.driverName}</td>
                            <td className="border border-black p-1 font-bold bg-gray-50 uppercase text-[9px]">Picking Crosschecked By</td>
                            <td className="border border-black p-1 font-bold text-[11px]">{header.pickingCrosscheckedBy}</td>
                            <td className="border border-black p-1 font-bold bg-gray-50 uppercase text-[9px]">Emp. Code</td>
                            <td className="border border-black p-1 font-bold text-[11px]">{header.pickingCrosscheckedByEmpCode || '-'}</td>
                        </tr>
                        <tr>
                            <td className="border border-black p-1 font-bold bg-gray-50 uppercase text-[9px]">Destination</td>
                            <td className="border border-black p-1 font-bold text-[11px] text-blue-600 uppercase">{header.destination}</td>
                            <td className="border border-black p-1 font-bold bg-gray-50 uppercase text-[9px]">Vehicle No</td>
                            <td className="border border-black p-1 font-bold text-[11px] uppercase text-emerald-600">{header.vehicleNo}</td>
                            <td className="border border-black p-1 font-bold bg-gray-50 uppercase text-[9px]">Start Time</td>
                            <td className="border border-black p-1 font-bold text-[11px]" colSpan={3}>
                                {(() => {
                                    const startLog = currentSheet.history?.find(h => h.action === 'LOADING_STARTED' || h.action === 'STAGING_STARTED');
                                    const fallbackStart = startLog ? new Date(startLog.timestamp).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '';
                                    const t = currentSheet.loadingStartTime || fallbackStart;
                                    if (!t) return '-';
                                    let d = new Date(t);
                                    if (isNaN(d.getTime())) {
                                        d = new Date(`1970/01/01 ${t}`);
                                    }
                                    return isNaN(d.getTime()) ? t : d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
                                })()}
                            </td>
                        </tr>
                        <tr>
                            <td className="border border-black p-1 font-bold bg-gray-50 uppercase text-[9px]">Loading Dock</td>
                            <td className="border border-black p-1 font-bold text-[11px] text-orange-600">{header.loadingDock}</td>
                            <td className="border border-black p-1 font-bold bg-gray-50 uppercase text-[9px]">Seal No *</td>
                            <td className="border border-black p-1 font-bold text-[11px]">{header.sealNo}</td>
                            <td className="border border-black p-1 font-bold bg-gray-50 uppercase text-[9px]">End Time</td>
                            <td className="border border-black p-1 font-bold text-[11px]" colSpan={3}>
                                {(() => {
                                    const endLog = currentSheet.history?.find(h => h.action === 'COMPLETED' || h.action === 'LOADING_SUBMITTED' || h.action === 'STAGING_SUBMITTED');
                                    const fallbackEnd = endLog ? new Date(endLog.timestamp).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '';
                                    const t = currentSheet.loadingEndTime || fallbackEnd;
                                    if (!t) return '-';
                                    let d = new Date(t);
                                    if (isNaN(d.getTime())) {
                                        d = new Date(`1970/01/01 ${t}`);
                                    }
                                    return isNaN(d.getTime()) ? t : d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
                                })()}
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* MAIN DATA TABLE */}
                <table className="w-full border-collapse border border-black text-[9px] mb-2 page-break-inside-auto">
                    <colgroup>
                        <col className="w-[4%]" />
                        <col className="w-[16%]" />
                        <col className="w-[5%]" />
                        <col className="w-[5%]" />
                        <col className="w-[5%]" />
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
                        <col className="w-[5%]" />
                        <col className="w-[5%]" />
                        <col className="w-[5%]" />
                    </colgroup>
                    <thead>
                        <tr className="bg-gray-100">
                            <th rowSpan={2} className="border border-black p-1 text-center bg-gray-200 font-bold uppercase text-[8px]">Sr.no</th>
                            <th rowSpan={2} className="border border-black p-1 text-left px-2 bg-gray-200 font-bold uppercase text-[8px]">SKU Name</th>
                            <th colSpan={3} className="border border-black p-1 text-center bg-gray-300 font-bold uppercase text-[8px]">STAGING (Checked by Sl)</th>
                            <th colSpan={10} className="border border-black p-1 text-center bg-gray-300 font-bold uppercase text-[8px]">LOADING DETAILS (1-10 PLTs)</th>
                            <th rowSpan={2} className="border border-black p-1 text-center bg-gray-200 font-bold uppercase text-[8px]">Loose</th>
                            <th rowSpan={2} className="border border-black p-1 text-center bg-gray-200 font-bold uppercase text-[8px]">Total</th>
                            <th rowSpan={2} className="border border-black p-1 text-center bg-gray-200 font-bold uppercase text-[8px]">Bal</th>
                        </tr>
                        <tr className="bg-gray-50">
                            <th className="border border-black p-0.5 text-center text-[7px] uppercase font-bold">Full</th>
                            <th className="border border-black p-0.5 text-center text-[7px] uppercase font-bold">Lse</th>
                            <th className="border border-black p-0.5 text-center text-[7px] uppercase font-bold bg-gray-100">TTL</th>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                                <th key={n} className="border border-black p-0.5 text-center bg-gray-100 font-bold text-[8px]">{n}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {currentSheet.loadingItems?.map((lItem, idx) => {
                            const sItem = currentSheet.stagingItems.find(s => s.srNo === lItem.skuSrNo);
                            if (!sItem) return null;
                            const rowsNeeded = Math.max(1, Math.ceil((sItem.fullPlt || 0) / 10));

                            return Array.from({ length: rowsNeeded }).map((_, rIndex) => (
                                <tr key={`l - ${idx} -${rIndex} `} className="h-6">
                                    {rIndex === 0 && (
                                        <>
                                            <td rowSpan={rowsNeeded} className="border border-black p-1 text-center font-bold">{lItem.skuSrNo}</td>
                                            <td rowSpan={rowsNeeded} className="border border-black p-1 px-1 font-bold text-[10px] break-words">{sItem.skuName}</td>
                                            <td rowSpan={rowsNeeded} className="border border-black p-1 text-center font-bold text-[11px]">{sItem.fullPlt}</td>
                                            <td rowSpan={rowsNeeded} className="border border-black p-1 text-center font-bold text-[11px]">{sItem.loose}</td>
                                            <td rowSpan={rowsNeeded} className="border border-black p-1 text-center font-bold bg-gray-50 text-[12px]">{sItem.ttlCases}</td>
                                        </>
                                    )}
                                    {Array.from({ length: 10 }).map((_, cIndex) => {
                                        const cell = lItem.cells.find(c => (c.row || 0) === rIndex && c.col === cIndex);
                                        const hasVal = cell && cell.value > 0;
                                        const absoluteIndex = rIndex * 10 + cIndex;
                                        const isRequiredSlot = absoluteIndex < (sItem.fullPlt || 0);
                                        const bgClass = !isRequiredSlot ? 'bg-gray-200' : hasVal ? 'bg-white font-bold' : 'bg-white';
                                        return (
                                            <td key={cIndex} className={`border border-black p-0.5 text-center text-[11px] ${bgClass}`}>
                                                {!isRequiredSlot ? '-' : cell?.value || ''}
                                            </td>
                                        );
                                    })}
                                    {rIndex === 0 && (
                                        <>
                                            <td rowSpan={rowsNeeded} className="border border-black p-1 text-center font-bold text-[11px]">{lItem.looseInput ?? ''}</td>
                                            <td rowSpan={rowsNeeded} className="border border-black p-1 text-center font-bold text-[12px] bg-gray-50">{lItem.total}</td>
                                            <td rowSpan={rowsNeeded} className={`border border-black p-1 text-center align-middle font-bold text-[13px] ${lItem.balance !== 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>{lItem.balance}</td>
                                        </>
                                    )}
                                </tr>
                            ));
                        })}
                    </tbody>
                </table>

                {/* ADDITIONAL ITEMS SECTION */}
                {(() => {
                    const filteredAdditionalItems = currentSheet.additionalItems?.filter(item => (item.skuName && item.skuName.trim() !== '') || item.total > 0) || [];
                    if (filteredAdditionalItems.length === 0) return null;
                    return (
                        <div className="mb-2">
                            <div className="font-bold text-[10px] uppercase tracking-widest bg-gray-100 p-1 border border-black border-b-0 text-center">
                                + Additional Items (Excess / Shortage Adjustments)
                            </div>
                            <table className="w-full border-collapse border border-black text-[9px]">
                                <colgroup>
                                    <col className="w-[5%]" /><col className="w-[30%]" />
                                    {[...Array(10)].map((_, i) => <col key={i} className="w-[5.5%]" />)}
                                    <col className="w-[5%]" />
                                </colgroup>
                                <thead>
                                    <tr className="bg-gray-50">
                                        <th className="border border-black p-1 text-center uppercase text-[8px]">Sr.no</th>
                                        <th className="border border-black p-1 text-left px-2 uppercase text-[8px]">SKU Name</th>
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => <th key={n} className="border border-black p-1 text-center bg-gray-100 font-bold">{n}</th>)}
                                        <th className="border border-black p-1 text-center uppercase text-[8px]">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAdditionalItems.map((aItem, idx) => (
                                        <tr key={`a - ${idx} `} className="h-6">
                                            <td className="border border-black p-1 text-center font-bold">A{idx + 1}</td>
                                            <td className="border border-black p-1 px-2 font-bold">{aItem.skuName}</td>
                                            {Array.from({ length: 10 }).map((_, i) => {
                                                const val = aItem.counts[i] || 0;
                                                return <td key={i} className={`border border-black p-0.5 text-center text-[11px] ${val > 0 ? 'bg-white font-bold' : 'bg-gray-200'}`}>{val > 0 ? val : '-'}</td>;
                                            })}
                                            <td className="border border-black p-1 text-center font-black text-[12px] bg-gray-50">{aItem.total}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    );
                })()}

                {/* FOOTER SECTION */}
                <div className="mt-1 border-2 border-black text-[10px]" style={{ pageBreakInside: 'avoid' }}>
                    {(() => {
                        const hasAdditionalItems = (currentSheet.additionalItems || []).some((i: AdditionalItem) => (i.total || 0) > 0);
                        const hasReturnedItems = lists.returnedItems.length > 0;
                        const hasRemarks = !!footer.remarks && footer.remarks.trim() !== '';
                        const hasRightContent = hasAdditionalItems || hasReturnedItems || hasRemarks;

                        return (
                            <div style={{ display: 'flex', borderBottom: '2px solid black', width: '100%', minHeight: '120px' }}>
                                <div style={{
                                    width: hasRightContent ? '40%' : '100%',
                                    borderRight: hasRightContent ? '2px solid black' : 'none',
                                    padding: '10px',
                                    backgroundColor: '#f9fafb'
                                }}>
                                    <div style={{ fontWeight: '900', fontSize: '13px', textTransform: 'uppercase', textDecoration: 'underline', marginBottom: '12px' }}>Summary Totals</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', fontWeight: 'bold' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Total Staging Qty</span><span className="text-lg">{totals.totalStaging}</span></div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#1d4ed8' }}><span>Grand Total Loaded</span><span className="text-xl">{totals.grandTotalLoaded}</span></div>
                                        <div style={{ borderTop: '2px dashed #000', paddingTop: '6px', marginTop: '6px', display: 'flex', justifyContent: 'space-between' }}>
                                            <span>Balance to Return</span>
                                            <span style={{ fontSize: '1.25rem', color: totals.balance > 0 ? '#dc2626' : '#16a34a' }}>{totals.balance}</span>
                                        </div>
                                    </div>
                                </div>
                                {hasRightContent && (
                                    <div style={{ width: '60%', display: 'flex', flexDirection: 'column' }}>
                                        <div style={{ flex: 1, height: hasAdditionalItems ? 'auto' : '100%', borderBottom: hasAdditionalItems ? '1px solid black' : '0', padding: '10px', display: 'flex', justifyContent: 'space-between' }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 'bold', textDecoration: 'underline', marginBottom: '6px', textTransform: 'uppercase' }}>Remarks / Adjustments:</div>
                                                <div style={{ whiteSpace: 'pre-wrap', fontWeight: 'medium', fontSize: '11px' }}>
                                                    {(lists.returnedItems as LoadingItemWithSku[]).map((item, i) => (
                                                        <div key={i}>• For {item.skuName}: {item.balance} loose case(s) returned back to picking.</div>
                                                    ))}
                                                    {footer.remarks}
                                                </div>
                                            </div>
                                            <div style={{ width: '100px', borderLeft: '1px dashed #ccc', paddingLeft: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                                <div style={{ fontSize: '8px', fontWeight: 'bold', textAlign: 'center', marginBottom: '4px', textTransform: 'uppercase' }}>Picking Sv Sign</div>
                                                <div style={{ height: '30px', borderBottom: '1px solid #000', width: '100%' }}></div>
                                            </div>
                                        </div>
                                        {hasAdditionalItems && (
                                            <div style={{ flex: 1, padding: '10px', display: 'flex', justifyContent: 'space-between' }}>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: 'bold', textDecoration: 'underline', marginBottom: '6px', textTransform: 'uppercase' }}>Cases Extra / Additional:</div>
                                                    <div style={{ whiteSpace: 'pre-wrap', fontWeight: 'medium', fontSize: '11px' }}>
                                                        {(currentSheet.additionalItems || []).filter((i: AdditionalItem) => i.total > 0).map((item: AdditionalItem, i: number) => (
                                                            <div key={i}>• For {item.skuName}: {item.total} extra cases loaded beyond staging qty.</div>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div style={{ width: '100px', borderLeft: '1px dashed #ccc', paddingLeft: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                                    <div style={{ fontSize: '8px', fontWeight: 'bold', textAlign: 'center', marginBottom: '4px', textTransform: 'uppercase' }}>Additional Approve</div>
                                                    <div style={{ height: '30px', borderBottom: '1px solid #000', width: '100%' }}></div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })()}

                    <div style={{ display: 'flex', borderBottom: '2px solid black', minHeight: '60px' }}>
                        <div style={{ width: '50%', borderRight: '2px solid black', display: 'flex' }}>
                            <div style={{ width: '30%', borderRight: '1px solid black', padding: '8px', fontWeight: '900', display: 'flex', alignItems: 'center', backgroundColor: '#f8fafc', textTransform: 'uppercase' }}>Supervisor</div>
                            <div style={{ flex: 1, padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '13px', textAlign: 'center' }}>{header.supervisorName}</div>
                        </div>
                        <div style={{ width: '50%', display: 'flex' }}>
                            <div style={{ width: '30%', borderRight: '1px solid black', padding: '8px', fontWeight: '900', display: 'flex', alignItems: 'center', backgroundColor: '#f8fafc', textTransform: 'uppercase' }}>SV Signature</div>
                            <div style={{ flex: 1, padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {RenderSignature(currentSheet.loadingSupervisorSign || '', 'SV')}
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', minHeight: '60px' }}>
                        <div style={{ width: '50%', borderRight: '2px solid black', display: 'flex' }}>
                            <div style={{ width: '30%', borderRight: '1px solid black', padding: '8px', fontWeight: '900', display: 'flex', alignItems: 'center', backgroundColor: '#f1f5f9', textTransform: 'uppercase' }}>Shift Lead</div>
                            <div style={{ flex: 1, padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {RenderSignature(currentSheet.slSign || '', 'SL')}
                            </div>
                        </div>
                        <div style={{ width: '50%', display: 'flex' }}>
                            <div style={{ width: '30%', borderRight: '1px solid black', padding: '8px', fontWeight: '900', display: 'flex', alignItems: 'center', backgroundColor: '#f1f5f9', textTransform: 'uppercase' }}>DEO Sign</div>
                            <div style={{ flex: 1, padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {RenderSignature(footer.deoSign, 'DEO')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-2 text-[10px] text-gray-400 flex justify-between px-1">
                <span>UCIA-OPS-LOADING-FORM-002</span>
                <span className="font-bold">System Date/Time: {new Date().toLocaleString('en-IN')}</span>
            </div>
        </div >
    );
}
