// src/components/common/OfflineIndicator.tsx
import React, { useState } from 'react';
import { WifiOff, Database, ShieldCheck, HardDrive, X } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { dbService } from '../../services/db';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const [dismissed, setDismissed] = useState(false);
  const stats = dbService.getStorageStats();

  if (isOnline && dismissed) return null;

  if (!isOnline) {
    return (
      <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-xl bg-slate-900/95 border border-amber-500/50 px-4 py-2.5 text-xs shadow-2xl backdrop-blur-md text-amber-200 animate-in fade-in slide-in-from-bottom-3 duration-300">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
          <WifiOff className="h-4 w-4" />
        </div>
        <div>
          <div className="font-semibold text-white flex items-center gap-1.5">
            Offline Software Mode Active
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <p className="text-[11px] text-slate-300">
            Running standalone without internet. {stats.totalRecords} records secured in local storage.
          </p>
        </div>
        <div className="h-6 w-px bg-slate-700 mx-1" />
        <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Local Sync OK</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 hidden md:flex items-center gap-2.5 rounded-lg bg-slate-900/80 border border-slate-700/60 px-3 py-1.5 text-[11px] shadow-lg backdrop-blur-sm text-slate-300">
      <HardDrive className="h-3.5 w-3.5 text-cyan-400" />
      <span className="font-medium text-slate-200">Local Software Database:</span>
      <span className="font-mono text-emerald-400">{stats.totalRecords} records ({stats.estimatedSizeKb} KB)</span>
      <span className="text-slate-500">|</span>
      <span className="text-slate-400">Offline-Ready</span>
      <button
        onClick={() => setDismissed(true)}
        className="ml-1 text-slate-500 hover:text-slate-300 p-0.5 rounded"
        title="Dismiss indicator"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
};
