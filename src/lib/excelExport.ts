import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { StagingItem, LoadingItem } from '@/types';

export const exportStagingToExcel = async (header: any, items: StagingItem[]) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Staging Sheet');

    // Styling
    const headerStyle: Partial<ExcelJS.Style> = {
        font: { bold: true, color: { argb: 'FFFFFFFF' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } }, // Slate-800
        alignment: { horizontal: 'center' }
    };

    // Header Section
    worksheet.mergeCells('A1:E1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'UCIA - FG WAREHOUSE STAGING SHEET';
    titleCell.font = { bold: true, size: 14 };
    titleCell.alignment = { horizontal: 'center' };

    worksheet.addRow(['Date', header.date, '', 'Shift', header.shift]);
    worksheet.addRow(['Supervisor', header.supervisorName, '', 'Destination', header.destination]);
    worksheet.addRow([]); // Spacer

    // Table Header
    const tableHeader = ['Sr.No', 'SKU Name', 'Cases/Plt', 'Full Plt', 'TTL Cases', 'Status'];
    const headerRow = worksheet.addRow(tableHeader);
    headerRow.eachCell((cell) => {
        cell.style = headerStyle;
    });

    // Data Rows
    items.forEach((item) => {
        worksheet.addRow([
            item.srNo,
            item.skuName,
            item.casesPerPlt,
            item.fullPlt,
            item.ttlCases,
            item.isRejected ? 'REJECTED' : 'OK'
        ]);
    });

    // column widths
    worksheet.getColumn(2).width = 30;
    worksheet.getColumn(6).width = 15;

    // Save
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `Staging_Sheet_${header.date || 'Export'}.xlsx`);
};

export const exportLoadingToExcel = async (header: any, items: LoadingItem[], stagingItems: StagingItem[]) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Loading Sheet');

    // Title
    worksheet.mergeCells('A1:O1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'UCIA - FG WAREHOUSE LOADING CHECK SHEET';
    titleCell.font = { bold: true, size: 14 };
    titleCell.alignment = { horizontal: 'center' };

    worksheet.addRow(['Date', header.date, 'Shift', header.shift, 'Transporter', header.transporter]);
    worksheet.addRow([]);

    // Actual Table Header (simplified for broad export)
    const tableHeader = [
        'Sr.No', 'SKU Name', 'Staging Total',
        'Cell 1', 'Cell 2', 'Cell 3', 'Cell 4', 'Cell 5',
        'Cell 6', 'Cell 7', 'Cell 8', 'Cell 9', 'Cell 10',
        'Loose', 'Total Loaded', 'Balance'
    ];

    const headerRow = worksheet.addRow(tableHeader);
    headerRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { horizontal: 'center' };
    });

    items.forEach(lItem => {
        const sItem = stagingItems.find(s => s.srNo === lItem.skuSrNo);
        const rowData = [
            lItem.skuSrNo,
            sItem?.skuName || 'Unknown',
            sItem?.ttlCases || 0,
            ...Array.from({ length: 10 }).map((_, i) => lItem.cells.find(c => c.col === i)?.value || 0),
            lItem.looseInput || 0,
            lItem.total,
            lItem.balance
        ];
        worksheet.addRow(rowData);
    });

    worksheet.getColumn(2).width = 30;

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `Loading_Sheet_${header.date || 'Export'}.xlsx`);
};

export const exportToExcelGeneric = async (data: any[], fileName: string, sheetName: string) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    if (data.length === 0) return;

    // Table Header
    const columns = Object.keys(data[0]);
    const headerRow = worksheet.addRow(columns);
    headerRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    });

    // Data Rows
    data.forEach(item => {
        worksheet.addRow(columns.map(col => item[col]));
    });

    columns.forEach((_, i) => {
        worksheet.getColumn(i + 1).width = 20;
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
};
