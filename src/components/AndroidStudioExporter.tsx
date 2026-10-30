import React, { useState } from 'react';
import { Download, Copy, Check, FileCode, Folder, FolderOpen, Code2, Sparkles, Terminal, CheckCircle2 } from 'lucide-react';
import JSZip from 'jszip';
import confetti from 'canvas-confetti';
import { ANDROID_PROJECT_FILES } from '../core/androidProjectFiles';
import { AndroidFile } from '../types';

export const AndroidStudioExporter: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<AndroidFile>(ANDROID_PROJECT_FILES[0]);
  const [copied, setCopied] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadZip = async () => {
    try {
      setIsZipping(true);
      const zip = new JSZip();

      // Add all project files with exact path hierarchy
      ANDROID_PROJECT_FILES.forEach((file) => {
        zip.file(file.path, file.content);
      });

      // Add a helpful README.md
      zip.file(
        'README.md',
        `# AutoReply Arabic - مشروع الرد التلقائي الذكي

مشروع أندرويد متكامل مبني باستخدام Jetpack Compose و Room Database و NotificationListenerService.

## المميزات:
- 25 كلمة ثابتة مزروعة مسبقاً مع رد موحد
- إمكانية إضافة وتعديل وحذف كلمات مخصصة
- فلتر النفي الذكي (NegationFilter) لمنع الرد على الجمل المنفية (ما، لا، لم، لن، مو، مب...)
- زر استعادة الكلمات الثابتة المحذوفة دون المساس بالردود المخصصة
- تطبيع النص العربي (ArabicNormalizer) لتوحيد الألفات والهمزات والياءات وإزالة التشكيل
- منع تكرار الردود (Anti-Spam Window)

## متطلبات التشغيل:
- Android Studio Iguana أو أحدث
- JDK 17
- Compile SDK: 34
- Min SDK: 26 (Android 8.0 Oreo)

## خطوات الفتح:
1. افتح Android Studio
2. اختر "Open" وحدد هذا المجلد
3. انتظر مزامنة Gradle
4. شغل التطبيق على هاتفك أو المحاكي
5. امنح صلاحية "الوصول للإشعارات" من شاشة الإعدادات
`
      );

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'AutoReply-Android-Project.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setIsZipping(false);
      setDownloadSuccess(true);
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err) {
      console.error('Error generating zip:', err);
      setIsZipping(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col h-full space-y-4">
      {/* Exporter Header & Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Code2 className="w-5 h-5 text-emerald-400" />
            <span>مستكشف كود أندرويد ستوديو الكامل (Full Project)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            19 ملفاً جاهزاً للنسخ أو التنزيل الفوري بصيغة ZIP للفتح في Android Studio
          </p>
        </div>

        <button
          onClick={handleDownloadZip}
          disabled={isZipping}
          className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950/60 flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          {downloadSuccess ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-200" />
              <span>تم تنزيل المشروع بنجاح!</span>
            </>
          ) : isZipping ? (
            <span>جارٍ إنشاء ملف ZIP...</span>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>تنزيل المشروع كاملاً (ZIP جاهز)</span>
            </>
          )}
        </button>
      </div>

      {/* Main Code View Area */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 min-h-[460px]">
        {/* Left Side: File Explorer Tree */}
        <div className="md:col-span-4 bg-slate-950/70 border border-slate-800 rounded-2xl p-3 flex flex-col overflow-hidden">
          <div className="text-xs font-bold text-slate-300 mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Folder className="w-3.5 h-3.5 text-emerald-400" />
              <span>هيكل الملفات ({ANDROID_PROJECT_FILES.length})</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Android Studio</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1 text-xs pr-1">
            {ANDROID_PROJECT_FILES.map((file) => {
              const isSelected = selectedFile.path === file.path;
              return (
                <button
                  key={file.path}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full text-right p-2 rounded-xl transition-all flex items-center gap-2 group ${
                    isSelected
                      ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 font-semibold'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <FileCode
                    className={`w-3.5 h-3.5 shrink-0 ${
                      isSelected
                        ? 'text-emerald-400'
                        : 'text-slate-500 group-hover:text-slate-400'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-xs font-mono">{file.name}</div>
                    <div className="text-[10px] text-slate-500 truncate">{file.path}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: Code Viewer */}
        <div className="md:col-span-8 bg-slate-950/90 border border-slate-800 rounded-2xl p-4 flex flex-col overflow-hidden">
          {/* File Header Bar */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold font-mono text-emerald-300">
                  {selectedFile.path}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                  {selectedFile.language.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">{selectedFile.description}</p>
            </div>

            <button
              onClick={handleCopy}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                copied
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>تم النسخ!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>نسخ الكود</span>
                </>
              )}
            </button>
          </div>

          {/* Syntax Highlighted Code Box */}
          <div className="flex-1 overflow-auto bg-slate-900/90 rounded-xl p-3 border border-slate-800/80 font-mono text-xs text-slate-200 leading-relaxed dir-ltr text-left selection:bg-emerald-500 selection:text-white">
            <pre className="whitespace-pre">
              <code>{selectedFile.content}</code>
            </pre>
          </div>
        </div>
      </div>

      {/* Guide Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 pt-2 text-xs">
        <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-2.5">
          <span className="font-bold text-emerald-400 block mb-0.5">1. فك ضغط الملف</span>
          <p className="text-[11px] text-slate-400">نزّل ملف ZIP وفك ضغطه في أي مجلد على حاسوبك.</p>
        </div>
        <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-2.5">
          <span className="font-bold text-emerald-400 block mb-0.5">2. افتح Android Studio</span>
          <p className="text-[11px] text-slate-400">اختر "Open Existing Project" وحدد مجلد المشروع.</p>
        </div>
        <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-2.5">
          <span className="font-bold text-emerald-400 block mb-0.5">3. مزامنة Gradle</span>
          <p className="text-[11px] text-slate-400">سيقوم أندرويد ستوديو بتنزيل مكتبات Room و Compose تلقائياً.</p>
        </div>
        <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-2.5">
          <span className="font-bold text-emerald-400 block mb-0.5">4. منح صلاحية الإشعارات</span>
          <p className="text-[11px] text-slate-400">عند تشغيل التطبيق أول مرة، امنح صلاحية الإشعارات ليعمل الرد في الخلفية.</p>
        </div>
      </div>
    </div>
  );
};
