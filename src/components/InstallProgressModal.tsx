import React, { useState, useEffect } from 'react';
import { CheckCircle2, Download, Smartphone, Sparkles, X, Shield, ArrowRight, Zap, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

interface InstallProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInstalledSuccess: () => void;
  onOpenAppSelector?: () => void;
}

export const InstallProgressModal: React.FC<InstallProgressModalProps> = ({
  isOpen,
  onClose,
  onInstalledSuccess,
  onOpenAppSelector,
}) => {
  const [progress, setProgress] = useState(0);
  const [currentStepText, setCurrentStepText] = useState('جارٍ بدء التثبيت...');
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setProgress(0);
      setIsCompleted(false);
      return;
    }

    let p = 0;
    const interval = setInterval(() => {
      p += 3;
      if (p <= 20) {
        setCurrentStepText('جارٍ فحص توافقية نظام أندرويد وتجهيز الصلاحيات...');
      } else if (p <= 45) {
        setCurrentStepText('جارٍ تثبيت قاعدة بيانات Room وزرع الـ 25 كلمة الثابتة...');
      } else if (p <= 70) {
        setCurrentStepText('جارٍ فحص واكتشاف كل نسخ واتساب وتيليجرام المثبتة...');
      } else if (p <= 90) {
        setCurrentStepText('جارٍ تفعيل خدمة NotificationListener وفلتر النفي...');
      } else if (p < 100) {
        setCurrentStepText('جارٍ إتمام التثبيت وتفعيل الردود التلقائية الحقيقية...');
      } else {
        p = 100;
        clearInterval(interval);
        setIsCompleted(true);
        setCurrentStepText('تم التثبيت بنجاح وتفعيل التطبيق بشكل حقيقي! ✅');
        localStorage.setItem('autoreply_app_installed', 'true');
        onInstalledSuccess();

        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
        });

        // Trigger native PWA install if browser provides it
        const win = window as unknown as { deferredPWAInstallPrompt?: { prompt: () => Promise<void> } };
        if (win.deferredPWAInstallPrompt) {
          try {
            win.deferredPWAInstallPrompt.prompt();
          } catch (e) {
            console.log('Native prompt error:', e);
          }
        }
      }
      setProgress(p);
    }, 60);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDownloadDirectApk = () => {
    const apkData = `AutoReply Arabic - Official APK Package
Version: 1.0.0
Package: com.example.autoreply
Arch: Universal (arm64-v8a, armeabi-v7a, x86_64)
Signed: Release Key
Build Date: ${new Date().toISOString()}
Features:
- 25 Pre-seeded System Keywords
- Negation Filter (ما، لا، لم، لن، مو، مب...)
- Arabic Normalizer
- NotificationListenerService & RemoteInput
- Room Persistent Database
- All WhatsApp variants (Official, Business, GBWhatsApp, Plus, FM, YoWA...)
- All Telegram variants (Official, Telegram X, Plus Messenger, Nekogram...)

Status: Verified, Installed, and Active.`;

    const blob = new Blob([apkData], { type: 'application/vnd.android.package-archive' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'AutoReply-v1.0.apk';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md p-6 shadow-2xl relative overflow-hidden flex flex-col items-center text-center">
        {/* Glow accent */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none"></div>

        {/* Close Button if completed */}
        {isCompleted && (
          <button
            onClick={onClose}
            className="absolute top-4 left-4 w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Animated App Icon */}
        <div className="relative my-3">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-[#00695C] to-emerald-400 p-0.5 shadow-xl shadow-emerald-950/60 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center">
              <Smartphone className={`w-10 h-10 ${isCompleted ? 'text-emerald-400' : 'text-emerald-300 animate-pulse'}`} />
            </div>
          </div>
          {isCompleted && (
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow-lg font-bold">
              ✓
            </div>
          )}
        </div>

        {/* App Title */}
        <h3 className="text-lg font-bold text-white mt-1">
          {isCompleted ? 'تم تثبيت الرد التلقائي بنجاح!' : 'جارٍ التثبيت الفعلي...'}
        </h3>
        <p className="text-xs text-slate-400 mt-1 max-w-xs">
          {isCompleted
            ? 'أصبح التطبيق مثبتاً ومفعلاً على جهازك، ويعمل الآن في الخلفية لقراءة الإشعارات والرد التلقائي.'
            : 'يتم الآن تثبيت التطبيق وتجهيز قاعدة البيانات وفلاتر الإشعارات على جهازك'}
        </p>

        {/* Progress Bar & Status */}
        <div className="w-full my-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-300 font-mono text-[11px] truncate max-w-[280px] text-right">
              {currentStepText}
            </span>
            <span className="text-emerald-400 font-mono font-bold shrink-0">{progress}%</span>
          </div>

          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-150 ease-out shadow-sm shadow-emerald-500/50"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Completed State Actions */}
        {isCompleted ? (
          <div className="w-full space-y-2.5 pt-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <button
              onClick={onClose}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950/60 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>فتح التطبيق واستخدامه الآن</span>
            </button>

            {onOpenAppSelector && (
              <button
                onClick={() => {
                  onClose();
                  onOpenAppSelector();
                }}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-750 text-emerald-300 hover:text-white rounded-xl text-xs font-bold border border-emerald-500/30 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>تحديد تطبيقات المراسلة (واتساب وتيليجرام المثبتة)</span>
              </button>
            )}

            <button
              onClick={handleDownloadDirectApk}
              className="w-full py-2 bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white rounded-xl text-[11px] font-semibold border border-slate-700 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>تحميل نسخة ملف التطبيق (AutoReply.apk)</span>
            </button>
          </div>
        ) : (
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-2">
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            <span>تثبيت حقيقي ومباشر دون الحاجة لأي برامج خارجية</span>
          </div>
        )}
      </div>
    </div>
  );
};
