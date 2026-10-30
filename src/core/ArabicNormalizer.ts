/**
 * تطبيع النص العربي: إزالة التشكيل، توحيد الألفات، الياء/الألف المقصورة، التاء المربوطة،
 * الهمزات، والأرقام الهندية-العربية، وإزالة المسافات الزائدة.
 * متطابق 100% مع ArabicNormalizer.kt في مشروع أندرويد.
 */
export const ArabicNormalizer = {
  DIACRITICS: /[\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g,
  EXTRA_SPACES: /\s+/g,

  normalize(input: string): string {
    if (!input) return "";

    return input
      .replace(this.DIACRITICS, "")
      .replace(/[أإآ]/g, "ا")
      .replace(/ى/g, "ي")
      .replace(/ة/g, "ه")
      .replace(/ؤ/g, "و")
      .replace(/ئ/g, "ي")
      .replace(/٠/g, "0")
      .replace(/١/g, "1")
      .replace(/٢/g, "2")
      .replace(/٣/g, "3")
      .replace(/٤/g, "4")
      .replace(/٥/g, "5")
      .replace(/٦/g, "6")
      .replace(/٧/g, "7")
      .replace(/٨/g, "8")
      .replace(/٩/g, "9")
      .replace(this.EXTRA_SPACES, " ")
      .trim()
      .toLowerCase();
  },
};
