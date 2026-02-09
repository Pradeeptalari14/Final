import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import ExcelJS from 'exceljs';
import { Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface RosterEntry {
    date: string;       // Normalized YYYY-MM-DD for logic
    shift: string;
    staffName: string;
    role: string;
    [key: string]: unknown; // Allow dynamic columns
}

interface RosterUploaderProps {
    onUploadSuccess: (data: RosterEntry[], headers: string[]) => void;
}

export function RosterUploader({ onUploadSuccess }: RosterUploaderProps) {
    const [isParsing, setIsParsing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        setIsParsing(true);
        setError(null);

        try {
            const buffer = await file.arrayBuffer();
            const workbook = new ExcelJS.Workbook();
            await workbook.xlsx.load(buffer);

            const worksheet = workbook.worksheets[0]; // Assume first sheet
            if (!worksheet) throw new Error('No worksheet found in file.');

            let bestHeaderRowIndex = 1;
            let maxColumns = 0;

            // Intelligent Header Detection (Scan first 10 rows)
            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber > 10) return;
                let colCount = 0;
                row.eachCell((cell) => {
                    if (cell.value) colCount++;
                });
                if (colCount > maxColumns) {
                    maxColumns = colCount;
                    bestHeaderRowIndex = rowNumber;
                }
            });

            const parsedData: RosterEntry[] = [];
            const headers: string[] = [];

            // 2. Extract Headers from Detected Row
            const headerRow = worksheet.getRow(bestHeaderRowIndex);
            headerRow.eachCell((cell, colNumber) => {
                let headerText = cell.text?.trim();
                // Special handling for Date headers to keep them short like Excel (e.g. "1-Jan")
                if (cell.value instanceof Date) {
                    headerText = cell.value.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                } else if (cell.numFmt && (cell.numFmt.includes('mmm') || cell.numFmt.includes('MMM'))) {
                    // Try to catch numeric dates formatted as custom strings if ExcelJS parses them as numbers
                    if (typeof cell.value === 'number') {
                        const d = new Date(Math.round((cell.value - 25569) * 86400 * 1000));
                        if (!isNaN(d.getTime())) {
                            headerText = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                        }
                    }
                }

                headers[colNumber] = headerText || `Col ${colNumber}`;
            });

            // Filter sparse headers
            const validHeaders = headers.filter(h => h);
            if (validHeaders.length === 0) throw new Error('No valid headers found.');

            // 3. Identify Key Logic Columns (Best Effort)
            const findColIndex = (keywords: string[]) => {
                return headers.findIndex(h => h && keywords.some(k => h.toLowerCase().includes(k)));
            };

            const dateIdx = findColIndex(['date', 'day']);
            const shiftIdx = findColIndex(['shift', 'time']);
            const nameIdx = findColIndex(['name', 'staff', 'employee', 'person']);
            const roleIdx = findColIndex(['role', 'duty', 'position', 'job']);

            // 4. Parse Data Rows (After Header Row)
            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber <= bestHeaderRowIndex) return; // Skip Header & Pre-header

                const rowData: Record<string, string> = {};
                let hasData = false;

                // Capture ALL columns mapping to headers
                headers.forEach((header, index) => {
                    if (!header) return;
                    const cell = row.getCell(index);

                    // Value Formatting
                    let cellValue = cell.text || '';
                    if (cell.value instanceof Date) {
                        cellValue = cell.value.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                    } else if (typeof cell.value === 'object' && cell.value && 'text' in (cell.value as object)) {
                        cellValue = (cell.value as { text: string }).text;
                    }

                    rowData[header] = cellValue;
                    if (cellValue) hasData = true;
                });

                if (!hasData) return;

                // Internal Logic Normalization (Safe Fallbacks)
                let dateStr = '';
                if (dateIdx > -1) {
                    const rawDate = row.getCell(dateIdx).value;
                    if (rawDate instanceof Date) {
                        dateStr = rawDate.toISOString().split('T')[0];
                    } else {
                        const d = new Date(String(rawDate));
                        if (!isNaN(d.getTime())) dateStr = d.toISOString().split('T')[0];
                    }
                }

                parsedData.push({
                    ...rowData,
                    // valid normalized fields for filtering, fallbacks to empty if not found
                    date: dateStr,
                    shift: shiftIdx > -1 ? (row.getCell(shiftIdx).text || '') : '',
                    staffName: nameIdx > -1 ? (row.getCell(nameIdx).text || '') : '',
                    role: roleIdx > -1 ? (row.getCell(roleIdx).text || '') : ''
                });
            });

            if (parsedData.length === 0) {
                throw new Error('No valid roster data found after header row.');
            }

            toast.success(`Parsed ${parsedData.length} rows. Header detected at Row ${bestHeaderRowIndex}.`);
            onUploadSuccess(parsedData, validHeaders);

        } catch (err: unknown) {
            console.error('Excel Parse Error:', err);
            const message = err instanceof Error ? err.message : 'Failed to parse Excel file.';
            setError(message);
            toast.error('Upload failed. Check file format.');
        } finally {
            setIsParsing(false);
        }
    }, [onUploadSuccess]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/vnd.ms-excel': ['.xls']
        },
        maxFiles: 1,
        disabled: isParsing
    });

    return (
        <div className="w-full">
            <div
                {...getRootProps()}
                className={cn(
                    "border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer group",
                    isDragActive ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20" : "border-slate-200 dark:border-slate-800 hover:border-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-900",
                    error && "border-red-300 bg-red-50 dark:bg-red-900/10"
                )}
            >
                <input {...getInputProps()} />

                <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center mb-4 transition-transform group-hover:scale-110",
                    isParsing ? "animate-pulse bg-indigo-100 text-indigo-600" : "bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-400"
                )}>
                    {isParsing ? <Upload className="animate-bounce" /> : <FileSpreadsheet />}
                </div>

                <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                        {isParsing ? 'Smart Scanning...' : 'Click to Upload Roster or Drag & Drop'}
                    </p>
                    <p className="text-xs text-slate-400">
                        Auto-detects Headers & Data (Scans first 10 rows)
                    </p>
                </div>

                {error && (
                    <div className="mt-4 flex items-center gap-2 text-rose-600 bg-rose-50 px-3 py-1.5 rounded-lg text-xs font-bold">
                        <AlertCircle size={14} />
                        {error}
                    </div>
                )}
            </div>

            <div className="mt-4 flex items-center justify-between text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                <span>Smart Parse Active</span>
                <span>Any Excel Format</span>
            </div>
        </div>
    );
}
