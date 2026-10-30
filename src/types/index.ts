export type TargetApp = string; // WhatsApp packages e.g. 'com.whatsapp' | 'com.whatsapp.w4b' | 'whatsapp_all'
export type RuleSource = 'SYSTEM' | 'USER' | 'LEARNED_AI';

export interface SupportedAppInfo {
  id: string;
  name: string;
  nameEn: string;
  category: 'whatsapp' | 'telegram' | 'other';
  packageName: string;
  color: string;
  badge?: string;
  isPopular?: boolean;
  installedDefault?: boolean;
}

export interface Rule {
  id: string;
  keyword: string;
  reply: string;
  targetApp: TargetApp;
  isEnabled: boolean;
  isExactMatch: boolean;
  source: RuleSource;
  createdAt: number;
}

export interface AppPreferencesState {
  negationFilterEnabled: boolean;
  duplicateWindowSeconds: number;
  notificationAccessGranted: boolean;
  activeAppPackages?: string[];
  selectedAppsTarget?: string;
}

export interface AISettings {
  provider: 'groq' | 'gemini';
  groqApiKey: string;
  groqModel: string;
  geminiApiKey: string;
  geminiModel: string;
  systemPrompt: string;
  temperature: number;
  autoReplyMode: 'hybrid' | 'ai_only' | 'rules_only';
  isAIEnabled: boolean;
}

export interface ScheduledMessage {
  id: string;
  title: string;
  targetRecipient: string; // phone or group name
  recipientType: 'contact' | 'group' | 'all_groups';
  messageText: string;
  imageUrl?: string;
  scheduledTime: number; // timestamp
  intervalDelaySeconds: number; // anti-ban delay (e.g. 5-30s)
  status: 'pending' | 'sending' | 'sent' | 'cancelled' | 'failed';
  repeat: 'none' | 'daily' | 'weekly';
  createdAt: number;
  sentAt?: number;
  error?: string;
}

export interface MonitoredKeyword {
  id: string;
  keyword: string;
  category: string;
  actionType: 'quote_reply' | 'direct_dm' | 'notify_only';
  customReply?: string;
  useAI: boolean;
  isEnabled: boolean;
  cooldownMinutes: number;
  matchCount: number;
  lastTriggered?: number;
}

export interface KnowledgeMemory {
  id: string;
  title: string;
  category: 'service' | 'pricing' | 'policy' | 'faq' | 'contact_info';
  content: string;
  updatedAt: number;
}

export interface ExtractedPattern {
  id: string;
  userQuestion: string;
  suggestedKeyword: string;
  suggestedReply: string;
  confidence: number; // 0-100%
  occurrences: number;
  status: 'pending' | 'approved' | 'rejected';
  category: string;
  detectedAt: number;
}

export interface WhatsAppLiveMessage {
  id: string;
  timestamp: number;
  senderName: string;
  senderPhone: string;
  text: string;
  isGroup: boolean;
  groupName?: string;
  replySent?: string;
  replyType?: 'rule' | 'ai' | 'radar' | 'scheduled';
  matchedKeyword?: string;
  status: 'replied' | 'ignored_negation' | 'duplicate_suppressed' | 'no_match';
  details: string;
}

export interface SimulationResult {
  id: string;
  timestamp: number;
  senderName: string;
  app: string;
  packageName?: string;
  rawMessage: string;
  normalizedMessage: string;
  blockedByNegation: boolean;
  negationWordDetected?: string;
  matchedRule?: Rule;
  replySent?: string;
  replySource?: 'RULE' | 'AI' | 'RADAR';
  status: 'REPLIED' | 'IGNORED_NEGATION' | 'NO_MATCH' | 'DUPLICATE_SUPPRESSED' | 'ACCESS_DISABLED';
  reasonArabic: string;
}

export interface AndroidFile {
  path: string;
  name: string;
  category: 'gradle' | 'manifest' | 'res' | 'kotlin_core' | 'kotlin_data' | 'kotlin_service' | 'kotlin_util';
  language: 'kotlin' | 'xml' | 'groovy';
  description: string;
  content: string;
}

