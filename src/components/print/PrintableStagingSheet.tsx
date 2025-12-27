import { SheetData } from '@/types';

export function PrintableStagingSheet({ data }: { data: Partial<SheetData> }) {
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
                            <td
                                colSpan={6}
                                className="border border-black p-2 text-center text-xl font-bold bg-gray-50 uppercase"
                            >
                                UCIA - FG WAREHOUSE
                            </td>
                        </tr>
                        <tr>
                            <td
                                colSpan={6}
                                className="border border-black p-1 text-center font-bold text-lg"
                            >
                                Staging Check Sheet
                            </td>
                        </tr>
                        {/* Row 1: Shift, Name, Destination */}
                        <tr>
                            <td className="border border-black p-1 font-bold bg-gray-50 text-center">
                                Shift
                            </td>
                            <td className="border border-black p-1 text-center font-medium">
                                {data.shift}
                            </td>
                            <td className="border border-black p-1 font-bold bg-gray-50 text-center">
                                Name of SV / SG
                            </td>
                            <td className="border border-black p-1 text-center font-medium break-words">
                                {data.supervisorName}
                            </td>
                            <td className="border border-black p-1 font-bold bg-gray-50 text-center">
                                Destination
                            </td>
                            <td className="border border-black p-1 text-center font-medium break-words">
                                {data.destination}
                            </td>
                        </tr>
                        {/* Row 2: Date, Emp Code, Loading Dock */}
                        <tr>
                            <td className="border border-black p-1 font-bold bg-gray-50 text-center">
                                Date
                            </td>
                            <td className="border border-black p-1 text-center font-medium">
                                {data.date}
                            </td>
                            <td className="border border-black p-1 font-bold bg-gray-50 text-center">
                                Emp. Code
                            </td>
                            <td className="border border-black p-1 text-center font-medium">
                                {data.empCode}
                            </td>
                            <td className="border border-black p-1 font-bold bg-gray-50 text-center">
                                Loading Dock No
                            </td>
                            <td className="border border-black p-1 text-center font-medium">
                                {data.loadingDockNo}
                            </td>
                        </tr>
                    </tbody>
                </table>

                {/* Staging Details */}
                <div className="w-full border-t border-black">
                    <div className="font-bold text-center bg-gray-200 border-b border-black p-1 uppercase tracking-wider">
                        STAGING DETAILS
                    </div>
                    <table className="w-full text-[10px] border-collapse">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="border border-black p-1 w-12 text-center">
                                    Sr. No.
                                </th>
                                <th className="border border-black p-1 text-left px-2">SKU Name</th>
                                <th className="border border-black p-1 w-16 text-center">
                                    Cases/PLT
                                </th>
                                <th className="border border-black p-1 w-16 text-center">
                                    Full PLT
                                </th>
                                <th className="border border-black p-1 w-16 text-center">Loose</th>
                                <th className="border border-black p-1 w-20 text-center font-bold">
                                    TTL Cases
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.stagingItems?.map((item, i) => (
                                <tr key={i}>
                                    <td className="border border-black p-1 text-center text-gray-600">
                                        {i + 1}
                                    </td>
                                    <td className="border border-black p-1 px-2 font-medium">
                                        {item.skuName}
                                    </td>
                                    <td className="border border-black p-1 text-center">
                                        {item.casesPerPlt || ''}
                                    </td>
                                    <td className="border border-black p-1 text-center">
                                        {item.fullPlt || ''}
                                    </td>
                                    <td className="border border-black p-1 text-center">
                                        {item.loose || ''}
                                    </td>
                                    <td className="border border-black p-1 text-center font-bold bg-gray-50">
                                        {item.ttlCases || ''}
                                    </td>
                                </tr>
                            ))}
                            <tr className="bg-gray-50 font-bold border-t-2 border-black">
                                <td
                                    colSpan={5}
                                    className="border border-black p-2 text-right uppercase"
                                >
                                    Total Staging Qty
                                </td>
                                <td className="border border-black p-2 text-center text-lg">
                                    {data.stagingItems?.reduce(
                                        (sum, i) => sum + (Number(i.ttlCases) || 0),
                                        0
                                    )}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Footer Signatures matching Excel */}
                <div className="grid grid-cols-3 gap-0 border-t border-black text-center">
                    <div className="border-r border-black p-8 flex flex-col justify-end h-24">
                        <div className="border-t border-black pt-1 w-2/3 mx-auto font-bold text-xs uppercase">
                            Picked By
                        </div>
                    </div>
                    <div className="border-r border-black p-8 flex flex-col justify-end h-24">
                        <div className="border-t border-black pt-1 w-2/3 mx-auto font-bold text-xs uppercase">
                            Checked By
                        </div>
                    </div>
                    <div className="p-8 flex flex-col justify-end h-24">
                        <div className="border-t border-black pt-1 w-2/3 mx-auto font-bold text-xs uppercase">
                            Supervisor Sign
                        </div>
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
