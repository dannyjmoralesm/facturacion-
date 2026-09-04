import React from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const OfflineIndicator: React.FC = () => {
  const { isOnline } = usePWAInstall();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-xl bg-amber-600 px-4 py-2.5 text-xs font-semibold text-white shadow-2xl shadow-amber-900/40 border border-amber-400/40 animate-pulse">
      <WifiOff className="w-4 h-4 shrink-0" />
      <div>
        <p className="font-bold">Modo Sin Conexión (Offline)</p>
        <p className="text-[11px] font-normal text-amber-100">Operando con caché local y base de datos interna persistente.</p>
      </div>
    </div>
  );
};
