import { Rule, AppPreferencesState, SimulationResult } from '../types';
import { ArabicNormalizer } from './ArabicNormalizer';
import { NegationFilter } from './NegationFilter';
import { doesRuleMatchApp } from './SupportedApps';

export class AutoReplyEngine {
  private repliedMessages = new Map<string, number>();

  processIncomingNotification(
    pkg: string,
    senderName: string,
    rawMessage: string,
    rules: Rule[],
    prefs: AppPreferencesState
  ): SimulationResult {
    const timestamp = Date.now();
    const id = `sim_${timestamp}_${Math.random().toString(36).substring(2, 7)}`;

    // 1. فحص إتاحة الوصول للإشعارات
    if (!prefs.notificationAccessGranted) {
      return {
        id,
        timestamp,
        senderName,
        app: pkg,
        rawMessage,
        normalizedMessage: ArabicNormalizer.normalize(rawMessage),
        blockedByNegation: false,
        status: 'ACCESS_DISABLED',
        reasonArabic: 'صلاحية الوصول إلى الإشعارات غير مفعّلة في إعدادات التطبيق.',
      };
    }

    if (!rawMessage.trim() || !senderName.trim()) {
      return {
        id,
        timestamp,
        senderName,
        app: pkg,
        rawMessage,
        normalizedMessage: '',
        blockedByNegation: false,
        status: 'NO_MATCH',
        reasonArabic: 'الرسالة أو اسم المرسل فارغ.',
      };
    }

    // 2. تطبيع النص العربي
    const normalizedMessage = ArabicNormalizer.normalize(rawMessage);

    // 3. فحص منع التكرار (Deduplication Window)
    const dupKey = `${pkg}|${senderName}|${normalizedMessage}`;
    const lastTime = this.repliedMessages.get(dupKey);
    const windowMs = (prefs.duplicateWindowSeconds || 60) * 1000;

    if (lastTime && timestamp - lastTime < windowMs) {
      const remainingSec = Math.ceil((windowMs - (timestamp - lastTime)) / 1000);
      return {
        id,
        timestamp,
        senderName,
        app: pkg,
        rawMessage,
        normalizedMessage,
        blockedByNegation: false,
        status: 'DUPLICATE_SUPPRESSED',
        reasonArabic: `تم تجاهل الرسالة لمنع التكرار (تبقى ${remainingSec} ثانية قبل السماح بالرد لنفس المحتوى).`,
      };
    }

    // 3.5 فحص التفضيلات العامة لتشغيل التطبيقات المحددة
    if (prefs.selectedAppsTarget && prefs.selectedAppsTarget !== 'all') {
      const isAllowedByPrefs = doesRuleMatchApp(prefs.selectedAppsTarget, pkg);
      if (!isAllowedByPrefs) {
        return {
          id,
          timestamp,
          senderName,
          app: pkg,
          rawMessage,
          normalizedMessage: ArabicNormalizer.normalize(rawMessage),
          blockedByNegation: false,
          status: 'NO_MATCH',
          reasonArabic: `تطبيق الإشعار غير مفعّل في تفضيلات التطبيقات النشطة بالإعدادات (مستهدف: ${prefs.selectedAppsTarget}).`,
        };
      }
    }

    // 4. ترشيح القواعد المفعلة المتوافقة مع التطبيق وحزمته
    const activeRules = rules.filter(
      (r) => r.isEnabled && doesRuleMatchApp(r.targetApp, pkg)
    );

    // 5. البحث عن تطابق
    let blockedNegationWord: string | undefined;
    let foundRuleBlockedByNegation: Rule | undefined;

    for (const rule of activeRules) {
      const normalizedKeyword = ArabicNormalizer.normalize(rule.keyword);
      if (!normalizedKeyword.trim()) continue;

      const contains = rule.isExactMatch
        ? normalizedMessage === normalizedKeyword
        : normalizedMessage.includes(normalizedKeyword);

      if (!contains) continue;

      // تحقق من فلتر النفي
      if (prefs.negationFilterEnabled) {
        const negationCheck = NegationFilter.check(normalizedMessage, normalizedKeyword);
        if (negationCheck.shouldBlock) {
          blockedNegationWord = negationCheck.negationWord;
          foundRuleBlockedByNegation = rule;
          continue; // ابحث إذا كانت هناك قاعدة أخرى أو توقف حسب التصميم
        }
      }

      // وجدنا مطابقة سليمة!
      this.repliedMessages.set(dupKey, timestamp);

      return {
        id,
        timestamp,
        senderName,
        app: pkg,
        rawMessage,
        normalizedMessage,
        blockedByNegation: false,
        matchedRule: rule,
        replySent: rule.reply,
        status: 'REPLIED',
        reasonArabic: `تم الرد بنجاح بمطابقة الكلمة المفتاحية: "${rule.keyword}" (${
          rule.isExactMatch ? 'تطابق تام' : 'احتواء'
        }).`,
      };
    }

    // إذا وُجدت قاعدة ولكن تم حجبها بفلتر النفي
    if (foundRuleBlockedByNegation) {
      return {
        id,
        timestamp,
        senderName,
        app: pkg,
        rawMessage,
        normalizedMessage,
        blockedByNegation: true,
        negationWordDetected: blockedNegationWord,
        matchedRule: foundRuleBlockedByNegation,
        status: 'IGNORED_NEGATION',
        reasonArabic: `تم حجب الرد بفضل فلتر النفي، لأن الكلمة المفتاحية "${foundRuleBlockedByNegation.keyword}" سبقتها أداة النفي: [${blockedNegationWord}].`,
      };
    }

    // لا يوجد تطابق
    return {
      id,
      timestamp,
      senderName,
      app: pkg,
      rawMessage,
      normalizedMessage,
      blockedByNegation: false,
      status: 'NO_MATCH',
      reasonArabic: 'لم يُعثر على أي كلمة مفتاحية مفعلة تطابق نص الرسالة بعد التطبيع.',
    };
  }

  clearDeduplicationHistory() {
    this.repliedMessages.clear();
  }
}

export const autoReplyEngine = new AutoReplyEngine();
