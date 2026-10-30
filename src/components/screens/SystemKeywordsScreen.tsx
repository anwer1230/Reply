import React, { useState } from 'react';
import { ArrowRight, RotateCcw, Check, Sparkles, AlertCircle, Info, ShieldAlert } from 'lucide-react';
import { Rule } from '../../types';
import { SYSTEM_KEYWORDS_LIST } from '../../core/SystemKeywords';

interface SystemKeywordsScreenProps {
  rules: Rule[];
  currentSystemReply: string;
  onBack: () => void;
  onUpdateAllSystemReplies: (newReply: string) => void;
  onRestoreMissingSystemKeywords: () => number | Promise<number>;
  onShowToast: (msg: string) => void;
}

export const SystemKeywordsScreen: React.FC<SystemKeywordsScreenProps> = ({
  rules,
  currentSystemReply,
  onBack,
  onUpdateAllSystemReplies,
  onRestoreMissingSystemKeywords,
  onShowToast,
}) => {
  const [newReply, setNewReply] = useState(currentSystemReply);
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);

  const existingSystemRules = rules.filter((r) => r.source === 'SYSTEM');
  const existingKeywordsSet = new Set(existingSystemRules.map((r) => r.keyword));
  const missingCount = SYSTEM_KEYWORDS_LIST.filter((k) => !existingKeywordsSet.has(k)).length;
  const currentCount = existingSystemRules.length;
  const totalCount = SYSTEM_KEYWORDS_LIST.length;

  const handleApplyReply = () => {
    onUpdateAllSystemReplies(newReply.trim());
    setShowApplyDialog(false);
    onShowToast('تم تحديث الرد الموحّد لجميع الكلمات الثابتة بنجاح');
  };

  const handleRestore = async () => {
    const restored = await onRestoreMissingSystemKeywords();
    setShowRestoreDialog(false);
    if (restored === 0) {
      onShowToast('كل الكلمات النظامية موجودة بالفعل');
    } else {
      onShowToast(`تمت استعادة ${restored} كلمة نظامية مفقودة بنجاح`);
    }
  };

  const isReplyChanged = newReply.trim().length > 0 && newReply.trim() !== currentSystemReply.trim();

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900 relative">
      {/* TopAppBar */}
      <header className="bg-[#00695C] text-white px-3 py-3 flex items-center gap-2 shadow-md shrink-0">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10 active:bg-white/20 transition-colors"
          title="رجوع"
        >
          <ArrowRight className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-base font-bold">إدارة الكلمات الثابتة</h1>
      </header>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-12">
        {/* Stats Card */}
        <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300">إحصائية الكلمات النظامية</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/30 font-mono">
              {currentCount} / {totalCount}
            </span>
          </div>

          <p className="font-bold text-sm text-white mt-1">
            الكلمات الثابتة الموجودة: {currentCount} من {totalCount}
          </p>

          {missingCount > 0 ? (
            <div className="mt-2 text-xs text-amber-300/90 bg-amber-950/40 border border-amber-500/30 rounded-xl p-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>يوجد {missingCount} كلمة محذوفة، يمكنك استعادتها بضغطة زر أدناه.</span>
            </div>
          ) : (
            <p className="text-[11px] text-emerald-400/90 mt-1 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              <span>جميع الكلمات الثابتة الـ 25 مزروعة وتعمل بالنظام.</span>
            </p>
          )}
        </div>

        {/* Unified Reply Field */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-200">
            الرد الموحّد لكل الكلمات الثابتة
          </label>
          <textarea
            value={newReply}
            onChange={(e) => setNewReply(e.target.value)}
            rows={4}
            placeholder="اكتب الرد الموحّد..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none leading-relaxed"
          />

          <button
            onClick={() => setShowApplyDialog(true)}
            disabled={!isReplyChanged}
            className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 ${
              isReplyChanged
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer active:scale-[0.98]'
                : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>تطبيق الرد على كل الكلمات الثابتة</span>
          </button>
        </div>

        <div className="border-t border-slate-800 my-2"></div>

        {/* Restore Missing Keywords Button */}
        <div className="space-y-2">
          <button
            onClick={() => setShowRestoreDialog(true)}
            disabled={missingCount === 0}
            className={`w-full py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
              missingCount > 0
                ? 'bg-amber-600/10 border-amber-500/50 text-amber-300 hover:bg-amber-600/20 active:scale-[0.98] cursor-pointer'
                : 'bg-slate-800/40 border-slate-700 text-slate-500 cursor-not-allowed'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>استعادة الكلمات المحذوفة ({missingCount})</span>
          </button>

          <p className="text-[11px] text-slate-400 leading-relaxed bg-slate-800/40 p-2.5 rounded-xl border border-slate-800">
            💡 <strong className="text-slate-300">ملاحظة:</strong> استعادة القائمة تضيف فقط الكلمات المحذوفة، ولا تُغيّر الردود المخصّصة للكلمات الموجودة مسبقاً.
          </p>
        </div>

        {/* Keywords Preview Grid */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>قائمة الـ 25 كلمة الثابتة</span>
            <span className="text-[10px] text-slate-500">اخضر: نشطة • رمادي: محذوفة</span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto p-1 bg-slate-950/60 rounded-xl border border-slate-800">
            {SYSTEM_KEYWORDS_LIST.map((keyword, index) => {
              const isPresent = existingKeywordsSet.has(keyword);
              return (
                <div
                  key={index}
                  className={`px-2 py-1.5 rounded-lg text-[11px] border flex items-center justify-between gap-1 transition-colors ${
                    isPresent
                      ? 'bg-slate-800/80 border-slate-700 text-slate-200'
                      : 'bg-rose-950/20 border-rose-900/30 text-rose-400/60 line-through'
                  }`}
                >
                  <span className="truncate">{keyword}</span>
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      isPresent ? 'bg-emerald-400' : 'bg-rose-500'
                    }`}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Apply Dialog */}
      {showApplyDialog && (
        <div className="absolute inset-0 bg-black/75 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 max-w-sm w-full space-y-3 shadow-2xl">
            <h3 className="font-bold text-white text-base">تأكيد تحديث الرد</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              سيتم استبدال رد جميع الكلمات الثابتة ({currentCount} كلمة) بالرد الجديد. هل تريد المتابعة؟
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowApplyDialog(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white"
              >
                إلغاء
              </button>
              <button
                onClick={handleApplyReply}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow"
              >
                تأكيد
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restore Dialog */}
      {showRestoreDialog && (
        <div className="absolute inset-0 bg-black/75 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 max-w-sm w-full space-y-3 shadow-2xl">
            <h3 className="font-bold text-white text-base">استعادة الكلمات</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              سيتم إضافة {missingCount} كلمة نظامية مفقودة مع الرد الافتراضي. متابعة؟
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowRestoreDialog(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white"
              >
                إلغاء
              </button>
              <button
                onClick={handleRestore}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow"
              >
                استعادة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
