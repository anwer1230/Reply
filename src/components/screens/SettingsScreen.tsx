import React, { useState, useMemo } from 'react';
import {
  ArrowRight,
  Bell,
  Shield,
  Clock,
  RotateCcw,
  Check,
  Smartphone,
  Sparkles,
  Search,
  ChevronDown,
  ChevronUp,
  Layers,
  CheckCircle2,
  List,
  Filter,
} from 'lucide-react';
import { AppPreferencesState } from '../../types';
import {
  SUPPORTED_APPS_LIST,
  SupportedAppInfo,
  getInstalledPackagesFromDevice,
  getAppDisplayLabel,
  WHATSAPP_PACKAGES,
  TELEGRAM_PACKAGES,
} from '../../core/SupportedApps';
import { AppSelectorModal } from '../AppSelectorModal';

interface SettingsScreenProps {
  preferences: AppPreferencesState;
  onBack: () => void;
  onNavigate: (screen: string) => void;
  onUpdatePreferences: (prefs: Partial<AppPreferencesState>) => void;
  onResetToDefaults: () => void;
  onShowToast: (msg: string) => void;
  onUpdateAllRulesTargetApp?: (targetApp: string) => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  preferences,
  onBack,
  onNavigate,
  onUpdatePreferences,
  onResetToDefaults,
  onShowToast,
  onUpdateAllRulesTargetApp,
}) => {
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [isAppListExpanded, setIsAppListExpanded] = useState(true);
  const [isAppModalOpen, setIsAppModalOpen] = useState(false);
  const [appSearchQuery, setAppSearchQuery] = useState('');
  const [appCategoryFilter, setAppCategoryFilter] = useState<'all' | 'installed' | 'whatsapp' | 'telegram' | 'other'>('all');
  const [syncRulesWithSelection, setSyncRulesWithSelection] = useState(true);

  // Get currently installed device packages
  const installedPackages = useMemo(() => getInstalledPackagesFromDevice(), []);

  // Compute currently selected packages set from preferences
  const currentSelectedSet = useMemo(() => {
    const target = preferences.selectedAppsTarget || 'all';
    if (target === 'all') {
      return new Set(SUPPORTED_APPS_LIST.map((a) => a.packageName));
    }
    if (target === 'whatsapp' || target === 'whatsapp_all') {
      return new Set(
        SUPPORTED_APPS_LIST.filter((a) => a.category === 'whatsapp').map((a) => a.packageName)
      );
    }
    if (target === 'telegram' || target === 'telegram_all') {
      return new Set(
        SUPPORTED_APPS_LIST.filter((a) => a.category === 'telegram').map((a) => a.packageName)
      );
    }
    // Comma-separated list or activeAppPackages
    const list = target.split(',').map((s) => s.trim()).filter(Boolean);
    if (list.length > 0) {
      return new Set(list);
    }
    if (preferences.activeAppPackages && preferences.activeAppPackages.length > 0) {
      return new Set(preferences.activeAppPackages);
    }
    return new Set(SUPPORTED_APPS_LIST.map((a) => a.packageName));
  }, [preferences.selectedAppsTarget, preferences.activeAppPackages]);

  // Apply new app selection to preferences and rules
  const applyAppSelection = (nextSet: Set<string>, toastCustomMsg?: string) => {
    const totalAppsCount = SUPPORTED_APPS_LIST.length;
    const selectedList = Array.from(nextSet);

    let targetAppString = 'all';

    if (selectedList.length === 0) {
      onShowToast('يرجى تحديد تطبيق واحد على الأقل لتشغيل الرد عليه');
      return;
    }

    if (selectedList.length === totalAppsCount) {
      targetAppString = 'all';
    } else {
      const waCount = SUPPORTED_APPS_LIST.filter((a) => a.category === 'whatsapp').length;
      const tgCount = SUPPORTED_APPS_LIST.filter((a) => a.category === 'telegram').length;

      const waSelected = selectedList.filter((pkg) =>
        SUPPORTED_APPS_LIST.some((a) => a.category === 'whatsapp' && a.packageName === pkg)
      );
      const tgSelected = selectedList.filter((pkg) =>
        SUPPORTED_APPS_LIST.some((a) => a.category === 'telegram' && a.packageName === pkg)
      );

      if (waSelected.length === waCount && selectedList.length === waCount) {
        targetAppString = 'whatsapp_all';
      } else if (tgSelected.length === tgCount && selectedList.length === tgCount) {
        targetAppString = 'telegram_all';
      } else {
        targetAppString = selectedList.join(',');
      }
    }

    // Update global preferences
    onUpdatePreferences({
      selectedAppsTarget: targetAppString,
      activeAppPackages: selectedList,
    });

    // Optionally sync all rules so individual rules also respond to the selected apps
    if (syncRulesWithSelection && onUpdateAllRulesTargetApp) {
      onUpdateAllRulesTargetApp(targetAppString);
    }

    onShowToast(
      toastCustomMsg || `تم حفظ التطبيقات المفعلة (${selectedList.length} تطبيق تواصل)`
    );
  };

  // Toggle single package checkbox
  const handleToggleSingleApp = (packageName: string) => {
    const nextSet = new Set(currentSelectedSet);
    if (nextSet.has(packageName)) {
      if (nextSet.size <= 1) {
        onShowToast('يجب إبقاء تطبيق واحد مفعل على الأقل');
        return;
      }
      nextSet.delete(packageName);
    } else {
      nextSet.add(packageName);
    }
    applyAppSelection(nextSet);
  };

  // Quick Action 1: Select WhatsApp + Telegram Together
  const handleSelectWhatsAppAndTelegramTogether = () => {
    const waAndTg = new Set(
      SUPPORTED_APPS_LIST.filter(
        (a) => a.category === 'whatsapp' || a.category === 'telegram'
      ).map((a) => a.packageName)
    );
    applyAppSelection(
      waAndTg,
      'تم تفعيل الرد التلقائي على جميع نسخ واتساب وتيليجرام معاً!'
    );
  };

  // Quick Action 2: Select all WhatsApp variants
  const handleSelectAllWhatsApp = () => {
    const waSet = new Set(
      SUPPORTED_APPS_LIST.filter((a) => a.category === 'whatsapp').map((a) => a.packageName)
    );
    applyAppSelection(waSet, 'تم تفعيل الرد التلقائي على كل نسخ واتساب');
  };

  // Quick Action 3: Select all Telegram variants
  const handleSelectAllTelegram = () => {
    const tgSet = new Set(
      SUPPORTED_APPS_LIST.filter((a) => a.category === 'telegram').map((a) => a.packageName)
    );
    applyAppSelection(tgSet, 'تم تفعيل الرد التلقائي على كل نسخ تيليجرام');
  };

  // Quick Action 4: Select only apps installed on device
  const handleSelectInstalledOnly = () => {
    const installed = new Set(
      SUPPORTED_APPS_LIST.filter((a) => installedPackages.has(a.packageName)).map(
        (a) => a.packageName
      )
    );
    if (installed.size === 0) {
      onShowToast('لم يتم العثور على تطبيقات مثبتة، تم تفعيل الكل افتراضياً');
      applyAppSelection(new Set(SUPPORTED_APPS_LIST.map((a) => a.packageName)));
      return;
    }
    applyAppSelection(
      installed,
      `تم تفعيل الرد التلقائي على التطبيقات المتوفرة بهاتفك (${installed.size} تطبيقات)`
    );
  };

  // Quick Action 5: Select All Apps
  const handleSelectAllApps = () => {
    const allSet = new Set(SUPPORTED_APPS_LIST.map((a) => a.packageName));
    applyAppSelection(allSet, 'تم تفعيل الرد التلقائي على جميع تطبيقات المراسلة');
  };

  // Notification access toggle
  const toggleAccess = () => {
    const newState = !preferences.notificationAccessGranted;
    onUpdatePreferences({ notificationAccessGranted: newState });
    onShowToast(
      newState
        ? 'تم منح صلاحية الاستماع للإشعارات'
        : 'تم تعطيل صلاحية الاستماع للإشعارات'
    );
  };

  // Negation filter toggle
  const toggleNegation = () => {
    const newState = !preferences.negationFilterEnabled;
    onUpdatePreferences({ negationFilterEnabled: newState });
    onShowToast(newState ? 'تم تفعيل فلتر النفي' : 'تم تعطيل فلتر النفي');
  };

  // Deduplication window change
  const handleDuplicateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = parseInt(e.target.value, 10);
    onUpdatePreferences({ duplicateWindowSeconds: val });
    onShowToast(`تم ضبط نافذة منع التكرار على ${val} ثانية`);
  };

  // Filtered apps for in-settings checklist
  const filteredApps = useMemo(() => {
    return SUPPORTED_APPS_LIST.filter((app) => {
      const isInstalled = installedPackages.has(app.packageName);
      let matchesCategory = true;
      if (appCategoryFilter === 'installed') matchesCategory = isInstalled;
      else if (appCategoryFilter === 'whatsapp') matchesCategory = app.category === 'whatsapp';
      else if (appCategoryFilter === 'telegram') matchesCategory = app.category === 'telegram';
      else if (appCategoryFilter === 'other') matchesCategory = app.category === 'other';

      const matchesSearch =
        app.name.toLowerCase().includes(appSearchQuery.toLowerCase()) ||
        app.nameEn.toLowerCase().includes(appSearchQuery.toLowerCase()) ||
        app.packageName.toLowerCase().includes(appSearchQuery.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [installedPackages, appCategoryFilter, appSearchQuery]);

  // Count active WhatsApp and Telegram apps
  const activeWaCount = SUPPORTED_APPS_LIST.filter(
    (a) => a.category === 'whatsapp' && currentSelectedSet.has(a.packageName)
  ).length;
  const activeTgCount = SUPPORTED_APPS_LIST.filter(
    (a) => a.category === 'telegram' && currentSelectedSet.has(a.packageName)
  ).length;
  const isBothWaAndTgActive = activeWaCount > 0 && activeTgCount > 0;

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900 relative">
      {/* TopAppBar */}
      <header className="bg-[#00695C] text-white px-3 py-3 flex items-center justify-between shadow-md shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10 active:bg-white/20 transition-colors cursor-pointer"
            title="رجوع"
          >
            <ArrowRight className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-base font-bold">الإعدادات</h1>
            <p className="text-[11px] text-emerald-100/80">تفضيلات التطبيقات وفلتر النفي</p>
          </div>
        </div>

        <button
          onClick={() => setIsAppModalOpen(true)}
          className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
          title="محدد التطبيقات المتقدم"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>محدد التطبيقات</span>
        </button>
      </header>

      {/* Settings Body */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
        
        {/* ======================================================== */}
        {/* MULTI-APP AUTO-REPLY SETTINGS (WhatsApp & Telegram Together) */}
        {/* ======================================================== */}
        <div className="bg-gradient-to-br from-slate-800 via-slate-850 to-slate-900 border-2 border-emerald-500/50 rounded-2xl p-4 shadow-lg space-y-3.5">
          {/* Card Title & Badges */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shrink-0 mt-0.5">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-bold text-sm text-white">تطبيقات الرد التلقائي (تحديد متعدد)</h2>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-bold">
                    {currentSelectedSet.size} تطبيق مفعّل
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  اختر التطبيقات لتشغيل الرد التلقائي عليها في نفس الوقت (مثل{' '}
                  <strong className="text-emerald-300">واتساب وتيليجرام معاً</strong>).
                </p>
              </div>
            </div>
          </div>

          {/* Active status indicator banner */}
          <div className="bg-slate-950/70 border border-slate-700/80 rounded-xl p-2.5 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">الحالة الحالية:</span>
              <span className="font-bold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                {isBothWaAndTgActive
                  ? '⚡ واتساب وتيليجرام مفعلان معاً'
                  : activeWaCount > 0
                  ? '🟢 نسخ واتساب فقط'
                  : activeTgCount > 0
                  ? '🔵 نسخ تيليجرام فقط'
                  : 'تطبيقات مخصصة'}
              </span>
            </div>
            <div className="text-[11px] text-slate-300 flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
                واتساب: {activeWaCount} نسخ
              </span>
              <span className="px-2 py-0.5 rounded bg-sky-950/80 text-sky-300 border border-sky-500/30">
                تيليجرام: {activeTgCount} نسخ
              </span>
              <span className="text-slate-400 truncate max-w-[190px]" title={getAppDisplayLabel(preferences.selectedAppsTarget || 'all')}>
                {getAppDisplayLabel(preferences.selectedAppsTarget || 'all')}
              </span>
            </div>
          </div>

          {/* Quick Presets Buttons (بنقرة واحدة) */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-400 block">اختيار سريع بنقرة واحدة:</span>
            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              {/* WhatsApp + Telegram Together Button */}
              <button
                type="button"
                onClick={handleSelectWhatsAppAndTelegramTogether}
                className="col-span-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 hover:from-emerald-500 hover:to-sky-500 text-white shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer border border-emerald-400/40"
              >
                <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                <span>⭐ تشغيل واتساب وتيليجرام معاً</span>
              </button>

              {/* WhatsApp Only */}
              <button
                type="button"
                onClick={handleSelectAllWhatsApp}
                className="py-2 px-2.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 border border-emerald-600/40 text-center transition-all cursor-pointer truncate"
                title="تفعيل كل نسخ واتساب (الرسمي، بزنس، GB، بلس...)"
              >
                💬 كل نسخ واتساب
              </button>

              {/* Telegram Only */}
              <button
                type="button"
                onClick={handleSelectAllTelegram}
                className="py-2 px-2.5 rounded-xl bg-sky-950/80 hover:bg-sky-900 text-sky-200 border border-sky-600/40 text-center transition-all cursor-pointer truncate"
                title="تفعيل كل نسخ تيليجرام (الرسمي، إكس، بلس...)"
              >
                ✈️ كل نسخ تيليجرام
              </button>

              {/* Installed on device only */}
              <button
                type="button"
                onClick={handleSelectInstalledOnly}
                className="py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-center transition-all cursor-pointer truncate"
                title="تفعيل التطبيقات المتوفرة بهاتفك فقط"
              >
                📱 المثبتة بهاتفي فقط
              </button>

              {/* All Supported Apps */}
              <button
                type="button"
                onClick={handleSelectAllApps}
                className="py-2 px-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-center transition-all cursor-pointer truncate"
                title="تفعيل كل التطبيقات المدعومة"
              >
                🌐 جميع التطبيقات
              </button>
            </div>
          </div>

          {/* Expand/Collapse In-Settings Checklist */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setIsAppListExpanded(!isAppListExpanded)}
              className="w-full py-2 px-3 bg-slate-900/80 hover:bg-slate-900 border border-slate-700/80 rounded-xl flex items-center justify-between text-xs font-bold text-slate-200 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                <span>قائمة اختيار وتخصيص التطبيقات الفردية ({filteredApps.length})</span>
              </div>
              {isAppListExpanded ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>
          </div>

          {/* In-Settings Multi-Select App Checklist */}
          {isAppListExpanded && (
            <div className="space-y-2.5 pt-1 animate-in fade-in duration-150">
              {/* Search & Filter bar inside settings */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute right-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={appSearchQuery}
                    onChange={(e) => setAppSearchQuery(e.target.value)}
                    placeholder="ابحث عن نسخة (واتساب، تيليجرام، GB، بلس)..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pr-8 pl-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Filter chips */}
                <div className="flex items-center gap-1 overflow-x-auto text-[11px] pb-1">
                  <button
                    type="button"
                    onClick={() => setAppCategoryFilter('all')}
                    className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                      appCategoryFilter === 'all'
                        ? 'bg-slate-700 text-white border-slate-500 font-bold'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    الكل ({SUPPORTED_APPS_LIST.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setAppCategoryFilter('installed')}
                    className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                      appCategoryFilter === 'installed'
                        ? 'bg-emerald-600 text-white border-emerald-500 font-bold'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    📱 بهاتفي ({installedPackages.size})
                  </button>

                  <button
                    type="button"
                    onClick={() => setAppCategoryFilter('whatsapp')}
                    className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                      appCategoryFilter === 'whatsapp'
                        ? 'bg-[#25D366] text-slate-950 border-[#25D366] font-bold'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    واتساب ({SUPPORTED_APPS_LIST.filter((a) => a.category === 'whatsapp').length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setAppCategoryFilter('telegram')}
                    className={`px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                      appCategoryFilter === 'telegram'
                        ? 'bg-[#229ED9] text-white border-[#229ED9] font-bold'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    تيليجرام ({SUPPORTED_APPS_LIST.filter((a) => a.category === 'telegram').length})
                  </button>
                </div>
              </div>

              {/* Scrollable list of selectable app cards */}
              <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 border border-slate-800 rounded-xl p-1 bg-slate-950/60">
                {filteredApps.length === 0 ? (
                  <p className="text-center py-4 text-xs text-slate-500">لا توجد تطبيقات مطابقة للبحث</p>
                ) : (
                  filteredApps.map((app) => {
                    const isChecked = currentSelectedSet.has(app.packageName);
                    const isInstalled = installedPackages.has(app.packageName);

                    return (
                      <div
                        key={app.id}
                        onClick={() => handleToggleSingleApp(app.packageName)}
                        className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                          isChecked
                            ? 'bg-slate-800/90 border-emerald-500/60 shadow-sm'
                            : 'bg-slate-900/60 border-slate-800/70 hover:bg-slate-850/60 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* Checkbox Icon */}
                          <div
                            className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all ${
                              isChecked
                                ? 'bg-emerald-600 text-white'
                                : 'border border-slate-600 bg-slate-950 text-transparent'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>

                          {/* App icon badge */}
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white shrink-0 shadow-xs"
                            style={{ backgroundColor: app.color }}
                          >
                            {app.category === 'whatsapp' ? 'WA' : app.category === 'telegram' ? 'TG' : 'APP'}
                          </div>

                          {/* Details */}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-xs text-white truncate">{app.name}</span>
                              {isInstalled && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                                  بهاتفك
                                </span>
                              )}
                              {app.badge && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                                  {app.badge}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 block truncate dir-ltr text-right">
                              {app.packageName}
                            </span>
                          </div>
                        </div>

                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded text-slate-400 shrink-0">
                          {isChecked ? 'مفعّل' : 'معطل'}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Sync Rules Option & Open Modal Button */}
          <div className="pt-1 flex flex-col gap-2">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={syncRulesWithSelection}
                onChange={(e) => setSyncRulesWithSelection(e.target.checked)}
                className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
              />
              <span>تحديث جميع قواعد الرد التلقائي الحالية لتطابق هذا الاختيار فوراً</span>
            </label>

            <button
              type="button"
              onClick={() => setIsAppModalOpen(true)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>فتح نافذة محدد التطبيقات المتقدمة وفحص الهاتف</span>
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* NOTIFICATION LISTENER STATUS CARD */}
        {/* ======================================================== */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-emerald-400" />
              <span className="font-bold text-sm text-white">صلاحية الاستماع للإشعارات</span>
            </div>
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-bold border ${
                preferences.notificationAccessGranted
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                  : 'bg-rose-950/80 text-rose-300 border-rose-500/40'
              }`}
            >
              {preferences.notificationAccessGranted ? '✅ الخدمة مفعّلة' : '❌ الخدمة معطلة'}
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            في نظام أندرويد، تتطلب ميزة قراءة الإشعارات والرد التلقائي إذن{' '}
            <code className="text-emerald-300 bg-slate-900 px-1 py-0.5 rounded text-[11px]">
              BIND_NOTIFICATION_LISTENER_SERVICE
            </code>
            .
          </p>

          <button
            onClick={toggleAccess}
            className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer ${
              preferences.notificationAccessGranted
                ? 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {preferences.notificationAccessGranted
              ? 'محاكاة: إيقاف الصلاحية مؤقتاً'
              : 'فتح الإعدادات ومنح الصلاحية'}
          </button>
        </div>

        {/* ======================================================== */}
        {/* NEGATION FILTER SWITCH */}
        {/* ======================================================== */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 shadow-sm flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 flex-1">
            <Shield className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-sm text-white">فلتر النفي الذكي</h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                تجاهل الرسائل المنفية تلقائياً مثل:{' '}
                <span className="text-rose-300">«ما ابي مساعدة»</span> أو{' '}
                <span className="text-rose-300">«لا اريد مساعدة»</span> أو{' '}
                <span className="text-rose-300">«مو ابي مختص»</span>.
              </p>
              <div className="mt-2 text-[11px] text-emerald-400/90 bg-emerald-950/40 border border-emerald-500/30 p-2 rounded-lg">
                ✨ يسمح بالرد على العبارات الإيجابية مثل: <strong className="text-white">«لا بأس، ابي مساعدة»</strong> لأن الكلمة السابقة للكلمة المفتاحية هي «بأس» وليست أداة نفي.
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleNegation}
            className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out shrink-0 mt-1 cursor-pointer ${
              preferences.negationFilterEnabled ? 'bg-emerald-600 justify-end' : 'bg-slate-700 justify-start'
            }`}
          >
            <div className="bg-white w-4 h-4 rounded-full shadow-md" />
          </button>
        </div>

        {/* ======================================================== */}
        {/* DUPLICATE WINDOW SETTING */}
        {/* ======================================================== */}
        <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-xs text-white">نافذة منع التكرار (Anti-Spam)</h3>
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
              {preferences.duplicateWindowSeconds} ثانية
            </span>
          </div>

          <p className="text-[11px] text-slate-300">
            المدة الزمنية التي يتم فيها تجاهل الرسائل المتطابقة من نفس المرسل والتطبيق لتفادي إرسال ردود مكررة متتالية.
          </p>

          <select
            value={preferences.duplicateWindowSeconds}
            onChange={handleDuplicateChange}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="15">15 ثانية (سريع للتجارب)</option>
            <option value="30">30 ثانية</option>
            <option value="60">60 ثانية (الافتراضي بنظام أندرويد)</option>
            <option value="120">120 ثانية (دقيقتان)</option>
            <option value="300">300 ثانية (5 دقائق)</option>
          </select>
        </div>

        <div className="border-t border-slate-800"></div>

        {/* ======================================================== */}
        {/* SYSTEM KEYWORDS NAV */}
        {/* ======================================================== */}
        <button
          onClick={() => onNavigate('system_keywords')}
          className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-2xl flex items-center justify-between text-white text-xs font-bold transition-all shadow-sm group cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <List className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span>إدارة الكلمات الثابتة والرد الموحّد</span>
          </div>
          <span className="text-slate-400 group-hover:text-emerald-400 transition-colors">←</span>
        </button>

        {/* ======================================================== */}
        {/* RESET FACTORY DEFAULTS */}
        {/* ======================================================== */}
        <div className="pt-2">
          <button
            onClick={() => setShowResetDialog(true)}
            className="w-full py-2.5 text-rose-400/80 hover:text-rose-300 hover:bg-rose-950/30 rounded-xl text-xs font-semibold border border-rose-900/30 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>إعادة ضبط المصنع واستعادة كل الكلمات والتفضيلات الافتراضية</span>
          </button>
        </div>
      </div>

      {/* App Selector Modal Popup */}
      <AppSelectorModal
        isOpen={isAppModalOpen}
        selectedApps={preferences.selectedAppsTarget || 'all'}
        onClose={() => setIsAppModalOpen(false)}
        onConfirm={(targetAppString) => {
          setIsAppModalOpen(false);
          const parts = targetAppString === 'all'
            ? SUPPORTED_APPS_LIST.map((a) => a.packageName)
            : targetAppString === 'whatsapp_all'
            ? SUPPORTED_APPS_LIST.filter((a) => a.category === 'whatsapp').map((a) => a.packageName)
            : targetAppString === 'telegram_all'
            ? SUPPORTED_APPS_LIST.filter((a) => a.category === 'telegram').map((a) => a.packageName)
            : targetAppString.split(',').map((s) => s.trim()).filter(Boolean);

          applyAppSelection(new Set(parts), `تم ضبط التطبيقات المستهدفة: ${getAppDisplayLabel(targetAppString)}`);
        }}
      />

      {/* Reset Confirmation Dialog */}
      {showResetDialog && (
        <div className="absolute inset-0 bg-black/75 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 max-w-sm w-full space-y-3 shadow-2xl">
            <h3 className="font-bold text-white text-base">إعادة ضبط المصنع</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              سيتم حذف أي كلمات مخصصة قمت بإضافتها، وإعادة زرع جميع الكلمات الـ 25 الثابتة مع الرد الافتراضي واستعادة تفضيلات التطبيقات الافتراضية. متابعة؟
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowResetDialog(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={() => {
                  onResetToDefaults();
                  setShowResetDialog(false);
                  onShowToast('تمت إعادة ضبط المصنع بنجاح');
                }}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow cursor-pointer"
              >
                إعادة ضبط
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
