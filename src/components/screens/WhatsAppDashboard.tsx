import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Sparkles,
  Zap,
  CheckCircle,
  Clock,
  Radar,
  Brain,
  Send,
  RefreshCw,
  Sliders,
  ShieldCheck,
  AlertTriangle,
  Flame,
  Radio,
  Image as ImageIcon,
} from 'lucide-react';
import { Rule, AISettings, AppPreferencesState, WhatsAppLiveMessage } from '../../types';
import { aiService } from '../../core/aiService';
import { automationService } from '../../core/automationService';

interface WhatsAppDashboardProps {
  rules: Rule[];
  preferences: AppPreferencesState;
  onUpdatePreferences: (prefs: Partial<AppPreferencesState>) => void;
  onNavigateToTab: (tab: string) => void;
  onShowToast: (msg: string) => void;
}

export const WhatsAppDashboard: React.FC<WhatsAppDashboardProps> = ({
  rules,
  preferences,
  onUpdatePreferences,
  onNavigateToTab,
  onShowToast,
}) => {
  const [aiSettings, setAiSettings] = useState<AISettings>(aiService.getSettings());
  const [liveMessages, setLiveMessages] = useState<WhatsAppLiveMessage[]>([]);
  const [testInput, setTestInput] = useState('');
  const [senderName, setSenderName] = useState('عميل واتساب');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [lastTestResult, setLastTestResult] = useState<any>(null);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 8000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = () => {
    setAiSettings(aiService.getSettings());
    setLiveMessages(automationService.getLiveMessages());
  };

  const activeRulesCount = rules.filter((r) => r.isEnabled).length;
  const scheduledCount = automationService.getScheduledMessages().filter((s) => s.status === 'pending').length;
  const radarKeywordsCount = automationService.getMonitoredKeywords().filter((k) => k.isEnabled).length;
  const memoriesCount = automationService.getKnowledgeMemories().length;

  // Toggle AI Mode
  const handleModeChange = (mode: 'hybrid' | 'ai_only' | 'rules_only') => {
    const updated = aiService.saveSettings({ autoReplyMode: mode });
    setAiSettings(updated);
    onShowToast(`تم تحويل نمط الرد إلى: ${mode === 'hybrid' ? 'هجين (قواعد + ذكاء اصطناعي)' : mode === 'ai_only' ? 'ذكاء اصطناعي بالكامل' : 'قواعد ثابتة فقط'}`);
  };

  // Test live message evaluation
  const handleTestEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testInput.trim()) return;

    setIsEvaluating(true);
    setLastTestResult(null);

    try {
      const res = await fetch('/api/test/incoming', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: senderName,
          message: testInput,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const evalResult = data.evaluation;
        setLastTestResult(evalResult);

        // Add to live messages
        automationService.addLiveMessage({
          id: `msg_${Date.now()}`,
          timestamp: Date.now(),
          senderName: senderName,
          senderPhone: '+9665XXXXXXXX',
          text: testInput,
          isGroup: false,
          replySent: evalResult.replyText,
          replyType: evalResult.replySource ? evalResult.replySource.toLowerCase() : 'rule',
          matchedKeyword: evalResult.matchedRule?.keyword,
          status: evalResult.status === 'REPLIED' ? 'replied' : evalResult.status === 'IGNORED_NEGATION' ? 'ignored_negation' : 'no_match',
          details: evalResult.reason,
        });
        setLiveMessages(automationService.getLiveMessages());
      }
    } catch {
      // Direct fallback
      const directAI = await aiService.generateReply({
        message: testInput,
        senderName: senderName,
        knowledgeMemories: automationService.getKnowledgeMemories(),
      });
      setLastTestResult({
        shouldReply: true,
        replyText: directAI.replyText,
        replySource: 'AI',
        status: 'REPLIED',
        reason: `تم توليد الرد محلياً بواسطة ${directAI.provider}`,
      });
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* WhatsApp Service Status Hero Banner */}
      <div className="bg-gradient-to-r from-emerald-950/70 via-slate-900 to-teal-950/70 border border-emerald-500/30 rounded-3xl p-5 md:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20 shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Radio className="w-7 h-7 text-emerald-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl md:text-2xl font-black text-white">نظام الرد الذكي والأتمتة لواتساب</h2>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  نشط ويعمل على كل نسخ واتساب
                </span>
              </div>
              <p className="text-xs md:text-sm text-slate-300 mt-1">
                يعمل بقراءة إشعارات واتساب الرسمية وبزنس والمعدلة • مدعوم بمفاتيح الذكاء الاصطناعي Groq و Gemini مع ذاكرة دائمة
              </p>
            </div>
          </div>

          {/* Quick Engine Status Indicator */}
          <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-700/80 px-4 py-2.5 rounded-2xl">
            <div className="text-right">
              <span className="text-[11px] text-slate-400 block font-bold">المزود الذكي الحالي</span>
              <span className="text-xs font-black text-emerald-300 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                {aiSettings.provider === 'groq' ? `Groq (${aiSettings.groqModel.split('-')[0]})` : `Google Gemini (${aiSettings.geminiModel})`}
              </span>
            </div>
            <button
              onClick={() => onNavigateToTab('ai_settings')}
              className="px-3 py-1.5 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              إعدادات المفتاح
            </button>
          </div>
        </div>

        {/* Mode Selector Row */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <Sliders className="w-4 h-4 text-emerald-400" />
            <span>نمط الرد المعتمد:</span>
            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => handleModeChange('hybrid')}
                className={`px-3 py-1 rounded-lg transition-all text-xs cursor-pointer ${
                  aiSettings.autoReplyMode === 'hybrid'
                    ? 'bg-emerald-600 text-white shadow-sm font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                هجين (قواعد + ذكاء)
              </button>
              <button
                onClick={() => handleModeChange('ai_only')}
                className={`px-3 py-1 rounded-lg transition-all text-xs cursor-pointer ${
                  aiSettings.autoReplyMode === 'ai_only'
                    ? 'bg-purple-600 text-white shadow-sm font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                ذكاء اصطناعي بالكامل
              </button>
              <button
                onClick={() => handleModeChange('rules_only')}
                className={`px-3 py-1 rounded-lg transition-all text-xs cursor-pointer ${
                  aiSettings.autoReplyMode === 'rules_only'
                    ? 'bg-blue-600 text-white shadow-sm font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                قواعد ثابتة فقط
              </button>
            </div>
          </div>

          {/* Negation Filter Quick Toggle */}
          <div className="flex items-center gap-2 bg-slate-950/70 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <ShieldCheck className={`w-4 h-4 ${preferences.negationFilterEnabled ? 'text-emerald-400' : 'text-slate-500'}`} />
            <span className="text-slate-300 font-bold">فلتر النفي الذكي:</span>
            <button
              onClick={() => onUpdatePreferences({ negationFilterEnabled: !preferences.negationFilterEnabled })}
              className={`px-2 py-0.5 rounded text-[11px] font-black cursor-pointer transition-colors ${
                preferences.negationFilterEnabled ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-500'
              }`}
            >
              {preferences.negationFilterEnabled ? 'مفعّل (يمنع الرد على لا أريد)' : 'معطّل'}
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: WhatsApp Rules */}
        <div
          onClick={() => onNavigateToTab('rules')}
          className="bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/40 p-4 rounded-2xl transition-all cursor-pointer group shadow-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400">قواعد الرد الفوري</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">{activeRulesCount}</div>
          <span className="text-[11px] text-emerald-400/90 font-medium">25 كلمة نظام ثابتة + مخصصة</span>
        </div>

        {/* Card 2: Scheduled Messages with Images */}
        <div
          onClick={() => onNavigateToTab('scheduled')}
          className="bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-teal-500/40 p-4 rounded-2xl transition-all cursor-pointer group shadow-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400">الرسائل المجدولة بالصور</span>
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-400 group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">{scheduledCount}</div>
          <span className="text-[11px] text-teal-400/90 font-medium">إرسال جماعي مع صور وفارق أمان</span>
        </div>

        {/* Card 3: Group Keyword Radar */}
        <div
          onClick={() => onNavigateToTab('radar')}
          className="bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/40 p-4 rounded-2xl transition-all cursor-pointer group shadow-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400">رادار مراقبة المجموعات</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
              <Radar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">{radarKeywordsCount}</div>
          <span className="text-[11px] text-amber-400/90 font-medium">رد اقتباس ورسائل خاصة تلقائية</span>
        </div>

        {/* Card 4: Persistent Memory */}
        <div
          onClick={() => onNavigateToTab('memory')}
          className="bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-purple-500/40 p-4 rounded-2xl transition-all cursor-pointer group shadow-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400">قاعدة الذاكرة والتعلم</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
              <Brain className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">{memoriesCount}</div>
          <span className="text-[11px] text-purple-400/90 font-medium">حقائق وخدمات وأسعار مخزنة</span>
        </div>
      </div>

      {/* Main Grid: Interactive Live Tester + Real-time Message Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 cols): Interactive WhatsApp Live Tester */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">مختبر الرد الذكي المباشر</h3>
            </div>
            <span className="text-[11px] text-slate-400 bg-slate-800 px-2.5 py-0.5 rounded-full">
              محاكاة استلام رسالة واتساب
            </span>
          </div>

          <form onSubmit={handleTestEvaluation} className="space-y-3 mb-4">
            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">اسم المرسل أو المجموعة</label>
              <input
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="مثال: خالد المنصور أو مجموعة التجارة"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">نص الرسالة الواردة</label>
              <div className="relative">
                <textarea
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  rows={3}
                  placeholder="اكتب رسالة لتجربة الرد (مثال: السلام عليكم كم السعر؟ أو لا أريد الاشتراك)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>
            </div>

            {/* Quick Test Samples */}
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setTestInput('السلام عليكم كم سعر الاشتراك والخدمات المتاحة؟')}
                className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded-lg cursor-pointer"
              >
                💡 استفسار عن الأسعار
              </button>
              <button
                type="button"
                onClick={() => setTestInput('مطلوب مبرمج أو مورد سريع')}
                className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded-lg cursor-pointer"
              >
                🎯 رادار: مطلوب
              </button>
              <button
                type="button"
                onClick={() => setTestInput('مش عايز الخدمة وشكراً')}
                className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded-lg cursor-pointer"
              >
                🛑 تجربة فلتر النفي
              </button>
            </div>

            <button
              type="submit"
              disabled={isEvaluating || !testInput.trim()}
              className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              {isEvaluating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>جاري تحليل الرسالة وتوليد الرد الذكي...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>إرسال الرسالة واختبار الرد الآن</span>
                </>
              )}
            </button>
          </form>

          {/* Test Result Display Box */}
          {lastTestResult && (
            <div className={`mt-auto border rounded-2xl p-3.5 ${
              lastTestResult.status === 'REPLIED'
                ? 'bg-emerald-950/30 border-emerald-500/40'
                : lastTestResult.status === 'IGNORED_NEGATION'
                ? 'bg-amber-950/30 border-amber-500/40'
                : 'bg-slate-950 border-slate-800'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-black flex items-center gap-1.5">
                  {lastTestResult.status === 'REPLIED' ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-300">تم الرد بنجاح</span>
                    </>
                  ) : lastTestResult.status === 'IGNORED_NEGATION' ? (
                    <>
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      <span className="text-amber-300">حُجب الرد (فلتر النفي)</span>
                    </>
                  ) : (
                    <span className="text-slate-400">لا يوجد رد مطابق</span>
                  )}
                </span>
                {lastTestResult.replySource && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    lastTestResult.replySource === 'AI' ? 'bg-purple-900 text-purple-200' : 'bg-blue-900 text-blue-200'
                  }`}>
                    المصدر: {lastTestResult.replySource === 'AI' ? 'ذكاء اصطناعي' : 'قاعدة ثابتة'}
                  </span>
                )}
              </div>

              {lastTestResult.replyText && (
                <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800 mb-2">
                  <span className="text-[10px] text-slate-400 block mb-1">الرد المرسل إلى العميل:</span>
                  <p className="text-xs text-white leading-relaxed font-medium">{lastTestResult.replyText}</p>
                </div>
              )}

              <p className="text-[10px] text-slate-400 leading-tight">
                {lastTestResult.reason}
              </p>
            </div>
          )}
        </div>

        {/* Right Column (7 cols): Live WhatsApp Message Stream */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">سجل محادثات واتساب المباشرة</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  automationService.clearLiveMessages();
                  setLiveMessages([]);
                  onShowToast('تم مسح سجل المحادثات المباشرة');
                }}
                className="text-[11px] text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                مسح السجل
              </button>
              <button
                onClick={loadDashboardData}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 cursor-pointer"
                title="تحديث"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[460px] pr-1">
            {liveMessages.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs">لا توجد رسائل مسجلة بعد. استخدم المختبر أو انتظر إشعارات واتساب.</p>
              </div>
            ) : (
              liveMessages.map((msg) => (
                <div
                  key={msg.id}
                  className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3.5 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-white">{msg.senderName}</span>
                      {msg.isGroup && (
                        <span className="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-500/30 px-2 py-0.2 rounded-full">
                          مجموعة: {msg.groupName || 'واتساب'}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500">
                      {new Date(msg.timestamp).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 mb-2 bg-slate-900/50 p-2 rounded-xl">
                    "{msg.text}"
                  </p>

                  {msg.replySent ? (
                    <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-2.5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          تم الرد التلقائي:
                        </span>
                        <span className="text-[10px] bg-emerald-900/40 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                          {msg.replyType === 'ai' ? '🤖 ذكاء اصطناعي' : msg.replyType === 'radar' ? '🎯 رادار المجموعات' : msg.replyType === 'scheduled' ? '⏰ مجدولة' : '⚡ قاعدة فورية'}
                        </span>
                      </div>
                      <p className="text-xs text-emerald-100 font-medium">{msg.replySent}</p>
                    </div>
                  ) : msg.status === 'ignored_negation' ? (
                    <div className="text-[11px] text-amber-400 bg-amber-950/20 border border-amber-500/20 rounded-xl p-2 flex items-center gap-1.5 font-bold">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>{msg.details}</span>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-500 italic">
                      لم يتم إرسال رد (لا توجد مطابقة)
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
