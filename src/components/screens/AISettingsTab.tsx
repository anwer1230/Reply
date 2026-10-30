import React, { useState } from 'react';
import {
  Sparkles,
  Key,
  Cpu,
  Bot,
  Sliders,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Save,
  HelpCircle,
  RefreshCw,
  Eye,
  EyeOff,
  Zap,
} from 'lucide-react';
import { AISettings } from '../../types';
import { aiService, POPULAR_GROQ_MODELS, POPULAR_GEMINI_MODELS } from '../../core/aiService';

interface AISettingsTabProps {
  onShowToast: (msg: string) => void;
}

export const AISettingsTab: React.FC<AISettingsTabProps> = ({ onShowToast }) => {
  const [settings, setSettings] = useState<AISettings>(aiService.getSettings());
  const [showGroqKey, setShowGroqKey] = useState(false);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; replyText?: string; error?: string } | null>(null);

  const handleSave = () => {
    aiService.saveSettings(settings);
    onShowToast('تم حفظ إعدادات ومفاتيح الذكاء الاصطناعي بنجاح');
  };

  const handleTestKey = async () => {
    setIsTesting(true);
    setTestResult(null);
    const key = settings.provider === 'groq' ? settings.groqApiKey : settings.geminiApiKey;
    const model = settings.provider === 'groq' ? settings.groqModel : settings.geminiModel;

    const res = await aiService.testConnection(settings.provider, key, model);
    setTestResult(res);
    setIsTesting(false);
  };

  const applyPresetPrompt = (preset: 'customer_service' | 'store' | 'booking') => {
    let prompt = '';
    if (preset === 'customer_service') {
      prompt = `أنت موظف خدمة عملاء ودود ومحترف للغاية على تطبيق واتساب.
- تجيب باختصار ولطف، وترحب بالعميل دائماً باسمه أو بعبارة ترحيبية راقية.
- تستند على قاعدة المعرفة المرفقة بدقة ولا تخمن أي معلومات مالية أو شروط لم تُذكر.
- توفر رقم أو طريقة التواصل المباشر عند طلب العميل محادثة مسؤول.`;
    } else if (preset === 'store') {
      prompt = `أنت المساعد الذكي لمبيعات المتجر الإلكتروني على واتساب.
- تشجع العميل على إتمام الشراء وتوضح له توفر المنتجات وطرق الشحن السريع والدفع الآمن.
- تقدم أسعار المنتجات المعتمدة وتوضح سياسة الضمان والاستبدال.`;
    } else if (preset === 'booking') {
      prompt = `أنت منسق المواعيد والحجوزات لخدماتنا عبر واتساب.
- توضح مواعيد العمل المتاحة وأيام الاستقبال بدقة.
- تطلب من العميل تزويدك بالاسم ورقم الهاتف والموعد المرغوب لتأكيد الحجز.`;
    }
    setSettings((prev) => ({ ...prev, systemPrompt: prompt }));
    onShowToast('تم تطبيق النموذج المحدد في البرومبت');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Info */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-500 p-0.5 shadow-md">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
          </div>
          <div>
            <h2 className="text-lg font-black text-white">إعداد ومفاتيح الذكاء الاصطناعي (Groq & Gemini)</h2>
            <p className="text-xs text-slate-400">
              اربط مفاتيح الذكاء الاصطناعي لتشغيل بوت التعلم، والردود الذكية المتكيفة، وتحليل الأنماط التلقائي
            </p>
          </div>
        </div>
      </div>

      {/* Provider Selector Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Groq Card */}
        <div
          onClick={() => setSettings((prev) => ({ ...prev, provider: 'groq' }))}
          className={`p-5 rounded-3xl border transition-all cursor-pointer relative overflow-hidden ${
            settings.provider === 'groq'
              ? 'bg-slate-900/90 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xl'
              : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 opacity-75'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
              <span className="font-black text-sm text-white">Groq Cloud (موصى به)</span>
            </div>
            <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
              فائق السرعة مجاناً
            </span>
          </div>
          <p className="text-xs text-slate-300 mb-3 leading-relaxed">
            يدعم نماذج <strong>Llama 3.3 70B</strong> المتطورة لسرعة فائقة في معالجة رسائل الواتساب خلال أجزاء من الثانية.
          </p>
          <a
            href="https://console.groq.com/keys"
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1 font-bold"
          >
            <span>احصل على مفتاح مجاني من console.groq.com</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Gemini Card */}
        <div
          onClick={() => setSettings((prev) => ({ ...prev, provider: 'gemini' }))}
          className={`p-5 rounded-3xl border transition-all cursor-pointer relative overflow-hidden ${
            settings.provider === 'gemini'
              ? 'bg-slate-900/90 border-purple-500 ring-2 ring-purple-500/20 shadow-xl'
              : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 opacity-75'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-purple-400"></span>
              <span className="font-black text-sm text-white">Google Gemini</span>
            </div>
            <span className="text-[10px] bg-purple-950 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded-full font-bold">
              ذكاء جوجل
            </span>
          </div>
          <p className="text-xs text-slate-300 mb-3 leading-relaxed">
            يدعم <strong>Gemini 2.5 Flash</strong> لفهم استثنائي للغة العربية واللهجات وتحليل المحادثات الطويلة.
          </p>
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-[11px] text-purple-400 hover:underline flex items-center gap-1 font-bold"
          >
            <span>احصل على مفتاح من Google AI Studio</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* API Key Inputs & Configuration */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Key className="w-4 h-4 text-emerald-400" />
          <span>مفاتيح الواجهة البرمجية (API Keys)</span>
        </h3>

        {/* Groq API Key Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
            <span>مفتاح Groq API Key</span>
            {settings.provider === 'groq' && (
              <span className="text-[10px] text-emerald-400 font-bold">المزود النشط حالياً</span>
            )}
          </label>
          <div className="relative">
            <input
              type={showGroqKey ? 'text' : 'password'}
              value={settings.groqApiKey}
              onChange={(e) => setSettings((prev) => ({ ...prev, groqApiKey: e.target.value }))}
              placeholder="gsk_..."
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
            />
            <button
              type="button"
              onClick={() => setShowGroqKey(!showGroqKey)}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
            >
              {showGroqKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Groq Model Selector */}
        {settings.provider === 'groq' && (
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">اختر نموذج Groq</label>
            <select
              value={settings.groqModel}
              onChange={(e) => setSettings((prev) => ({ ...prev, groqModel: e.target.value }))}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              {POPULAR_GROQ_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Gemini API Key Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
            <span>مفتاح Google Gemini API Key</span>
            {settings.provider === 'gemini' && (
              <span className="text-[10px] text-purple-400 font-bold">المزود النشط حالياً</span>
            )}
          </label>
          <div className="relative">
            <input
              type={showGeminiKey ? 'text' : 'password'}
              value={settings.geminiApiKey}
              onChange={(e) => setSettings((prev) => ({ ...prev, geminiApiKey: e.target.value }))}
              placeholder="AIzaSy..."
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
            />
            <button
              type="button"
              onClick={() => setShowGeminiKey(!showGeminiKey)}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
            >
              {showGeminiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Gemini Model Selector */}
        {settings.provider === 'gemini' && (
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">اختر نموذج Gemini</label>
            <select
              value={settings.geminiModel}
              onChange={(e) => setSettings((prev) => ({ ...prev, geminiModel: e.target.value }))}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 cursor-pointer"
            >
              {POPULAR_GEMINI_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Test Connection Button & Result */}
        <div className="pt-2">
          <button
            type="button"
            disabled={isTesting}
            onClick={handleTestKey}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors"
          >
            {isTesting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>جاري فحص الاتصال بالمزود...</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>فحص واختبار المفتاح المحدد الآن</span>
              </>
            )}
          </button>

          {testResult && (
            <div className={`mt-3 p-3.5 rounded-2xl border text-xs flex items-start gap-2.5 ${
              testResult.success
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
            }`}>
              {testResult.success ? (
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div>
                <span className="font-bold block mb-0.5">
                  {testResult.success ? 'المفتاح يعمل بشكل ممتاز!' : 'فشل الاتصال بالمفتاح:'}
                </span>
                <p className="text-[11px] opacity-90">{testResult.replyText || testResult.error}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bot Persona & Prompt Customization */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-bold text-white">شخصية وسياق بوت الواتساب (System Prompt)</h3>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400">نماذج جاهزة:</span>
            <button
              onClick={() => applyPresetPrompt('customer_service')}
              className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded cursor-pointer"
            >
              خدمة عملاء
            </button>
            <button
              onClick={() => applyPresetPrompt('store')}
              className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded cursor-pointer"
            >
              متجر
            </button>
            <button
              onClick={() => applyPresetPrompt('booking')}
              className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded cursor-pointer"
            >
              حجوزات
            </button>
          </div>
        </div>

        <textarea
          rows={5}
          value={settings.systemPrompt}
          onChange={(e) => setSettings((prev) => ({ ...prev, systemPrompt: e.target.value }))}
          className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-xs text-white focus:outline-none focus:border-purple-500 leading-relaxed resize-none"
        />

        {/* Temperature slider */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="font-bold">درجة الإبداع والحرية (Temperature):</span>
            <span className="font-mono text-purple-400 font-bold">{settings.temperature}</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={settings.temperature}
            onChange={(e) => setSettings((prev) => ({ ...prev, temperature: parseFloat(e.target.value) }))}
            className="w-full accent-purple-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>دقيق ومقيد بمعلومات قاعدة المعرفة (0.0)</span>
            <span>متوازن (0.7)</span>
            <span>إبداعي وتفاعلي (1.0)</span>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black rounded-2xl shadow-xl shadow-emerald-950/40 flex items-center gap-2 cursor-pointer transition-all"
        >
          <Save className="w-4 h-4" />
          <span>حفظ وتفعيل إعدادات الذكاء الاصطناعي</span>
        </button>
      </div>
    </div>
  );
};
