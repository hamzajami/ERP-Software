// src/components/desktop/DesktopTitlebar.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  Monitor,
  Maximize2,
  Minimize2,
  HardDrive,
  Download,
  Upload,
  RefreshCw,
  Keyboard,
  ShieldCheck,
  Wifi,
  WifiOff,
  HelpCircle,
  FileSpreadsheet,
  Settings,
  ChevronDown,
  Info,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { dbService } from '../../services/db';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Modal } from '../common/Modal';

interface DesktopTitlebarProps {
  onNavigate: (module: string) => void;
  onRefreshData?: () => void;
}

export const DesktopTitlebar: React.FC<DesktopTitlebarProps> = ({ onNavigate, onRefreshData }) => {
  const isOnline = useOnlineStatus();
  const { isStandalone, isInstallable, install } = usePWAInstall();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [restoreJson, setRestoreJson] = useState('');
  const [restoreFeedback, setRestoreFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const stats = dbService.getStorageStats();

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    // Global keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowShortcuts(true);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        // Prevent default browser save page
        e.preventDefault();
        handleExportBackup();
      }
      if (e.key === 'F11') {
        e.preventDefault();
        toggleFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Click outside to close menus
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleExportBackup = () => {
    const dataStr = dbService.exportDatabaseJSON();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `elite-packages-erp-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setNotification('Database backup successfully exported to JSON file.');
    setTimeout(() => setNotification(null), 4000);
    setActiveMenu(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setRestoreJson(content);
      setShowRestoreModal(true);
    };
    reader.readAsText(file);
    e.target.value = '';
    setActiveMenu(null);
  };

  const handleExecuteRestore = () => {
    if (!restoreJson.trim()) return;
    const res = dbService.importDatabaseJSON(restoreJson);
    setRestoreFeedback(res);
    if (res.success) {
      if (onRefreshData) onRefreshData();
      setTimeout(() => {
        setShowRestoreModal(false);
        setRestoreFeedback(null);
        setRestoreJson('');
      }, 1500);
    }
  };

  const handleResetFactory = () => {
    if (window.confirm('Reset local database to factory default demonstration data? All newly added orders/records will be reset.')) {
      dbService.resetToFactoryDefaults();
      if (onRefreshData) onRefreshData();
      setNotification('Database reset to factory demonstration defaults.');
      setTimeout(() => setNotification(null), 3000);
      setActiveMenu(null);
    }
  };

  return (
    <div className="bg-slate-950 border-b border-slate-800 text-slate-200 select-none text-xs">
      {/* Upper Desktop Window Bar */}
      <div className="flex items-center justify-between px-3 py-1 bg-slate-900/90 border-b border-slate-800/80">
        {/* Left: Desktop Window Title */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 font-bold tracking-tight text-white">
            <div className="h-5 w-5 rounded bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-slate-950 font-black text-[11px] shadow-sm">
              EP
            </div>
            <span>Elite Packages ERP</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono border border-amber-500/30">
              Desktop Edition v1.2
            </span>
          </div>

          <span className="text-slate-600">|</span>

          {/* Plant identifier */}
          <span className="hidden md:inline text-slate-400 text-[11px]">
            Unit 1: 8-Color Gravure Press Line, Lahore PK
          </span>
        </div>

        {/* Center: Offline & Database Health Badge */}
        <div className="hidden lg:flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-[11px]">
            {isOnline ? (
              <>
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className="text-slate-300">Online &amp; Cached</span>
              </>
            ) : (
              <>
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-amber-300 font-medium">Standalone Offline</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-mono">
            <HardDrive className="h-3 w-3 text-cyan-400" />
            <span>Local DB: {stats.totalRecords} records</span>
          </div>
        </div>

        {/* Right: Window Controls & Quick Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowShortcuts(true)}
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
            title="Keyboard Shortcuts (Ctrl+K)"
          >
            <Keyboard className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
            title={isFullscreen ? 'Exit Fullscreen (F11)' : 'Desktop Fullscreen (F11)'}
          >
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>

          {isStandalone && (
            <div className="ml-1 px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-700/50 text-emerald-400 text-[10px] font-mono flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" />
              <span>STANDALONE</span>
            </div>
          )}
        </div>
      </div>

      {/* Lower Desktop ERP Menu Strip (File, Operations, Tools, Database, Help) */}
      <div ref={menuRef} className="flex items-center justify-between px-2 py-0.5 bg-slate-950">
        <div className="flex items-center space-x-1">
          {/* File Menu */}
          <div className="relative">
            <button
              onClick={() => setActiveMenu(activeMenu === 'file' ? null : 'file')}
              className={`px-2.5 py-1 rounded text-xs transition ${
                activeMenu === 'file' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-300 hover:bg-slate-800/60'
              }`}
            >
              File
            </button>
            {activeMenu === 'file' && (
              <div className="absolute left-0 mt-1 w-56 rounded-md bg-slate-900 border border-slate-700 shadow-2xl py-1 z-50">
                <button
                  onClick={() => {
                    onNavigate('sales');
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-800 flex items-center justify-between text-slate-200 hover:text-white"
                >
                  <span>New Sales Order</span>
                  <span className="text-[10px] text-slate-500 font-mono">Alt+N</span>
                </button>
                <div className="my-1 border-t border-slate-800" />
                <button
                  onClick={handleExportBackup}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-800 flex items-center justify-between text-slate-200 hover:text-white"
                >
                  <span className="flex items-center gap-2">
                    <Download className="h-3.5 w-3.5 text-cyan-400" /> Export Database (.json)
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">Ctrl+S</span>
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-800 flex items-center gap-2 text-slate-200 hover:text-white"
                >
                  <Upload className="h-3.5 w-3.5 text-amber-400" /> Restore Database (.json)
                </button>
                <div className="my-1 border-t border-slate-800" />
                <button
                  onClick={handleResetFactory}
                  className="w-full text-left px-3 py-1.5 hover:bg-red-950/60 text-red-400 hover:text-red-300 flex items-center gap-2"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Reset to Factory Seed
                </button>
                <div className="my-1 border-t border-slate-800" />
                <button
                  onClick={() => window.location.reload()}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  Reload Software Window
                </button>
              </div>
            )}
          </div>

          {/* Operations Menu */}
          <div className="relative">
            <button
              onClick={() => setActiveMenu(activeMenu === 'ops' ? null : 'ops')}
              className={`px-2.5 py-1 rounded text-xs transition ${
                activeMenu === 'ops' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-300 hover:bg-slate-800/60'
              }`}
            >
              Operations
            </button>
            {activeMenu === 'ops' && (
              <div className="absolute left-0 mt-1 w-56 rounded-md bg-slate-900 border border-slate-700 shadow-2xl py-1 z-50">
                <button
                  onClick={() => {
                    onNavigate('production');
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-200 hover:text-white"
                >
                  Work Orders &amp; Cylinders
                </button>
                <button
                  onClick={() => {
                    onNavigate('inventory');
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-200 hover:text-white"
                >
                  Store &amp; Stock Ledger
                </button>
                <button
                  onClick={() => {
                    onNavigate('production');
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-200 hover:text-white"
                >
                  Machine Shifts &amp; QC Logs
                </button>
                <button
                  onClick={() => {
                    onNavigate('dispatch');
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-200 hover:text-white"
                >
                  Dispatch &amp; Commercial Invoices
                </button>
              </div>
            )}
          </div>

          {/* Tools Menu */}
          <div className="relative">
            <button
              onClick={() => setActiveMenu(activeMenu === 'tools' ? null : 'tools')}
              className={`px-2.5 py-1 rounded text-xs transition ${
                activeMenu === 'tools' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-300 hover:bg-slate-800/60'
              }`}
            >
              Tools
            </button>
            {activeMenu === 'tools' && (
              <div className="absolute left-0 mt-1 w-60 rounded-md bg-slate-900 border border-slate-700 shadow-2xl py-1 z-50">
                <button
                  onClick={() => {
                    onNavigate('inventory');
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-800 flex items-center gap-2 text-slate-200 hover:text-white"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Stock Ledger Excel (.xlsx)</span>
                </button>
                <button
                  onClick={() => {
                    onNavigate('reports');
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-200 hover:text-white"
                >
                  Stock Valuation (FIFO / Avg)
                </button>
                <div className="my-1 border-t border-slate-800" />
                <button
                  onClick={() => {
                    toggleFullscreen();
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-800 flex items-center justify-between text-slate-200 hover:text-white"
                >
                  <span>Toggle Fullscreen</span>
                  <span className="text-[10px] text-slate-500 font-mono">F11</span>
                </button>
                <button
                  onClick={() => {
                    setShowShortcuts(true);
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-800 flex items-center justify-between text-slate-200 hover:text-white"
                >
                  <span>Keyboard Shortcuts</span>
                  <span className="text-[10px] text-slate-500 font-mono">Ctrl+K</span>
                </button>
              </div>
            )}
          </div>

          {/* Database Menu */}
          <div className="relative">
            <button
              onClick={() => setActiveMenu(activeMenu === 'db' ? null : 'db')}
              className={`px-2.5 py-1 rounded text-xs transition ${
                activeMenu === 'db' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-300 hover:bg-slate-800/60'
              }`}
            >
              Database
            </button>
            {activeMenu === 'db' && (
              <div className="absolute left-0 mt-1 w-64 rounded-md bg-slate-900 border border-slate-700 shadow-2xl py-2 z-50 px-3 text-slate-300">
                <div className="text-[11px] font-semibold text-white mb-1.5 flex items-center justify-between">
                  <span>Local Storage State</span>
                  <span className="text-emerald-400 font-mono text-[10px]">ACID OK</span>
                </div>
                <div className="space-y-1 text-[11px] text-slate-400 bg-slate-950 p-2 rounded border border-slate-800">
                  <div className="flex justify-between">
                    <span>Total Database Rows:</span>
                    <span className="text-white font-mono">{stats.totalRecords}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estimated Footprint:</span>
                    <span className="text-cyan-400 font-mono">{stats.estimatedSizeKb} KB</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last State Sync:</span>
                    <span className="text-slate-400 font-mono text-[10px]">{stats.lastSaved}</span>
                  </div>
                </div>

                <div className="mt-2.5 space-y-1">
                  <button
                    onClick={handleExportBackup}
                    className="w-full py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-center block font-medium"
                  >
                    Download JSON Backup
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-1 text-xs rounded bg-slate-800 hover:bg-slate-700 text-amber-300 text-center block font-medium"
                  >
                    Restore from JSON File
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Help Menu */}
          <div className="relative">
            <button
              onClick={() => setActiveMenu(activeMenu === 'help' ? null : 'help')}
              className={`px-2.5 py-1 rounded text-xs transition ${
                activeMenu === 'help' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-300 hover:bg-slate-800/60'
              }`}
            >
              Help
            </button>
            {activeMenu === 'help' && (
              <div className="absolute left-0 mt-1 w-52 rounded-md bg-slate-900 border border-slate-700 shadow-2xl py-1 z-50">
                <button
                  onClick={() => {
                    setShowAboutModal(true);
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-200 hover:text-white flex items-center gap-2"
                >
                  <Info className="h-3.5 w-3.5 text-blue-400" />
                  <span>About Desktop ERP</span>
                </button>
                <button
                  onClick={() => {
                    setShowShortcuts(true);
                    setActiveMenu(null);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-slate-200 hover:text-white flex items-center gap-2"
                >
                  <Keyboard className="h-3.5 w-3.5 text-amber-400" />
                  <span>Shortcuts Cheatsheet</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Info */}
        <div className="text-[11px] text-slate-500 font-mono hidden sm:flex items-center gap-2 pr-2">
          <span>Make-to-Order Rotogravure</span>
          <span className="text-slate-700">•</span>
          <span className="text-emerald-500/90">Single-Line Engine</span>
        </div>
      </div>

      {/* Hidden File Input for JSON restore */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept=".json"
        className="hidden"
      />

      {/* Floating Notification */}
      {notification && (
        <div className="fixed top-12 right-4 z-50 rounded-lg bg-slate-900 border border-emerald-500 text-white px-4 py-2 text-xs shadow-2xl flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Keyboard Shortcuts Modal */}
      <Modal
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
        title="Desktop ERP Keyboard Shortcuts"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600 dark:text-slate-400 text-xs">
            Quick enterprise hotkeys designed for fast factory floor data entry and window management:
          </p>

          <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
            <div className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-900">
              <span className="font-medium text-slate-700 dark:text-slate-300">Open Keyboard Shortcuts</span>
              <kbd className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-200 font-mono text-[11px] border border-slate-300 dark:border-slate-700">Ctrl + K</kbd>
            </div>
            <div className="flex justify-between items-center p-2.5">
              <span className="font-medium text-slate-700 dark:text-slate-300">Export Local Database Backup</span>
              <kbd className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-200 font-mono text-[11px] border border-slate-300 dark:border-slate-700">Ctrl + S</kbd>
            </div>
            <div className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-900">
              <span className="font-medium text-slate-700 dark:text-slate-300">Toggle Fullscreen Desktop Mode</span>
              <kbd className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-200 font-mono text-[11px] border border-slate-300 dark:border-slate-700">F11</kbd>
            </div>
            <div className="flex justify-between items-center p-2.5">
              <span className="font-medium text-slate-700 dark:text-slate-300">Print Delivery Challan / Invoice</span>
              <kbd className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-200 font-mono text-[11px] border border-slate-300 dark:border-slate-700">Ctrl + P</kbd>
            </div>
            <div className="flex justify-between items-center p-2.5 bg-slate-50 dark:bg-slate-900">
              <span className="font-medium text-slate-700 dark:text-slate-300">Close Active Modal Dialog</span>
              <kbd className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-200 font-mono text-[11px] border border-slate-300 dark:border-slate-700">Esc</kbd>
            </div>
          </div>
        </div>
      </Modal>

      {/* Restore Database Confirmation Modal */}
      <Modal
        isOpen={showRestoreModal}
        onClose={() => {
          setShowRestoreModal(false);
          setRestoreFeedback(null);
          setRestoreJson('');
        }}
        title="Restore Database from Backup"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
            <div>
              <div className="font-semibold text-amber-200">Overwrite Existing Local Records</div>
              <p className="text-[11px] text-amber-300/90 mt-0.5">
                Restoring will replace the active local ledger, orders, and production records with the imported file state.
              </p>
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">Backup JSON Payload Preview:</label>
            <textarea
              value={restoreJson}
              onChange={(e) => setRestoreJson(e.target.value)}
              rows={8}
              className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 focus:outline-none focus:border-amber-500"
              placeholder="Paste JSON backup content here..."
            />
          </div>

          {restoreFeedback && (
            <div
              className={`p-2.5 rounded-lg text-xs ${
                restoreFeedback.success
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-red-500/20 text-red-300 border border-red-500/30'
              }`}
            >
              {restoreFeedback.message}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => {
                setShowRestoreModal(false);
                setRestoreFeedback(null);
              }}
              className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
            >
              Cancel
            </button>
            <button
              onClick={handleExecuteRestore}
              className="px-4 py-1.5 rounded bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs"
            >
              Confirm Restore
            </button>
          </div>
        </div>
      </Modal>

      {/* About ERP Modal */}
      <Modal
        isOpen={showAboutModal}
        onClose={() => setShowAboutModal(false)}
        title="About Elite Packages ERP - Desktop Edition"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs text-slate-300">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-900 border border-slate-800">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg">
              EP
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">Elite Packages ERP</h4>
              <p className="text-slate-400 text-xs">Rotogravure Printing &amp; Converting Management Software</p>
              <p className="text-[10px] text-amber-400 font-mono mt-0.5">Version 1.2.0 Desktop Standalone</p>
            </div>
          </div>

          <div className="space-y-2 text-slate-400 leading-relaxed text-[11px]">
            <p>
              Engineered specifically for single-line make-to-order rotogravure printing packaging plants (Elite Packages, Pakistan), with an extensible architecture designed for future multi-line and multi-shift expansion.
            </p>
            <p>
              Includes complete Order-to-Cash lifecycle: Sales CRM, Cylinder registers, Material issue reconciliation, Machine shift logs, multi-stage production (Printing, Lamination, Slitting), Quality Control rework loops, Delivery Challans, Sales Tax Invoices, and Excel Stock Ledger generation.
            </p>
          </div>

          <div className="border-t border-slate-800 pt-3 flex justify-between text-[11px] text-slate-500">
            <span>License: Enterprise Production</span>
            <span>Offline-First Storage Engine</span>
          </div>
        </div>
      </Modal>
    </div>
  );
};
