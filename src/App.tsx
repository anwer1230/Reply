import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Sparkles,
  Key,
  Clock,
  Radar,
  Brain,
  TrendingUp,
  CheckCircle,
  Radio,
  Sliders,
  ShieldCheck,
} from 'lucide-react';
import { Rule, AppPreferencesState } from './types';
import { repository } from './core/storage';
import { WhatsAppDashboard } from './components/screens/WhatsAppDashboard';
import { AISettingsTab } from './components/screens/AISettingsTab';
import { ScheduledMessagesTab } from './components/screens/ScheduledMessagesTab';
import { GroupRadarTab } from './components/screens/GroupRadarTab';
import { LearningBotMemoryTab } from './components/screens/LearningBotMemoryTab';
import { PatternAnalyzerTab } from './components/screens/PatternAnalyzerTab';
import { WhatsAppRulesTab } from './components/screens/WhatsAppRulesTab';

type NavTab =
  | 'dashboard'
  | 'rules'
  | 'scheduled'
  | 'radar'
  | 'memory'
  | 'patterns'
  | 'ai_settings';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

  // App Data State
  const [rules, setRules] = useState<Rule[]>([]);
  const [preferences, setPreferences] = useState<AppPreferencesState>({
    negationFilterEnabled: true,
    duplicateWindowSeconds: 60,
    notificationAccessGranted: true,
    selectedAppsTarget: 'whatsapp',
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load data on initial mount
  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = async () => {
    const loadedPrefs = repository.getPreferences();
    setPreferences({ ...loadedPrefs, selectedAppsTarget: 'whatsapp' });
    setRules(repository.getRules());

    // Sync from real backend if available
    try {
      const serverRules = await repository.fetchRulesFromBackend();
      if (serverRules && serverRules.length > 0) {
        setRules(serverRules);
      }
    } catch {
      // Offline fallback
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3500);
  };

  // Rule actions
  const handleSaveRule = (ruleData: Omit<Rule, 'createdAt'> & { createdAt?: number }) => {
    if (ruleData.id === '0') {
      repository.addRule({ ...ruleData, targetApp: 'whatsapp' });
      showToast('تمت إضافة قاعدة الرد لواتساب بنجاح');
    } else {
      repository.updateRule({
        ...ruleData,
        targetApp: 'whatsapp',
        createdAt: ruleData.createdAt || Date.now(),
      });
      showToast('تم حفظ تعديل القاعدة');
    }
    refreshData();
  };

  const handleDeleteRule = (ruleId: string) => {
    repository.deleteRule(ruleId);
    showToast('تم حذف القاعدة');
    refreshData();
  };

  const handleToggleRule = (ruleId: string, isEnabled: boolean) => {
    const rule = rules.find((r) => r.id === ruleId);
    if (rule) {
      repository.updateRule({ ...rule, isEnabled, targetApp: 'whatsapp' });
      refreshData();
    }
  };

  const handleUpdateAllSystemReplies = (newReply: string) => {
    repository.updateAllSystemReplies(newReply);
    refreshData();
  };

  const handleRestoreMissingSystemKeywords = async () => {
    const restoredCount = await repository.restoreMissingSystemKeywords();
    await refreshData();
    return restoredCount;
  };

  const handleUpdatePreferences = async (prefs: Partial<AppPreferencesState>) => {
    const updated = await repository.savePreferences({ ...prefs, selectedAppsTarget: 'whatsapp' });
    setPreferences(updated);
    showToast('تم تحديث التفضيلات بنجاح');
  };

  // Approval from Pattern Analyzer directly creates active Rule!
  const handleAddRuleFromPattern = (keywordText: string, replyText: string) => {
    handleSaveRule({
      id: '0',
      keyword: keywordText,
      reply: replyText,
      targetApp: 'whatsapp',
      isEnabled: true,
      isExactMatch: false,
      source: 'LEARNED_AI',
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Cairo',sans-serif]">
      {/* Top Global Navigation Bar - Exclusively WhatsApp Branded */}
      <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 px-4 py-3 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-3">
          {/* Logo & App Title */}
          <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-start">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#128C7E] to-[#25D366] p-0.5 shadow-lg shadow-emerald-950/60">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                  <Radio className="w-5 h-5 text-[#25D366] animate-pulse" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base md:text-lg font-black tracking-tight text-white">
                    أتمتة والرد الذكي لواتساب
                  </h1>
                  <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                    واتساب فقط • بالذكاء الاصطناعي
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  يدعم واتساب الرسمي، Business، GB، بلس • مزود بمفاتيح Groq & Gemini وذاكرة دائمة
                </p>
              </div>
            </div>

            {/* Quick WhatsApp Status Indicator */}
            <div className="lg:hidden flex items-center gap-1.5 bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-xl text-[10px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span>نشط</span>
            </div>
          </div>

          {/* Navigation Tabs - Exclusively Dedicated to the WhatsApp AI Functions */}
          <div className="flex items-center gap-1 bg-slate-950/90 p-1.5 rounded-2xl border border-slate-800 text-xs font-bold overflow-x-auto max-w-full">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'dashboard'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>الرئيسية والمحادثات</span>
            </button>

            <button
              onClick={() => setActiveTab('ai_settings')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'ai_settings'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                  : 'text-purple-400 hover:text-white'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>مفاتيح الذكاء الاصطناعي</span>
            </button>

            <button
              onClick={() => setActiveTab('rules')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'rules'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>قواعد الرد (25 كلمة)</span>
            </button>

            <button
              onClick={() => setActiveTab('scheduled')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'scheduled'
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>رسائل مجدولة بالصور</span>
            </button>

            <button
              onClick={() => setActiveTab('radar')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'radar'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Radar className="w-3.5 h-3.5" />
              <span>رادار المجموعات</span>
            </button>

            <button
              onClick={() => setActiveTab('memory')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'memory'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Brain className="w-3.5 h-3.5" />
              <span>بوت الذاكرة الدائمة</span>
            </button>

            <button
              onClick={() => setActiveTab('patterns')}
              className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'patterns'
                  ? 'bg-cyan-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>استخلاص الأنماط</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-6">
        {activeTab === 'dashboard' && (
          <WhatsAppDashboard
            rules={rules}
            preferences={preferences}
            onUpdatePreferences={handleUpdatePreferences}
            onNavigateToTab={(tab: string) => setActiveTab(tab as NavTab)}
            onShowToast={showToast}
          />
        )}

        {activeTab === 'ai_settings' && (
          <AISettingsTab onShowToast={showToast} />
        )}

        {activeTab === 'rules' && (
          <WhatsAppRulesTab
            rules={rules}
            onSaveRule={handleSaveRule}
            onDeleteRule={handleDeleteRule}
            onToggleRule={handleToggleRule}
            onUpdateAllSystemReplies={handleUpdateAllSystemReplies}
            onRestoreMissingSystemKeywords={handleRestoreMissingSystemKeywords}
            onShowToast={showToast}
          />
        )}

        {activeTab === 'scheduled' && (
          <ScheduledMessagesTab onShowToast={showToast} />
        )}

        {activeTab === 'radar' && (
          <GroupRadarTab onShowToast={showToast} />
        )}

        {activeTab === 'memory' && (
          <LearningBotMemoryTab onShowToast={showToast} />
        )}

        {activeTab === 'patterns' && (
          <PatternAnalyzerTab
            onAddRuleFromPattern={handleAddRuleFromPattern}
            onShowToast={showToast}
          />
        )}
      </main>

      {/* Global Toast Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="bg-slate-900 text-white border border-emerald-500/40 px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-bold">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}
