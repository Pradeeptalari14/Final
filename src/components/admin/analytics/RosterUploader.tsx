import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import ExcelJS from 'exceljs';
import { Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface RosterEntry {
    date: string;       // YYYY-MM-DD
    shift: string;
    staffName: string;
    role: string;
    vehicleNo?: string; // Optional
}

interface RosterUploaderProps {
    onUploadSuccess: (data: RosterEntry[]) => void;
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

            const parsedData: RosterEntry[] = [];

            // Skip header row (1)
            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber === 1) return; // Skip Header

                // Expected Columns: A=Date, B=Shift, C=Staff Name, D=Role, E=Vehicle (Optional)
                const dateVal = row.getCell(1).value;
                const shiftVal = row.getCell(2).text;
                const nameVal = row.getCell(3).text;
                const roleVal = row.getCell(4).text;
                const vehicleVal = row.getCell(5).text;

                if (!dateVal || !nameVal) return; // Skip invalid rows

                // Simple date parsing
                let dateStr = '';
                if (dateVal instanceof Date) {
                    dateStr = dateVal.toISOString().split('T')[0];
                } else {
                    // Try parsing string date
                    const d = new Date(String(dateVal));
                    if (!isNaN(d.getTime())) {
                        dateStr = d.toISOString().split('T')[0];
                    }
                }

                parsedData.push({
                    date: dateStr,
                    shift: shiftVal || 'First',
                    staffName: nameVal,
                    role: roleVal || 'Staff',
                    vehicleNo: vehicleVal
                });
            });

            if (parsedData.length === 0) {
                throw new Error('No valid roster data found.');
            }

            toast.success(`Successfully parsed ${parsedData.length} roster entries!`);
            onUploadSuccess(parsedData);

        } catch (err: any) {
            console.error('Excel Parse Error:', err);
            setError(err.message || 'Failed to parse Excel file.');
            toast.error('Upload failed. Please check file format.');
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
                        {isParsing ? 'Parsing Roster File...' : 'Click to Upload Roster or Drag & Drop'}
                    </p>
                    <p className="text-xs text-slate-400">
                        Support for .xlsx, .xls (Max 5MB)
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
                <span>Required format</span>
                <span>Date | Shift | Name | Role | Vehicle</span>
            </div>
        </div>
    );
}
