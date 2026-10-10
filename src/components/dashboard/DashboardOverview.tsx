// src/components/dashboard/DashboardOverview.tsx
import React from 'react';
import {
  Customer,
  SalesOrder,
  SalesOrderItem,
  WorkOrder,
  ProductionRun,
  QCInspection,
  Item,
  Invoice,
  MaterialIssue,
  Cylinder,
} from '../../types/erp.ts';
import { ERPDatabaseState } from '../../services/db.ts';
import { formatPKR, formatDate, formatNumber } from '../../utils/formatters.ts';
import { StatCard } from '../common/StatCard.tsx';
import { Badge } from '../common/Badge.tsx';
import { ActiveTab } from '../layout/Navbar.tsx';
import {
  ShoppingCart,
  Factory,
  Boxes,
  Percent,
  Truck,
  DollarSign,
  AlertTriangle,
  ArrowRight,
  Plus,
  Play,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  Disc,
} from 'lucide-react';

interface DashboardOverviewProps {
  state: ERPDatabaseState;
  setActiveTab: (tab: ActiveTab) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({ state, setActiveTab }) => {
  const lowStockCount = state.items.filter((i: Item) => i.current_stock <= i.reorder_level).length;

  const totalStockVal = state.items.reduce(
    (acc: number, i: Item) => acc + Math.max(0, i.current_stock) * i.standard_cost,
    0
  );

  const openOrdersCount = state.sales_orders.filter(
    (o: SalesOrder) => o.status !== 'closed' && o.status !== 'dispatched'
  ).length;

  const inProductionWoCount = state.work_orders.filter((w: WorkOrder) => w.status === 'in_production').length;

  const totalGoodProducedKg = state.production_runs.reduce((acc: number, r: ProductionRun) => acc + r.qty_produced, 0);
  const totalWastageKg = state.production_runs.reduce((acc: number, r: ProductionRun) => acc + r.wastage, 0);
  const overallWastagePct =
    totalGoodProducedKg + totalWastageKg > 0
      ? Math.round((totalWastageKg / (totalGoodProducedKg + totalWastageKg)) * 1000) / 10
      : 0;

  const unpaidInvoices = state.invoices.filter((inv: Invoice) => inv.payment_status !== 'paid');
  const receivables = unpaidInvoices.reduce(
    (acc: number, inv: Invoice) => acc + (inv.total_amount - (inv.amount_paid || 0)),
    0
  );

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white rounded-2xl shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Rotogravure Line 1 Active
            </span>
            <span className="text-xs text-slate-400">Shift A (08:00 - 16:00)</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white mt-1">
            Elite Packages Production Console
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Single-line rotogravure printing & converting ERP for flexible food packaging. Real-time order-to-cash workflow, atomic stock ledger, and cylinder tracking.
          </p>
        </div>

        {/* Quick Launch Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setActiveTab('sales')}
            className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Order</span>
          </button>
          <button
            onClick={() => setActiveTab('production')}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs border border-slate-700 transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Floor Work Orders</span>
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs shadow-xs transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Stock Ledger (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Open Order Intake"
          value={`${openOrdersCount} Orders`}
          subtext="Active pipeline in planning & press"
          icon={ShoppingCart}
          accentColor="indigo"
          onClick={() => setActiveTab('sales')}
        />
        <StatCard
          title="Floor Output (Produced)"
          value={`${formatNumber(totalGoodProducedKg, 0)} kg`}
          subtext={`Wastage: ${overallWastagePct}% (${formatNumber(totalWastageKg, 0)} kg)`}
          icon={Factory}
          accentColor="amber"
          onClick={() => setActiveTab('production')}
        />
        <StatCard
          title="On-Hand Inventory Value"
          value={formatPKR(totalStockVal)}
          subtext={
            lowStockCount > 0
              ? `⚠ ${lowStockCount} raw materials below reorder`
              : 'All materials at healthy stock levels'
          }
          icon={Boxes}
          accentColor={lowStockCount > 0 ? 'rose' : 'emerald'}
          onClick={() => setActiveTab('inventory')}
        />
        <StatCard
          title="Receivables Due"
          value={formatPKR(receivables)}
          subtext={`${unpaidInvoices.length} invoices awaiting remittance`}
          icon={DollarSign}
          accentColor="sky"
          onClick={() => setActiveTab('dispatch')}
        />
      </div>

      {/* Active Factory Work Orders & Cylinders */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Active Work Orders */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Factory className="w-4 h-4 text-amber-500" />
                Current Floor Work Orders
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Rotogravure jobs in schedule, material issue, and production
              </p>
            </div>
            <button
              onClick={() => setActiveTab('production')}
              className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {state.work_orders.slice(0, 4).map((wo: WorkOrder) => {
              const soItem = state.sales_order_items.find((i: SalesOrderItem) => i.id === wo.sales_order_item_id);
              const cylinder = state.cylinders.find((c: Cylinder) => c.id === wo.cylinder_id);
              const issues = state.material_issues.filter((m: MaterialIssue) => m.work_order_id === wo.id);

              return (
                <div key={wo.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-slate-900">
                        WO-{String(wo.id).padStart(4, '0')}
                      </span>
                      <Badge status={wo.status} />
                      {soItem?.requires_lamination && (
                        <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200">
                          Triplex Lamination
                        </span>
                      )}
                    </div>
                    <div className="font-bold text-xs text-slate-800 line-clamp-1">
                      {soItem?.product_spec}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-3">
                      <span>Cylinder: {cylinder?.design_ref}</span>
                      <span>Target: {formatNumber(soItem?.quantity_kg || 0, 0)} kg</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`text-xs font-bold block ${
                        issues.length > 0 ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      {issues.length > 0 ? `${issues.length} Materials Issued` : 'Material Needed'}
                    </span>
                    <button
                      onClick={() => setActiveTab('production')}
                      className="mt-1 text-[11px] font-bold text-slate-700 hover:text-slate-950 underline"
                    >
                      Open Job Card
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cylinder Status Panel */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Disc className="w-4 h-4 text-amber-500" />
              Cylinder Register
            </h3>
            <button
              onClick={() => setActiveTab('production')}
              className="text-xs font-bold text-amber-700 hover:text-amber-800"
            >
              Register
            </button>
          </div>

          <div className="space-y-3">
            {state.cylinders.slice(0, 4).map((cyl: Cylinder) => (
              <div
                key={cyl.id}
                className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-xs text-slate-900 truncate max-w-[170px]">
                    {cyl.design_ref}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {cyl.colors_count} Colors • {cyl.storage_location}
                  </div>
                </div>
                <Badge status={cyl.status} size="sm" />
              </div>
            ))}
          </div>

          {/* Machine Line Status */}
          <div className="pt-3 border-t border-slate-100">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Production Machinery Status
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 bg-emerald-50 text-emerald-900 rounded-md border border-emerald-200">
                <span className="font-bold">Rotomec 8-Color Gravure Press</span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-600 text-white px-2 py-0.5 rounded">
                  Running
                </span>
              </div>
              <div className="flex items-center justify-between p-2 bg-slate-100 text-slate-800 rounded-md border border-slate-200">
                <span className="font-semibold">Nordmeccanica Laminator</span>
                <span className="text-[10px] font-bold text-slate-500">Standby (Shift B)</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-slate-100 text-slate-800 rounded-md border border-slate-200">
                <span className="font-semibold">Titan Dual Turret Slitter</span>
                <span className="text-[10px] font-bold text-slate-500">Standby (Shift A)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
