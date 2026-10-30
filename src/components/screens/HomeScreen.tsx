import React, { useState } from 'react';
import { Settings, Plus, AlertTriangle, Search, Filter, MessageSquare, Check, Sparkles, Smartphone, CheckCircle2 } from 'lucide-react';
import { Rule, AppPreferencesState } from '../../types';
import { getAppDisplayLabel, doesRuleMatchApp, SUPPORTED_APPS_LIST } from '../../core/SupportedApps';
import { AppSelectorModal } from '../AppSelectorModal';

interface HomeScreenProps {
  rules: Rule[];
  preferences: AppPreferencesState;
  onNavigate: (screen: string, params?: { ruleId?: string }) => void;
  onToggleRule: (ruleId: string, isEnabled: boolean) => void;
  onUpdateAllRulesTargetApp?: (targetApp: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  rules,
  preferences,
  onNavigate,
  onToggleRule,
  onUpdateAllRulesTargetApp,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterApp, setFilterApp] = useState<'all' | 'whatsapp' | 'telegram'>('all');
  const [isAppModalOpen, setIsAppModalOpen] = useState(false);
  const globalTargetApp = preferences.selectedAppsTarget || 'all';

  const filteredRules = rules.filter((rule) => {
    const matchesSearch =
      rule.keyword.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.reply.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesApp =
      filterApp === 'all' ||
      doesRuleMatchApp(rule.targetApp, filterApp);
    return matchesSearch && matchesApp;
  });

  const systemRulesCount = rules.filter((r) => r.source === 'SYSTEM').length;
  const userRulesCount = rules.filter((r) => r.source === 'USER').length;

  const handleConfirmApps = (targetAppString: string) => {
    localStorage.setItem('autoreply_global_target_app', targetAppString);
    if (onUpdateAllRulesTargetApp) {
      onUpdateAllRulesTargetApp(targetAppString);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900 relative">
      {/* TopAppBar - Material 3 Style */}
      <header className="bg-[#00695C] text-white px-4 py-3 flex items-center justify-between shadow-md shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-emerald-300" />
          </div>
          <div>
            <h1 className="text-base font-bold leading-tight">الرد التلقائي</h1>
            <p className="text-[11px] text-emerald-100/80">
              {systemRulesCount} نظامية • {userRulesCount} مخصصة
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('settings')}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10 active:bg-white/20 transition-colors cursor-pointer"
          title="الإعدادات"
        >
          <Settings className="w-5 h-5 text-white" />
        </button>
      </header>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 pb-20">
        {/* Warning if notification access not granted */}
        {!preferences.notificationAccessGranted && (
          <div className="bg-rose-950/70 border border-rose-500/50 rounded-2xl p-3.5 text-rose-100 shadow-sm animate-pulse">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-bold text-sm text-rose-300">⚠️ الخدمة غير مفعّلة</h3>
                <p className="text-xs text-rose-200/90 mt-1 leading-relaxed">
                  يجب تفعيل صلاحية الاستماع للإشعارات في إعدادات التطبيق ليعمل الرد التلقائي.
                </p>
                <button
                  onClick={() => onNavigate('settings')}
                  className="mt-2.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shadow transition-all cursor-pointer"
                >
                  فتح الإعدادات لتفعيلها
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Target Apps Selector Card */}
        <div className="bg-gradient-to-r from-emerald-950/60 via-slate-800/90 to-teal-950/60 border border-emerald-500/40 rounded-2xl p-3 shadow-md">
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                <Smartphone className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-black text-white">تطبيقات المراسلة المستهدفة:</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                    واتساب وتيليجرام بكل أنواعها
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5 truncate">
                  {getAppDisplayLabel(globalTargetApp)}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsAppModalOpen(true)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 shadow-sm shadow-emerald-950/60 cursor-pointer"
            >
              <span>تحديد التطبيقات</span>
            </button>
          </div>
        </div>

        {/* Search and Filters Bar */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث في الكلمات أو الردود..."
              className="w-full bg-slate-800/90 border border-slate-700 rounded-xl pr-9 pl-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
            <button
              onClick={() => setFilterApp('all')}
              className={`px-2.5 py-1 rounded-full border transition-colors whitespace-nowrap cursor-pointer ${
                filterApp === 'all'
                  ? 'bg-emerald-600 text-white border-emerald-500 font-bold'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
              }`}
            >
              الكل ({rules.length})
            </button>
            <button
              onClick={() => setFilterApp('whatsapp')}
              className={`px-2.5 py-1 rounded-full border transition-colors whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                filterApp === 'whatsapp'
                  ? 'bg-[#25D366] text-slate-950 font-bold border-[#25D366]'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
              }`}
            >
              واتساب وكل أنواعه
            </button>
            <button
              onClick={() => setFilterApp('telegram')}
              className={`px-2.5 py-1 rounded-full border transition-colors whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                filterApp === 'telegram'
                  ? 'bg-[#229ED9] text-white font-bold border-[#229ED9]'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
              }`}
            >
              تيليجرام وكل أنواعه
            </button>
          </div>
        </div>

        {/* Rules List */}
        {rules.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <p className="text-sm">جارٍ تحميل القواعد...</p>
          </div>
        ) : filteredRules.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <p className="text-sm">لا توجد كلمات تطابق بحثك.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredRules.map((rule) => (
              <div
                key={rule.id}
                onClick={() => onNavigate('add_edit', { ruleId: rule.id })}
                className={`group bg-slate-800/80 hover:bg-slate-800 border transition-all rounded-2xl p-3.5 cursor-pointer shadow-sm relative ${
                  rule.isEnabled
                    ? 'border-slate-700/80 hover:border-emerald-500/50'
                    : 'border-slate-800 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-bold text-sm text-white group-hover:text-emerald-400 transition-colors">
                        {rule.keyword}
                      </span>

                      {rule.source === 'SYSTEM' ? (
                        <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 text-[10px] px-2 py-0.5 rounded-full font-semibold">
                          ثابتة
                        </span>
                      ) : (
                        <span className="bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 text-[10px] px-2 py-0.5 rounded-full font-semibold">
                          مخصصة
                        </span>
                      )}

                      {rule.isExactMatch && (
                        <span className="bg-amber-950/80 text-amber-300 border border-amber-500/30 text-[10px] px-1.5 py-0.2 rounded font-medium">
                          تطابق تام
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                      الرد: {rule.reply}
                    </p>

                    <div className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium flex-wrap">
                      <span className="text-slate-400 shrink-0">التطبيق:</span>
                      <span className="bg-slate-900/90 px-2 py-0.5 rounded text-slate-200 border border-slate-700/80 font-semibold truncate max-w-[240px]">
                        {getAppDisplayLabel(rule.targetApp)}
                      </span>
                    </div>
                  </div>

                  {/* Switch button */}
                  <div className="shrink-0 pt-0.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => onToggleRule(rule.id, !rule.isEnabled)}
                      className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out cursor-pointer ${
                        rule.isEnabled ? 'bg-emerald-600 justify-end' : 'bg-slate-700 justify-start'
                      }`}
                      title={rule.isEnabled ? 'إيقاف القاعدة' : 'تفعيل القاعدة'}
                    >
                      <div className="bg-white w-4 h-4 rounded-full shadow-md transform transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button (+) */}
      <button
        onClick={() => onNavigate('add_edit')}
        className="absolute bottom-5 left-5 w-13 h-13 rounded-2xl bg-[#00695C] hover:bg-[#00796B] active:scale-95 text-white flex items-center justify-center shadow-lg shadow-emerald-950/60 transition-transform z-30 border border-emerald-400/30 cursor-pointer"
        title="إضافة كلمة أو قاعدة جديدة"
      >
        <Plus className="w-7 h-7" />
      </button>

      {/* App Selector Modal */}
      <AppSelectorModal
        isOpen={isAppModalOpen}
        selectedApps={globalTargetApp}
        onClose={() => setIsAppModalOpen(false)}
        onConfirm={handleConfirmApps}
      />
    </div>
  );
};
