// src/services/excelExport.ts
import ExcelJS from 'exceljs';
import { StockLedgerEntry, Item } from '../types/erp.ts';

export interface LedgerExportFilter {
  selectedItemName?: string;
  startDate?: string;
  endDate?: string;
  txnType?: string;
}

export async function exportStockLedgerToExcel(
  entries: StockLedgerEntry[],
  items: Item[],
  filters: LedgerExportFilter = {}
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Elite Packages ERP';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Stock Ledger', {
    pageSetup: { orientation: 'landscape', paperSize: 9 }, // A4
  });

  // Company Brand Header Banner
  worksheet.mergeCells('A1:H1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = 'ELITE PACKAGES (PVT) LTD — STOCK LEDGER AUDIT REPORT';
  titleCell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0F172A' }, // Dark slate
  };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(1).height = 36;

  // Metadata Sub-banner
  worksheet.mergeCells('A2:H2');
  const subCell = worksheet.getCell('A2');
  const filterDesc = [
    filters.selectedItemName ? `Item: ${filters.selectedItemName}` : 'All Materials',
    filters.txnType ? `Type: ${filters.txnType.toUpperCase()}` : 'All Txn Types',
    filters.startDate || filters.endDate
      ? `Date Range: ${filters.startDate || 'Start'} to ${filters.endDate || 'End'}`
      : 'Full History',
    `Generated: ${new Date().toLocaleString('en-PK')}`,
  ].join(' | ');

  subCell.value = filterDesc;
  subCell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF475569' } };
  subCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(2).height = 22;

  // Empty spacer row
  worksheet.getRow(3).height = 10;

  // Table Column Headers
  const headerRow = worksheet.getRow(4);
  headerRow.height = 26;
  const headers = [
    { header: 'Entry #', key: 'id', width: 10 },
    { header: 'Item Name & Spec', key: 'item_name', width: 38 },
    { header: 'Category', key: 'item_type', width: 14 },
    { header: 'Txn Date & Time', key: 'txn_date', width: 22 },
    { header: 'Txn Type', key: 'txn_type', width: 14 },
    { header: 'Quantity (UOM)', key: 'qty', width: 18 },
    { header: 'Balance After', key: 'balance_after', width: 18 },
    { header: 'Reference / Remarks', key: 'ref', width: 36 },
  ];

  worksheet.columns = headers.map((h) => ({
    key: h.key,
    width: h.width,
  }));

  // Populate header text and format
  headers.forEach((h, index) => {
    const colNumber = index + 1;
    const cell = headerRow.getCell(colNumber);
    cell.value = h.header;
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' }, // Slate 800
    };
    cell.alignment = {
      horizontal: ['qty', 'balance_after', 'id'].includes(h.key) ? 'right' : 'left',
      vertical: 'middle',
    };
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF0F172A' } },
      bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    };
  });

  // Populate Data Rows
  let currentRowIdx = 5;
  const itemMap = new Map(items.map((i) => [i.id, i]));

  entries.forEach((entry, idx) => {
    const row = worksheet.getRow(currentRowIdx);
    row.height = 22;
    const item = itemMap.get(entry.item_id);

    const refString = entry.ref_type === 'purchase_order_item'
      ? `PO Item #${entry.ref_id} (${entry.notes || 'GRN Receipt'})`
      : entry.ref_type === 'material_issue'
      ? `Material Issue #${entry.ref_id} (${entry.notes || 'Floor Issue'})`
      : entry.notes || 'Manual Entry';

    const isEven = idx % 2 === 0;
    const rowBg = isEven ? 'FFFFFFFF' : 'FFF8FAFC'; // Clean zebra striping

    // Cells
    row.getCell(1).value = entry.id;
    row.getCell(2).value = item ? item.name : `Item #${entry.item_id}`;
    row.getCell(3).value = item ? item.item_type.toUpperCase() : 'N/A';
    row.getCell(4).value = entry.txn_date;
    row.getCell(5).value = entry.txn_type.toUpperCase();
    row.getCell(6).value = entry.qty;
    row.getCell(7).value = entry.balance_after;
    row.getCell(8).value = refString;

    // Alignment and formatting
    for (let c = 1; c <= 8; c++) {
      const cell = row.getCell(c);
      cell.font = { name: 'Calibri', size: 10 };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: rowBg },
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };

      if (c === 1) cell.alignment = { horizontal: 'center', vertical: 'middle' };
      if (c === 3 || c === 5) cell.alignment = { horizontal: 'center', vertical: 'middle' };
      if (c === 6 || c === 7) {
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
        cell.numFmt = '#,##0.00';
        if (c === 6) {
          cell.font = {
            name: 'Calibri',
            size: 10,
            bold: true,
            color: { argb: entry.qty >= 0 ? 'FF15803D' : 'FFB91C1C' }, // Green vs Red
          };
        }
      }
    }

    currentRowIdx++;
  });

  // Footer / Totals row
  const summaryRow = worksheet.getRow(currentRowIdx);
  summaryRow.height = 24;
  worksheet.mergeCells(`A${currentRowIdx}:E${currentRowIdx}`);
  const summaryLabel = worksheet.getCell(`A${currentRowIdx}`);
  summaryLabel.value = `Total Ledger Entries: ${entries.length}`;
  summaryLabel.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF0F172A' } };
  summaryLabel.alignment = { horizontal: 'left', vertical: 'middle' };
  summaryLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };

  // Calculate net movement
  const netQty = entries.reduce((acc, curr) => acc + curr.qty, 0);
  const netCell = worksheet.getCell(`F${currentRowIdx}`);
  netCell.value = netQty;
  netCell.numFmt = '#,##0.00';
  netCell.font = { name: 'Calibri', size: 10, bold: true };
  netCell.alignment = { horizontal: 'right', vertical: 'middle' };
  netCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };

  // Last row balance
  const lastBalance = entries.length > 0 ? entries[entries.length - 1].balance_after : 0;
  const balanceCell = worksheet.getCell(`G${currentRowIdx}`);
  balanceCell.value = lastBalance;
  balanceCell.numFmt = '#,##0.00';
  balanceCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF1E3A8A' } };
  balanceCell.alignment = { horizontal: 'right', vertical: 'middle' };
  balanceCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };

  const endBlank = worksheet.getCell(`H${currentRowIdx}`);
  endBlank.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };

  for (let c = 1; c <= 8; c++) {
    const cell = summaryRow.getCell(c);
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF94A3B8' } },
      bottom: { style: 'medium', color: { argb: 'FF94A3B8' } },
    };
  }

  // Generate buffer and trigger browser download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const timestamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12);
  const filename = `Stock_Ledger_Elite_Packages_${timestamp}.xlsx`;

  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
}
