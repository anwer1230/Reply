import React, { useState, useEffect } from 'react';
import { ArrowRight, Trash2, Check, AlertCircle, Smartphone } from 'lucide-react';
import { Rule, TargetApp } from '../../types';
import { getAppDisplayLabel } from '../../core/SupportedApps';
import { AppSelectorModal } from '../AppSelectorModal';

interface AddEditScreenProps {
  ruleId?: string;
  rules: Rule[];
  onBack: () => void;
  onSaveRule: (rule: Omit<Rule, 'createdAt'> & { createdAt?: number }) => void;
  onDeleteRule: (ruleId: string) => void;
}

export const AddEditScreen: React.FC<AddEditScreenProps> = ({
  ruleId,
  rules,
  onBack,
  onSaveRule,
  onDeleteRule,
}) => {
  const existingRule = rules.find((r) => r.id === ruleId);

  const [keyword, setKeyword] = useState('');
  const [reply, setReply] = useState('');
  const [targetApp, setTargetApp] = useState<TargetApp>('whatsapp');
  const [isExactMatch, setIsExactMatch] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isAppModalOpen, setIsAppModalOpen] = useState(false);

  useEffect(() => {
    if (existingRule) {
      setKeyword(existingRule.keyword);
      setReply(existingRule.reply);
      setTargetApp(existingRule.targetApp);
      setIsExactMatch(existingRule.isExactMatch);
    }
  }, [existingRule]);

  const canSave = keyword.trim().length > 0 && reply.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    onSaveRule({
      id: existingRule ? existingRule.id : '0',
      keyword: keyword.trim(),
      reply: reply.trim(),
      targetApp,
      isExactMatch,
      isEnabled: existingRule ? existingRule.isEnabled : true,
      source: existingRule ? existingRule.source : 'USER',
      createdAt: existingRule?.createdAt,
    });
    onBack();
  };

  const handleDelete = () => {
    if (existingRule) {
      onDeleteRule(existingRule.id);
      setShowDeleteDialog(false);
      onBack();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900 relative">
      {/* TopAppBar */}
      <header className="bg-[#00695C] text-white px-3 py-3 flex items-center justify-between shadow-md shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10 active:bg-white/20 transition-colors"
            title="رجوع"
          >
            <ArrowRight className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-base font-bold">
            {existingRule ? 'تعديل القاعدة' : 'إضافة قاعدة'}
          </h1>
        </div>

        {existingRule && (
          <button
            onClick={() => setShowDeleteDialog(true)}
            className="w-9 h-9 rounded-full flex items-center justify-center text-rose-200 hover:text-white hover:bg-rose-500/20 active:bg-rose-500/30 transition-colors"
            title="حذف"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </header>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {existingRule?.source === 'SYSTEM' && (
          <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-2.5 text-xs text-emerald-200 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>هذه كلمة من قائمة الكلمات الثابتة النظامية. يمكنك تعديلها أو حذفها واستعادتها لاحقاً.</span>
          </div>
        )}

        {/* Keyword field */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-300">
            الكلمة المفتاحية <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="مثال: ابي مساعدة"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Reply field */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-300">
            نص الرد التلقائي <span className="text-rose-400">*</span>
          </label>
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="اكتب نص الرد الذي سيتم إرساله تلقائياً..."
            rows={4}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
          />
        </div>

        {/* Target App Selector */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-300">
              التطبيقات المستهدفة بالرد:
            </label>
            <button
              type="button"
              onClick={() => setIsAppModalOpen(true)}
              className="text-emerald-400 hover:text-emerald-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>استعراض كل التطبيقات</span>
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Currently selected display card */}
          <div
            onClick={() => setIsAppModalOpen(true)}
            className="bg-slate-800/90 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500/50 rounded-2xl p-3 flex items-center justify-between gap-3 cursor-pointer transition-all shadow-sm group"
          >
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 block font-medium">التطبيقات المحددة لهذه القاعدة:</span>
              <span className="text-xs font-bold text-emerald-400 group-hover:text-emerald-300 truncate block mt-0.5">
                {getAppDisplayLabel(targetApp)}
              </span>
            </div>

            <span className="px-3 py-1 bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-bold shrink-0">
              استعراض الكل وتعديل ✎
            </span>
          </div>

          {/* Quick Preset Multi-select options */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] text-slate-400 block">اختيار سريع أو جمع عدة أنواع معاً:</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => {
                  if (targetApp === 'whatsapp_all' || targetApp === 'whatsapp') {
                    setTargetApp('com.whatsapp');
                  } else if (targetApp.includes('whatsapp') || targetApp.includes('com.whatsapp')) {
                    // toggle out
                    const next = targetApp.split(',').filter(s => !s.includes('whatsapp'));
                    setTargetApp(next.length ? next.join(',') : 'all');
                  } else {
                    setTargetApp(targetApp === 'all' ? 'whatsapp_all' : `${targetApp},whatsapp_all`);
                  }
                }}
                className={`py-2 px-2 rounded-xl border text-center transition-all ${
                  targetApp === 'whatsapp_all' || targetApp === 'whatsapp' || targetApp.includes('com.whatsapp')
                    ? 'bg-[#25D366] text-slate-950 font-bold border-[#25D366] shadow'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                }`}
              >
                واتساب (كل أنواعه)
              </button>

              <button
                type="button"
                onClick={() => {
                  if (targetApp === 'telegram_all' || targetApp === 'telegram') {
                    setTargetApp('org.telegram.messenger');
                  } else if (targetApp.includes('telegram') || targetApp.includes('org.telegram')) {
                    const next = targetApp.split(',').filter(s => !s.includes('telegram'));
                    setTargetApp(next.length ? next.join(',') : 'all');
                  } else {
                    setTargetApp(targetApp === 'all' ? 'telegram_all' : `${targetApp},telegram_all`);
                  }
                }}
                className={`py-2 px-2 rounded-xl border text-center transition-all ${
                  targetApp === 'telegram_all' || targetApp === 'telegram' || targetApp.includes('telegram')
                    ? 'bg-[#229ED9] text-white font-bold border-[#229ED9] shadow'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                }`}
              >
                تيليجرام (كل أنواعه)
              </button>

              <button
                type="button"
                onClick={() => setTargetApp('whatsapp_all,telegram_all')}
                className={`py-2 px-2 rounded-xl border text-center transition-all ${
                  (targetApp.includes('whatsapp') && targetApp.includes('telegram'))
                    ? 'bg-gradient-to-r from-[#25D366] to-[#229ED9] text-slate-950 font-bold border-emerald-400 shadow'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                }`}
              >
                واتساب + تيليجرام معاً
              </button>

              <button
                type="button"
                onClick={() => setTargetApp('all')}
                className={`py-2 px-2 rounded-xl border text-center transition-all ${
                  targetApp === 'all'
                    ? 'bg-emerald-600 text-white font-bold border-emerald-500 shadow'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                }`}
              >
                الكل (جميع التطبيقات)
              </button>
            </div>
          </div>
        </div>

        <AppSelectorModal
          isOpen={isAppModalOpen}
          selectedApps={targetApp}
          onClose={() => setIsAppModalOpen(false)}
          onConfirm={(selected) => setTargetApp(selected)}
        />

        {/* Exact Match Switch */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-200">مطابقة تامة (وليس احتواء)</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              إذا تم تفعيلها، يجب أن تكون الرسالة مطابقة للكلمة بحذافيرها.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsExactMatch(!isExactMatch)}
            className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out shrink-0 ${
              isExactMatch ? 'bg-emerald-600 justify-end' : 'bg-slate-700 justify-start'
            }`}
          >
            <div className="bg-white w-4 h-4 rounded-full shadow-md" />
          </button>
        </div>

        <div className="pt-4">
          <button
            onClick={handleSave}
            disabled={!canSave}
            className={`w-full py-3 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 ${
              canSave
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer active:scale-[0.98]'
                : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>{existingRule ? 'حفظ التعديلات' : 'إضافة القاعدة'}</span>
          </button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="absolute inset-0 bg-black/75 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 max-w-sm w-full space-y-3 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-bold text-white text-base">تأكيد الحذف</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {existingRule?.source === 'SYSTEM'
                ? 'ستُحذف هذه الكلمة النظامية. يمكنك استعادتها لاحقاً في أي وقت من شاشة إعدادات الكلمات الثابتة.'
                : 'هل أنت متأكد من حذف هذه القاعدة المخصصة؟ لا يمكن التراجع عن هذا الإجراء.'}
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowDeleteDialog(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white"
              >
                إلغاء
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow"
              >
                حذف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
