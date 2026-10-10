// src/components/reports/ReportsModule.tsx
import React, { useState } from 'react';
import {
  Item,
  WorkOrder,
  SalesOrder,
  SalesOrderItem,
  Customer,
  Invoice,
  ProductionRun,
  MaterialIssue,
  StockValuationMethod,
} from '../../types/erp.ts';
import { dbService } from '../../services/db.ts';
import { formatPKR, formatDate, formatNumber } from '../../utils/formatters.ts';
import { Badge } from '../common/Badge.tsx';
import {
  BarChart3,
  Calculator,
  Percent,
  Layers,
  FileText,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  ArrowRight,
  DollarSign,
  Package,
  Boxes,
} from 'lucide-react';

interface ReportsModuleProps {
  items: Item[];
  workOrders: WorkOrder[];
  salesOrders: SalesOrder[];
  salesOrderItems: SalesOrderItem[];
  customers: Customer[];
  invoices: Invoice[];
  productionRuns: ProductionRun[];
  materialIssues: MaterialIssue[];
}

export const ReportsModule: React.FC<ReportsModuleProps> = ({
  items,
  workOrders,
  salesOrders,
  salesOrderItems,
  customers,
  invoices,
  productionRuns,
  materialIssues,
}) => {
  const [activeReportTab, setActiveReportTab] = useState<
    'valuation' | 'material_cost' | 'wastage' | 'open_orders' | 'receivables'
  >('valuation');

  const currentMethod = dbService.getValuationMethod();
  const valuationData = dbService.calculateInventoryValuation();
  const wastageData = dbService.getWastageReport();

  const handleToggleValuationMethod = (method: StockValuationMethod) => {
    dbService.setValuationMethod(method);
  };

  // Outstanding Invoices
  const unpaidInvoices = invoices.filter((inv) => inv.payment_status !== 'paid');
  const totalReceivables = unpaidInvoices.reduce(
    (acc, inv) => acc + (inv.total_amount - (inv.amount_paid || 0)),
    0
  );

  // Open Sales Orders
  const openOrders = salesOrders.filter((so) => so.status !== 'closed' && so.status !== 'dispatched');

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-amber-500" />
            Executive Reports & Cost Accounting
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Stock Valuation Studio (Weighted Average vs. FIFO), Stage-wise Wastage %, Job Costing, and Receivables
          </p>
        </div>

        {/* Tab Navigator */}
        <div className="flex flex-wrap bg-slate-200/80 p-1 rounded-lg">
          <button
            onClick={() => setActiveReportTab('valuation')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              activeReportTab === 'valuation'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Inventory Valuation (WA vs FIFO)
          </button>
          <button
            onClick={() => setActiveReportTab('wastage')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              activeReportTab === 'wastage'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Production Wastage %
          </button>
          <button
            onClick={() => setActiveReportTab('material_cost')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              activeReportTab === 'material_cost'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Job Cost per Work Order
          </button>
          <button
            onClick={() => setActiveReportTab('open_orders')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              activeReportTab === 'open_orders'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Open Orders Pipeline ({openOrders.length})
          </button>
          <button
            onClick={() => setActiveReportTab('receivables')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              activeReportTab === 'receivables'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Accounts Receivable ({unpaidInvoices.length})
          </button>
        </div>
      </div>

      {/* 1. STOCK VALUATION STUDIO (WEIGHTED AVERAGE VS. FIFO) */}
      {activeReportTab === 'valuation' && (
        <div className="space-y-6">
          {/* Open Decision Architecture Banner */}
          <div className="p-5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-xl shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-200 text-amber-900 border border-amber-300">
                    Open Decision Architecture
                  </span>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    Stock Valuation Method Selection (Weighted Average vs. FIFO)
                  </h3>
                </div>
                <p className="text-xs text-slate-700 max-w-3xl">
                  In rotogravure flexible packaging, substrate films (BOPP, PET, Poly) and gravure inks
                  experience price fluctuations due to import exchange rates (USD/PKR) and petrochemical feedstocks.
                  Elite Packages allows toggling between <strong>Weighted Average Cost</strong> and{' '}
                  <strong>FIFO (First-In, First-Out)</strong> transparently without silent hardcoding.
                </p>
              </div>

              {/* Interactive Toggle */}
              <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-amber-200 shadow-xs shrink-0">
                <button
                  onClick={() => handleToggleValuationMethod('weighted_average')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    currentMethod === 'weighted_average'
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Weighted Average
                </button>
                <button
                  onClick={() => handleToggleValuationMethod('fifo')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    currentMethod === 'fifo'
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  FIFO (First-In, First-Out)
                </button>
              </div>
            </div>

            {/* Side-by-side financial total impact */}
            <div className="mt-4 pt-4 border-t border-amber-200/80 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-3 bg-white/80 rounded-lg border border-amber-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Total Asset Value (Weighted Average)
                </span>
                <div className="text-lg font-bold text-slate-900 mt-0.5">
                  {formatPKR(valuationData.totalWeightedAverage)}
                </div>
                <span className="text-[10px] text-slate-400">Blended cumulative cost</span>
              </div>

              <div className="p-3 bg-white/80 rounded-lg border border-amber-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Total Asset Value (FIFO Method)
                </span>
                <div className="text-lg font-bold text-slate-900 mt-0.5">
                  {formatPKR(valuationData.totalFIFO)}
                </div>
                <span className="text-[10px] text-slate-400">Values ending stock at newest batch prices</span>
              </div>

              <div className="p-3 bg-white/80 rounded-lg border border-amber-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Valuation Variance Delta
                </span>
                <div
                  className={`text-lg font-bold mt-0.5 ${
                    valuationData.totalFIFO >= valuationData.totalWeightedAverage
                      ? 'text-emerald-700'
                      : 'text-rose-700'
                  }`}
                >
                  {formatPKR(Math.abs(valuationData.totalFIFO - valuationData.totalWeightedAverage))}
                  <span className="text-xs ml-1 font-normal">
                    ({valuationData.totalFIFO >= valuationData.totalWeightedAverage ? '+ Higher' : '- Lower'})
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">
                  Currently Active: <strong className="uppercase">{currentMethod.replace('_', ' ')}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Detailed Item Valuation Comparison Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                Raw Material Valuation Breakdown by Item
              </h4>
              <span className="text-[11px] text-slate-500">
                Comparing Weighted Average unit rate vs. FIFO batch consumption
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50/50 border-b border-slate-200 text-slate-800 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Material Spec</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3 text-right">On-Hand Stock</th>
                    <th className="px-4 py-3 text-right">Weighted Avg Rate</th>
                    <th className="px-4 py-3 text-right">WA Total Asset</th>
                    <th className="px-4 py-3 text-right">FIFO Unit Rate</th>
                    <th className="px-4 py-3 text-right">FIFO Total Asset</th>
                    <th className="px-4 py-3 text-right">Variance %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {valuationData.itemsValuation.map((val) => (
                    <tr key={val.item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5 font-bold text-slate-900">{val.item.name}</td>
                      <td className="px-4 py-3.5 uppercase text-[10px] font-semibold text-slate-500">
                        {val.item.item_type}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-800">
                        {formatNumber(val.quantity, 1)} {val.item.uom}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-medium">
                        {formatPKR(val.weightedAverageUnitRate)}/{val.item.uom}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-900">
                        {formatPKR(val.weightedAverageTotal)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-medium">
                        {formatPKR(val.fifoUnitRate)}/{val.item.uom}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-900">
                        {formatPKR(val.fifoTotal)}
                      </td>
                      <td
                        className={`px-4 py-3.5 text-right font-mono font-semibold ${
                          val.variancePercent > 0
                            ? 'text-emerald-700'
                            : val.variancePercent < 0
                            ? 'text-rose-700'
                            : 'text-slate-400'
                        }`}
                      >
                        {val.variancePercent > 0 ? '+' : ''}
                        {val.variancePercent}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. PRODUCTION WASTAGE % REPORT */}
      {activeReportTab === 'wastage' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Total Good Production
              </span>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {formatNumber(wastageData.totalProduced, 1)} kg
              </div>
              <span className="text-xs text-slate-500">Total salable packaging</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Total Scrap & Wastage
              </span>
              <div className="text-2xl font-bold text-rose-600 mt-1">
                {formatNumber(wastageData.totalWastage, 1)} kg
              </div>
              <span className="text-xs text-slate-500">Trim, start-up, & defect loss</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Overall Factory Wastage %
              </span>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {wastageData.overallPercentage}%
              </div>
              <span className="text-xs text-emerald-600 font-semibold">Industry benchmark: &lt;4.5%</span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Estimated Scrap Recovery
              </span>
              <div className="text-2xl font-bold text-slate-900 mt-1">
                {formatPKR(wastageData.totalWastage * 120)}
              </div>
              <span className="text-xs text-slate-500">Re-pelletizing scrap salvage (Rs 120/kg)</span>
            </div>
          </div>

          {/* Stage breakdown */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
              Stage-Wise Wastage Performance
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {Object.entries(wastageData.stageBreakdown).map(([stage, stats]) => (
                <div key={stage} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 capitalize text-sm">{stage} Stage</span>
                    <span className="font-mono font-bold text-sm text-slate-900">
                      {stats.percentage}%
                    </span>
                  </div>

                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        stats.percentage > 4 ? 'bg-rose-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, stats.percentage * 10)}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[11px] text-slate-500 pt-1">
                    <span>Good: {formatNumber(stats.produced, 0)} kg</span>
                    <span className="text-rose-600 font-semibold">Loss: {formatNumber(stats.wastage, 0)} kg</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. MATERIAL COST PER WORK ORDER */}
      {activeReportTab === 'material_cost' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
              Material Cost Accounting per Work Order
            </h4>
            <span className="text-[11px] text-slate-500">
              Aggregated directly from store material_issues records
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/50 border-b border-slate-200 text-slate-800 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Work Order</th>
                  <th className="px-4 py-3">Product Specification</th>
                  <th className="px-4 py-3 text-right">Job Target (kg)</th>
                  <th className="px-4 py-3 text-right">Contract Value</th>
                  <th className="px-4 py-3 text-right">Direct Material Cost</th>
                  <th className="px-4 py-3 text-right">Gross Margin %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {workOrders.map((wo) => {
                  const soItem = salesOrderItems.find((i) => i.id === wo.sales_order_item_id);
                  const costData = dbService.getWorkOrderMaterialCost(wo.id);
                  const contractValue = soItem ? soItem.quantity_kg * soItem.unit_rate : 0;
                  const margin =
                    contractValue > 0
                      ? Math.round(((contractValue - costData.totalCost) / contractValue) * 1000) / 10
                      : 0;

                  return (
                    <tr key={wo.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5 font-bold font-mono text-slate-900">
                        WO-{String(wo.id).padStart(4, '0')}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-slate-900 max-w-sm truncate">
                        {soItem?.product_spec}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-medium">
                        {formatNumber(soItem?.quantity_kg || 0, 0)} kg
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-900">
                        {formatPKR(contractValue)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-amber-800">
                        {formatPKR(costData.totalCost)}
                      </td>
                      <td
                        className={`px-4 py-3.5 text-right font-mono font-bold text-sm ${
                          margin >= 25 ? 'text-emerald-700' : 'text-amber-700'
                        }`}
                      >
                        {margin}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. OPEN ORDERS PIPELINE */}
      {activeReportTab === 'open_orders' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
              Pending & Active Production Pipeline
            </h4>
            <span className="text-[11px] text-slate-500">
              Orders requiring delivery fulfillment
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/50 border-b border-slate-200 text-slate-800 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Order #</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Delivery Deadline</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Line Items</th>
                  <th className="px-4 py-3 text-right">Total Order Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {openOrders.map((so) => {
                  const customer = customers.find((c) => c.id === so.customer_id);
                  const itemsList = salesOrderItems.filter((i) => i.sales_order_id === so.id);
                  const totalVal = itemsList.reduce((acc, i) => acc + i.quantity_kg * i.unit_rate, 0);

                  return (
                    <tr key={so.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5 font-mono font-bold text-slate-900">
                        SO-{String(so.id).padStart(4, '0')}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-slate-900">{customer?.name}</td>
                      <td className="px-4 py-3.5 font-medium text-amber-800">
                        {formatDate(so.delivery_deadline)}
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge status={so.status} />
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">
                        {itemsList.map((i) => i.product_spec).join(', ')}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-900">
                        {formatPKR(totalVal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. ACCOUNTS RECEIVABLE */}
      {activeReportTab === 'receivables' && (
        <div className="space-y-4">
          <div className="p-5 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800">
                Total Outstanding Commercial Receivables
              </span>
              <div className="text-2xl font-black text-rose-950 mt-0.5">
                {formatPKR(totalReceivables)}
              </div>
            </div>
            <span className="px-3 py-1 bg-white text-rose-800 rounded-lg border border-rose-200 text-xs font-bold shadow-2xs">
              {unpaidInvoices.length} Invoices Pending Clearance
            </span>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-800 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Invoice #</th>
                    <th className="px-4 py-3">Due Date</th>
                    <th className="px-4 py-3 text-right">Invoice Total</th>
                    <th className="px-4 py-3 text-right">Paid</th>
                    <th className="px-4 py-3 text-right">Outstanding Balance</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {unpaidInvoices.map((inv) => {
                    const balance = inv.total_amount - (inv.amount_paid || 0);
                    return (
                      <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3.5 font-mono font-bold text-slate-900">
                          {inv.invoice_number}
                        </td>
                        <td className="px-4 py-3.5 font-medium text-slate-700">
                          {formatDate(inv.due_date)}
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-900">
                          {formatPKR(inv.total_amount)}
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono text-emerald-700 font-bold">
                          {formatPKR(inv.amount_paid || 0)}
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono font-extrabold text-rose-700 text-sm">
                          {formatPKR(balance)}
                        </td>
                        <td className="px-4 py-3.5">
                          <Badge status={inv.payment_status} />
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
    </div>
  );
};
