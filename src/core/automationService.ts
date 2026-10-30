import {
  ScheduledMessage,
  MonitoredKeyword,
  KnowledgeMemory,
  ExtractedPattern,
  WhatsAppLiveMessage,
} from '../types';

const SCHEDULED_KEY = 'autoreply_scheduled_messages_v1';
const RADAR_KEY = 'autoreply_monitored_keywords_v1';
const MEMORY_KEY = 'autoreply_knowledge_memory_v1';
const PATTERNS_KEY = 'autoreply_patterns_v1';
const LIVE_STREAM_KEY = 'autoreply_live_stream_v1';

export class AutomationService {
  private static instance: AutomationService;

  static getInstance(): AutomationService {
    if (!this.instance) {
      this.instance = new AutomationService();
    }
    return this.instance;
  }

  // ================= Scheduled Messages =================
  getScheduledMessages(): ScheduledMessage[] {
    try {
      const raw = localStorage.getItem(SCHEDULED_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.error('Error reading scheduled messages', e);
    }
    const seeded: ScheduledMessage[] = [
      {
        id: 'sched_1',
        title: 'رسالة ترحيبية بالعملاء الجدد مع بروشور الخدمة',
        targetRecipient: 'مجموعة عملاء واتساب VIP',
        recipientType: 'group',
        messageText: 'أهلاً بكم جميعاً في مجموعتنا الرسمية! يسعدنا تقديم أحدث العروض والخدمات المتاحة لهذا الأسبوع.',
        imageUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&auto=format&fit=crop&q=80',
        scheduledTime: Date.now() + 3600000 * 2,
        intervalDelaySeconds: 15,
        status: 'pending',
        repeat: 'daily',
        createdAt: Date.now() - 3600000,
      },
      {
        id: 'sched_2',
        title: 'إشعار فوري بمواعيد العمل والدعم الفني',
        targetRecipient: 'قائمة البث (Broadcast 1)',
        recipientType: 'all_groups',
        messageText: 'نلفت عنايتكم بأن فريق الدعم الفني جاهز للرد على استفساراتكم على مدار الساعة عبر محادثة الواتساب.',
        scheduledTime: Date.now() + 86400000,
        intervalDelaySeconds: 20,
        status: 'pending',
        repeat: 'none',
        createdAt: Date.now() - 7200000,
      },
    ];
    this.saveScheduledMessages(seeded);
    return seeded;
  }

  saveScheduledMessages(list: ScheduledMessage[]) {
    try {
      localStorage.setItem(SCHEDULED_KEY, JSON.stringify(list));
    } catch (e) {
      console.error('Error saving scheduled messages', e);
    }
    fetch('/api/scheduled-messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(list),
    }).catch(() => {});
  }

  addScheduledMessage(msg: Omit<ScheduledMessage, 'id' | 'createdAt' | 'status'>): ScheduledMessage {
    const list = this.getScheduledMessages();
    const created: ScheduledMessage = {
      ...msg,
      id: `sched_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: Date.now(),
      status: 'pending',
    };
    list.unshift(created);
    this.saveScheduledMessages(list);
    return created;
  }

  deleteScheduledMessage(id: string) {
    const list = this.getScheduledMessages().filter((m) => m.id !== id);
    this.saveScheduledMessages(list);
  }

  sendScheduledMessageNow(id: string): ScheduledMessage | undefined {
    const list = this.getScheduledMessages();
    const item = list.find((m) => m.id === id);
    if (item) {
      item.status = 'sent';
      item.sentAt = Date.now();
      this.saveScheduledMessages(list);

      // Add to live stream log
      this.addLiveMessage({
        id: `send_${Date.now()}`,
        timestamp: Date.now(),
        senderName: 'النظام الآلي (حملة مجدولة)',
        senderPhone: item.targetRecipient,
        text: item.messageText,
        isGroup: item.recipientType !== 'contact',
        groupName: item.recipientType !== 'contact' ? item.targetRecipient : undefined,
        replySent: item.messageText,
        replyType: 'scheduled',
        status: 'replied',
        details: `تم الإرسال الفوري للرسالة المجدولة مع ${item.imageUrl ? 'صورة مرفقة' : 'نص فقط'} (فارق زمني: ${item.intervalDelaySeconds} ثانية لمنع الحظر)`,
      });
    }
    return item;
  }

  // ================= Monitored Keywords (Radar) =================
  getMonitoredKeywords(): MonitoredKeyword[] {
    try {
      const raw = localStorage.getItem(RADAR_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.error('Error reading radar keywords', e);
    }
    const defaults: MonitoredKeyword[] = [
      {
        id: 'radar_1',
        keyword: 'مطلوب',
        category: 'طلبات وخدمات',
        actionType: 'quote_reply',
        customReply: 'أهلاً بك! رأينا طلبك في المجموعة ونحن نوفر هذه الخدمة بأعلى جودة. يمكنك التحدث معنا مباشرة عبر الخاص.',
        useAI: true,
        isEnabled: true,
        cooldownMinutes: 10,
        matchCount: 18,
        lastTriggered: Date.now() - 1800000,
      },
      {
        id: 'radar_2',
        keyword: 'أريد شراء',
        category: 'مبيعات وتجارة',
        actionType: 'direct_dm',
        customReply: 'مرحباً بك! بخصوص رغبتك بالشراء المعروضة في القروب، إليك قائمة الأسعار والعروض الحصرية المتاحة الآن.',
        useAI: true,
        isEnabled: true,
        cooldownMinutes: 15,
        matchCount: 12,
        lastTriggered: Date.now() - 4500000,
      },
      {
        id: 'radar_3',
        keyword: 'كم السعر',
        category: 'استفسارات مالية',
        actionType: 'quote_reply',
        customReply: 'وعليكم السلام! تفضل بالاطلاع على قائمة الأسعار الرسمية أو تواصل معنا لحساب التكلفة بدقة.',
        useAI: false,
        isEnabled: true,
        cooldownMinutes: 5,
        matchCount: 29,
        lastTriggered: Date.now() - 900000,
      },
      {
        id: 'radar_4',
        keyword: 'متوفر',
        category: 'مخزون ومتاح',
        actionType: 'quote_reply',
        customReply: 'نعم متوفر وجاهز للطلب الفوري مع إمكانية التوصيل السريع!',
        useAI: false,
        isEnabled: true,
        cooldownMinutes: 10,
        matchCount: 8,
      },
    ];
    this.saveMonitoredKeywords(defaults);
    return defaults;
  }

  saveMonitoredKeywords(list: MonitoredKeyword[]) {
    try {
      localStorage.setItem(RADAR_KEY, JSON.stringify(list));
    } catch (e) {
      console.error('Error saving radar keywords', e);
    }
    fetch('/api/radar-keywords', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(list),
    }).catch(() => {});
  }

  addMonitoredKeyword(kw: Omit<MonitoredKeyword, 'id' | 'matchCount'>): MonitoredKeyword {
    const list = this.getMonitoredKeywords();
    const created: MonitoredKeyword = {
      ...kw,
      id: `rad_${Date.now()}`,
      matchCount: 0,
    };
    list.unshift(created);
    this.saveMonitoredKeywords(list);
    return created;
  }

  deleteMonitoredKeyword(id: string) {
    const list = this.getMonitoredKeywords().filter((k) => k.id !== id);
    this.saveMonitoredKeywords(list);
  }

  toggleMonitoredKeyword(id: string, isEnabled: boolean) {
    const list = this.getMonitoredKeywords();
    const target = list.find((k) => k.id === id);
    if (target) {
      target.isEnabled = isEnabled;
      this.saveMonitoredKeywords(list);
    }
  }

  // ================= Knowledge Memory (JSON Store) =================
  getKnowledgeMemories(): KnowledgeMemory[] {
    try {
      const raw = localStorage.getItem(MEMORY_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.error('Error reading knowledge memory', e);
    }
    const defaults: KnowledgeMemory[] = [
      {
        id: 'mem_1',
        title: 'باقات وأسعار الخدمات',
        category: 'pricing',
        content: 'الباقة الأساسية بسعر 50 ريال شهرياً، والباقة الاحترافية مع كافة الميزات والرد الذكي بسعر 120 ريال.',
        updatedAt: Date.now() - 86400000,
      },
      {
        id: 'mem_2',
        title: 'مواعيد العمل والدعم',
        category: 'service',
        content: 'فريق العمل متاح يومياً من الساعة 9:00 صباحاً حتى 11:00 مساءً، والرد الآلي الذكي يعمل 24 ساعة طوال أيام الأسبوع.',
        updatedAt: Date.now() - 43200000,
      },
      {
        id: 'mem_3',
        title: 'طرق الدفع المعتمدة',
        category: 'policy',
        content: 'نقبل الدفع عبر مدى، فيزا، ماستركارد، Apple Pay، والتحويل البنكي المباشر مع توفير فاتورة ضريبية إلكترونية فورية.',
        updatedAt: Date.now() - 3600000 * 5,
      },
      {
        id: 'mem_4',
        title: 'سياسة الاستبدال والضمان',
        category: 'faq',
        content: 'نقدم ضمان رضا كامل لمدة 14 يوماً مع دعم فني مجاني وتحديثات مستمرة لجميع المشتركين.',
        updatedAt: Date.now() - 3600000 * 12,
      },
    ];
    this.saveKnowledgeMemories(defaults);
    return defaults;
  }

  saveKnowledgeMemories(list: KnowledgeMemory[]) {
    try {
      localStorage.setItem(MEMORY_KEY, JSON.stringify(list));
    } catch (e) {
      console.error('Error saving knowledge memory', e);
    }
    fetch('/api/memory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(list),
    }).catch(() => {});
  }

  addKnowledgeMemory(item: Omit<KnowledgeMemory, 'id' | 'updatedAt'>): KnowledgeMemory {
    const list = this.getKnowledgeMemories();
    const created: KnowledgeMemory = {
      ...item,
      id: `mem_${Date.now()}`,
      updatedAt: Date.now(),
    };
    list.unshift(created);
    this.saveKnowledgeMemories(list);
    return created;
  }

  deleteKnowledgeMemory(id: string) {
    const list = this.getKnowledgeMemories().filter((m) => m.id !== id);
    this.saveKnowledgeMemories(list);
  }

  // ================= Extracted Patterns =================
  getPatterns(): ExtractedPattern[] {
    try {
      const raw = localStorage.getItem(PATTERNS_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.error('Error reading patterns', e);
    }
    const defaults: ExtractedPattern[] = [
      {
        id: 'pat_seed_1',
        userQuestion: 'السلام عليكم أريد أعرف طريقة التفعيل على واتساب الأعمال؟',
        suggestedKeyword: 'تفعيل واتساب الاعمال',
        suggestedReply: 'وعليكم السلام! التفعيل يتم بسهولة عبر فتح إعدادات الهاتف، واختيار تطبيق واتساب للأعمال ومنحه صلاحية الإشعارات.',
        confidence: 96,
        occurrences: 21,
        status: 'pending',
        category: 'faq',
        detectedAt: Date.now() - 3600000 * 4,
      },
      {
        id: 'pat_seed_2',
        userQuestion: 'هل يدعم إرسال صور وفيديوهات مع الرسائل المجدولة؟',
        suggestedKeyword: 'ارسال صور مجدولة',
        suggestedReply: 'نعم بالتأكيد! يمكنك جدولة رسائل جماعية مع إرفاق صور وروابط وفارق زمني أوتوماتيكي لمنع الحظر.',
        confidence: 92,
        occurrences: 15,
        status: 'pending',
        category: 'service',
        detectedAt: Date.now() - 3600000 * 8,
      },
    ];
    this.savePatterns(defaults);
    return defaults;
  }

  savePatterns(list: ExtractedPattern[]) {
    try {
      localStorage.setItem(PATTERNS_KEY, JSON.stringify(list));
    } catch (e) {
      console.error('Error saving patterns', e);
    }
  }

  updatePatternStatus(id: string, status: 'approved' | 'rejected') {
    const list = this.getPatterns();
    const target = list.find((p) => p.id === id);
    if (target) {
      target.status = status;
      this.savePatterns(list);
    }
  }

  // ================= Live Stream Logs =================
  getLiveMessages(): WhatsAppLiveMessage[] {
    try {
      const raw = localStorage.getItem(LIVE_STREAM_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.error('Error reading live stream', e);
    }
    const defaults: WhatsAppLiveMessage[] = [
      {
        id: 'live_init_1',
        timestamp: Date.now() - 120000,
        senderName: 'أبو فهد العتيبي',
        senderPhone: '+966501234567',
        text: 'السلام عليكم، بكم باقة الرد الذكي مع الذكاء الاصطناعي؟',
        isGroup: false,
        replySent: 'وعليكم السلام ورحمة الله! أسعار باقات الرد الذكي تبدأ من 50 ريال شهرياً وتدعم الرد التلقائي الفوري على مدار الساعة.',
        replyType: 'ai',
        matchedKeyword: 'بكم',
        status: 'replied',
        details: 'تم الرد بواسطة محرك الذكاء الاصطناعي Groq (Llama 3.3 70B) استناداً إلى قاعدة المعرفة',
      },
      {
        id: 'live_init_2',
        timestamp: Date.now() - 340000,
        senderName: 'مجموعة تجار الجملة',
        senderPhone: 'قروب تجار الرياض',
        text: 'مطلوب مورد معتمد لتقديم استشارات فورية ومتابعة المحادثات',
        isGroup: true,
        groupName: 'قروب تجار الرياض',
        replySent: 'أهلاً بك! رأينا طلبك في المجموعة ونحن نوفر هذه الخدمة بأعلى جودة. يمكنك التحدث معنا مباشرة عبر الخاص.',
        replyType: 'radar',
        matchedKeyword: 'مطلوب',
        status: 'replied',
        details: 'اقتناص رادار الكلمات المفتاحية في المجموعات (Quote Reply)',
      },
      {
        id: 'live_init_3',
        timestamp: Date.now() - 560000,
        senderName: 'سعد الشمري',
        senderPhone: '+966559876543',
        text: 'لا أريد الاشتراك الآن ولكن شكراً لكم',
        isGroup: false,
        status: 'ignored_negation',
        details: 'تم حجب الرد بفضل فلتر النفي الذكي (رصد كلمة النفي: "لا أريد")',
      },
    ];
    this.saveLiveMessages(defaults);
    return defaults;
  }

  saveLiveMessages(list: WhatsAppLiveMessage[]) {
    try {
      localStorage.setItem(LIVE_STREAM_KEY, JSON.stringify(list.slice(0, 80)));
    } catch (e) {
      console.error('Error saving live stream', e);
    }
  }

  addLiveMessage(msg: WhatsAppLiveMessage) {
    const list = this.getLiveMessages();
    list.unshift(msg);
    this.saveLiveMessages(list);
  }

  clearLiveMessages() {
    this.saveLiveMessages([]);
  }
}

export const automationService = AutomationService.getInstance();
