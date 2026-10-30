import React, { useState, useEffect } from 'react';
import { Smartphone, CheckCircle2, Sparkles, X, Shield, ArrowDownToLine, Zap } from 'lucide-react';
import { InstallProgressModal } from './InstallProgressModal';

export const InstallAppBanner: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if previously installed or running in standalone mode
    const installed =
      localStorage.getItem('autoreply_app_installed') === 'true' ||
      window.matchMedia('(display-mode: standalone)').matches;
    setIsInstalled(installed);

    // Capture browser beforeinstallprompt
    const handlePrompt = (e: Event) => {
      e.preventDefault();
      (window as unknown as { deferredPWAInstallPrompt?: Event }).deferredPWAInstallPrompt = e;
    };
    window.addEventListener('beforeinstallprompt', handlePrompt);
    return () => window.removeEventListener('beforeinstallprompt', handlePrompt);
  }, []);

  if (isDismissed) return null;

  return (
    <>
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border-b border-emerald-500/40 px-3 sm:px-4 py-2.5 shadow-lg relative z-30">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* App Info Box */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#00695C] to-emerald-400 p-0.5 shadow-md shadow-emerald-950/60 shrink-0">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-emerald-400" />
                </div>
              </div>
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xs sm:text-sm font-black text-white leading-tight">
                  تطبيق الرد التلقائي الذكي (AutoReply)
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  {isInstalled ? '✅ مثبت ومفعّل على جهازك' : 'جاهز للتثبيت الفعلي الآن'}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                قراءة الإشعارات والرد التلقائي المباشر • يدعم كل نسخ واتساب وتيليجرام • يعمل بدون إنترنت أو خادم
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 active:scale-95 text-slate-950 hover:text-black font-black rounded-xl text-xs shadow-lg shadow-emerald-950/60 transition-all flex items-center justify-center gap-2 cursor-pointer flex-1 sm:flex-initial"
            >
              {isInstalled ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-slate-950" />
                  <span>إعادة تثبيت / تحديث التطبيق</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-slate-950" />
                  <span>تثبيت التطبيق الآن</span>
                </>
              )}
            </button>

            <button
              onClick={() => setIsDismissed(true)}
              className="w-7 h-7 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
              title="إخفاء الإشعار"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <InstallProgressModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onInstalledSuccess={() => {
          setIsInstalled(true);
        }}
      />
    </>
  );
};
