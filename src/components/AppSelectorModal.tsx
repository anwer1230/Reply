import React, { useState, useEffect } from 'react';
import { Search, Check, X, Smartphone, Sparkles, RefreshCw, CheckSquare, Square, Filter, CheckCircle2 } from 'lucide-react';
import {
  SUPPORTED_APPS_LIST,
  SupportedAppInfo,
  getInstalledPackagesFromDevice,
  saveInstalledPackagesToDevice,
  WHATSAPP_PACKAGES,
  TELEGRAM_PACKAGES,
} from '../core/SupportedApps';

interface AppSelectorModalProps {
  selectedApps: string; // 'all' or comma-separated package names or 'whatsapp' / 'telegram'
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (targetAppString: string) => void;
}

export const AppSelectorModal: React.FC<AppSelectorModalProps> = ({
  selectedApps,
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  // الحزم المثبتة فعلياً في هاتف المستخدم
  const [installedPackages, setInstalledPackages] = useState<Set<string>>(() =>
    getInstalledPackagesFromDevice()
  );

  // Parse initial selected packages
  const parseInitialSelection = (): Set<string> => {
    if (!selectedApps || selectedApps === 'all') {
      return new Set(SUPPORTED_APPS_LIST.map((a) => a.packageName));
    }
    if (selectedApps === 'whatsapp' || selectedApps === 'whatsapp_all') {
      return new Set(
        SUPPORTED_APPS_LIST.filter((a) => a.category === 'whatsapp').map((a) => a.packageName)
      );
    }
    if (selectedApps === 'telegram' || selectedApps === 'telegram_all') {
      return new Set(
        SUPPORTED_APPS_LIST.filter((a) => a.category === 'telegram').map((a) => a.packageName)
      );
    }
    return new Set(selectedApps.split(',').map((s) => s.trim()).filter(Boolean));
  };

  const [selectedPackages, setSelectedPackages] = useState<Set<string>>(parseInitialSelection);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'installed' | 'all' | 'whatsapp' | 'telegram' | 'other'>('installed');
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  // تحديث الحزم المحفوظة عند التغيير
  const toggleInstalledStatus = (e: React.MouseEvent, pkg: string) => {
    e.stopPropagation();
    const next = new Set(installedPackages);
    if (next.has(pkg)) {
      next.delete(pkg);
    } else {
      next.add(pkg);
    }
    setInstalledPackages(next);
    saveInstalledPackagesToDevice(next);
  };

  const togglePackage = (pkg: string) => {
    const next = new Set(selectedPackages);
    if (next.has(pkg)) {
      next.delete(pkg);
    } else {
      next.add(pkg);
    }
    setSelectedPackages(next);
  };

  // اختيار كل نسخ واتساب
  const selectAllWhatsApp = () => {
    const next = new Set(selectedPackages);
    SUPPORTED_APPS_LIST.filter((a) => a.category === 'whatsapp').forEach((a) =>
      next.add(a.packageName)
    );
    setSelectedPackages(next);
  };

  // اختيار كل نسخ تيليجرام
  const selectAllTelegram = () => {
    const next = new Set(selectedPackages);
    SUPPORTED_APPS_LIST.filter((a) => a.category === 'telegram').forEach((a) =>
      next.add(a.packageName)
    );
    setSelectedPackages(next);
  };

  // اختيار واتساب + تيليجرام معاً
  const selectWhatsAppAndTelegram = () => {
    const next = new Set(selectedPackages);
    SUPPORTED_APPS_LIST.filter((a) => a.category === 'whatsapp' || a.category === 'telegram').forEach((a) =>
      next.add(a.packageName)
    );
    setSelectedPackages(next);
  };

  // اختيار التطبيقات المثبتة في الهاتف فقط
  const selectInstalledOnly = () => {
    const next = new Set<string>();
    SUPPORTED_APPS_LIST.forEach((a) => {
      if (installedPackages.has(a.packageName)) {
        next.add(a.packageName);
      }
    });
    setSelectedPackages(next);
  };

  // تحديد الكل
  const selectAll = () => {
    setSelectedPackages(new Set(SUPPORTED_APPS_LIST.map((a) => a.packageName)));
  };

  // إلغاء تحديد الكل
  const deselectAll = () => {
    setSelectedPackages(new Set());
  };

  // محاكاة إعادة فحص تطبيقات الهاتف
  const handleScanDevice = () => {
    setIsScanning(true);
    setScanMessage('جارٍ فحص حزم تطبيقات التواصل المثبتة بنظام الهاتف...');
    setTimeout(() => {
      setIsScanning(false);
      setScanMessage(`تم العثور على ${installedPackages.size} تطبيقات مراسلة وتواصل مثبتة في جهازك!`);
      setTimeout(() => setScanMessage(null), 4000);
    }, 600);
  };

  const handleConfirm = () => {
    const totalCount = SUPPORTED_APPS_LIST.length;
    const selectedList = Array.from(selectedPackages);

    if (selectedList.length === 0) {
      alert('يرجى اختيار تطبيق واحد على الأقل لتطبيق الرد التلقائي عليه');
      return;
    }

    if (selectedList.length === totalCount) {
      onConfirm('all');
      onClose();
      return;
    }

    const waCount = SUPPORTED_APPS_LIST.filter((a) => a.category === 'whatsapp').length;
    const tgCount = SUPPORTED_APPS_LIST.filter((a) => a.category === 'telegram').length;

    const waSelected = selectedList.filter((pkg) =>
      SUPPORTED_APPS_LIST.some((a) => a.category === 'whatsapp' && a.packageName === pkg)
    );
    const tgSelected = selectedList.filter((pkg) =>
      SUPPORTED_APPS_LIST.some((a) => a.category === 'telegram' && a.packageName === pkg)
    );

    if (waSelected.length === waCount && selectedList.length === waCount) {
      onConfirm('whatsapp_all');
      onClose();
      return;
    }

    if (tgSelected.length === tgCount && selectedList.length === tgCount) {
      onConfirm('telegram_all');
      onClose();
      return;
    }

    // حفظ كقائمة حزم مفصولة بفواصل
    onConfirm(selectedList.join(','));
    onClose();
  };

  const filteredApps = SUPPORTED_APPS_LIST.filter((app) => {
    const isInstalled = installedPackages.has(app.packageName);
    let matchesTab = true;
    if (activeTab === 'installed') matchesTab = isInstalled;
    else if (activeTab === 'whatsapp') matchesTab = app.category === 'whatsapp';
    else if (activeTab === 'telegram') matchesTab = app.category === 'telegram';
    else if (activeTab === 'other') matchesTab = app.category === 'other';

    const matchesSearch =
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.packageName.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesTab && matchesSearch;
  });

  const installedCount = SUPPORTED_APPS_LIST.filter((a) => installedPackages.has(a.packageName)).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Top Header matching Android Dialog style */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>التطبيق المستهدف</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40">
                  تحديد متعدد (Checkboxes)
                </span>
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                اختر التطبيقات لتطبيق الرد التلقائي عليها (يمكنك اختيار عدة نسخ لواتساب وتيليجرام معاً)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Real Device Scanner Banner */}
        <div className="bg-gradient-to-r from-emerald-950/60 via-slate-850 to-teal-950/60 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-slate-200 font-medium">
              التطبيقات المتوفرة بهاتفك: <strong className="text-emerald-300 font-bold">{installedCount}</strong> تطبيق تواصل
            </span>
          </div>

          <button
            onClick={handleScanDevice}
            disabled={isScanning}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'جارٍ الفحص...' : 'إعادة فحص الهاتف'}</span>
          </button>
        </div>

        {scanMessage && (
          <div className="bg-emerald-900/60 text-emerald-200 text-xs px-4 py-2 border-b border-emerald-700/50 flex items-center gap-2 shrink-0 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{scanMessage}</span>
          </div>
        )}

        {/* Search Bar */}
        <div className="p-3 bg-slate-900 border-b border-slate-800 shrink-0 space-y-2.5">
          <div className="relative">
            <Search className="w-4 h-4 absolute right-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن اسم النسخة (مثلاً: واتساب للأعمال، GBWhatsApp، تيليجرام X)..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pr-10 pl-4 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Tab Filters */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-semibold py-0.5">
              <button
                onClick={() => setActiveTab('installed')}
                className={`px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'installed'
                    ? 'bg-emerald-600 text-white border-emerald-500 font-bold shadow-sm'
                    : 'bg-slate-850 text-slate-300 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <span>📱 المثبتة بهاتفي فقط</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-900/60 font-mono">
                  {installedCount}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('whatsapp')}
                className={`px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'whatsapp'
                    ? 'bg-[#25D366] text-slate-950 border-[#25D366] font-bold shadow-sm'
                    : 'bg-slate-850 text-slate-300 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <span>واتساب بكل أنواعه</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-900/60 font-mono">
                  {SUPPORTED_APPS_LIST.filter((a) => a.category === 'whatsapp').length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('telegram')}
                className={`px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'telegram'
                    ? 'bg-[#229ED9] text-white border-[#229ED9] font-bold shadow-sm'
                    : 'bg-slate-850 text-slate-300 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <span>تيليجرام بكل أنواعه</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-900/60 font-mono">
                  {SUPPORTED_APPS_LIST.filter((a) => a.category === 'telegram').length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-slate-700 text-white border-slate-500 font-bold shadow-sm'
                    : 'bg-slate-850 text-slate-300 border-slate-700 hover:bg-slate-800'
                }`}
              >
                جميع التطبيقات ({SUPPORTED_APPS_LIST.length})
              </button>
            </div>

            {/* Quick Bulk Selection Buttons */}
            <div className="flex items-center gap-1.5 text-[11px] font-semibold flex-wrap">
              <button
                onClick={selectAllWhatsApp}
                className="px-2 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 transition-colors cursor-pointer"
                title="تحديد كل نسخ واتساب (الرسمي، بزنس، GB، بلس...)"
              >
                + كل واتساب
              </button>
              <button
                onClick={selectAllTelegram}
                className="px-2 py-1 rounded-lg bg-sky-950/80 hover:bg-sky-900 text-sky-300 border border-sky-500/40 transition-colors cursor-pointer"
                title="تحديد كل نسخ تيليجرام (الرسمي، إكس، بلس...)"
              >
                + كل تيليجرام
              </button>
              <button
                onClick={selectWhatsAppAndTelegram}
                className="px-2 py-1 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-500/40 transition-colors cursor-pointer"
                title="تحديد نسخ واتساب وتيليجرام معاً"
              >
                + واتساب وتيليجرام معاً
              </button>
              <button
                onClick={selectInstalledOnly}
                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors cursor-pointer"
                title="تحديد كل التطبيقات المثبتة بهاتفك فقط"
              >
                المثبتة فقط
              </button>
              <button
                onClick={deselectAll}
                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-700 transition-colors cursor-pointer"
              >
                إلغاء التحديد
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Apps List with Checkboxes */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2">
          {filteredApps.length === 0 ? (
            <div className="p-8 text-center text-slate-400 space-y-2">
              <p className="text-sm">لم يتم العثور على تطبيقات تطابق البحث أو الفلتر المختار.</p>
              <button
                onClick={() => {
                  setActiveTab('all');
                  setSearchQuery('');
                }}
                className="text-xs text-emerald-400 hover:underline cursor-pointer"
              >
                عرض كل التطبيقات المدعومة
              </button>
            </div>
          ) : (
            filteredApps.map((app) => {
              const isChecked = selectedPackages.has(app.packageName);
              const isInstalledOnDevice = installedPackages.has(app.packageName);

              return (
                <div
                  key={app.id}
                  onClick={() => togglePackage(app.packageName)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isChecked
                      ? 'bg-slate-850 border-emerald-500/70 shadow-sm'
                      : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-900/60 text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Checkbox Icon */}
                    <div className="shrink-0">
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                          isChecked
                            ? 'bg-emerald-600 text-white shadow'
                            : 'border border-slate-700 bg-slate-900 text-transparent'
                        }`}
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                    </div>

                    {/* App Color Badge */}
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm"
                      style={{ backgroundColor: app.color }}
                    >
                      {app.category === 'whatsapp' ? 'WA' : app.category === 'telegram' ? 'TG' : 'APP'}
                    </div>

                    {/* App Information */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-white">{app.name}</span>
                        {app.badge && (
                          <span className="text-[10px] px-2 py-0.2 rounded-full font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                            {app.badge}
                          </span>
                        )}
                        {isInstalledOnDevice ? (
                          <span className="text-[10px] px-2 py-0.2 rounded-full font-bold bg-emerald-950 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                            <span>✅ مثبت بهاتفك</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500">غير مثبت</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <span className="truncate">{app.nameEn}</span>
                        <span className="text-slate-600">•</span>
                        <span className="font-mono text-[11px] text-slate-500 dir-ltr text-left truncate">
                          {app.packageName}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Device toggle button */}
                  <div className="shrink-0 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => toggleInstalledStatus(e, app.packageName)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                        isInstalledOnDevice
                          ? 'bg-emerald-950/40 text-emerald-300 border-emerald-600/30 hover:bg-rose-950/40 hover:text-rose-300 hover:border-rose-700/40'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                      title="تبديل حالة التثبيت على الهاتف"
                    >
                      {isInstalledOnDevice ? 'مثبت بنظامي' : '+ تعيين كمثبت'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer & Actions with Cancel & Confirm (موافق و إلغاء) */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0 flex-wrap">
          <div className="text-xs text-slate-300 font-semibold min-w-0">
            تم تحديد:{' '}
            <span className="text-emerald-400 font-bold font-mono text-sm">
              {selectedPackages.size}
            </span>{' '}
            تطبيق{' '}
            <span className="text-slate-500 text-[11px]">
              (سيعمل الرد التلقائي عليها جميعاً)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              onClick={handleConfirm}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-950/60 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>موافق (تطبيق الردود على المختارة)</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
