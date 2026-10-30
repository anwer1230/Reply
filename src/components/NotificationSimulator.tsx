import React, { useState } from 'react';
import { Send, Shield, Sparkles, CheckCircle2, XCircle, AlertTriangle, RefreshCw, MessageSquare, History, Play } from 'lucide-react';
import { Rule, AppPreferencesState, SimulationResult } from '../types';
import { autoReplyEngine } from '../core/AutoReplyEngine';
import { ArabicNormalizer } from '../core/ArabicNormalizer';
import { NegationFilter } from '../core/NegationFilter';
import { SUPPORTED_APPS_LIST } from '../core/SupportedApps';

interface NotificationSimulatorProps {
  rules: Rule[];
  preferences: AppPreferencesState;
  onNotificationHandled?: (result: SimulationResult) => void;
}

// Synthesize pleasant Android notification chime via Web Audio API
function playChime(isSuccess: boolean) {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = isSuccess ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(isSuccess ? 587.33 : 329.63, ctx.currentTime); // D5 or E4
    if (isSuccess) {
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
    }

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch (e) {
    // Audio might be blocked by autoplay policies until user clicks
  }
}

export const NotificationSimulator: React.FC<NotificationSimulatorProps> = ({
  rules,
  preferences,
  onNotificationHandled,
}) => {
  const [senderName, setSenderName] = useState('أحمد العتيبي');
  const [app, setApp] = useState<string>('com.whatsapp');
  const [message, setMessage] = useState('ابي مساعدة في حل واجب');
  const [history, setHistory] = useState<SimulationResult[]>([]);
  const [lastResult, setLastResult] = useState<SimulationResult | null>(null);

  const predefinedScenarios = [
    {
      title: '«ابي مساعدة»',
      desc: 'طلب مباشر (يجب أن يرد)',
      msg: 'ابي مساعدة لو سمحت',
      app: 'whatsapp' as const,
      expected: 'REPLIED',
    },
    {
      title: '«ما ابي مساعدة»',
      desc: 'نفي بـ [ما] (يجب أن يتجاهل)',
      msg: 'ما ابي مساعدة خلاص شكرًا',
      app: 'whatsapp' as const,
      expected: 'IGNORED_NEGATION',
    },
    {
      title: '«لا اريد مساعدة»',
      desc: 'نفي بـ [لا] (يجب أن يتجاهل)',
      msg: 'لا اريد مساعدة حالياً',
      app: 'whatsapp' as const,
      expected: 'IGNORED_NEGATION',
    },
    {
      title: '«لا بأس، ابي مساعدة»',
      desc: 'الكلمة السابقة [بأس] (يجب أن يرد!)',
      msg: 'لا بأس، ابي مساعدة في المشروع',
      app: 'whatsapp' as const,
      expected: 'REPLIED',
    },
    {
      title: '«عندي اسايمنت»',
      desc: 'كلمة نظامية ثابتة (يرد)',
      msg: 'السلام عليكم عندي اسايمنت تسليمه غداً',
      app: 'telegram' as const,
      expected: 'REPLIED',
    },
    {
      title: '«من يسوي تكليف»',
      desc: 'كلمة نظامية ثابتة (يرد)',
      msg: 'من يسوي تكليف برمجة؟',
      app: 'whatsapp' as const,
      expected: 'REPLIED',
    },
    {
      title: '«مو ابي مختص»',
      desc: 'نفي لهجة عامية بـ [مو] (يتجاهل)',
      msg: 'انا مو ابي مختص ولا شي',
      app: 'telegram' as const,
      expected: 'IGNORED_NEGATION',
    },
    {
      title: '«ابي شخص مضمون»',
      desc: 'كلمة نظامية (يرد)',
      msg: 'ابي شخص مضمون وثقة لمشروعي',
      app: 'whatsapp' as const,
      expected: 'REPLIED',
    },
  ];

  const handleSimulate = (msgToTest?: string, appToTest?: 'whatsapp' | 'telegram') => {
    const rawMsg = msgToTest !== undefined ? msgToTest : message;
    const targetApp = appToTest || app;

    if (!rawMsg.trim()) return;

    const result = autoReplyEngine.processIncomingNotification(
      targetApp,
      senderName,
      rawMsg,
      rules,
      preferences
    );

    playChime(result.status === 'REPLIED');
    setLastResult(result);
    setHistory((prev) => [result, ...prev.slice(0, 24)]);
    if (onNotificationHandled) onNotificationHandled(result);
  };

  const handleClearHistory = () => {
    setHistory([]);
    setLastResult(null);
    autoReplyEngine.clearDeduplicationHistory();
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col h-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>مختبر محاكاة الإشعارات والرد التلقائي</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                Live Simulator
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              اختبر وصول رسائل واتساب وتيليجرام وتأكد من عمل تطبيع النص وفلتر النفي في الوقت الفعلي
            </p>
          </div>
        </div>

        <button
          onClick={handleClearHistory}
          className="text-xs text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg border border-slate-700/60 hover:bg-slate-800 transition-colors flex items-center gap-1.5"
          title="مسح سجل المحاكاة وإعادة تعيين منع التكرار"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>مسح السجل</span>
        </button>
      </div>

      {/* Mechanism Notice */}
      <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-emerald-200">
        <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-white">آلية عمل تطبيقك الفعلي (بدون خادم ولا بوت):</strong> الإشعار يصل لشريط أندرويد ← خدمة <code className="bg-slate-900 px-1 py-0.5 rounded text-white font-mono">NotificationListenerService</code> تلتقطه وتطابق الكلمات مع فلتر النفي ← ترسل الرد عبر <code className="bg-slate-900 px-1 py-0.5 rounded text-white font-mono">RemoteInput</code> الداخلي المدمج بالإشعار مباشرة داخل هاتفك!
        </div>
      </div>

      {/* Quick Test Scenarios */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300">
            ⚡ سيناريوهات الاختبار السريعة (حسب متطلباتك):
          </span>
          <span className="text-[11px] text-slate-500">اضغط لتجربة السيناريو فوراً</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {predefinedScenarios.map((sc, i) => (
            <button
              key={i}
              onClick={() => {
                setMessage(sc.msg);
                setApp(sc.app);
                handleSimulate(sc.msg, sc.app);
              }}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500/50 text-right transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-white group-hover:text-emerald-400">
                  <span className="truncate">{sc.title}</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                      sc.expected === 'REPLIED'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-600/40'
                        : 'bg-rose-950 text-rose-300 border border-rose-600/40'
                    }`}
                  >
                    {sc.expected === 'REPLIED' ? 'يرد' : 'يحجب'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">{sc.desc}</p>
              </div>

              <div className="mt-2 text-[10px] text-slate-500 flex items-center gap-1 justify-end">
                <span>{sc.app === 'whatsapp' ? 'واتساب' : 'تيليجرام'}</span>
                <Play className="w-2.5 h-2.5 text-emerald-400 fill-emerald-400" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Test Sender Box */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              اسم المرسل:
            </label>
            <input
              type="text"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-semibold text-slate-400">
                تطبيق الإشعار والنسخة:
              </label>
              <span className="text-[10px] text-emerald-400 font-medium">
                {SUPPORTED_APPS_LIST.find((a) => a.packageName === app)?.badge || 'مثبت'}
              </span>
            </div>
            <select
              value={app}
              onChange={(e) => setApp(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <optgroup label="عائلة واتساب (WhatsApp & Clones)">
                {SUPPORTED_APPS_LIST.filter((a) => a.category === 'whatsapp').map((a) => (
                  <option key={a.id} value={a.packageName}>
                    {a.name} ({a.packageName})
                  </option>
                ))}
              </optgroup>
              <optgroup label="عائلة تيليجرام (Telegram & Clones)">
                {SUPPORTED_APPS_LIST.filter((a) => a.category === 'telegram').map((a) => (
                  <option key={a.id} value={a.packageName}>
                    {a.name} ({a.packageName})
                  </option>
                ))}
              </optgroup>
              <optgroup label="تطبيقات أخرى">
                {SUPPORTED_APPS_LIST.filter((a) => a.category === 'other').map((a) => (
                  <option key={a.id} value={a.packageName}>
                    {a.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              حالة الفلاتر الحالية:
            </label>
            <div className="flex items-center gap-2 h-9">
              <span
                className={`text-[10px] px-2.5 py-1.5 rounded-lg border font-semibold flex items-center gap-1 ${
                  preferences.negationFilterEnabled
                    ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                    : 'bg-slate-800 border-slate-700 text-slate-500'
                }`}
              >
                <Shield className="w-3 h-3" />
                <span>فلتر النفي {preferences.negationFilterEnabled ? 'مفعّل' : 'معطّل'}</span>
              </span>
              <span className="text-[10px] px-2 py-1.5 rounded-lg border bg-slate-900 border-slate-700 text-slate-300">
                منع التكرار: {preferences.duplicateWindowSeconds} ث
              </span>
            </div>
          </div>
        </div>

        {/* Message Input & Send Button */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-semibold text-slate-400">
            نص الرسالة الواردة في الإشعار:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSimulate();
              }}
              placeholder="اكتب رسالة لتجربتها، مثلاً: ابي مساعدة أو ما ابي مساعدة..."
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <button
              onClick={() => handleSimulate()}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-950/50 flex items-center gap-2 shrink-0 active:scale-95 transition-transform cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>إرسال إشعار محاكى</span>
            </button>
          </div>
        </div>
      </div>

      {/* Last Result Inspector Card */}
      {lastResult && (
        <div
          className={`rounded-2xl p-4 border transition-all animate-in fade-in slide-in-from-top-2 duration-200 ${
            lastResult.status === 'REPLIED'
              ? 'bg-emerald-950/40 border-emerald-500/50'
              : lastResult.status === 'IGNORED_NEGATION'
              ? 'bg-amber-950/40 border-amber-500/50'
              : 'bg-slate-800/80 border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {lastResult.status === 'REPLIED' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : lastResult.status === 'IGNORED_NEGATION' ? (
                <Shield className="w-5 h-5 text-amber-400 shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 text-slate-400 shrink-0" />
              )}
              <h4 className="font-bold text-sm text-white">
                {lastResult.status === 'REPLIED'
                  ? '✅ تم إرسال الرد التلقائي بنجاح!'
                  : lastResult.status === 'IGNORED_NEGATION'
                  ? '🛑 تم حجب الرد بفضل فلتر النفي'
                  : 'ℹ️ لم يتم الرد على الإشعار'}
              </h4>
            </div>

            <span className="text-[11px] font-mono text-slate-400">
              {new Date(lastResult.timestamp).toLocaleTimeString('ar-SA')}
            </span>
          </div>

          <p className="text-xs text-slate-200 mb-3">{lastResult.reasonArabic}</p>

          {/* Breakdown Pills */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs bg-slate-900/80 rounded-xl p-3 border border-slate-800">
            <div>
              <span className="text-[10px] text-slate-500 block">النص الأصلي:</span>
              <span className="text-white font-medium">"{lastResult.rawMessage}"</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">بعد التطبيع (Normalizer):</span>
              <span className="text-emerald-300 font-mono text-[11px]">
                "{lastResult.normalizedMessage}"
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">فحص فلتر النفي:</span>
              {lastResult.blockedByNegation ? (
                <span className="text-rose-400 font-bold">
                  محجوب بأداة: [{lastResult.negationWordDetected}]
                </span>
              ) : (
                <span className="text-emerald-400">سليم (غير منفي)</span>
              )}
            </div>
          </div>

          {/* Reply Text Preview */}
          {lastResult.replySent && (
            <div className="mt-3 bg-emerald-950/70 border border-emerald-500/40 rounded-xl p-3">
              <span className="text-[10px] font-bold text-emerald-300 uppercase block mb-1">
                الرد التلقائي الذي تم إرساله للعميل ({lastResult.senderName}):
              </span>
              <p className="text-xs text-white font-medium leading-relaxed">
                "{lastResult.replySent}"
              </p>
            </div>
          )}
        </div>
      )}

      {/* History Log Table */}
      <div className="flex-1 flex flex-col min-h-[160px] space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-slate-400">
          <div className="flex items-center gap-1.5">
            <History className="w-3.5 h-3.5" />
            <span>سجل الإشعارات التي تمت معالجتها ({history.length}):</span>
          </div>
          {history.length > 0 && (
            <span className="text-[10px] text-slate-500">الأحدث أولاً</span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto max-h-48 border border-slate-800 rounded-2xl bg-slate-950/40 divide-y divide-slate-800/80 text-xs">
          {history.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              لم يتم تشغيل أي محاكاة بعد. اضغط على أحد السيناريوهات السريعة بالأعلى لتجربتها!
            </div>
          ) : (
            history.map((item) => (
              <div key={item.id} className="p-3 flex items-start justify-between gap-3 hover:bg-slate-900/50 transition-colors">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                        item.app === 'whatsapp'
                          ? 'bg-[#25D366]/20 text-[#25D366]'
                          : 'bg-[#229ED9]/20 text-[#229ED9]'
                      }`}
                    >
                      {item.app === 'whatsapp' ? 'واتساب' : 'تيليجرام'}
                    </span>
                    <span className="font-bold text-white text-xs">{item.senderName}</span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(item.timestamp).toLocaleTimeString('ar-SA')}
                    </span>
                  </div>

                  <p className="text-slate-300">"{item.rawMessage}"</p>

                  {item.replySent && (
                    <div className="text-[11px] text-emerald-400 bg-emerald-950/30 px-2 py-1 rounded-lg border border-emerald-900/40 inline-block">
                      💬 رد: {item.replySent}
                    </div>
                  )}
                </div>

                <div className="shrink-0 text-left">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold inline-block ${
                      item.status === 'REPLIED'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                        : item.status === 'IGNORED_NEGATION'
                        ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {item.status === 'REPLIED'
                      ? 'تم الرد'
                      : item.status === 'IGNORED_NEGATION'
                      ? 'حجب بنفي'
                      : item.status === 'DUPLICATE_SUPPRESSED'
                      ? 'تكرار'
                      : 'لا تطابق'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
