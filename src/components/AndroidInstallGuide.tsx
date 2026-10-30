import React, { useState } from 'react';
import {
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Terminal,
  Download,
  FolderTree,
  Sliders,
  Battery,
  Bell,
  HelpCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const AndroidInstallGuide: React.FC = () => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<number>(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const toggleStepCompleted = (stepNumber: number) => {
    const next = new Set(completedSteps);
    if (next.has(stepNumber)) {
      next.delete(stepNumber);
    } else {
      next.add(stepNumber);
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } });
    }
    setCompletedSteps(next);
  };

  const copyCode = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const steps = [
    {
      num: 1,
      title: 'المرحلة 1: تثبيت برنامج Android Studio',
      icon: Terminal,
      summary: 'تحميل وتثبيت بيئة التطوير الرسمية من Google',
      content: (
        <div className="space-y-3 text-xs text-slate-300">
          <p>
            تطبيقك لا يحتاج أي خوادم أو بوتات؛ يتم بناؤه وتثبيته مباشرة كملف APK أصلي على هاتفك:
          </p>
          <ol className="list-decimal list-inside space-y-1.5 pr-2">
            <li>
              حمّل أندرويد ستوديو من الموقع الرسمي:{' '}
              <a
                href="https://developer.android.com/studio"
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 underline font-semibold inline-flex items-center gap-1"
              >
                developer.android.com/studio <ExternalLink className="w-3 h-3" />
              </a>
            </li>
            <li>ثبّته بالإعدادات الافتراضية (Next ← Next ← Install).</li>
            <li>عند أول تشغيل، اختر <strong>Standard</strong> وسيقوم بتنزيل مكونات Android SDK تلقائياً.</li>
          </ol>
          <div className="bg-slate-950/70 border border-slate-800 p-2.5 rounded-xl text-[11px] text-slate-400">
            📌 <strong>المتطلبات الموصى بها:</strong> ذاكرة RAM بحجم 8GB+ ومساحة 10GB حرة على القرص.
          </div>
        </div>
      ),
    },
    {
      num: 2,
      title: 'المرحلة 2: إنشاء المشروع في Android Studio',
      icon: FolderTree,
      summary: 'إنشاء مشروع Kotlin جديد بإعدادات الحزمة com.example.autoreply',
      content: (
        <div className="space-y-3 text-xs text-slate-300">
          <p>اتبع الخطوات الدقيقة التالية:</p>
          <ol className="list-decimal list-inside space-y-1.5 pr-2">
            <li>افتح Android Studio ← اختر <strong>New Project</strong>.</li>
            <li>اختر قالب <strong>Empty Activity</strong> (الذي يستخدم Jetpack Compose).</li>
            <li>اضغط <strong>Next</strong> واملأ البيانات كالتالي:
              <ul className="list-disc list-inside space-y-1 pr-4 mt-1 font-mono text-[11px] text-emerald-300">
                <li>Name: AutoReply</li>
                <li>Package name: com.example.autoreply</li>
                <li>Language: Kotlin</li>
                <li>Minimum SDK: API 26 (Android 8.0 Oreo)</li>
                <li>Build configuration language: Kotlin DSL (build.gradle.kts)</li>
              </ul>
            </li>
            <li>اضغط <strong>Finish</strong> وانتظر حتى تنتهي مزامنة Gradle الأولية.</li>
          </ol>
        </div>
      ),
    },
    {
      num: 3,
      title: 'المرحلة 3: نسخ ملفات المشروع الجاهزة (19 ملفاً)',
      icon: Download,
      summary: 'تحميل ملف ZIP أو نسخ الأكواد مباشرة إلى مجلدات المشروع',
      content: (
        <div className="space-y-3 text-xs text-slate-300">
          <p>
            بدلاً من كتابة الكود يدوياً، يمكنك الضغط على تبويب{' '}
            <strong className="text-white">«مشروع Android Studio (ZIP)»</strong> وتنزيل ملف ZIP كامل جاهز وفك ضغطه داخل مجلد المشروع، أو التأكد من مطابقة الملفات التالية:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
            <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 space-y-1">
              <span className="font-bold text-emerald-400 block">الملفات الأساسية في app/src/main/java/</span>
              <ul className="text-slate-400 font-mono space-y-0.5">
                <li>• App.kt (زرع الـ 25 كلمة)</li>
                <li>• MainActivity.kt (التنقل)</li>
                <li>• MainViewModel.kt</li>
                <li>• Rule.kt & Screens.kt</li>
              </ul>
            </div>
            <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 space-y-1">
              <span className="font-bold text-emerald-400 block">المجلدات data / service / util</span>
              <ul className="text-slate-400 font-mono space-y-0.5">
                <li>• data/ (Room DB & SystemKeywords)</li>
                <li>• service/ (AutoReplyNotificationListener)</li>
                <li>• util/ (ArabicNormalizer & NegationFilter)</li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },
    {
      num: 4,
      title: 'المرحلة 4: توصيل الهاتف وتفعيل خيارات المطور',
      icon: Smartphone,
      summary: 'توصيل هاتفك الشخصي بكابل USB لتثبيت التطبيق عليه',
      content: (
        <div className="space-y-3 text-xs text-slate-300">
          <ol className="list-decimal list-inside space-y-1.5 pr-2">
            <li>
              <strong>تفعيل خيارات المطور:</strong> على هاتفك اذهب إلى: الإعدادات ← حول الهاتف ← اضغط على «رقم الإصدار» (Build number) <strong>7 مرات متتالية</strong> حتى تظهر رسالة «أنت الآن مطوّر».
            </li>
            <li>
              <strong>تفعيل تصحيح USB:</strong> ارجع إلى الإعدادات ← خيارات المطور ← فعّل «تصحيح أخطاء USB» (USB Debugging).
            </li>
            <li>
              <strong>التوصيل:</strong> وصّل الهاتف بالكمبيوتر بكابل USB، ووافق على رسالة «السماح بتصحيح أخطاء USB من هذا الكمبيوتر».
            </li>
            <li>
              في شريط أندرويد ستوديو العلوي، ستشاهد اسم هاتفك يظهر بجانب زر التشغيل الأخضر ▶️.
            </li>
          </ol>
        </div>
      ),
    },
    {
      num: 5,
      title: 'المرحلة 5: تشغيل وتثبيت التطبيق على هاتفك',
      icon: CheckCircle2,
      summary: 'الضغط على زر التشغيل ▶️ في Android Studio لتثبيت APK',
      content: (
        <div className="space-y-3 text-xs text-slate-300">
          <p>
            اضغط زر <strong className="text-emerald-400">Run ▶️</strong> الأخضر في أعلى واجهة Android Studio.
          </p>
          <ul className="list-disc list-inside space-y-1 pr-2">
            <li>سيبدأ Gradle في تجميع الكود وإنشاء ملف الـ APK.</li>
            <li>سيتم تثبيت التطبيق تلقائياً على هاتفك وسيفتح أمامك الشاشة الرئيسية للرد التلقائي.</li>
            <li>عند أول تشغيل، ستُزرع الـ 25 كلمة ثابتة مع الرد الموحّد في قاعدة بيانات Room المحلية لهاتفك.</li>
          </ul>
        </div>
      ),
    },
    {
      num: 6,
      title: 'المرحلة 6: تفعيل صلاحية الوصول للإشعارات (إلزامية)',
      icon: Bell,
      summary: 'الخطوة الوحيدة المطلوبة لتمكين التطبيق من قراءة الإشعارات والرد التلقائي',
      content: (
        <div className="space-y-3 text-xs text-slate-300">
          <div className="bg-amber-950/40 border border-amber-500/40 rounded-2xl p-3 text-amber-200">
            ⚠️ <strong>ملاحظة هامة:</strong> لأن التطبيق لا يستخدم بوتات ولا إنترنت خارجي، فإنه يعتمد على قراءة شريط الإشعارات من نظام أندرويد مباشرة عبر صلاحية <code className="text-white bg-slate-900 px-1 py-0.5 rounded font-mono">NotificationListenerService</code>.
          </div>
          <ol className="list-decimal list-inside space-y-1.5 pr-2">
            <li>افتح تطبيق «الرد التلقائي» على هاتفك.</li>
            <li>ستظهر لك بطاقة حمراء: <strong>«⚠️ الخدمة غير مفعّلة»</strong>.</li>
            <li>اضغط على زر <strong>«فتح الإعدادات»</strong>.</li>
            <li>ستفتح شاشة نظام أندرويد: (الوصول إلى الإشعارات / Notification access).</li>
            <li>ابحث عن تطبيق <strong>الرد التلقائي</strong> وفعّل المفتاح بجانبه، ثم اضغط "سماح".</li>
            <li>عد للتطبيق ستجد البطاقة تحولت للأخضر: <strong>«✅ الخدمة مفعّلة»</strong>!</li>
          </ol>
        </div>
      ),
    },
    {
      num: 7,
      title: 'المرحلة 7: الاختبار الفعلي على هاتفك',
      icon: Sliders,
      summary: 'إرسال رسائل تجريبية من هاتف آخر والتأكد من سرعة الرد وفلتر النفي',
      content: (
        <div className="space-y-3 text-xs text-slate-300">
          <p>من هاتف آخر (أو حساب صديق) أرسل لحسابك على واتساب أو تيليجرام:</p>
          <div className="space-y-2">
            <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-white block">1. أرسل: «ابي مساعدة»</span>
                <span className="text-[11px] text-emerald-400">النتيجة: يرد تلقائياً بالرد الموحّد خلال ثانيتين!</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 text-[10px] font-bold">
                رد فوري
              </span>
            </div>

            <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-white block">2. أرسل: «ما ابي مساعدة»</span>
                <span className="text-[11px] text-amber-400">النتيجة: يتجاهلها فلتر النفي ولا يرد!</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 text-[10px] font-bold">
                حجب بنفي
              </span>
            </div>

            <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-white block">3. أرسل: «لا بأس، ابي مساعدة»</span>
                <span className="text-[11px] text-emerald-400">النتيجة: يرد بنجاح لأن الكلمة السابقة «بأس» وليست نفي!</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 text-[10px] font-bold">
                رد ذكي
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      num: 8,
      title: 'المرحلة 8: حماية الخدمة من الإيقاف في الخلفية (لهواتف شاومي، سامسونج، هواوي)',
      icon: Battery,
      summary: 'ضبط إعدادات البطارية لضمان بقاء التطبيق يعمل حتى لو أغلقت الشاشة',
      content: (
        <div className="space-y-3 text-xs text-slate-300">
          <p>
            تطبق بعض الشركات نظام إدارة بطارية صارم قد يوقف الخدمات بالخلفية. تأكد من تفعيل الآتي حسب نوع هاتفك:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
            <div className="bg-slate-950/90 p-3 rounded-xl border border-slate-800 space-y-1">
              <span className="font-bold text-amber-400 block">📱 شاومي / ريدمي / بوكو:</span>
              <p className="text-slate-400">
                الإعدادات ← التطبيقات ← الرد التلقائي ← توفير البطارية ← اختر <strong>«بدون قيود»</strong>، وفعّل «التشغيل التلقائي».
              </p>
            </div>
            <div className="bg-slate-950/90 p-3 rounded-xl border border-slate-800 space-y-1">
              <span className="font-bold text-blue-400 block">📱 سامسونج (Samsung):</span>
              <p className="text-slate-400">
                الإعدادات ← العناية بالجهاز ← البطارية ← حدود استخدام الخلفية ← أضف الرد التلقائي إلى <strong>«التطبيقات التي لا يتم وضعها في وضع السكون»</strong>.
              </p>
            </div>
            <div className="bg-slate-950/90 p-3 rounded-xl border border-slate-800 space-y-1">
              <span className="font-bold text-rose-400 block">📱 هواوي / أونور:</span>
              <p className="text-slate-400">
                الإعدادات ← البطارية ← تشغيل التطبيقات ← الرد التلقائي ← غيّر إلى <strong>«إدارة يدوية»</strong> وفعّل (تشغيل تلقائي + تشغيل بالخلفية).
              </p>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/80 border border-emerald-500/30 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                100% يعمل على الجوال بدون خادم أو بوت
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {completedSteps.size} من {steps.length} مراحل مكتملة
              </span>
            </div>
            <h2 className="text-xl font-black text-white">
              دليل بناء المشروع وتثبيته على هاتفك خطوة بخطوة
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              تطبيقك يعتمد بالكامل على قراءة الإشعارات والرد التلقائي عبر RemoteInput داخل الهاتف نفسه. لا تحتاج تيليجرام بوت، ولا ويب هوك، ولا استضافة، ولا دفع أي رسوم.
            </p>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 px-4 py-2.5 rounded-2xl shrink-0 text-center">
            <span className="text-[11px] text-slate-400 block">آلية العمل الأصلية:</span>
            <span className="text-xs font-bold text-emerald-400">NotificationListenerService</span>
          </div>
        </div>
      </div>

      {/* Accordion Steps List */}
      <div className="space-y-3">
        {steps.map((step) => {
          const isOpen = activeStep === step.num;
          const isDone = completedSteps.has(step.num);
          const Icon = step.icon;

          return (
            <div
              key={step.num}
              className={`rounded-2xl border transition-all overflow-hidden ${
                isOpen
                  ? 'bg-slate-900 border-emerald-500/60 shadow-lg'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Step Header */}
              <div
                onClick={() => setActiveStep(isOpen ? 0 : step.num)}
                className="p-4 flex items-center justify-between gap-3 cursor-pointer select-none"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                      isDone
                        ? 'bg-emerald-600 text-white'
                        : isOpen
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isDone ? <Check className="w-5 h-5 stroke-[3]" /> : step.num}
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>{step.title}</span>
                      {isDone && (
                        <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                          مكتملة
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">{step.summary}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleStepCompleted(step.num);
                    }}
                    className={`text-xs px-2.5 py-1 rounded-lg border font-semibold transition-all ${
                      isDone
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    {isDone ? 'تم الإنجاز ✓' : 'تحديد كمكتمل'}
                  </button>

                  <div className="text-slate-400">
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
              </div>

              {/* Step Content */}
              {isOpen && (
                <div className="p-4 pt-0 border-t border-slate-800/80 bg-slate-950/40 mt-1">
                  <div className="pt-3">{step.content}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Troubleshooting Matrix Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-emerald-400" />
          <span>جدول التشخيص السريع إذا لم يصلك الرد</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-950/60">
                <th className="p-3 rounded-tr-xl">الحالة</th>
                <th className="p-3">السبب</th>
                <th className="p-3 rounded-tl-xl">الحل السريع</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              <tr>
                <td className="p-3 font-semibold text-rose-300">لم يصل أي رد نهائياً</td>
                <td className="p-3 text-slate-400">صلاحية الوصول للإشعارات غير مفعّلة في الهاتف</td>
                <td className="p-3">افتح التطبيق واضغط «فتح الإعدادات» وفعّل المفتاح</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-amber-300">الرسالة كانت: «ما ابي مساعدة»</td>
                <td className="p-3 text-slate-400">فلتر النفي (NegationFilter) قام بحجبها عمداً</td>
                <td className="p-3">هذا عمل الفلتر الطبيعي. جرّب إرسال «ابي مساعدة» بدون نفي</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-blue-300">الرسالة في مجموعة (Group)</td>
                <td className="p-3 text-slate-400">التطبيق يتجاهل إشعارات المجموعات منعاً للإزعاج</td>
                <td className="p-3">أرسل الرسالة في محادثة فردية مباشرة</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-purple-300">الخدمة تقف بعد إغلاق الشاشة</td>
                <td className="p-3 text-slate-400">نظام توفير البطارية في الهاتف يوقف التطبيقات</td>
                <td className="p-3">اذهب إلى إعدادات البطارية بالهاتف واجعل التطبيق «بدون قيود»</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
