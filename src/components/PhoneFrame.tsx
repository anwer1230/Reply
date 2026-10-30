import React from 'react';
import { Wifi, Battery, Signal, ArrowRight, RotateCcw } from 'lucide-react';

interface PhoneFrameProps {
  children: React.ReactNode;
  activeScreenTitle?: string;
  onRestart?: () => void;
}

export const PhoneFrame: React.FC<PhoneFrameProps> = ({ children, onRestart }) => {
  // Current time formatted HH:MM
  const timeString = new Date().toLocaleTimeString('ar-SA', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return (
    <div className="relative mx-auto w-full max-w-[400px] h-[780px] bg-slate-950 rounded-[44px] p-3 shadow-2xl shadow-emerald-950/40 border-[6px] border-slate-700/80 ring-1 ring-slate-800 flex flex-col overflow-hidden">
      {/* Speaker and Front Camera notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-6 bg-slate-900 rounded-b-2xl z-50 flex items-center justify-center gap-2">
        <div className="w-10 h-1 bg-slate-700 rounded-full"></div>
        <div className="w-2.5 h-2.5 bg-slate-800 border border-slate-700 rounded-full"></div>
      </div>

      {/* Screen container */}
      <div className="relative flex-1 bg-slate-900 text-slate-100 rounded-[32px] overflow-hidden flex flex-col border border-slate-800">
        {/* Android Status Bar (#00695C theme) */}
        <div className="h-8 bg-[#00695C] px-5 flex items-center justify-between text-xs text-white/95 font-medium select-none z-40">
          <span className="font-mono tracking-wider">{timeString}</span>
          <div className="flex items-center gap-2">
            {onRestart && (
              <button
                onClick={onRestart}
                title="إعادة تشغيل التطبيق في المحاكي"
                className="opacity-70 hover:opacity-100 transition-opacity p-0.5"
              >
                <RotateCcw className="w-3 h-3 text-emerald-200" />
              </button>
            )}
            <Signal className="w-3.5 h-3.5" />
            <Wifi className="w-3.5 h-3.5" />
            <div className="flex items-center gap-0.5">
              <span className="text-[10px]">98%</span>
              <Battery className="w-4 h-4 fill-white" />
            </div>
          </div>
        </div>

        {/* Dynamic Screen Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden relative flex flex-col bg-slate-900">
          {children}
        </div>

        {/* Android Navigation Pill */}
        <div className="h-5 bg-slate-950 flex items-center justify-center select-none">
          <div className="w-32 h-1 bg-slate-600 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};
