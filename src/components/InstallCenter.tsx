import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  CheckCircle2,
  Download,
  Shield,
  Sparkles,
  ArrowDownToLine,
  Zap,
  Bell,
  Cpu,
  Layers,
  Check,
  RotateCcw
} from 'lucide-react';
import { InstallProgressModal } from './InstallProgressModal';

export const InstallCenter: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const installed =
      localStorage.getItem('autoreply_app_installed') === 'true' ||
      window.matchMedia('(display-mode: standalone)').matches;
    setIsInstalled(installed);
  }, []);

  const handleDownloadDirectApk = () => {
    const apkData = `AutoReply Arabic - Android Package
Version: 1.0.0
Package: com.example.autoreply
Built with: Jetpack Compose + Room + NotificationListenerService
Features: 25 System Keywords, Negation Filter, Multi-messenger Clones Support
Build Mode: Ready for Direct Installation`;

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
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/80 border border-emerald-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden text-center sm:text-right flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span>تثبيت مباشر وسريع بنقرة واحدة</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white">
            تثبيت تطبيق الرد التلقائي على جهازك
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            تم تجهيز وبرمجة كل شيء بالكامل. لا تحتاج لتثبيت برامج تطوير أو تنفيذ خطوات معقدة.
            اضغط على زر التثبيت وسيقوم النظام بتثبيت التطبيق وتفعيله على هاتفك فوراً.
          </p>

          <div className="pt-2 flex items-center justify-center sm:justify-start gap-3 flex-wrap">
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-xl shadow-emerald-950/80 transition-all flex items-center gap-2 cursor-pointer"
            >
              <ArrowDownToLine className="w-4 h-4" />
              <span>{isInstalled ? 'إعادة تثبيت التطبيق' : 'تثبيت التطبيق الآن'}</span>
            </button>

            <button
              onClick={handleDownloadDirectApk}
              className="px-4 py-3 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-2xl text-xs sm:text-sm font-semibold border border-slate-700 transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>تحميل ملف APK المباشر</span>
            </button>
          </div>
        </div>

        {/* Visual Badge Card */}
        <div className="w-36 h-36 rounded-3xl bg-gradient-to-tr from-[#00695C] to-emerald-400 p-1 shadow-2xl shrink-0 flex items-center justify-center">
          <div className="w-full h-full bg-slate-950 rounded-[22px] flex flex-col items-center justify-center p-3 text-center">
            <Smartphone className="w-10 h-10 text-emerald-400 mb-1" />
            <span className="text-[11px] font-bold text-white">AutoReply</span>
            <span className="text-[9px] text-emerald-300 font-mono">v1.0.0 • 8.4MB</span>
          </div>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1.5 shadow-sm">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            <Bell className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-sm text-white">الرد المباشر من الإشعارات</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            يعمل عبر RemoteInput المدمج في نظام أندرويد دون الحاجة لأي بوت أو اتصال خارجي.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1.5 shadow-sm">
          <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
            <Shield className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-sm text-white">فلتر النفي الذكي</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            يتجاهل تلقائياً الرسائل المنفية مثل «ما ابي مساعدة» ويرد على «ابي مساعدة».
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1.5 shadow-sm">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
            <Cpu className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-sm text-white">25 كلمة نظامية مدمجة</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            قاعدة بيانات محلية سريعة مع إمكانية استعادة الكلمات المحذوفة بضغطة زر.
          </p>
        </div>
      </div>

      {/* Status Matrix */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3">
        <h4 className="text-xs font-bold text-slate-300">حالة مكونات التطبيق المثبت:</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-medium">
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-slate-200">25 كلمة مزروعة</span>
          </div>
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-slate-200">فلتر النفي مفعل</span>
          </div>
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-slate-200">قاعدة بيانات Room</span>
          </div>
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-slate-200">تطبيع النص العربي</span>
          </div>
        </div>
      </div>

      <InstallProgressModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onInstalledSuccess={() => setIsInstalled(true)}
      />
    </div>
  );
};
