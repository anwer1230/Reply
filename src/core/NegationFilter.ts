/**
 * فلتر النفي لمنع الرد عندما ينفي المرسل طلبه.
 * مثال: "ما ابي مساعدة" أو "لا اريد مساعدة" أو "لن اطلب مساعدة".
 *
 * متطابق 100% مع NegationFilter.kt في أندرويد.
 */
export const NEGATIONS_SET: ReadonlySet<string> = new Set([
  "ما",
  "لا",
  "لم",
  "لن",
  "مو",
  "مب",
  "ماهو",
  "ماهي",
  "غير",
  "بدون",
  "مستحيل",
  "ابدا",
  "لاابي",
  "ماابي",
  "مااريد",
  "لااريد",
  "ماحتاج",
  "لاحتاج",
]);

export interface NegationCheckResult {
  shouldBlock: boolean;
  negationWord?: string;
  previousWord?: string;
  prefix?: string;
}

export const NegationFilter = {
  NEGATIONS: NEGATIONS_SET,

  check(normalizedMessage: string, normalizedKeyword: string): NegationCheckResult {
    if (!normalizedKeyword.trim()) return { shouldBlock: false };

    const keywordIdx = normalizedMessage.indexOf(normalizedKeyword);
    if (keywordIdx === -1) return { shouldBlock: false };

    // الكلمة المفتاحية في بداية الرسالة = لا يوجد نفي قبلها
    if (keywordIdx === 0) return { shouldBlock: false };

    const prefix = normalizedMessage.substring(0, keywordIdx).trimEnd();
    if (!prefix) return { shouldBlock: false };

    const words = prefix.split(/\s+/);
    const lastWord = words[words.length - 1] || "";

    const isBlocked = this.NEGATIONS.has(lastWord);
    return {
      shouldBlock: isBlocked,
      negationWord: isBlocked ? lastWord : undefined,
      previousWord: lastWord,
      prefix,
    };
  },

  shouldBlock(normalizedMessage: string, normalizedKeyword: string): boolean {
    return this.check(normalizedMessage, normalizedKeyword).shouldBlock;
  },
};
