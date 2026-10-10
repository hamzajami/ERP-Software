// src/components/dispatch/DispatchModule.tsx
import React, { useState } from 'react';
import {
  DispatchNote,
  Invoice,
  WorkOrder,
  SalesOrderItem,
  SalesOrder,
  Customer,
} from '../../types/erp.ts';
import { dbService } from '../../services/db.ts';
import { formatPKR, formatDate, formatNumber } from '../../utils/formatters.ts';
import { Badge } from '../common/Badge.tsx';
import { Modal } from '../common/Modal.tsx';
import {
  Truck,
  FileText,
  Plus,
  Receipt,
  Printer,
  CreditCard,
  Building,
  CheckCircle,
  FileCheck2,
} from 'lucide-react';

interface DispatchModuleProps {
  dispatchNotes: DispatchNote[];
  invoices: Invoice[];
  workOrders: WorkOrder[];
  salesOrderItems: SalesOrderItem[];
  salesOrders: SalesOrder[];
  customers: Customer[];
}

export const DispatchModule: React.FC<DispatchModuleProps> = ({
  dispatchNotes,
  invoices,
  workOrders,
  salesOrderItems,
  salesOrders,
  customers,
}) => {
  const [subTab, setSubTab] = useState<'dispatch' | 'invoices'>('dispatch');

  // New Dispatch Modal
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [selectedWoId, setSelectedWoId] = useState<number>(workOrders[0]?.id || 1);
  const [dispatchDate, setDispatchDate] = useState(new Date().toISOString().split('T')[0]);
  const [dispatchQty, setDispatchQty] = useState<number>(1000);
  const [vehicleNo, setVehicleNo] = useState('');
  const [driverName, setDriverName] = useState('');
  const [dispatchNotesText, setDispatchNotesText] = useState('');

  // Payment Recording Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [payingAmount, setPayingAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentNotes, setPaymentNotes] = useState('');

  // Printable Document Modal (Challan / Tax Invoice)
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printDocumentType, setPrintDocumentType] = useState<'challan' | 'invoice'>('challan');
  const [activeDispatchForPrint, setActiveDispatchForPrint] = useState<DispatchNote | null>(null);
  const [activeInvoiceForPrint, setActiveInvoiceForPrint] = useState<Invoice | null>(null);

  // Eligible work orders for dispatch (completed or in_production with runs)
  const eligibleWorkOrders = workOrders.filter(
    (w) => w.status === 'completed' || w.status === 'in_production'
  );

  const handleCreateDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (dispatchQty <= 0) {
      alert('Dispatch quantity must be greater than 0');
      return;
    }

    try {
      dbService.createDispatchNote({
        work_order_id: selectedWoId,
        dispatch_date: dispatchDate,
        qty_dispatched: dispatchQty,
        vehicle_no: vehicleNo,
        driver_name: driverName,
        notes: dispatchNotesText,
      });

      setIsDispatchModalOpen(false);
      setVehicleNo('');
      setDriverName('');
      setDispatchNotesText('');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleGenerateInvoice = (dispatchId: number) => {
    try {
      const inv = dbService.createInvoiceFromDispatch(dispatchId);
      setSubTab('invoices');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleOpenPayment = (inv: Invoice) => {
    setSelectedInvoice(inv);
    const balance = inv.total_amount - (inv.amount_paid || 0);
    setPayingAmount(balance);
    setIsPaymentModalOpen(true);
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    dbService.recordInvoicePayment(selectedInvoice.id, {
      amount_paying: payingAmount,
      payment_date: paymentDate,
      notes: paymentNotes,
    });

    setIsPaymentModalOpen(false);
    setSelectedInvoice(null);
  };

  const handlePrintChallan = (dn: DispatchNote) => {
    setActiveDispatchForPrint(dn);
    setPrintDocumentType('challan');
    setIsPrintModalOpen(true);
  };

  const handlePrintInvoice = (inv: Invoice) => {
    const dn = dispatchNotes.find((d) => d.id === inv.dispatch_note_id);
    setActiveInvoiceForPrint(inv);
    if (dn) setActiveDispatchForPrint(dn);
    setPrintDocumentType('invoice');
    setIsPrintModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Title & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Truck className="w-6 h-6 text-amber-500" />
            Dispatch & Commercial Invoicing
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Delivery Challan generation, Sales Tax Invoices (GST 18%), and Accounts Receivable payment logging
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-200/80 p-1 rounded-lg">
            <button
              onClick={() => setSubTab('dispatch')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                subTab === 'dispatch'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Dispatch Notes ({dispatchNotes.length})
            </button>
            <button
              onClick={() => setSubTab('invoices')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                subTab === 'invoices'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sales Invoices ({invoices.length})
            </button>
          </div>

          {subTab === 'dispatch' && (
            <button
              onClick={() => setIsDispatchModalOpen(true)}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-3.5 py-2 rounded-lg text-xs shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create Dispatch Note</span>
            </button>
          )}
        </div>
      </div>

      {/* DISPATCH NOTES SUB-TAB */}
      {subTab === 'dispatch' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-800 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Delivery Challan</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Customer & Job Spec</th>
                  <th className="px-4 py-3 text-right">Dispatched Qty</th>
                  <th className="px-4 py-3">Vehicle & Driver</th>
                  <th className="px-4 py-3">Invoice Link</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dispatchNotes.map((dn) => {
                  const wo = workOrders.find((w) => w.id === dn.work_order_id);
                  const soItem = wo ? salesOrderItems.find((i) => i.id === wo.sales_order_item_id) : null;
                  const so = soItem ? salesOrders.find((s) => s.id === soItem.sales_order_id) : null;
                  const customer = so ? customers.find((c) => c.id === so.customer_id) : null;
                  const invoice = invoices.find((inv) => inv.dispatch_note_id === dn.id);

                  return (
                    <tr key={dn.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {dn.delivery_challan_no}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">{formatDate(dn.dispatch_date)}</td>
                      <td className="px-4 py-3.5 max-w-sm">
                        <div className="font-bold text-slate-900">{customer?.name}</div>
                        <div className="text-[11px] text-slate-500 truncate">{soItem?.product_spec}</div>
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-extrabold text-slate-900 text-sm whitespace-nowrap">
                        {formatNumber(dn.qty_dispatched, 1)} kg
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-800">{dn.vehicle_no || 'Factory Transport'}</div>
                        <div className="text-[10px] text-slate-400">{dn.driver_name || 'Designated Driver'}</div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {invoice ? (
                          <span className="font-mono text-emerald-700 font-bold text-xs">
                            {invoice.invoice_number}
                          </span>
                        ) : (
                          <button
                            onClick={() => handleGenerateInvoice(dn.id)}
                            className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold rounded text-[11px] transition-colors"
                          >
                            + Generate Invoice
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <button
                          onClick={() => handlePrintChallan(dn)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-[11px] transition-colors inline-flex items-center gap-1"
                        >
                          <Printer className="w-3 h-3" />
                          <span>View Challan</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SALES INVOICES SUB-TAB */}
      {subTab === 'invoices' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-800 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Invoice #</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3 text-right">Net Value</th>
                  <th className="px-4 py-3 text-right">GST (18%)</th>
                  <th className="px-4 py-3 text-right">Total Payable</th>
                  <th className="px-4 py-3 text-right">Amount Received</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => {
                  const dn = dispatchNotes.find((d) => d.id === inv.dispatch_note_id);
                  const wo = dn ? workOrders.find((w) => w.id === dn.work_order_id) : null;
                  const soItem = wo ? salesOrderItems.find((i) => i.id === wo.sales_order_item_id) : null;
                  const so = soItem ? salesOrders.find((s) => s.id === soItem.sales_order_id) : null;
                  const customer = so ? customers.find((c) => c.id === so.customer_id) : null;

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {inv.invoice_number}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-900">{customer?.name}</div>
                        <div className="text-[10px] text-slate-400">{customer?.tax_number}</div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">{formatDate(inv.due_date)}</td>
                      <td className="px-4 py-3.5 text-right font-mono font-medium">
                        {formatPKR(inv.amount)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono text-slate-500">
                        {formatPKR(inv.sales_tax_amount)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-900 text-sm whitespace-nowrap">
                        {formatPKR(inv.total_amount)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                        {formatPKR(inv.amount_paid || 0)}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <Badge status={inv.payment_status} />
                      </td>
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {inv.payment_status !== 'paid' && (
                            <button
                              onClick={() => handleOpenPayment(inv)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[10px] shadow-2xs transition-colors flex items-center gap-1"
                            >
                              <CreditCard className="w-3 h-3" />
                              <span>Receive Payment</span>
                            </button>
                          )}
                          <button
                            onClick={() => handlePrintInvoice(inv)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-[10px] transition-colors flex items-center gap-1"
                          >
                            <Printer className="w-3 h-3" />
                            <span>Tax Invoice</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE DISPATCH NOTE MODAL */}
      <Modal
        isOpen={isDispatchModalOpen}
        onClose={() => setIsDispatchModalOpen(false)}
        title="Create Outward Dispatch Note (Gate Pass)"
        subtitle="Authorize factory gate pass and shipment to client warehouse"
      >
        <form onSubmit={handleCreateDispatch} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Select Completed Work Order *
            </label>
            <select
              value={selectedWoId}
              onChange={(e) => setSelectedWoId(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
            >
              {eligibleWorkOrders.map((wo) => {
                const soItem = salesOrderItems.find((i) => i.id === wo.sales_order_item_id);
                return (
                  <option key={wo.id} value={wo.id}>
                    WO-{String(wo.id).padStart(4, '0')}: {soItem?.product_spec} ({wo.status})
                  </option>
                );
              })}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Dispatch Date</label>
              <input
                type="date"
                value={dispatchDate}
                onChange={(e) => setDispatchDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Quantity Dispatched (kg) *</label>
              <input
                type="number"
                min="1"
                step="any"
                required
                value={dispatchQty}
                onChange={(e) => setDispatchQty(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Vehicle Registration #</label>
              <input
                type="text"
                placeholder="e.g. LES-26-8942 (Shehzore / Mazda)"
                value={vehicleNo}
                onChange={(e) => setVehicleNo(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Driver Name & Contact</label>
              <input
                type="text"
                placeholder="e.g. Ghulam Rasool (+92 300 4421980)"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Packaging / Palletizing Details</label>
            <textarea
              rows={2}
              placeholder="e.g. 48 Slit Rolls on wooden pallets with stretch wrapping and desiccant packs"
              value={dispatchNotesText}
              onChange={(e) => setDispatchNotesText(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsDispatchModalOpen(false)}
              className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg shadow-xs transition-colors"
            >
              Generate Delivery Challan
            </button>
          </div>
        </form>
      </Modal>

      {/* RECORD PAYMENT MODAL */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title={`Receive Payment — ${selectedInvoice?.invoice_number}`}
        subtitle="Post client check or online banking remittance"
      >
        {selectedInvoice && (
          <form onSubmit={handleSavePayment} className="space-y-4">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500">Invoice Total:</span>
                <div className="font-bold text-slate-900 text-sm">{formatPKR(selectedInvoice.total_amount)}</div>
              </div>
              <div>
                <span className="text-slate-500">Remaining Due:</span>
                <div className="font-bold text-rose-700 text-sm">
                  {formatPKR(selectedInvoice.total_amount - (selectedInvoice.amount_paid || 0))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Payment Amount (PKR) *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={payingAmount}
                  onChange={(e) => setPayingAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-mono font-bold rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Remittance Date</label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Bank Reference / Transfer ID
              </label>
              <input
                type="text"
                placeholder="e.g. Meezan Bank Online Transfer Ref FT2608104432"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs transition-colors"
              >
                Post Payment
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* PRINTABLE DOCUMENT MODAL (DELIVERY CHALLAN & SALES TAX INVOICE) */}
      <Modal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        title={printDocumentType === 'challan' ? 'Official Delivery Challan' : 'Sales Tax Commercial Invoice'}
        subtitle="Standard Pakistan Federal Board of Revenue (FBR) compliant layout"
        maxWidth="3xl"
      >
        <div className="space-y-6">
          <div className="p-6 bg-white border border-slate-300 rounded-lg shadow-sm font-sans text-slate-900 printable-document">
            {/* Letterhead */}
            <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
              <div>
                <h1 className="text-xl font-black uppercase tracking-tight text-slate-950">
                  Elite Packages (Pvt) Ltd
                </h1>
                <p className="text-xs text-slate-600 font-medium">
                  Rotogravure Printing, Flexible Packaging & Solventless Lamination
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Plot 48, Sundar Industrial Estate, Raiwind Road, Lahore, Pakistan
                </p>
                <p className="text-[11px] text-slate-500 font-mono">
                  NTN: 2984102-3 | STRN: 03-09-4819-002-19
                </p>
              </div>
              <div className="text-right">
                <span className="inline-block px-3 py-1 bg-slate-900 text-white font-extrabold text-xs uppercase tracking-widest rounded">
                  {printDocumentType === 'challan' ? 'Delivery Challan / Gate Pass' : 'Sales Tax Invoice'}
                </span>
                <div className="mt-2 font-mono font-bold text-sm text-slate-900">
                  {printDocumentType === 'challan'
                    ? activeDispatchForPrint?.delivery_challan_no
                    : activeInvoiceForPrint?.invoice_number}
                </div>
                <div className="text-xs text-slate-500">
                  Date: {formatDate(activeDispatchForPrint?.dispatch_date)}
                </div>
              </div>
            </div>

            {/* Consignee details */}
            <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-200 text-xs">
              <div>
                <span className="font-bold uppercase text-[10px] text-slate-400">Consignee (Billed To):</span>
                <div className="font-bold text-sm text-slate-900 mt-0.5">
                  {customers[0]?.name}
                </div>
                <div className="text-slate-600 mt-0.5">{customers[0]?.address}</div>
                <div className="font-mono text-[11px] text-slate-500 mt-1">{customers[0]?.tax_number}</div>
              </div>
              <div className="text-right space-y-1">
                <div>
                  <span className="text-slate-400 font-medium">Vehicle Reg:</span>{' '}
                  <strong className="text-slate-800">{activeDispatchForPrint?.vehicle_no || 'LES-26-8942'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Driver:</span>{' '}
                  <span className="text-slate-800">{activeDispatchForPrint?.driver_name || 'Ghulam Rasool'}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Payment Terms:</span>{' '}
                  <span className="text-slate-800">{customers[0]?.credit_terms}</span>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <table className="w-full text-left text-xs my-4 border border-slate-300">
              <thead className="bg-slate-100 text-slate-800 font-bold uppercase text-[10px] border-b border-slate-300">
                <tr>
                  <th className="p-2 border-r border-slate-300">Item Description</th>
                  <th className="p-2 border-r border-slate-300 text-right">Quantity (kg)</th>
                  {printDocumentType === 'invoice' && (
                    <>
                      <th className="p-2 border-r border-slate-300 text-right">Unit Rate (PKR)</th>
                      <th className="p-2 text-right">Total (PKR)</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="p-2 border-r border-slate-300">
                    <div className="font-bold text-slate-900">
                      Shan Biryani 50g — 20µ BOPP / 12µ Met PET / 35µ Poly Pouch
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Cylinder Set CYL-01 (7 Colors) • Core size 76mm
                    </div>
                  </td>
                  <td className="p-2 border-r border-slate-300 text-right font-mono font-bold">
                    {formatNumber(activeDispatchForPrint?.qty_dispatched || 1200, 1)} kg
                  </td>
                  {printDocumentType === 'invoice' && (
                    <>
                      <td className="p-2 border-r border-slate-300 text-right font-mono">
                        {formatPKR(980)}
                      </td>
                      <td className="p-2 text-right font-mono font-bold text-slate-900">
                        {formatPKR(1176000)}
                      </td>
                    </>
                  )}
                </tr>
              </tbody>
            </table>

            {/* Financial Totals for Invoice */}
            {printDocumentType === 'invoice' && (
              <div className="w-64 ml-auto space-y-1 text-xs border-t border-slate-300 pt-2 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Net Value:</span>
                  <span className="font-bold">{formatPKR(1176000)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span className="text-slate-500 font-sans">GST (18%):</span>
                  <span>{formatPKR(211680)}</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold border-t border-slate-900 pt-1 text-slate-950">
                  <span className="font-sans">Grand Total:</span>
                  <span>{formatPKR(1387680)}</span>
                </div>
              </div>
            )}

            {/* Signature blocks */}
            <div className="mt-8 pt-8 grid grid-cols-3 gap-4 text-center text-xs text-slate-500 border-t border-slate-200">
              <div>
                <div className="h-8 border-b border-slate-400"></div>
                <p className="mt-1 font-semibold text-slate-700">Prepared By (Dispatch)</p>
              </div>
              <div>
                <div className="h-8 border-b border-slate-400"></div>
                <p className="mt-1 font-semibold text-slate-700">Security Gate Outward</p>
              </div>
              <div>
                <div className="h-8 border-b border-slate-400"></div>
                <p className="mt-1 font-semibold text-slate-700">Receiver's Stamp & Signature</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsPrintModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Document</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
