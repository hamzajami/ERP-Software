// src/App.tsx
import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext.tsx';
import { dbService, ERPDatabaseState } from './services/db.ts';
import { Navbar, ActiveTab } from './components/layout/Navbar.tsx';
import { DashboardOverview } from './components/dashboard/DashboardOverview.tsx';
import { SalesModule } from './components/sales/SalesModule.tsx';
import { InventoryModule } from './components/inventory/InventoryModule.tsx';
import { ProductionModule } from './components/production/ProductionModule.tsx';
import { DispatchModule } from './components/dispatch/DispatchModule.tsx';
import { ReportsModule } from './components/reports/ReportsModule.tsx';

import { DesktopTitlebar } from './components/desktop/DesktopTitlebar.tsx';
import { PWAInstallButton } from './components/common/PWAInstallButton.tsx';
import { OfflineIndicator } from './components/common/OfflineIndicator.tsx';

function ERPApp() {
  const [dbState, setDbState] = useState<ERPDatabaseState>(dbService.getState());
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  useEffect(() => {
    // Subscribe to state changes in the persistent ERP database
    const unsubscribe = dbService.subscribe(() => {
      setDbState({ ...dbService.getState() });
    });
    return () => unsubscribe();
  }, []);

  const lowStockCount = dbState.items.filter((i) => i.current_stock <= i.reorder_level).length;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Desktop Software Window Chrome & Menu */}
      <DesktopTitlebar
        onNavigate={(tab) => setActiveTab(tab as ActiveTab)}
        onRefreshData={() => setDbState({ ...dbService.getState() })}
      />

      {/* Desktop Install Banner (auto-hides when running standalone) */}
      <PWAInstallButton variant="banner" />

      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        lowStockCount={lowStockCount}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardOverview state={dbState} setActiveTab={setActiveTab} />
        )}

        {activeTab === 'sales' && (
          <SalesModule
            customers={dbState.customers}
            salesOrders={dbState.sales_orders}
            salesOrderItems={dbState.sales_order_items}
            cylinders={dbState.cylinders}
            onOpenWorkOrderTab={() => setActiveTab('production')}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryModule
            items={dbState.items}
            suppliers={dbState.suppliers}
            purchaseOrders={dbState.purchase_orders}
            purchaseOrderItems={dbState.purchase_order_items}
            stockLedger={dbState.stock_ledger}
          />
        )}

        {activeTab === 'production' && (
          <ProductionModule
            workOrders={dbState.work_orders}
            cylinders={dbState.cylinders}
            machineShifts={dbState.machine_shifts}
            productionRuns={dbState.production_runs}
            qcInspections={dbState.qc_inspections}
            materialIssues={dbState.material_issues}
            items={dbState.items}
            salesOrderItems={dbState.sales_order_items}
            customers={dbState.customers}
          />
        )}

        {activeTab === 'dispatch' && (
          <DispatchModule
            dispatchNotes={dbState.dispatch_notes}
            invoices={dbState.invoices}
            workOrders={dbState.work_orders}
            salesOrderItems={dbState.sales_order_items}
            salesOrders={dbState.sales_orders}
            customers={dbState.customers}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsModule
            items={dbState.items}
            workOrders={dbState.work_orders}
            salesOrders={dbState.sales_orders}
            salesOrderItems={dbState.sales_order_items}
            customers={dbState.customers}
            invoices={dbState.invoices}
            productionRuns={dbState.production_runs}
            materialIssues={dbState.material_issues}
          />
        )}
      </main>

      {/* Industrial Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-900">Elite Packages (Pvt) Ltd</span>
            <span>• Single-Line Rotogravure Converting ERP</span>
          </div>
          <div className="flex items-center gap-3 text-slate-400">
            <span>Karachi / Sundar Industrial Estate Lahore</span>
            <span>• FBR Tax Compliant</span>
            <span>• Schema Ready for Line 2 & Multi-Shift Expansion</span>
          </div>
        </div>
      </footer>

      {/* Offline Status & Local Storage Indicator */}
      <OfflineIndicator />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ERPApp />
    </AuthProvider>
  );
}
