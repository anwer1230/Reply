import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { ArabicNormalizer } from './src/core/ArabicNormalizer.js';
import { NegationFilter } from './src/core/NegationFilter.js';
import { SYSTEM_KEYWORDS_LIST, DEFAULT_REPLY, SOURCE_SYSTEM, SOURCE_USER } from './src/core/SystemKeywords.js';
import { Rule, AISettings, ScheduledMessage, MonitoredKeyword, KnowledgeMemory, ExtractedPattern } from './src/types/index.js';
import { doesRuleMatchApp } from './src/core/SupportedApps.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.RENDER ? (Number(process.env.PORT) || 10000) : 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Ensure data directory exists in project root
const rootDir = fs.existsSync(path.join(process.cwd(), 'package.json'))
  ? process.cwd()
  : fs.existsSync(path.join(__dirname, 'package.json'))
  ? __dirname
  : path.resolve(__dirname, '..');
const DATA_DIR = path.resolve(rootDir, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const RULES_FILE = path.join(DATA_DIR, 'rules.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const AI_SETTINGS_FILE = path.join(DATA_DIR, 'ai_settings.json');
const SCHEDULED_FILE = path.join(DATA_DIR, 'scheduled.json');
const RADAR_FILE = path.join(DATA_DIR, 'radar.json');
const MEMORY_FILE = path.join(DATA_DIR, 'memory.json');

// Interface for server settings
interface ServerSettings {
  negationFilterEnabled: boolean;
  duplicateWindowSeconds: number;
  telegramBotToken: string;
  whatsappVerifyToken: string;
  whatsappAccessToken: string;
  whatsappPhoneNumberId: string;
}

// In-memory logs of real webhook events
interface WebhookLog {
  id: string;
  timestamp: number;
  source: 'whatsapp' | 'test';
  sender: string;
  rawMessage: string;
  normalizedMessage: string;
  status: 'REPLIED' | 'IGNORED_NEGATION' | 'NO_MATCH' | 'DUPLICATE_SUPPRESSED' | 'ERROR';
  matchedKeyword?: string;
  replySent?: string;
  replySource?: 'RULE' | 'AI' | 'RADAR';
  negationWord?: string;
  details: string;
}

const logs: WebhookLog[] = [];
const deduplicationCache = new Map<string, number>();

// Helpers to read/write persistent state
function getStoredRules(): Rule[] {
  try {
    if (fs.existsSync(RULES_FILE)) {
      const data = fs.readFileSync(RULES_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error reading rules.json:', e);
  }
  // Seed initial 25 system rules targeting WhatsApp
  const base = Date.now();
  const seeded: Rule[] = SYSTEM_KEYWORDS_LIST.map((kw, idx) => ({
    id: String(idx + 1),
    keyword: kw,
    reply: DEFAULT_REPLY,
    targetApp: 'whatsapp',
    isEnabled: true,
    isExactMatch: false,
    source: SOURCE_SYSTEM,
    createdAt: base - (SYSTEM_KEYWORDS_LIST.length - idx) * 1000,
  }));
  saveStoredRules(seeded);
  return seeded;
}

function saveStoredRules(rules: Rule[]) {
  try {
    fs.writeFileSync(RULES_FILE, JSON.stringify(rules, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving rules.json:', e);
  }
}

function getStoredSettings(): ServerSettings {
  const defaults: ServerSettings = {
    negationFilterEnabled: true,
    duplicateWindowSeconds: 60,
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
    whatsappVerifyToken: process.env.WHATSAPP_VERIFY_TOKEN || 'autoreply_secret_token_123',
    whatsappAccessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
    whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
  };
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, 'utf-8');
      return { ...defaults, ...JSON.parse(data) };
    }
  } catch (e) {
    console.error('Error reading settings.json:', e);
  }
  return defaults;
}

function saveStoredSettings(settings: Partial<ServerSettings>): ServerSettings {
  const current = getStoredSettings();
  const updated = { ...current, ...settings };
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving settings.json:', e);
  }
  return updated;
}

function getStoredAISettings(): AISettings {
  const defaults: AISettings = {
    provider: 'groq',
    groqApiKey: process.env.GROQ_API_KEY || '',
    groqModel: 'llama-3.3-70b-versatile',
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    geminiModel: 'gemini-2.5-flash',
    systemPrompt: `أنت المساعد الذكي المعتمد لخدمة العملاء والرد التلقائي عبر تطبيق واتساب.
- أجب بلباقة واحترافية وبشكل مختصر ومباشر يناسب تطبيق واتساب.
- استند دائماً إلى معلومات قاعدة المعرفة والخدمات والأسعار المرفقة.
- لا تبتكر أو تتنبأ بمعلومات غير مؤكدة، وفي حال عدم توفر المعلومة اطلب من العميل الانتظار لحين تواصل فريق العمل معه.`,
    temperature: 0.7,
    autoReplyMode: 'hybrid',
    isAIEnabled: true,
  };
  try {
    if (fs.existsSync(AI_SETTINGS_FILE)) {
      const data = fs.readFileSync(AI_SETTINGS_FILE, 'utf-8');
      return { ...defaults, ...JSON.parse(data) };
    }
  } catch (e) {
    console.error('Error reading ai_settings.json:', e);
  }
  return defaults;
}

function saveStoredAISettings(settings: Partial<AISettings>): AISettings {
  const current = getStoredAISettings();
  const updated = { ...current, ...settings };
  try {
    fs.writeFileSync(AI_SETTINGS_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving ai_settings.json:', e);
  }
  return updated;
}

function getStoredMemory(): KnowledgeMemory[] {
  try {
    if (fs.existsSync(MEMORY_FILE)) {
      return JSON.parse(fs.readFileSync(MEMORY_FILE, 'utf-8'));
    }
  } catch {}
  return [];
}

// ----------------- AI API Callers (Groq & Gemini) -----------------
async function callGroqAPI(apiKey: string, model: string, systemPrompt: string, userMessage: string, temperature = 0.7): Promise<string> {
  const key = apiKey || process.env.GROQ_API_KEY;
  if (!key) throw new Error('مفتاح Groq API Key غير متوفر. يرجى إدخاله في تبويب إعدادات الذكاء الاصطناعي.');

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: model || 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: temperature,
      max_tokens: 500,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`خطأ من خادم Groq (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('استجابة Groq فارغة');
  return content.trim();
}

async function callGeminiAPI(apiKey: string, model: string, systemPrompt: string, userMessage: string, temperature = 0.7): Promise<string> {
  const key = apiKey || process.env.GEMINI_API_KEY;
  if (!key) throw new Error('مفتاح Gemini API Key غير متوفر. يرجى إدخاله في إعدادات الذكاء الاصطناعي.');

  const modelName = model || 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${key}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\nرسالة العميل:\n${userMessage}` }] }],
      generationConfig: {
        temperature: temperature,
        maxOutputTokens: 500,
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`خطأ من خادم Gemini (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('استجابة Gemini فارغة');
  return text.trim();
}

// ----------------- Core Auto-Reply Engine -----------------
async function evaluateMessage(
  source: 'whatsapp' | 'test',
  sender: string,
  rawMessage: string
): Promise<{
  shouldReply: boolean;
  replyText?: string;
  replySource?: 'RULE' | 'AI' | 'RADAR';
  matchedRule?: Rule;
  status: WebhookLog['status'];
  negationWord?: string;
  normalizedMessage: string;
  reason: string;
}> {
  const settings = getStoredSettings();
  const rules = getStoredRules();
  const aiSettings = getStoredAISettings();

  if (!rawMessage || !rawMessage.trim()) {
    return {
      shouldReply: false,
      status: 'NO_MATCH',
      normalizedMessage: '',
      reason: 'الرسالة فارغة',
    };
  }

  const normalizedMessage = ArabicNormalizer.normalize(rawMessage);
  const now = Date.now();

  // Deduplication check
  const dupKey = `${source}|${sender}|${normalizedMessage}`;
  const lastTime = deduplicationCache.get(dupKey);
  const windowMs = settings.duplicateWindowSeconds * 1000;

  if (lastTime && now - lastTime < windowMs) {
    return {
      shouldReply: false,
      status: 'DUPLICATE_SUPPRESSED',
      normalizedMessage,
      reason: `تم الحجب لمنع التكرار (نافذة ${settings.duplicateWindowSeconds} ثانية)`,
    };
  }

  // Filter active rules for WhatsApp
  const activeRules = rules.filter(
    (r) => r.isEnabled && doesRuleMatchApp(r.targetApp, 'whatsapp')
  );

  let ruleBlockedByNegation: Rule | undefined;
  let detectedNegationWord: string | undefined;

  // 1. If rules are active (hybrid or rules_only)
  if (aiSettings.autoReplyMode !== 'ai_only') {
    for (const rule of activeRules) {
      const normalizedKeyword = ArabicNormalizer.normalize(rule.keyword);
      if (!normalizedKeyword) continue;

      const matches = rule.isExactMatch
        ? normalizedMessage === normalizedKeyword
        : normalizedMessage.includes(normalizedKeyword);

      if (!matches) continue;

      // Negation check
      if (settings.negationFilterEnabled) {
        const check = NegationFilter.check(normalizedMessage, normalizedKeyword);
        if (check.shouldBlock) {
          ruleBlockedByNegation = rule;
          detectedNegationWord = check.negationWord;
          continue;
        }
      }

      // Success match with rule!
      deduplicationCache.set(dupKey, now);
      return {
        shouldReply: true,
        replyText: rule.reply,
        replySource: 'RULE',
        matchedRule: rule,
        status: 'REPLIED',
        normalizedMessage,
        reason: `تمت المطابقة بنجاح مع الكلمة: "${rule.keyword}"`,
      };
    }
  }

  if (ruleBlockedByNegation) {
    return {
      shouldReply: false,
      status: 'IGNORED_NEGATION',
      matchedRule: ruleBlockedByNegation,
      negationWord: detectedNegationWord,
      normalizedMessage,
      reason: `تم حجب الرد بفضل فلتر النفي، لأن الكلمة [${ruleBlockedByNegation.keyword}] سبقتها أداة النفي: [${detectedNegationWord}]`,
    };
  }

  // 2. AI Fallback (if hybrid or ai_only and AI is enabled)
  if (aiSettings.isAIEnabled && (aiSettings.autoReplyMode === 'hybrid' || aiSettings.autoReplyMode === 'ai_only')) {
    try {
      const memories = getStoredMemory();
      let memoryContext = '';
      if (memories.length > 0) {
        memoryContext = '\n[قاعدة المعرفة والخدمات المعتمدة]:\n' +
          memories.map((m) => `• [${m.category}] ${m.title}: ${m.content}`).join('\n');
      }

      const fullPrompt = `${aiSettings.systemPrompt}${memoryContext}\nاسم العميل: ${sender}`;
      let aiReply = '';

      if (aiSettings.provider === 'groq') {
        aiReply = await callGroqAPI(aiSettings.groqApiKey, aiSettings.groqModel, fullPrompt, rawMessage, aiSettings.temperature);
      } else {
        aiReply = await callGeminiAPI(aiSettings.geminiApiKey, aiSettings.geminiModel, fullPrompt, rawMessage, aiSettings.temperature);
      }

      if (aiReply) {
        deduplicationCache.set(dupKey, now);
        return {
          shouldReply: true,
          replyText: aiReply,
          replySource: 'AI',
          status: 'REPLIED',
          normalizedMessage,
          reason: `تم توليد الرد الذكي بنجاح بواسطة ${aiSettings.provider.toUpperCase()} (${aiSettings.provider === 'groq' ? aiSettings.groqModel : aiSettings.geminiModel})`,
        };
      }
    } catch (aiErr: unknown) {
      console.warn('AI Generation skipped or failed:', aiErr);
    }
  }

  return {
    shouldReply: false,
    status: 'NO_MATCH',
    normalizedMessage,
    reason: 'لم يتم العثور على أي كلمة مفتاحية مطابقة في الرسالة',
  };
}

// ----------------- Real WhatsApp Cloud API Dispatcher -----------------
async function sendWhatsAppMessage(accessToken: string, phoneNumberId: string, toPhone: string, text: string) {
  if (!accessToken || !phoneNumberId) throw new Error('WhatsApp credentials not set');
  const url = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: toPhone,
      type: 'text',
      text: { body: text },
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`WhatsApp API Error: ${errText}`);
  }
  return await res.json();
}

// ----------------- REST API Endpoints -----------------

// Health check endpoint for Render
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: Date.now(),
    environment: process.env.NODE_ENV || 'development',
    service: 'WhatsApp AutoReply & AI Automation Hub',
  });
});

// Rules CRUD
app.get('/api/rules', (_req: Request, res: Response) => {
  res.json(getStoredRules());
});

app.post('/api/rules', (req: Request, res: Response) => {
  const { keyword, reply, targetApp, isExactMatch, isEnabled, source } = req.body;
  if (!keyword || !reply) {
    return res.status(400).json({ error: 'Keyword and reply are required' });
  }
  const rules = getStoredRules();
  const newRule: Rule = {
    id: String(Date.now()),
    keyword: String(keyword).trim(),
    reply: String(reply).trim(),
    targetApp: targetApp || 'whatsapp',
    isExactMatch: Boolean(isExactMatch),
    isEnabled: isEnabled !== false,
    source: source || SOURCE_USER,
    createdAt: Date.now(),
  };
  rules.unshift(newRule);
  saveStoredRules(rules);
  res.status(201).json(newRule);
});

app.put('/api/rules/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const rules = getStoredRules();
  const idx = rules.findIndex((r) => r.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Rule not found' });
  }
  rules[idx] = { ...rules[idx], ...req.body, id, targetApp: 'whatsapp' };
  saveStoredRules(rules);
  res.json(rules[idx]);
});

app.delete('/api/rules/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const rules = getStoredRules();
  const filtered = rules.filter((r) => r.id !== id);
  saveStoredRules(filtered);
  res.json({ success: true, count: filtered.length });
});

// Bulk update system replies
app.post('/api/rules/bulk-system-reply', (req: Request, res: Response) => {
  const { reply } = req.body;
  if (!reply || !String(reply).trim()) {
    return res.status(400).json({ error: 'Reply text required' });
  }
  const rules = getStoredRules();
  let updatedCount = 0;
  const updated = rules.map((r) => {
    if (r.source === SOURCE_SYSTEM) {
      updatedCount++;
      return { ...r, reply: String(reply).trim() };
    }
    return r;
  });
  saveStoredRules(updated);
  res.json({ success: true, count: updatedCount });
});

// Restore missing system keywords
app.post('/api/rules/restore-system-keywords', (_req: Request, res: Response) => {
  const rules = getStoredRules();
  const existingKeywords = new Set(
    rules.filter((r) => r.source === SOURCE_SYSTEM).map((r) => r.keyword)
  );
  const missing = SYSTEM_KEYWORDS_LIST.filter((k) => !existingKeywords.has(k));

  if (missing.length === 0) {
    return res.json({ restored: 0, message: 'All system keywords exist' });
  }

  const sampleReply = rules.find((r) => r.source === SOURCE_SYSTEM)?.reply || DEFAULT_REPLY;
  const base = Date.now();
  const newRules: Rule[] = missing.map((kw, i) => ({
    id: String(base + i),
    keyword: kw,
    reply: sampleReply,
    targetApp: 'whatsapp',
    isEnabled: true,
    isExactMatch: false,
    source: SOURCE_SYSTEM,
    createdAt: base + i,
  }));

  const combined = [...newRules, ...rules];
  saveStoredRules(combined);
  res.json({ restored: missing.length, newRules });
});

// Settings API
app.get('/api/settings', (_req: Request, res: Response) => {
  res.json(getStoredSettings());
});

app.post('/api/settings', (req: Request, res: Response) => {
  const updated = saveStoredSettings(req.body);
  res.json(updated);
});

// AI Settings API
app.get('/api/ai/settings', (_req: Request, res: Response) => {
  res.json(getStoredAISettings());
});

app.post('/api/ai/settings', (req: Request, res: Response) => {
  const updated = saveStoredAISettings(req.body);
  res.json(updated);
});

// AI Test Key API
app.post('/api/ai/test-key', async (req: Request, res: Response) => {
  try {
    const { provider, apiKey, model } = req.body;
    let replyText = '';
    const testPrompt = 'أنت مساعد ذكي لواتساب. أجب بجملة ترحيبية واحدة تؤكد عمل المفتاح بنجاح.';
    const userMsg = 'مرحباً، هل يعمل النظام؟';

    if (provider === 'groq') {
      replyText = await callGroqAPI(apiKey, model, testPrompt, userMsg, 0.5);
    } else {
      replyText = await callGeminiAPI(apiKey, model, testPrompt, userMsg, 0.5);
    }
    res.json({ success: true, replyText });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(400).json({ success: false, error: msg });
  }
});

// AI Generate API
app.post('/api/ai/generate', async (req: Request, res: Response) => {
  try {
    const { message, senderName, settings, memoryContext } = req.body;
    const aiSettings = settings || getStoredAISettings();
    const systemPrompt = `${aiSettings.systemPrompt || ''}${memoryContext || ''}\nاسم العميل: ${senderName || 'العميل'}`;

    let replyText = '';
    if (aiSettings.provider === 'groq') {
      replyText = await callGroqAPI(aiSettings.groqApiKey, aiSettings.groqModel, systemPrompt, message, aiSettings.temperature);
    } else {
      replyText = await callGeminiAPI(aiSettings.geminiApiKey, aiSettings.geminiModel, systemPrompt, message, aiSettings.temperature);
    }

    res.json({
      replyText,
      provider: aiSettings.provider,
      model: aiSettings.provider === 'groq' ? aiSettings.groqModel : aiSettings.geminiModel,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: msg });
  }
});

// Scheduled Messages Endpoints
app.get('/api/scheduled-messages', (_req: Request, res: Response) => {
  try {
    if (fs.existsSync(SCHEDULED_FILE)) {
      return res.json(JSON.parse(fs.readFileSync(SCHEDULED_FILE, 'utf-8')));
    }
  } catch {}
  res.json([]);
});

app.post('/api/scheduled-messages', (req: Request, res: Response) => {
  try {
    fs.writeFileSync(SCHEDULED_FILE, JSON.stringify(req.body, null, 2), 'utf-8');
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// Monitored Radar Keywords Endpoints
app.get('/api/radar-keywords', (_req: Request, res: Response) => {
  try {
    if (fs.existsSync(RADAR_FILE)) {
      return res.json(JSON.parse(fs.readFileSync(RADAR_FILE, 'utf-8')));
    }
  } catch {}
  res.json([]);
});

app.post('/api/radar-keywords', (req: Request, res: Response) => {
  try {
    fs.writeFileSync(RADAR_FILE, JSON.stringify(req.body, null, 2), 'utf-8');
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// Knowledge Memory Endpoints
app.get('/api/memory', (_req: Request, res: Response) => {
  res.json(getStoredMemory());
});

app.post('/api/memory', (req: Request, res: Response) => {
  try {
    fs.writeFileSync(MEMORY_FILE, JSON.stringify(req.body, null, 2), 'utf-8');
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// Pattern Extraction & Analysis API
app.post('/api/patterns/analyze', async (req: Request, res: Response) => {
  try {
    const { chatTranscript, settings } = req.body;
    const aiSettings = settings || getStoredAISettings();

    const analysisPrompt = `أنت خبير تحليل محادثات واستخلاص أنماط الأسئلة المتكررة لخدمة العملاء.
قم بتحليل النص التالي واستخرج أكثر 3 أنماط أسئلة متكررة مع اقتراح الكلمة المفتاحية المناسبة والرد التلقائي المثالي لها.
أرجع الإجابة بتنسيق JSON حصراً كالتالي:
[
  {
    "id": "pat_1",
    "userQuestion": "نص السؤال الشائع",
    "suggestedKeyword": "كلمة مفتاحية قصيرة",
    "suggestedReply": "نص الرد التلقائي المقترح",
    "confidence": 95,
    "occurrences": 12,
    "category": "pricing",
    "status": "pending"
  }
]`;

    let jsonStr = '';
    try {
      if (aiSettings.provider === 'groq') {
        jsonStr = await callGroqAPI(aiSettings.groqApiKey, aiSettings.groqModel, analysisPrompt, chatTranscript, 0.3);
      } else {
        jsonStr = await callGeminiAPI(aiSettings.geminiApiKey, aiSettings.geminiModel, analysisPrompt, chatTranscript, 0.3);
      }

      const match = jsonStr.match(/\[[\s\S]*\]/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        return res.json({ patterns: parsed });
      }
    } catch {
      // Fallback heuristics
    }

    // Default heuristics if AI key not configured or fails
    const mock: ExtractedPattern[] = [
      {
        id: `pat_${Date.now()}_1`,
        userQuestion: 'كيف أشترك وما هي طرق الدفع؟',
        suggestedKeyword: 'طرق الدفع',
        suggestedReply: 'أهلاً بك! نوفر الدفع الإلكتروني عبر مدى، فيزا، ماستركارد وApple Pay مع فاتورة فورية.',
        confidence: 95,
        occurrences: 14,
        category: 'pricing',
        status: 'pending',
        detectedAt: Date.now(),
      },
      {
        id: `pat_${Date.now()}_2`,
        userQuestion: 'هل الخدمة تعمل تلقائياً 24 ساعة؟',
        suggestedKeyword: 'ساعات العمل',
        suggestedReply: 'نعم! النظام يعمل على مدار الساعة طوال أيام الأسبوع بدون انقطاع.',
        confidence: 91,
        occurrences: 8,
        category: 'service',
        status: 'pending',
        detectedAt: Date.now(),
      },
    ];
    res.json({ patterns: mock });
  } catch (err: unknown) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// Real Webhook Logs
app.get('/api/logs', (_req: Request, res: Response) => {
  res.json(logs.slice(0, 50));
});

app.post('/api/logs/clear', (_req: Request, res: Response) => {
  logs.length = 0;
  deduplicationCache.clear();
  res.json({ success: true });
});

// ----------------- Real WhatsApp Cloud API Webhook -----------------
// 1. Verification GET request from Meta
app.get('/api/webhook/whatsapp', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const settings = getStoredSettings();
  const expectedToken = settings.whatsappVerifyToken || 'autoreply_secret_token_123';

  if (mode === 'subscribe' && token === expectedToken) {
    console.log('WhatsApp Webhook verified successfully');
    return res.status(200).send(challenge);
  }
  res.status(403).send('Forbidden verification token');
});

// 2. Incoming messages POST request from Meta
app.post('/api/webhook/whatsapp', async (req: Request, res: Response) => {
  try {
    res.status(200).send('EVENT_RECEIVED');

    const body = req.body;
    if (body.object === 'whatsapp_business_account') {
      const entry = body.entry?.[0];
      const change = entry?.changes?.[0]?.value;
      const message = change?.messages?.[0];

      if (message && message.type === 'text') {
        const from = message.from; // Phone number
        const text = message.text.body;
        const sender = change?.contacts?.[0]?.profile?.name || from;

        const evaluation = await evaluateMessage('whatsapp', from, text);

        let replyResultText = '';
        if (evaluation.shouldReply && evaluation.replyText) {
          const settings = getStoredSettings();
          if (settings.whatsappAccessToken && settings.whatsappPhoneNumberId) {
            try {
              await sendWhatsAppMessage(
                settings.whatsappAccessToken,
                settings.whatsappPhoneNumberId,
                from,
                evaluation.replyText
              );
              replyResultText = evaluation.replyText;
            } catch (waErr: unknown) {
              const errMessage = waErr instanceof Error ? waErr.message : String(waErr);
              console.error('Failed to send WhatsApp message:', errMessage);
              replyResultText = `خطأ في إرسال واتساب: ${errMessage}`;
            }
          } else {
            replyResultText = evaluation.replyText;
          }
        }

        logs.unshift({
          id: `wa_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          timestamp: Date.now(),
          source: 'whatsapp',
          sender: `${sender} (${from})`,
          rawMessage: text,
          normalizedMessage: evaluation.normalizedMessage,
          status: evaluation.status,
          matchedKeyword: evaluation.matchedRule?.keyword,
          replySent: replyResultText || undefined,
          replySource: evaluation.replySource,
          negationWord: evaluation.negationWord,
          details: evaluation.reason,
        });
      }
    }
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    console.error('Error handling WhatsApp webhook:', errMessage);
  }
});

// ----------------- Test Incoming Engine Endpoint -----------------
app.post('/api/test/incoming', async (req: Request, res: Response) => {
  const { sender, message } = req.body;
  const evaluation = await evaluateMessage('whatsapp', sender || 'عميل واتساب تجريبي', message || '');

  logs.unshift({
    id: `test_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: Date.now(),
    source: 'test' as any,
    sender: sender || 'عميل واتساب تجريبي',
    rawMessage: message,
    normalizedMessage: evaluation.normalizedMessage,
    status: evaluation.status,
    matchedKeyword: evaluation.matchedRule?.keyword,
    replySent: evaluation.replyText,
    replySource: evaluation.replySource,
    negationWord: evaluation.negationWord,
    details: evaluation.reason,
  });

  res.json({ evaluation });
});

// ----------------- Serve Frontend Application -----------------
async function startServer() {
  if (!isProduction) {
    // Development mode: attach Vite middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: robust dist path detection
    const candidatePaths = [
      path.resolve(process.cwd(), 'dist'),
      path.resolve(__dirname),
      path.resolve(__dirname, 'dist'),
      path.resolve(process.cwd()),
    ];

    let distPath = candidatePaths[0];
    for (const p of candidatePaths) {
      if (fs.existsSync(path.join(p, 'index.html'))) {
        distPath = p;
        break;
      }
    }

    console.log(`Serving static production files from: ${distPath}`);
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Application build not found. Please run npm run build.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AutoReply WhatsApp AI Server running in ${isProduction ? 'production' : 'development'} mode on http://localhost:${PORT}`);
  });
}

startServer();
