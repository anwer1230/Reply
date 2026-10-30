import React, { useState, useEffect } from 'react';
import {
  Server,
  Cloud,
  Send,
  CheckCircle2,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  Shield,
  FileCode,
  Radio,
  Zap,
  Globe,
  Lock,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ServerLog {
  id: string;
  timestamp: number;
  source: 'whatsapp' | 'telegram' | 'test';
  sender: string;
  rawMessage: string;
  normalizedMessage: string;
  status: 'REPLIED' | 'IGNORED_NEGATION' | 'NO_MATCH' | 'DUPLICATE_SUPPRESSED' | 'ERROR';
  matchedKeyword?: string;
  replySent?: string;
  negationWord?: string;
  details: string;
}

export const RenderDeployAndWebhooks: React.FC = () => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [telegramToken, setTelegramToken] = useState('');
  const [botInfo, setBotInfo] = useState<{ is_bot?: boolean; first_name?: string; username?: string } | null>(null);
  const [testingBot, setTestingBot] = useState(false);
  const [settingWebhook, setSettingWebhook] = useState(false);
  const [webhookResult, setWebhookResult] = useState<string | null>(null);

  const [whatsappVerifyToken, setWhatsappVerifyToken] = useState('autoreply_secret_token_123');
  const [whatsappToken, setWhatsappToken] = useState('');
  const [whatsappPhoneId, setWhatsappPhoneId] = useState('');

  const [logs, setLogs] = useState<ServerLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const originUrl = typeof window !== 'undefined' ? window.location.origin : 'https://autoreply.onrender.com';
  const telegramWebhookUrl = `${originUrl}/api/webhook/telegram`;
  const whatsappWebhookUrl = `${originUrl}/api/webhook/whatsapp`;

  useEffect(() => {
    fetchSettings();
    fetchLogs();
    const interval = setInterval(fetchLogs, 4000);
    return () => clearInterval(interval);
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.telegramBotToken) setTelegramToken(data.telegramBotToken);
        if (data.whatsappVerifyToken) setWhatsappVerifyToken(data.whatsappVerifyToken);
        if (data.whatsappAccessToken) setWhatsappToken(data.whatsappAccessToken);
        if (data.whatsappPhoneNumberId) setWhatsappPhoneId(data.whatsappPhoneNumberId);
      }
    } catch {
      // Offline fallback
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch {
      // Handled
    }
  };

  const copyToClipboard = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2500);
  };

  const handleTestBot = async () => {
    if (!telegramToken.trim()) return;
    setTestingBot(true);
    setBotInfo(null);
    setWebhookResult(null);
    try {
      const res = await fetch('/api/telegram/test-bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: telegramToken.trim() }),
      });
      const data = await res.json();
      if (data.ok && data.result) {
        setBotInfo(data.result);
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
        // Save to backend settings
        await fetch('/api/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ telegramBotToken: telegramToken.trim() }),
        });
      } else {
        alert(`فشل التحقق من البوت: ${data.description || 'تأكد من صحة التوكن'}`);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      alert(`خطأ في الاتصال: ${msg}`);
    } finally {
      setTestingBot(false);
    }
  };

  const handleSetWebhook = async () => {
    if (!telegramToken.trim()) return;
    setSettingWebhook(true);
    setWebhookResult(null);
    try {
      const res = await fetch('/api/telegram/set-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: telegramToken.trim(),
          url: telegramWebhookUrl,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setWebhookResult('✅ تم ربط الويب هوك بنجاح! الآن أي رسالة ترسلها للبوت على تيليجرام سيتم الرد عليها تلقائياً.');
        confetti({ particleCount: 70, spread: 70, origin: { y: 0.5 } });
      } else {
        setWebhookResult(`❌ فشل تثبيت الويب هوك: ${data.description}`);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setWebhookResult(`❌ خطأ: ${msg}`);
    } finally {
      setSettingWebhook(false);
    }
  };

  const handleSaveWhatsApp = async () => {
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          whatsappVerifyToken,
          whatsappAccessToken: whatsappToken.trim(),
          whatsappPhoneNumberId: whatsappPhoneId.trim(),
        }),
      });
      alert('تم حفظ إعدادات واتساب بنجاح');
    } catch {
      alert('فشل حفظ إعدادات واتساب');
    }
  };

  const renderYamlContent = `# Render Blueprint Specification for AutoReply Arabic
services:
  - type: web
    name: autoreply-arabic
    runtime: node
    plan: free
    region: frankfurt
    buildCommand: npm install && npm run build
    startCommand: npm start
    healthCheckPath: /api/health
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3000
      - key: TELEGRAM_BOT_TOKEN
        sync: false
      - key: WHATSAPP_VERIFY_TOKEN
        value: autoreply_secret_token_123
      - key: WHATSAPP_ACCESS_TOKEN
        sync: false
      - key: WHATSAPP_PHONE_NUMBER_ID
        sync: false`;

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-emerald-950/70 via-slate-900 to-teal-950/60 border border-emerald-500/30 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                سيرفر حقيقي متصل (Node.js & Express)
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                Render Ready
              </span>
            </div>
            <h2 className="text-xl font-black text-white">
              التشغيل الحقيقي والفعلي + ملف إعدادات النشر على Render
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              هنا يعمل التطبيق عبر خادم حقيقي يستقبل رسائل حقيقية عبر Webhooks من تيليجرام وواتساب،
              ويُجري تطبيع النص وفلتر النفي ويرسل الردود فوراً، مع ملف جاهز لنشر المشروع بضغطة زر واحدة على منصة Render.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => copyToClipboard(renderYamlContent, 'yaml-btn')}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950/60 transition-all flex items-center gap-2 cursor-pointer"
            >
              {copiedSection === 'yaml-btn' ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>تم نسخ render.yaml</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>نسخ ملف render.yaml</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Configurations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Telegram Real Integration */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#229ED9]/20 text-[#229ED9] border border-[#229ED9]/30 flex items-center justify-center font-bold">
                  TG
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                    <span>تشغيل تيليجرام الفعلي (Real Telegram Bot)</span>
                    <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                      Webhook مباشر
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    اربط بوت تيليجرام حقيقي ليرد على رسائل الناس تلقائياً
                  </p>
                </div>
              </div>
            </div>

            {/* Telegram Webhook URL */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-1">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>رابط الويب هوك الخاص بسيرفرك (Webhook URL):</span>
                <button
                  onClick={() => copyToClipboard(telegramWebhookUrl, 'tg-url')}
                  className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                >
                  {copiedSection === 'tg-url' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedSection === 'tg-url' ? 'تم النسخ' : 'نسخ'}</span>
                </button>
              </div>
              <div className="font-mono text-xs text-emerald-300 break-all dir-ltr text-left">
                {telegramWebhookUrl}
              </div>
            </div>

            {/* Bot Token Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                توكن بوت تيليجرام (Telegram Bot Token من @BotFather):
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={telegramToken}
                  onChange={(e) => setTelegramToken(e.target.value)}
                  placeholder="مثال: 7123456789:AAHk..."
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-[#229ED9]"
                />
                <button
                  onClick={handleTestBot}
                  disabled={testingBot || !telegramToken}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 shrink-0"
                >
                  {testingBot ? 'جارٍ الفحص...' : 'فحص البوت'}
                </button>
              </div>
            </div>

            {/* Bot Info Feedback */}
            {botInfo && (
              <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-3 text-xs text-emerald-200 flex items-center justify-between">
                <div>
                  <div className="font-bold flex items-center gap-1.5 text-white">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>تم التحقق من البوت: {botInfo.first_name}</span>
                  </div>
                  <span className="text-[11px] text-emerald-300 font-mono">@{botInfo.username}</span>
                </div>
                <button
                  onClick={handleSetWebhook}
                  disabled={settingWebhook}
                  className="px-3 py-1.5 bg-[#229ED9] hover:bg-[#1f8ec4] text-white rounded-lg text-xs font-bold shadow"
                >
                  {settingWebhook ? 'جارٍ التثبيت...' : 'تثبيت الويب هوك الآن'}
                </button>
              </div>
            )}

            {webhookResult && (
              <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-xs text-slate-200">
                {webhookResult}
              </div>
            )}
          </div>

          <div className="text-[11px] text-slate-400 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/80 leading-relaxed">
            💡 <strong>كيف تجربه فعلياً؟</strong> بعد إدخال التوكن والضغط على "تثبيت الويب هوك"، افتح تطبيق تيليجرام على هاتفك وأرسل للبوت رسالة مثل <strong className="text-white">«ابي مساعدة»</strong> وسيرد فوراً، ثم جرب <strong className="text-rose-400">«ما ابي مساعدة»</strong> ولن يرد بفضل فلتر النفي!
          </div>
        </div>

        {/* Section 2: WhatsApp Cloud API Real Integration */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/30 flex items-center justify-center font-bold">
                  WA
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                    <span>تشغيل واتساب الفعلي (WhatsApp Cloud API)</span>
                    <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                      رسمي من Meta
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    ربط بوابة Meta WhatsApp Business الرسمية لاستقبال الرسائل والرد
                  </p>
                </div>
              </div>
            </div>

            {/* WhatsApp Webhook URL */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-1">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>رابط رد الاتصال (Callback URL) في لوحة Meta:</span>
                <button
                  onClick={() => copyToClipboard(whatsappWebhookUrl, 'wa-url')}
                  className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                >
                  {copiedSection === 'wa-url' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedSection === 'wa-url' ? 'تم النسخ' : 'نسخ'}</span>
                </button>
              </div>
              <div className="font-mono text-xs text-emerald-300 break-all dir-ltr text-left">
                {whatsappWebhookUrl}
              </div>
            </div>

            {/* Verify Token */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>رمز التحقق (Verify Token) في لوحة Meta:</span>
                <button
                  onClick={() => copyToClipboard(whatsappVerifyToken, 'wa-token')}
                  className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                >
                  {copiedSection === 'wa-token' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedSection === 'wa-token' ? 'تم النسخ' : 'نسخ'}</span>
                </button>
              </div>
              <input
                type="text"
                value={whatsappVerifyToken}
                onChange={(e) => setWhatsappVerifyToken(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#25D366]"
              />
            </div>

            {/* Phone Number ID & Token */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Phone Number ID:</label>
                <input
                  type="text"
                  value={whatsappPhoneId}
                  onChange={(e) => setWhatsappPhoneId(e.target.value)}
                  placeholder="معرف رقم الهاتف"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Permanent Token:</label>
                <input
                  type="password"
                  value={whatsappToken}
                  onChange={(e) => setWhatsappToken(e.target.value)}
                  placeholder="رمز الوصول الدائم"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono"
                />
              </div>
            </div>

            <button
              onClick={handleSaveWhatsApp}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl text-xs font-bold transition-all"
            >
              حفظ إعدادات واتساب
            </button>
          </div>

          <div className="text-[11px] text-slate-400 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/80 leading-relaxed">
            💡 في موقع developers.facebook.com: أضف WhatsApp المنتج، واذهب إلى Webhooks وضع الـ Callback URL والـ Verify Token واشترك في حقل <strong className="text-white">messages</strong>.
          </div>
        </div>
      </div>

      {/* Section 3: Render Deployment Guide & render.yaml */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center">
              <Cloud className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>ملف إعدادات النشر على منصة Render (render.yaml)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-500/40">
                  Blueprint Ready
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                تم تضمين ملف render.yaml رسمياً في جذر المشروع. يمكنك نشره مباشرة على Render في خطوات بسيطة.
              </p>
            </div>
          </div>

          <button
            onClick={() => copyToClipboard(renderYamlContent, 'yaml-code')}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-slate-200 flex items-center gap-1.5 transition-colors"
          >
            {copiedSection === 'yaml-code' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>تم النسخ!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>نسخ محتوى render.yaml</span>
              </>
            )}
          </button>
        </div>

        {/* 4 Steps to Deploy on Render */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 space-y-1">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs mb-1">
              1
            </div>
            <h4 className="font-bold text-white">ارفع المشروع إلى GitHub</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              ارفع الكود إلى مستودع (Repository) في حسابك على GitHub مع ملف render.yaml.
            </p>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 space-y-1">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs mb-1">
              2
            </div>
            <h4 className="font-bold text-white">افتح Render.com</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              سجل الدخول في render.com واضغط على زر <strong className="text-white">New +</strong> ثم اختر <strong className="text-white">Blueprint</strong>.
            </p>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 space-y-1">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs mb-1">
              3
            </div>
            <h4 className="font-bold text-white">اختر المستودع</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              سيقرأ Render ملف <code className="text-emerald-300">render.yaml</code> تلقائياً ويجهز السيرفر والإعدادات.
            </p>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 space-y-1">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs mb-1">
              4
            </div>
            <h4 className="font-bold text-white">اضغط Apply ومبروك!</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              خلال دقيقة واحدة سيكون تطبيق الرد التلقائي منشوراً برابط دائم HTTPS شغال 24/7!
            </p>
          </div>
        </div>

        {/* Code Block */}
        <div className="bg-slate-950 rounded-2xl p-3.5 border border-slate-800 font-mono text-xs text-slate-300 dir-ltr text-left overflow-x-auto">
          <pre>{renderYamlContent}</pre>
        </div>
      </div>

      {/* Section 4: Live Real-time Server Logs */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <h3 className="font-bold text-sm text-white">
              سجل أحداث السيرفر والويب هوك الفعلي (Live Server & Webhook Logs)
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">({logs.length} حدث)</span>
          </div>

          <button
            onClick={fetchLogs}
            className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>تحديث</span>
          </button>
        </div>

        <div className="max-h-60 overflow-y-auto divide-y divide-slate-800/80 text-xs font-mono">
          {logs.length === 0 ? (
            <div className="py-8 text-center text-slate-500 font-sans">
              لا توجد رسائل واردة عبر الويب هوك بعد. أرسل رسالة للبوت على تيليجرام أو استخدم مختبر المحاكاة لرؤية السجل الحي فوراً!
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="py-2.5 flex items-start justify-between gap-3 font-sans">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-bold uppercase ${
                        log.source === 'telegram'
                          ? 'bg-[#229ED9]/20 text-[#229ED9]'
                          : log.source === 'whatsapp'
                          ? 'bg-[#25D366]/20 text-[#25D366]'
                          : 'bg-indigo-950 text-indigo-300'
                      }`}
                    >
                      {log.source}
                    </span>
                    <span className="font-bold text-white text-xs">{log.sender}</span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(log.timestamp).toLocaleTimeString('ar-SA')}
                    </span>
                  </div>
                  <div className="text-slate-300 text-xs">الرسالة: "{log.rawMessage}"</div>
                  <div className="text-[11px] text-slate-400">{log.details}</div>
                  {log.replySent && (
                    <div className="text-[11px] text-emerald-300 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded">
                      رد السيرفر: "{log.replySent}"
                    </div>
                  )}
                </div>

                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                    log.status === 'REPLIED'
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                      : log.status === 'IGNORED_NEGATION'
                      ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {log.status === 'REPLIED'
                    ? 'تم الرد الفعلي'
                    : log.status === 'IGNORED_NEGATION'
                    ? 'حُجب بفلتر النفي'
                    : log.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
