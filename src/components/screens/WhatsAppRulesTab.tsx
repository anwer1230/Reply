import React, { useState } from 'react';
import {
  MessageSquare,
  Plus,
  Trash2,
  Edit2,
  Search,
  CheckCircle,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  CheckSquare,
  Sliders,
} from 'lucide-react';
import { Rule } from '../../types';

interface WhatsAppRulesTabProps {
  rules: Rule[];
  onSaveRule: (rule: Omit<Rule, 'createdAt'> & { createdAt?: number }) => void;
  onDeleteRule: (id: string) => void;
  onToggleRule: (id: string, isEnabled: boolean) => void;
  onUpdateAllSystemReplies: (newReply: string) => void;
  onRestoreMissingSystemKeywords: () => Promise<number>;
  onShowToast: (msg: string) => void;
}

export const WhatsAppRulesTab: React.FC<WhatsAppRulesTabProps> = ({
  rules,
  onSaveRule,
  onDeleteRule,
  onToggleRule,
  onUpdateAllSystemReplies,
  onRestoreMissingSystemKeywords,
  onShowToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [showUnifiedModal, setShowUnifiedModal] = useState(false);

  // Edit / Add Form
  const [editId, setEditId] = useState<string>('0');
  const [keyword, setKeyword] = useState('');
  const [reply, setReply] = useState('');
  const [isExactMatch, setIsExactMatch] = useState(false);

  // Unified reply state
  const [unifiedReplyText, setUnifiedReplyText] = useState('');

  const handleOpenAdd = () => {
    setEditId('0');
    setKeyword('');
    setReply('');
    setIsExactMatch(false);
    setShowAddEditModal(true);
  };

  const handleOpenEdit = (rule: Rule) => {
    setEditId(rule.id);
    setKeyword(rule.keyword);
    setReply(rule.reply);
    setIsExactMatch(rule.isExactMatch);
    setShowAddEditModal(true);
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim() || !reply.trim()) return;

    onSaveRule({
      id: editId,
      keyword: keyword.trim(),
      reply: reply.trim(),
      targetApp: 'whatsapp',
      isEnabled: true,
      isExactMatch,
      source: editId === '0' ? 'USER' : (rules.find((r) => r.id === editId)?.source || 'USER'),
    });

    setShowAddEditModal(false);
  };

  const handleUnifiedSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unifiedReplyText.trim()) return;

    onUpdateAllSystemReplies(unifiedReplyText.trim());
    setShowUnifiedModal(false);
    onShowToast('تم تحديث نص الرد الموحد لجميع الكلمات الثابتة بنجاح');
  };

  const handleRestore = async () => {
    const count = await onRestoreMissingSystemKeywords();
    if (count > 0) {
      onShowToast(`تمت استعادة ${count} كلمة نظام مفقودة بنجاح`);
    } else {
      onShowToast('جميع كلمات النظام الـ 25 موجودة بالفعل');
    }
  };

  const filteredRules = rules.filter(
    (r) =>
      r.keyword.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.reply.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-black text-white">قواعد الرد التلقائي لواتساب</h2>
            <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
              25 كلمة أساسية + فلتر نفي
            </span>
          </div>
          <p className="text-xs text-slate-400">
            تخصيص الردود الفورية لواتساب الرسمي والأعمال وباقي النسخ مع حماية كاملة من الرد الخاطئ
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setUnifiedReplyText(rules.find((r) => r.source === 'SYSTEM')?.reply || '');
              setShowUnifiedModal(true);
            }}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Sliders className="w-3.5 h-3.5 text-emerald-400" />
            <span>تعديل الرد الموحّد</span>
          </button>

          <button
            onClick={handleRestore}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
            title="استعادة أي كلمة محذوفة من الـ 25 الأساسية"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>استعادة الكلمات المفقودة</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-950/40 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة قاعدة جديدة</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-3 rounded-2xl">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="البحث في الكلمات أو نصوص الرد..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div className="text-xs text-slate-400 font-bold">
          عدد القواعد: <span className="text-emerald-400">{filteredRules.length}</span>
        </div>
      </div>

      {/* Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredRules.map((rule) => (
          <div
            key={rule.id}
            className={`bg-slate-900 border rounded-3xl p-5 shadow-xl transition-all space-y-3 ${
              rule.isEnabled ? 'border-slate-800 hover:border-emerald-500/40' : 'border-slate-800/40 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                <h3 className="font-black text-sm text-white">"{rule.keyword}"</h3>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">
                  {rule.source === 'SYSTEM' ? 'ثابتة (أساسية)' : rule.source === 'LEARNED_AI' ? 'مستخلصة ذكياً' : 'مخصصة'}
                </span>
                {rule.isExactMatch && (
                  <span className="text-[10px] bg-blue-950 text-blue-300 border border-blue-500/30 px-2 py-0.2 rounded-full">
                    تطابق تام
                  </span>
                )}
              </div>

              {/* Toggle Switch */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={rule.isEnabled}
                  onChange={(e) => onToggleRule(rule.id, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-xs text-slate-300 leading-relaxed">
              <span className="text-[10px] text-slate-500 block mb-1 font-bold">الرد التلقائي:</span>
              <p className="line-clamp-3 font-medium">{rule.reply}</p>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
              <span className="text-emerald-400/90 font-bold">التطبيق: واتساب</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEdit(rule)}
                  className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg cursor-pointer transition-colors"
                  title="تعديل"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDeleteRule(rule.id)}
                  className="p-1.5 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 rounded-lg cursor-pointer transition-colors"
                  title="حذف"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Rule Modal */}
      {showAddEditModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-black text-sm text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <span>{editId === '0' ? 'إضافة قاعدة رد جديدة لواتساب' : 'تعديل قاعدة الرد'}</span>
              </h3>
              <button
                onClick={() => setShowAddEditModal(false)}
                className="text-slate-500 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">الكلمة المفتاحية المستهدفة</label>
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="مثال: مرحباً، السعر، العنوان، الوظائف"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">نص الرد التلقائي</label>
                <textarea
                  rows={4}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="اكتب الرد التلقائي الذي سيرسله النظام عند استلام هذه الكلمة..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500 resize-none leading-relaxed"
                  required
                />
              </div>

              <div className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <input
                  type="checkbox"
                  id="exactMatch"
                  checked={isExactMatch}
                  onChange={(e) => setIsExactMatch(e.target.checked)}
                  className="accent-emerald-500"
                />
                <label htmlFor="exactMatch" className="text-xs text-slate-300 font-bold cursor-pointer">
                  اشتراط تطابق الكلمة بالكامل (Exact Match)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddEditModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white text-xs cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950 cursor-pointer transition-colors"
                >
                  حفظ القاعدة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Unified Reply Modal */}
      {showUnifiedModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-black text-sm text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                <span>تعديل الرد الموحد لكلمات النظام الـ 25</span>
              </h3>
              <button
                onClick={() => setShowUnifiedModal(false)}
                className="text-slate-500 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUnifiedSubmit} className="space-y-4">
              <p className="text-xs text-slate-400">
                سيتم استبدال نص الرد لكافة كلمات النظام الأساسية (25 كلمة) بهذا النص بنقرة واحدة:
              </p>

              <textarea
                rows={4}
                value={unifiedReplyText}
                onChange={(e) => setUnifiedReplyText(e.target.value)}
                placeholder="اكتب الرد الموحد..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500 resize-none leading-relaxed"
                required
              />

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowUnifiedModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white text-xs cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-950 cursor-pointer transition-colors"
                >
                  تطبيق الرد على كل الكلمات الثابتة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
