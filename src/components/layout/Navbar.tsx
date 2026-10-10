// src/components/layout/Navbar.tsx
import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  Factory,
  Truck,
  BarChart3,
  RotateCcw,
} from 'lucide-react';
import { RoleSwitcher } from './RoleSwitcher.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { dbService } from '../../services/db.ts';
import { PWAInstallButton } from '../common/PWAInstallButton.tsx';

export type ActiveTab = 'dashboard' | 'sales' | 'inventory' | 'production' | 'dispatch' | 'reports';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  lowStockCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, lowStockCount }) => {
  const { canAccess } = useAuth();

  const handleReset = () => {
    if (
      window.confirm(
        'Reset all ERP data to default rotogravure industry seed data? All custom entries will be restored to factory defaults.'
      )
    ) {
      dbService.resetToDefault();
    }
  };

  const navItems: Array<{
    id: ActiveTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    visible: boolean;
    badge?: number;
  }> = [
    {
      id: 'dashboard',
      label: 'Overview',
      icon: LayoutDashboard,
      visible: true,
    },
    {
      id: 'sales',
      label: 'Sales & CRM',
      icon: ShoppingCart,
      visible: canAccess('sales'),
    },
    {
      id: 'inventory',
      label: 'Store & Inventory',
      icon: Boxes,
      visible: canAccess('procurement'),
      badge: lowStockCount > 0 ? lowStockCount : undefined,
    },
    {
      id: 'production',
      label: 'Production & QC',
      icon: Factory,
      visible: canAccess('production'),
    },
    {
      id: 'dispatch',
      label: 'Dispatch & Billing',
      icon: Truck,
      visible: canAccess('dispatch'),
    },
    {
      id: 'reports',
      label: 'Reports & Costing',
      icon: BarChart3,
      visible: canAccess('reports'),
    },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40">
      {/* Top Banner with Brand & User Actions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-black text-xl tracking-tight">
              EP
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white">
                  Elite Packages
                </span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.5 rounded border border-amber-500/30 uppercase tracking-widest">
                  ERP
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                Make-to-Order Rotogravure Printing & Packaging (Pakistan)
              </p>
            </div>
          </div>

          {/* Right Action Tools */}
          <div className="flex items-center gap-3">
            {/* PWA / Desktop Install Action */}
            <PWAInstallButton variant="navbar" />

            {/* Reset Seed Button */}
            <button
              onClick={handleReset}
              title="Reset to initial factory sample data"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-xs transition-colors border border-slate-700/60"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Reset Seed Data</span>
            </button>

            {/* Role Switcher */}
            <RoleSwitcher />
          </div>
        </div>
      </div>

      {/* Navigation Sub-bar */}
      <div className="bg-slate-950 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 scrollbar-none">
            {navItems
              .filter((item) => item.visible)
              .map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                    {item.badge !== undefined && (
                      <span
                        className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                          isActive
                            ? 'bg-slate-950 text-amber-400'
                            : 'bg-rose-500 text-white'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
          </nav>
        </div>
      </div>
    </header>
  );
};
