import { SupportedAppInfo } from '../types';
export type { SupportedAppInfo };

export const SUPPORTED_APPS_LIST: SupportedAppInfo[] = [
  // ================= WhatsApp Family Only =================
  {
    id: 'com.whatsapp',
    packageName: 'com.whatsapp',
    name: 'واتساب الرسمي',
    nameEn: 'WhatsApp Messenger',
    category: 'whatsapp',
    color: '#25D366',
    badge: 'الرسمي',
    isPopular: true,
    installedDefault: true,
  },
  {
    id: 'com.whatsapp.w4b',
    packageName: 'com.whatsapp.w4b',
    name: 'واتساب للأعمال (Business)',
    nameEn: 'WhatsApp Business',
    category: 'whatsapp',
    color: '#128C7E',
    badge: 'تجاري',
    isPopular: true,
    installedDefault: true,
  },
  {
    id: 'com.gbwhatsapp',
    packageName: 'com.gbwhatsapp',
    name: 'جي بي واتساب (GBWhatsApp)',
    nameEn: 'GBWhatsApp',
    category: 'whatsapp',
    color: '#075E54',
    badge: 'معدل',
    isPopular: true,
    installedDefault: true,
  },
  {
    id: 'com.whatsapp.plus',
    packageName: 'com.whatsapp.plus',
    name: 'واتساب بلس (WhatsApp Plus)',
    nameEn: 'WhatsApp Plus',
    category: 'whatsapp',
    color: '#1EBEA5',
    badge: 'بلس',
    isPopular: true,
    installedDefault: true,
  },
  {
    id: 'com.fmwhatsapp',
    packageName: 'com.fmwhatsapp',
    name: 'إف إم واتساب (FMWhatsApp)',
    nameEn: 'FMWhatsApp (Fouad)',
    category: 'whatsapp',
    color: '#25D366',
    badge: 'Fouad',
    installedDefault: true,
  },
  {
    id: 'com.yowhatsapp',
    packageName: 'com.yowhatsapp',
    name: 'يو واتساب (YoWhatsApp)',
    nameEn: 'YoWhatsApp',
    category: 'whatsapp',
    color: '#128C7E',
    badge: 'YoWA',
    installedDefault: false,
  },
  {
    id: 'com.ogwhatsapp',
    packageName: 'com.ogwhatsapp',
    name: 'أو جي واتساب (OGWhatsApp)',
    nameEn: 'OGWhatsApp',
    category: 'whatsapp',
    color: '#075E54',
    badge: 'OG',
    installedDefault: false,
  },
  {
    id: 'com.aerowhatsapp',
    packageName: 'com.aerowhatsapp',
    name: 'واتساب إيرو (Aero WhatsApp)',
    nameEn: 'Aero WhatsApp',
    category: 'whatsapp',
    color: '#1EBEA5',
    badge: 'Aero',
    installedDefault: false,
  },
];

export const WHATSAPP_PACKAGES = new Set(
  SUPPORTED_APPS_LIST.map((a) => a.packageName)
);

export const TELEGRAM_PACKAGES = new Set<string>();

const INSTALLED_STORAGE_KEY = 'autoreply_installed_device_packages';

/**
 * جلب الحزم المثبتة فعلياً على هاتف المستخدم (مخصصة للواتساب)
 */
export function getInstalledPackagesFromDevice(): Set<string> {
  try {
    const raw = localStorage.getItem(INSTALLED_STORAGE_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr) && arr.length > 0) {
        return new Set(arr);
      }
    }
  } catch (e) {
    console.error('Failed to load installed apps', e);
  }

  // الافتراضي لواتساب
  return new Set([
    'com.whatsapp',
    'com.whatsapp.w4b',
    'com.gbwhatsapp',
    'com.whatsapp.plus',
  ]);
}

/**
 * حفظ قائمة التطبيقات المثبتة في هاتف المستخدم
 */
export function saveInstalledPackagesToDevice(packages: Set<string> | string[]) {
  try {
    const arr = Array.from(packages);
    localStorage.setItem(INSTALLED_STORAGE_KEY, JSON.stringify(arr));
  } catch (e) {
    console.error('Failed to save installed apps', e);
  }
}

/**
 * دالة التحقق مما إذا كان إشعار الحزمة يطابق تطبيق واتساب المستهدف المحدد في القاعدة.
 */
export function doesRuleMatchApp(ruleTargetApp: string, incomingPackageOrAppKey: string): boolean {
  // التطبيق يعمل فقط على الواتساب!
  if (incomingPackageOrAppKey !== 'whatsapp' && !WHATSAPP_PACKAGES.has(incomingPackageOrAppKey)) {
    return false;
  }

  if (!ruleTargetApp || ruleTargetApp === 'all' || ruleTargetApp === 'whatsapp' || ruleTargetApp === 'whatsapp_all') {
    return true;
  }

  const list = ruleTargetApp.split(',').map((s) => s.trim());
  if (list.includes('all') || list.includes('whatsapp') || list.includes('whatsapp_all')) return true;
  return list.includes(incomingPackageOrAppKey);
}

/**
 * الحصول على التسمية العربية المعروضة لنوع تطبيق واتساب المستهدف
 */
export function getAppDisplayLabel(targetApp: string): string {
  if (!targetApp || targetApp === 'all' || targetApp === 'whatsapp' || targetApp === 'whatsapp_all') {
    return 'جميع نسخ واتساب (الرسمي، الأعمال، GB، بلس)';
  }

  const parts = targetApp.split(',').map((s) => s.trim()).filter(Boolean);
  if (parts.length === 0) return 'جميع نسخ واتساب';

  if (parts.length === 1) {
    const single = parts[0];
    const app = SUPPORTED_APPS_LIST.find((a) => a.packageName === single || a.id === single);
    return app ? app.name : single;
  }

  const names = parts.map((pkg) => {
    const app = SUPPORTED_APPS_LIST.find((a) => a.packageName === pkg || a.id === pkg);
    if (!app) return pkg;
    return app.name.split(' (')[0];
  });

  return names.join(' + ');
}

