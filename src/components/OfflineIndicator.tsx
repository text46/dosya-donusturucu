import React from 'react';
import { WifiOff, CheckCircle2 } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-40 max-w-sm w-[92%] animate-in slide-in-from-top-4 duration-200">
      <div className="flex items-center gap-2.5 rounded-xl bg-slate-900/90 text-white px-3.5 py-2.5 shadow-xl backdrop-blur-md border border-slate-700/60 text-xs">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
          <WifiOff className="w-3.5 h-3.5" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-emerald-400 flex items-center gap-1">
            Çevrimdışı Mod Aktif <CheckCircle2 className="w-3.5 h-3.5 inline" />
          </p>
          <p className="text-slate-300 text-[11px] leading-tight">
            İnternet bağlantısı yok, ancak tüm işlemler cihazınızda çalışmaya devam eder.
          </p>
        </div>
      </div>
    </div>
  );
};
