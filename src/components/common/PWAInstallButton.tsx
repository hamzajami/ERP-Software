// src/components/common/PWAInstallButton.tsx
import React, { useState } from 'react';
import {
  Download,
  Monitor,
  CheckCircle,
  Laptop,
  HelpCircle,
  ExternalLink,
  HardDrive,
  Cpu,
  Layers,
  Sparkles,
  X
} from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Modal } from './Modal';

interface PWAInstallButtonProps {
  variant?: 'navbar' | 'banner' | 'menu';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ variant = 'navbar' }) => {
  const { isInstallable, isInstalled, isStandalone, isIOS, install } = usePWAInstall();
  const [showDesktopGuide, setShowDesktopGuide] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (success) {
        setInstallSuccess(true);
      }
    } else {
      setShowDesktopGuide(true);
    }
  };

  // If already running in standalone desktop app mode
  if (isStandalone) {
    if (variant === 'menu') {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-emerald-400 bg-emerald-950/40 rounded border border-emerald-800/40">
          <CheckCircle className="h-3.5 w-3.5" />
          <span>Desktop Software Active</span>
        </div>
      );
    }
    return (
      <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
        <Monitor className="h-3.5 w-3.5" />
        <span>Desktop Standalone</span>
      </div>
    );
  }

  return (
    <>
      {variant === 'navbar' && (
        <button
          onClick={handleInstallClick}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-semibold text-xs shadow-sm hover:shadow transition-all duration-150 active:scale-95"
          title="Install Elite Packages ERP as a standalone Desktop Software"
        >
          <Laptop className="h-3.5 w-3.5" />
          <span>Install Desktop App</span>
        </button>
      )}

      {variant === 'banner' && (
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white px-4 py-2 border-b border-amber-500/30 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-amber-500/20 rounded-lg text-amber-400">
              <Laptop className="h-4 w-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wide mr-2">Desktop Software:</span>
              <span className="text-xs text-slate-300">
                Install as a dedicated desktop program for instant launch, offline factory floor access, and zero internet dependency.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-1.5 px-3 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow transition"
            >
              <Download className="h-3 w-3" />
              <span>Install to PC</span>
            </button>
            <button
              onClick={() => setShowDesktopGuide(true)}
              className="text-slate-400 hover:text-white p-1"
              title="Desktop Installation Instructions"
            >
              <HelpCircle className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {variant === 'menu' && (
        <button
          onClick={handleInstallClick}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-amber-300 hover:bg-slate-800 rounded transition text-left"
        >
          <Laptop className="h-4 w-4 text-amber-400" />
          <div>
            <div className="font-semibold text-white">Install as Desktop App</div>
            <div className="text-[10px] text-slate-400">Run offline on Windows / macOS / Linux</div>
          </div>
        </button>
      )}

      {/* Desktop Installation Guide Modal */}
      <Modal
        isOpen={showDesktopGuide}
        onClose={() => setShowDesktopGuide(false)}
        title="Install Elite Packages ERP as Desktop Software"
        maxWidth="lg"
      >
        <div className="space-y-6">
          <div className="rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700 p-5 text-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <Laptop className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-base text-white">Dedicated Desktop Software Experience</h4>
                <p className="text-xs text-slate-400">Run fully offline on factory workstations, dispatch counters, and plant supervisor PCs</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs mt-4">
              <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                <div className="text-amber-400 font-semibold mb-1 flex items-center gap-1.5">
                  <Cpu className="h-3.5 w-3.5" /> 100% Offline
                </div>
                <p className="text-slate-400 text-[11px]">Works seamlessly without internet access. Data is cached locally.</p>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                <div className="text-cyan-400 font-semibold mb-1 flex items-center gap-1.5">
                  <HardDrive className="h-3.5 w-3.5" /> Local Database
                </div>
                <p className="text-slate-400 text-[11px]">ACID stock ledger, orders, and QC logs stored on your device.</p>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                <div className="text-emerald-400 font-semibold mb-1 flex items-center gap-1.5">
                  <Monitor className="h-3.5 w-3.5" /> Native Window
                </div>
                <p className="text-slate-400 text-[11px]">No browser address bar or tabs. Launches directly from desktop icon.</p>
              </div>
            </div>
          </div>

          {/* Quick Install Action if browser supports beforeinstallprompt */}
          {isInstallable && (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 flex items-center justify-between">
              <div>
                <div className="font-semibold text-amber-900 dark:text-amber-200 text-sm">One-Click Direct Install Ready</div>
                <p className="text-xs text-amber-700 dark:text-amber-300">Your browser supports direct desktop app installation.</p>
              </div>
              <button
                onClick={async () => {
                  const res = await install();
                  if (res) setShowDesktopGuide(false);
                }}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs shadow-sm flex items-center gap-2"
              >
                <Download className="h-3.5 w-3.5" />
                Install Now
              </button>
            </div>
          )}

          {/* Platform Step-by-Step Instructions */}
          <div className="space-y-4">
            <h5 className="font-semibold text-slate-900 dark:text-white text-xs uppercase tracking-wider text-slate-500">
              Manual Installation Steps by Operating System
            </h5>

            {/* Windows 10/11 & Chrome / Edge */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 text-xs space-y-2">
              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-[11px]">Windows / Google Chrome</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-300 pl-1 text-[11px]">
                <li>Look at the right side of the address bar at the top of your browser.</li>
                <li>Click the <strong>Install icon</strong> (computer with a down arrow).</li>
                <li>Click <strong>Install</strong> when prompted. A desktop shortcut and Start Menu entry will be created.</li>
              </ol>
            </div>

            {/* Windows Edge */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 text-xs space-y-2">
              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-cyan-100 dark:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300 text-[11px]">Windows / Microsoft Edge</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-300 pl-1 text-[11px]">
                <li>Click the <strong>Settings & more (...)</strong> menu button in the top right.</li>
                <li>Hover over <strong>Apps</strong> and select <strong>Install this site as an app</strong>.</li>
                <li>Name it <strong>Elite Packages ERP</strong> and select <em>Pin to taskbar</em> or <em>Desktop shortcut</em>.</li>
              </ol>
            </div>

            {/* macOS Safari / Chrome */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 text-xs space-y-2">
              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-[11px]">macOS (Sonoma & newer)</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-300 pl-1 text-[11px]">
                <li>In Safari, click <strong>File</strong> in the top menu bar.</li>
                <li>Select <strong>Add to Dock...</strong>.</li>
                <li>Click <strong>Add</strong> to create an app in your Applications folder and Dock.</li>
              </ol>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
            <button
              onClick={() => setShowDesktopGuide(false)}
              className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};
