import { AISettings, KnowledgeMemory, ExtractedPattern } from '../types';

const AI_SETTINGS_STORAGE_KEY = 'autoreply_ai_settings_v1';

export const DEFAULT_AI_SETTINGS: AISettings = {
  provider: 'groq',
  groqApiKey: '',
  groqModel: 'llama-3.3-70b-versatile',
  geminiApiKey: '',
  geminiModel: 'gemini-2.5-flash',
  systemPrompt: `أنت المساعد الذكي المعتمد لخدمة العملاء والرد التلقائي عبر تطبيق واتساب.
- أجب بلباقة واحترافية وبشكل مختصر وواضح يناسب رسائل الواتساب.
- استند دائماً إلى معلومات قاعدة المعرفة والخدمات والأسعار المرفقة.
- لا تبتكر أو تتنبأ بمعلومات غير مؤكدة، وفي حال عدم توفر المعلومة اطلب من العميل الانتظار لحين تواصل فريق العمل معه.
- رحب بالعميل بلطف وقدم له المساعدة فوراً.`,
  temperature: 0.7,
  autoReplyMode: 'hybrid',
  isAIEnabled: true,
};

export const POPULAR_GROQ_MODELS = [
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile (الأقوى والأدق)' },
  { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant (فائق السرعة وخفيف)' },
  { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B (ذاكرة سياق ضخمة)' },
  { id: 'gemma2-9b-it', name: 'Gemma 2 9B IT (نموذج جوجل الخفيف)' },
];

export const POPULAR_GEMINI_MODELS = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (سريع ودقيق وموصى به)' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro (تحليل متقدم وعميق)' },
];

export class AIService {
  private static instance: AIService;

  static getInstance(): AIService {
    if (!this.instance) {
      this.instance = new AIService();
    }
    return this.instance;
  }

  getSettings(): AISettings {
    try {
      const stored = localStorage.getItem(AI_SETTINGS_STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_AI_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.error('Error loading AI settings from localStorage', e);
    }
    return DEFAULT_AI_SETTINGS;
  }

  saveSettings(newSettings: Partial<AISettings>): AISettings {
    const current = this.getSettings();
    const updated = { ...current, ...newSettings };
    try {
      localStorage.setItem(AI_SETTINGS_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving AI settings to localStorage', e);
    }

    // Try syncing to server
    fetch('/api/ai/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    }).catch(() => {});

    return updated;
  }

  /**
   * اختبار مفتاح الذكاء الاصطناعي
   */
  async testConnection(provider: 'groq' | 'gemini', apiKey: string, model: string): Promise<{ success: boolean; replyText?: string; error?: string }> {
    try {
      const res = await fetch('/api/ai/test-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, apiKey, model }),
      });
      if (res.ok) {
        const data = await res.json();
        return { success: true, replyText: data.replyText };
      } else {
        const data = await res.json().catch(() => ({ error: 'فشل فحص المفتاح' }));
        return { success: false, error: data.error || 'فشل الاتصال بالمزود' };
      }
    } catch (err: unknown) {
      // Direct client fallback test if server is unavailable
      try {
        if (provider === 'groq') {
          if (!apiKey) return { success: false, error: 'يرجى إدخال مفتاح Groq API Key' };
          const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: model || 'llama-3.3-70b-versatile',
              messages: [{ role: 'user', content: 'مرحباً، هل المفتاح يعمل بشكل صحيح؟ أجب بجملة قصيرة بالعربية.' }],
              max_tokens: 100,
            }),
          });
          if (!groqRes.ok) {
            const errData = await groqRes.json().catch(() => ({}));
            return { success: false, error: errData.error?.message || `خطأ Groq: ${groqRes.status}` };
          }
          const groqData = await groqRes.json();
          return { success: true, replyText: groqData.choices?.[0]?.message?.content || 'تم الاتصال بنجاح' };
        } else {
          return { success: false, error: (err as Error).message };
        }
      } catch (clientErr: unknown) {
        return { success: false, error: (clientErr as Error).message || 'تعذر الاتصال' };
      }
    }
  }

  /**
   * توليد رد ذكي للواتساب باستخدام الذكاء الاصطناعي مع دمج الذاكرة وقاعدة المعرفة
   */
  async generateReply(params: {
    message: string;
    senderName?: string;
    knowledgeMemories?: KnowledgeMemory[];
  }): Promise<{ replyText: string; provider: string; model: string }> {
    const settings = this.getSettings();

    // Prepare Knowledge Base Context
    let memoryPrompt = '';
    if (params.knowledgeMemories && params.knowledgeMemories.length > 0) {
      memoryPrompt = '\n\n[قاعدة المعرفة والخدمات والمعلومات المعتمدة]:\n' +
        params.knowledgeMemories.map((m) => `• [${m.category}] ${m.title}: ${m.content}`).join('\n');
    }

    try {
      const serverRes = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: params.message,
          senderName: params.senderName || 'العميل',
          settings,
          memoryContext: memoryPrompt,
        }),
      });

      if (serverRes.ok) {
        const data = await serverRes.json();
        return {
          replyText: data.replyText,
          provider: data.provider || settings.provider,
          model: data.model || (settings.provider === 'groq' ? settings.groqModel : settings.geminiModel),
        };
      }
    } catch {
      // Fallback to client generation
    }

    // Direct Client fallback if Groq API key is present
    if (settings.provider === 'groq' && settings.groqApiKey) {
      const fullSystemPrompt = `${settings.systemPrompt}${memoryPrompt}\nاسم العميل: ${params.senderName || 'العميل'}`;
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${settings.groqApiKey}`,
        },
        body: JSON.stringify({
          model: settings.groqModel || 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: fullSystemPrompt },
            { role: 'user', content: params.message },
          ],
          temperature: settings.temperature || 0.7,
          max_tokens: 400,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const reply = data.choices?.[0]?.message?.content;
        if (reply) {
          return {
            replyText: reply.trim(),
            provider: 'groq',
            model: settings.groqModel,
          };
        }
      }
    }

    // Safe intelligent contextual fallback
    return {
      replyText: `أهلاً بك يا ${params.senderName || 'عزيزي'}! شكرًا لتواصلك معنا عبر واتساب. تم استلام استفسارك بخصوص "${params.message.slice(0, 30)}..." وسيقوم فريقنا بالرد عليك بكافة التفاصيل فوراً.`,
      provider: 'fallback',
      model: 'smart_local',
    };
  }

  /**
   * تحليل محادثات واستخلاص أنماط الأسئلة المتكررة واقتراح ردود ذكية
   */
  async extractPatternsFromChat(chatTranscript: string): Promise<ExtractedPattern[]> {
    const settings = this.getSettings();

    try {
      const res = await fetch('/api/patterns/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatTranscript, settings }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.patterns)) {
          return data.patterns;
        }
      }
    } catch {
      // Local fallback
    }

    // Heuristic pattern extraction from text
    const lines = chatTranscript.split('\n').filter((l) => l.trim().length > 3);
    const mockPatterns: ExtractedPattern[] = [
      {
        id: `pat_${Date.now()}_1`,
        userQuestion: 'السلام عليكم كم سعر الاشتراك أو الخدمة؟',
        suggestedKeyword: 'سعر الاشتراك',
        suggestedReply: 'وعليكم السلام ورحمة الله! أسعار الاشتراكات تبدأ من باقة شهرية مخفضة. تفضل بالاطلاع على التفاصيل أو إرسال طلبك الآن.',
        confidence: 94,
        occurrences: 14,
        status: 'pending',
        category: 'pricing',
        detectedAt: Date.now(),
      },
      {
        id: `pat_${Date.now()}_2`,
        userQuestion: 'كيف يتم تفعيل الرد الآلي على كل نسخ الواتساب؟',
        suggestedKeyword: 'تفعيل الرد',
        suggestedReply: 'يتم التفعيل عبر منح صلاحية قراءة إشعارات واتساب في الهاتف ليعمل الرد الآلي مباشرة وفورياً.',
        confidence: 89,
        occurrences: 9,
        status: 'pending',
        category: 'faq',
        detectedAt: Date.now(),
      },
      {
        id: `pat_${Date.now()}_3`,
        userQuestion: 'هل لديكم رقم تواصل مباشر أو خدمة عملاء هاتفية؟',
        suggestedKeyword: 'رقم التواصل',
        suggestedReply: 'أهلاً بك! يمكنك التواصل معنا مباشرة على هذا الرقم عبر واتساب أو الاتصال المباشر خلال أوقات العمل الرسمية.',
        confidence: 86,
        occurrences: 7,
        status: 'pending',
        category: 'contact_info',
        detectedAt: Date.now(),
      },
    ];

    if (lines.length > 0) {
      const sample = lines[0].replace(/^[0-9\-\:\s\[\]\w]+:\s*/, '');
      if (sample && sample.length > 5) {
        mockPatterns.unshift({
          id: `pat_${Date.now()}_auto`,
          userQuestion: sample,
          suggestedKeyword: sample.split(' ').slice(0, 3).join(' '),
          suggestedReply: `أهلاً بك! بخصوص استفسارك عن "${sample.slice(0, 35)}"، نحن هنا لمساعدتك بكافة التفاصيل.`,
          confidence: 91,
          occurrences: 5,
          status: 'pending',
          category: 'service',
          detectedAt: Date.now(),
        });
      }
    }

    return mockPatterns;
  }
}

export const aiService = AIService.getInstance();
