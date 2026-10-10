// src/components/inventory/InventoryModule.tsx
import React, { useState } from 'react';
import {
  Item,
  Supplier,
  PurchaseOrder,
  PurchaseOrderItem,
  StockLedgerEntry,
} from '../../types/erp.ts';
import { dbService } from '../../services/db.ts';
import { exportStockLedgerToExcel } from '../../services/excelExport.ts';
import { formatPKR, formatDate, formatNumber, formatDateTime } from '../../utils/formatters.ts';
import { Badge } from '../common/Badge.tsx';
import { Modal } from '../common/Modal.tsx';
import {
  Boxes,
  Download,
  AlertTriangle,
  Plus,
  ShoppingBag,
  FileSpreadsheet,
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
  CheckCircle2,
  PackagePlus,
  RefreshCw,
} from 'lucide-react';

interface InventoryModuleProps {
  items: Item[];
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  purchaseOrderItems: PurchaseOrderItem[];
  stockLedger: StockLedgerEntry[];
}

export const InventoryModule: React.FC<InventoryModuleProps> = ({
  items,
  suppliers,
  purchaseOrders,
  purchaseOrderItems,
  stockLedger,
}) => {
  const [activeTab, setActiveTab] = useState<'items' | 'ledger' | 'purchase_orders' | 'suppliers'>(
    'items'
  );

  // Filters for Stock Ledger
  const [ledgerItemFilter, setLedgerItemFilter] = useState<number | 'all'>('all');
  const [ledgerTxnTypeFilter, setLedgerTxnTypeFilter] = useState<string>('all');
  const [ledgerStartDate, setLedgerStartDate] = useState<string>('');
  const [ledgerEndDate, setLedgerEndDate] = useState<string>('');

  // Item Modal
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [newItem, setNewItem] = useState<{
    name: string;
    item_type: 'film' | 'ink' | 'solvent' | 'adhesive';
    uom: string;
    reorder_level: number;
    standard_cost: number;
  }>({
    name: '',
    item_type: 'film',
    uom: 'kg',
    reorder_level: 500,
    standard_cost: 650,
  });

  // Purchase Order Modal
  const [isPoModalOpen, setIsPoModalOpen] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<number>(suppliers[0]?.id || 1);
  const [poOrderDate, setPoOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [poExpectedDate, setPoExpectedDate] = useState('');
  const [poNotes, setPoNotes] = useState('');
  const [poLineItems, setPoLineItems] = useState<Array<{ item_id: number; qty_ordered: number; rate: number }>>([
    { item_id: items[0]?.id || 1, qty_ordered: 1000, rate: items[0]?.standard_cost || 650 },
  ]);

  // Partial Receipt Modal
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [selectedPoForReceipt, setSelectedPoForReceipt] = useState<PurchaseOrder | null>(null);
  const [receiptQuantities, setReceiptQuantities] = useState<Record<number, number>>({});
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split('T')[0]);
  const [receiptRemarks, setReceiptRemarks] = useState('');

  // Manual Adjustment Modal
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [adjItemId, setAdjItemId] = useState<number>(items[0]?.id || 1);
  const [adjQty, setAdjQty] = useState<number>(0);
  const [adjReason, setAdjReason] = useState<string>('Physical Cycle Count Reconciliation');
  const [adjNotes, setAdjNotes] = useState<string>('');

  // Filtered Stock Ledger
  const filteredLedger = stockLedger.filter((entry) => {
    if (ledgerItemFilter !== 'all' && entry.item_id !== ledgerItemFilter) return false;
    if (ledgerTxnTypeFilter !== 'all' && entry.txn_type !== ledgerTxnTypeFilter) return false;
    if (ledgerStartDate && entry.txn_date.substring(0, 10) < ledgerStartDate) return false;
    if (ledgerEndDate && entry.txn_date.substring(0, 10) > ledgerEndDate) return false;
    return true;
  });

  // Low stock items
  const lowStockItems = items.filter((i) => i.current_stock <= i.reorder_level);

  // Handle Export to Excel
  const handleExportExcel = async () => {
    const selectedItem =
      ledgerItemFilter !== 'all' ? items.find((i) => i.id === ledgerItemFilter)?.name : undefined;

    await exportStockLedgerToExcel(filteredLedger, items, {
      selectedItemName: selectedItem,
      txnType: ledgerTxnTypeFilter !== 'all' ? ledgerTxnTypeFilter : undefined,
      startDate: ledgerStartDate,
      endDate: ledgerEndDate,
    });
  };

  // Handle Save Item
  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name.trim()) return;
    dbService.addItem(newItem);
    setIsItemModalOpen(false);
    setNewItem({
      name: '',
      item_type: 'film',
      uom: 'kg',
      reorder_level: 500,
      standard_cost: 650,
    });
  };

  // Handle PO Creation
  const handleAddPoLine = () => {
    setPoLineItems([
      ...poLineItems,
      { item_id: items[0]?.id || 1, qty_ordered: 500, rate: items[0]?.standard_cost || 650 },
    ]);
  };

  const handleSavePurchaseOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (poLineItems.some((i) => i.qty_ordered <= 0 || i.rate <= 0)) {
      alert('Please fill out valid quantity and unit rate for all purchase order items.');
      return;
    }

    dbService.createPurchaseOrder(
      {
        supplier_id: selectedSupplierId,
        order_date: poOrderDate,
        expected_delivery: poExpectedDate,
        notes: poNotes,
      },
      poLineItems
    );

    setIsPoModalOpen(false);
  };

  // Handle Goods Receipt (Partial/Full)
  const handleOpenReceiveModal = (po: PurchaseOrder) => {
    setSelectedPoForReceipt(po);
    const relatedItems = purchaseOrderItems.filter((i) => i.purchase_order_id === po.id);
    const initialQtyMap: Record<number, number> = {};
    relatedItems.forEach((item) => {
      const remaining = Math.max(0, item.qty_ordered - (item.qty_received || 0));
      initialQtyMap[item.id] = remaining; // default to remaining
    });
    setReceiptQuantities(initialQtyMap);
    setIsReceiveModalOpen(true);
  };

  const handleSaveReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPoForReceipt) return;

    const receipts = Object.entries(receiptQuantities).map(([poItemIdStr, qty]) => ({
      po_item_id: Number(poItemIdStr),
      qty_to_receive: Number(qty),
    }));

    if (receipts.every((r) => r.qty_to_receive <= 0)) {
      alert('Please specify quantity to receive for at least one item.');
      return;
    }

    dbService.receivePurchaseOrderItems(
      selectedPoForReceipt.id,
      receipts,
      receiptDate,
      receiptRemarks
    );

    setIsReceiveModalOpen(false);
    setSelectedPoForReceipt(null);
  };

  // Handle Manual Stock Adjustment
  const handleSaveAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (adjQty === 0) {
      alert('Adjustment quantity cannot be 0.');
      return;
    }

    dbService.recordManualStockAdjustment({
      item_id: adjItemId,
      qty: adjQty,
      reason: adjReason,
      notes: adjNotes,
    });

    setIsAdjustmentModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Module Title & Tab Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Boxes className="w-6 h-6 text-amber-500" />
            Store, Inventory & Procurement
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Raw materials (Films, Inks, Solvents, Adhesives), Purchase Orders with Partial Receipts & Atomic Stock Ledger
          </p>
        </div>

        {/* Tab switcher & quick actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex bg-slate-200/80 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('items')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                activeTab === 'items'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Item Master ({items.length})
            </button>
            <button
              onClick={() => setActiveTab('ledger')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                activeTab === 'ledger'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Stock Ledger ({stockLedger.length})
            </button>
            <button
              onClick={() => setActiveTab('purchase_orders')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                activeTab === 'purchase_orders'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Purchase Orders ({purchaseOrders.length})
            </button>
          </div>

          {activeTab === 'items' && (
            <button
              onClick={() => setIsItemModalOpen(true)}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-lg text-xs shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Item</span>
            </button>
          )}

          {activeTab === 'purchase_orders' && (
            <button
              onClick={() => setIsPoModalOpen(true)}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Purchase Order</span>
            </button>
          )}

          {activeTab === 'ledger' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAdjustmentModalOpen(true)}
                className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold px-2.5 py-1.5 rounded-lg text-xs border border-slate-300 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Adjust Stock</span>
              </button>
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs shadow-xs transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download as Excel (.xlsx)</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* LOW STOCK ALERT BANNER */}
      {lowStockItems.length > 0 && (
        <div className="p-4 bg-rose-50 border border-rose-200/90 rounded-xl flex items-start justify-between gap-3 text-rose-900 animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-rose-100 rounded-lg text-rose-700 border border-rose-200 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-rose-950">
                Low Stock Alert: {lowStockItems.length} Materials At or Below Reorder Threshold
              </h4>
              <p className="text-xs text-rose-800 mt-0.5">
                The following rotogravure factory inputs require urgent replenishment to prevent press downtime:
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {lowStockItems.map((item) => (
                  <span
                    key={item.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white text-rose-900 border border-rose-200 text-xs font-semibold shadow-2xs"
                  >
                    <strong>{item.name}</strong> — Stock: {formatNumber(item.current_stock, 1)} {item.uom} (Min: {formatNumber(item.reorder_level, 0)} {item.uom})
                  </span>
                ))}
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              setActiveTab('purchase_orders');
              setIsPoModalOpen(true);
            }}
            className="shrink-0 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow-xs transition-colors"
          >
            Create PO Now
          </button>
        </div>
      )}

      {/* ITEM MASTER SUB-TAB */}
      {activeTab === 'items' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-800 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Material Name & Spec</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">UOM</th>
                  <th className="px-4 py-3 text-right">Standard Rate</th>
                  <th className="px-4 py-3 text-right">Reorder Level</th>
                  <th className="px-4 py-3 text-right">Current On-Hand</th>
                  <th className="px-4 py-3 text-right">Stock Valuation</th>
                  <th className="px-4 py-3 text-center">Stock Health</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => {
                  const isLow = item.current_stock <= item.reorder_level;
                  const totalVal = item.current_stock * item.standard_cost;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5 font-mono font-bold text-slate-800">
                        ITM-{String(item.id).padStart(3, '0')}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-slate-900">{item.name}</td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                          {item.item_type}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-medium">{item.uom}</td>
                      <td className="px-4 py-3.5 text-right font-medium">
                        {formatPKR(item.standard_cost)}/{item.uom}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono text-slate-500">
                        {formatNumber(item.reorder_level, 0)} {item.uom}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-900 text-sm">
                        {formatNumber(item.current_stock, 1)} {item.uom}
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold text-slate-900 whitespace-nowrap">
                        {formatPKR(totalVal)}
                      </td>
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Adequate
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* STOCK LEDGER SUB-TAB (WITH EXCEL EXPORT) */}
      {activeTab === 'ledger' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1 text-slate-500 font-semibold">
                <Filter className="w-4 h-4 text-slate-400" />
                <span>Filters:</span>
              </div>

              {/* Item filter */}
              <select
                value={ledgerItemFilter}
                onChange={(e) =>
                  setLedgerItemFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))
                }
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white"
              >
                <option value="all">All Raw Materials ({items.length})</option>
                {items.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
              </select>

              {/* Txn Type filter */}
              <select
                value={ledgerTxnTypeFilter}
                onChange={(e) => setLedgerTxnTypeFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white"
              >
                <option value="all">All Movement Types</option>
                <option value="receipt">Receipt (Inward GRN)</option>
                <option value="issue">Issue (Work Order Floor)</option>
                <option value="adjustment">Adjustment (Reconcile)</option>
                <option value="return">Return</option>
              </select>

              {/* Date Filters */}
              <div className="flex items-center gap-1">
                <input
                  type="date"
                  placeholder="Start Date"
                  value={ledgerStartDate}
                  onChange={(e) => setLedgerStartDate(e.target.value)}
                  className="px-2 py-1 rounded border border-slate-300 text-xs"
                />
                <span className="text-slate-400">to</span>
                <input
                  type="date"
                  placeholder="End Date"
                  value={ledgerEndDate}
                  onChange={(e) => setLedgerEndDate(e.target.value)}
                  className="px-2 py-1 rounded border border-slate-300 text-xs"
                />
              </div>

              {(ledgerItemFilter !== 'all' ||
                ledgerTxnTypeFilter !== 'all' ||
                ledgerStartDate ||
                ledgerEndDate) && (
                <button
                  onClick={() => {
                    setLedgerItemFilter('all');
                    setLedgerTxnTypeFilter('all');
                    setLedgerStartDate('');
                    setLedgerEndDate('');
                  }}
                  className="text-xs text-amber-700 font-bold hover:underline"
                >
                  Clear Filters
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500 text-xs">
                Showing <strong>{filteredLedger.length}</strong> of {stockLedger.length} entries
              </span>
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-3 py-1.5 rounded-lg text-xs shadow-xs transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export Filtered Rows to .xlsx</span>
              </button>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-800 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Txn #</th>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Material Spec</th>
                    <th className="px-4 py-3">Txn Type</th>
                    <th className="px-4 py-3 text-right">Movement Qty</th>
                    <th className="px-4 py-3 text-right">Running Balance</th>
                    <th className="px-4 py-3">Reference / Origin</th>
                    <th className="px-4 py-3">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLedger.map((entry) => {
                    const item = items.find((i) => i.id === entry.item_id);
                    const isPositive = entry.qty >= 0;

                    return (
                      <tr key={entry.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-slate-800">
                          #{String(entry.id).padStart(4, '0')}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-slate-500">
                          {formatDateTime(entry.txn_date)}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          {item?.name}
                          <span className="ml-1 text-[10px] text-slate-400 font-normal">
                            ({item?.uom})
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              entry.txn_type === 'receipt'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : entry.txn_type === 'issue'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {isPositive ? (
                              <ArrowDownLeft className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <ArrowUpRight className="w-3 h-3 text-amber-600" />
                            )}
                            {entry.txn_type}
                          </span>
                        </td>
                        <td
                          className={`px-4 py-3 text-right font-mono font-bold whitespace-nowrap ${
                            isPositive ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {isPositive ? '+' : ''}
                          {formatNumber(entry.qty, 1)} {item?.uom}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-extrabold text-slate-900 whitespace-nowrap">
                          {formatNumber(entry.balance_after, 1)} {item?.uom}
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                          {entry.ref_type === 'purchase_order_item'
                            ? `PO Item #${entry.ref_id}`
                            : entry.ref_type === 'material_issue'
                            ? `Issue Record #${entry.ref_id}`
                            : 'Manual / System'}
                        </td>
                        <td className="px-4 py-3 text-slate-600 max-w-xs truncate">
                          {entry.notes || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PURCHASE ORDERS SUB-TAB */}
      {activeTab === 'purchase_orders' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-800 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">PO Number</th>
                    <th className="px-4 py-3">Supplier</th>
                    <th className="px-4 py-3">Order Date</th>
                    <th className="px-4 py-3">Expected ETA</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Materials & Fulfillment Qty</th>
                    <th className="px-4 py-3 text-right">PO Total</th>
                    <th className="px-4 py-3 text-center">Goods Receipt Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {purchaseOrders.map((po) => {
                    const supplier = suppliers.find((s) => s.id === po.supplier_id);
                    const poItems = purchaseOrderItems.filter((i) => i.purchase_order_id === po.id);
                    const totalVal = poItems.reduce(
                      (acc, i) => acc + i.qty_ordered * i.rate,
                      0
                    );

                    return (
                      <tr key={po.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3.5 font-bold text-slate-900 font-mono whitespace-nowrap">
                          {po.po_number}
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-slate-900">
                          {supplier?.name}
                          <div className="text-[10px] text-slate-400 font-normal">
                            Lead time: {supplier?.lead_time_days} days
                          </div>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">{formatDate(po.order_date)}</td>
                        <td className="px-4 py-3.5 whitespace-nowrap text-amber-700 font-medium">
                          {formatDate(po.expected_delivery)}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <Badge status={po.status} />
                        </td>
                        <td className="px-4 py-3.5 max-w-sm">
                          <div className="space-y-1.5">
                            {poItems.map((item) => {
                              const itm = items.find((i) => i.id === item.item_id);
                              const pct = Math.round(
                                ((item.qty_received || 0) / item.qty_ordered) * 100
                              );
                              return (
                                <div
                                  key={item.id}
                                  className="p-2 bg-slate-50 border border-slate-200/70 rounded-md text-[11px]"
                                >
                                  <div className="font-semibold text-slate-900 truncate">
                                    {itm?.name}
                                  </div>
                                  <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                                    <span>
                                      Ordered: {formatNumber(item.qty_ordered, 0)} {itm?.uom} @ {formatPKR(item.rate)}
                                    </span>
                                    <span className="font-bold text-slate-800">
                                      Recv: {formatNumber(item.qty_received || 0, 0)} {itm?.uom} ({pct}%)
                                    </span>
                                  </div>
                                  {/* Progress bar */}
                                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
                                    <div
                                      className={`h-full ${
                                        pct >= 100
                                          ? 'bg-emerald-500'
                                          : pct > 0
                                          ? 'bg-amber-500'
                                          : 'bg-slate-300'
                                      }`}
                                      style={{ width: `${Math.min(100, pct)}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-right font-bold text-slate-900 whitespace-nowrap">
                          {formatPKR(totalVal)}
                        </td>
                        <td className="px-4 py-3.5 text-center whitespace-nowrap">
                          {po.status !== 'completed' && (
                            <button
                              onClick={() => handleOpenReceiveModal(po)}
                              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg font-bold text-xs shadow-2xs transition-colors flex items-center gap-1.5 mx-auto"
                            >
                              <PackagePlus className="w-3.5 h-3.5" />
                              <span>Receive Goods</span>
                            </button>
                          )}
                          {po.status === 'completed' && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Fully Received
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CREATE ITEM MODAL */}
      <Modal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        title="Add Material to Item Master"
        subtitle="Configure standard substrates, gravure inks, organic solvents, or solventless adhesives"
      >
        <form onSubmit={handleSaveItem} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Material Name & Specification *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Metallized BOPP 18 Micron or Gravure Cyan NT"
              value={newItem.name}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Material Category</label>
              <select
                value={newItem.item_type}
                onChange={(e) => setNewItem({ ...newItem, item_type: e.target.value as any })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              >
                <option value="film">Film Substrate (BOPP, PET, Poly, CPP)</option>
                <option value="ink">Gravure Printing Ink (Solvent-based)</option>
                <option value="solvent">Press Solvent (Ethyl Acetate, Toluene, IPA)</option>
                <option value="adhesive">Lamination Adhesive (Solventless 2K)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Unit of Measure (UOM)</label>
              <select
                value={newItem.uom}
                onChange={(e) => setNewItem({ ...newItem, uom: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              >
                <option value="kg">kg (Kilograms)</option>
                <option value="L">L (Liters)</option>
                <option value="rolls">rolls</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Reorder Level Threshold (Alert Trigger)
              </label>
              <input
                type="number"
                min="0"
                required
                value={newItem.reorder_level}
                onChange={(e) => setNewItem({ ...newItem, reorder_level: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Standard Cost (PKR/UOM)</label>
              <input
                type="number"
                min="1"
                required
                value={newItem.standard_cost}
                onChange={(e) => setNewItem({ ...newItem, standard_cost: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsItemModalOpen(false)}
              className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 rounded-lg shadow-xs transition-colors"
            >
              Save Material
            </button>
          </div>
        </form>
      </Modal>

      {/* CREATE PURCHASE ORDER MODAL */}
      <Modal
        isOpen={isPoModalOpen}
        onClose={() => setIsPoModalOpen(false)}
        title="Issue Purchase Order to Supplier"
        subtitle="Procure raw films, chemicals, and inks from certified industrial vendors"
        maxWidth="2xl"
      >
        <form onSubmit={handleSavePurchaseOrder} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Supplier *</label>
              <select
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.lead_time_days}d lead)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">PO Date</label>
              <input
                type="date"
                value={poOrderDate}
                onChange={(e) => setPoOrderDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Expected Delivery ETA</label>
              <input
                type="date"
                value={poExpectedDate}
                onChange={(e) => setPoExpectedDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              />
            </div>
          </div>

          <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Materials to Order
              </h4>
              <button
                type="button"
                onClick={handleAddPoLine}
                className="text-xs font-bold text-amber-700 hover:text-amber-800 bg-amber-100 px-2.5 py-1 rounded"
              >
                + Add Item
              </button>
            </div>

            <div className="space-y-2">
              {poLineItems.map((line, idx) => (
                <div
                  key={idx}
                  className="bg-white p-3 rounded-lg border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-2"
                >
                  <div className="sm:col-span-1">
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                      Item
                    </label>
                    <select
                      value={line.item_id}
                      onChange={(e) => {
                        const newId = Number(e.target.value);
                        const match = items.find((i) => i.id === newId);
                        const updated = [...poLineItems];
                        updated[idx].item_id = newId;
                        if (match) updated[idx].rate = match.standard_cost;
                        setPoLineItems(updated);
                      }}
                      className="w-full px-2 py-1.5 text-xs rounded border border-slate-300"
                    >
                      {items.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.name} ({i.uom})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                      Quantity to Order
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={line.qty_ordered}
                      onChange={(e) => {
                        const updated = [...poLineItems];
                        updated[idx].qty_ordered = Number(e.target.value);
                        setPoLineItems(updated);
                      }}
                      className="w-full px-2 py-1.5 text-xs rounded border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 mb-0.5">
                      Agreed Rate (PKR)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={line.rate}
                      onChange={(e) => {
                        const updated = [...poLineItems];
                        updated[idx].rate = Number(e.target.value);
                        setPoLineItems(updated);
                      }}
                      className="w-full px-2 py-1.5 text-xs rounded border border-slate-300"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Quality Specs & Delivery Notes
            </label>
            <input
              type="text"
              placeholder="e.g. Food contact compliance certificate required with batch report"
              value={poNotes}
              onChange={(e) => setPoNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsPoModalOpen(false)}
              className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg shadow-xs transition-colors"
            >
              Issue Purchase Order
            </button>
          </div>
        </form>
      </Modal>

      {/* PARTIAL / FULL GOODS RECEIPT MODAL */}
      <Modal
        isOpen={isReceiveModalOpen}
        onClose={() => setIsReceiveModalOpen(false)}
        title={`Goods Inward Receipt — ${selectedPoForReceipt?.po_number}`}
        subtitle="Log inward batch, update received balance, and automatically write to stock ledger"
      >
        {selectedPoForReceipt && (
          <form onSubmit={handleSaveReceipt} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Receipt Date</label>
                <input
                  type="date"
                  value={receiptDate}
                  onChange={(e) => setReceiptDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Delivery Challan / GRN Ref</label>
                <input
                  type="text"
                  placeholder="e.g. GRN-2026-0941 / Vendor DC 5501"
                  value={receiptRemarks}
                  onChange={(e) => setReceiptRemarks(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 space-y-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                Enter Inward Quantities Received Today
              </h4>

              {purchaseOrderItems
                .filter((p) => p.purchase_order_id === selectedPoForReceipt.id)
                .map((poItem) => {
                  const itm = items.find((i) => i.id === poItem.item_id);
                  const remaining = Math.max(0, poItem.qty_ordered - (poItem.qty_received || 0));

                  return (
                    <div
                      key={poItem.id}
                      className="bg-white p-3 rounded-lg border border-slate-200 flex items-center justify-between gap-4"
                    >
                      <div>
                        <div className="font-bold text-slate-900 text-xs">{itm?.name}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Ordered: <strong>{formatNumber(poItem.qty_ordered, 0)} {itm?.uom}</strong> | Already Recv:{' '}
                          <strong>{formatNumber(poItem.qty_received || 0, 0)} {itm?.uom}</strong> | Pending:{' '}
                          <span className="text-amber-700 font-bold">{formatNumber(remaining, 0)} {itm?.uom}</span>
                        </div>
                      </div>

                      <div className="w-36">
                        <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                          Qty Received ({itm?.uom})
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={poItem.qty_ordered * 1.2} // allow up to 20% over-delivery if commercial tolerance
                          value={receiptQuantities[poItem.id] ?? 0}
                          onChange={(e) =>
                            setReceiptQuantities({
                              ...receiptQuantities,
                              [poItem.id]: Number(e.target.value),
                            })
                          }
                          className="w-full px-2.5 py-1 text-xs font-mono font-bold rounded border border-slate-300 focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                    </div>
                  );
                })}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsReceiveModalOpen(false)}
                className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs transition-colors"
              >
                Post Inward Goods Receipt (GRN)
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* MANUAL STOCK ADJUSTMENT MODAL */}
      <Modal
        isOpen={isAdjustmentModalOpen}
        onClose={() => setIsAdjustmentModalOpen(false)}
        title="Physical Stock Adjustment"
        subtitle="Reconcile physical floor inventory with ledger. Balance_after is computed atomically."
      >
        <form onSubmit={handleSaveAdjustment} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Select Material *</label>
            <select
              value={adjItemId}
              onChange={(e) => setAdjItemId(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
            >
              {items.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name} (Current: {formatNumber(i.current_stock, 1)} {i.uom})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Adjustment Quantity (+ or -)
              </label>
              <input
                type="number"
                step="any"
                required
                placeholder="e.g. +50 or -25"
                value={adjQty}
                onChange={(e) => setAdjQty(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <span className="text-[10px] text-slate-400">
                Positive to add stock, negative to write off damage / evaporation.
              </span>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Adjustment Reason</label>
              <select
                value={adjReason}
                onChange={(e) => setAdjReason(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              >
                <option value="Physical Cycle Count Reconciliation">Physical Cycle Count Reconciliation</option>
                <option value="Solvent Evaporation & Drum Residual Write-off">
                  Solvent Evaporation & Drum Residual Write-off
                </option>
                <option value="Damaged Substrate Roll Scrap">Damaged Substrate Roll Scrap</option>
                <option value="Found Unrecorded Floor Stock">Found Unrecorded Floor Stock</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Auditor Remarks</label>
            <input
              type="text"
              placeholder="e.g. End of month physical inventory audit signed by Plant Manager"
              value={adjNotes}
              onChange={(e) => setAdjNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAdjustmentModalOpen(false)}
              className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 rounded-lg shadow-xs transition-colors"
            >
              Record Adjustment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
