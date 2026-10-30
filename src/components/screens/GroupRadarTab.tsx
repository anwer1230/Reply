import React, { useState, useEffect } from 'react';
import {
  Radar,
  Plus,
  Trash2,
  Sparkles,
  MessageCircle,
  Share2,
  Clock,
  CheckCircle,
  Sliders,
  ShieldCheck,
  Search,
  Flame,
} from 'lucide-react';
import { MonitoredKeyword } from '../../types';
import { automationService } from '../../core/automationService';

interface GroupRadarTabProps {
  onShowToast: (msg: string) => void;
}

export const GroupRadarTab: React.FC<GroupRadarTabProps> = ({ onShowToast }) => {
  const [keywords, setKeywords] = useState<MonitoredKeyword[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Keyword Form
  const [keywordText, setKeywordText] = useState('');
  const [category, setCategory] = useState('طلبات وخدمات');
  const [actionType, setActionType] = useState<'quote_reply' | 'direct_dm' | 'notify_only'>('quote_reply');
  const [customReply, setCustomReply] = useState('');
  const [useAI, setUseAI] = useState(true);
  const [cooldownMinutes, setCooldownMinutes] = useState(10);

  useEffect(() => {
    loadKeywords();
  }, []);

  const loadKeywords = () => {
    setKeywords(automationService.getMonitoredKeywords());
  };

  const handleToggle = (id: string, isEnabled: boolean) => {
    automationService.toggleMonitoredKeyword(id, isEnabled);
    loadKeywords();
    onShowToast(`تم ${isEnabled ? 'تفعيل' : 'تعطيل'} رصد الكلمة المفتاحية`);
  };

  const handleDelete = (id: string) => {
    automationService.deleteMonitoredKeyword(id);
    loadKeywords();
    onShowToast('تم حذف الكلمة من الرادار');
  };

  const handleAddKeyword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keywordText.trim()) return;

    automationService.addMonitoredKeyword({
      keyword: keywordText.trim(),
      category,
      actionType,
      customReply: customReply.trim() || undefined,
      useAI,
      isEnabled: true,
      cooldownMinutes,
    });

    onShowToast(`تمت إضافة "${keywordText}" إلى رادار المجموعات`);
    setShowAddModal(false);
    setKeywordText('');
    setCustomReply('');
    loadKeywords();
  };

  const filtered = keywords.filter((k) =>
    k.keyword.toLowerCase().includes(searchQuery.toLowerCase()) ||
    k.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Radar className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-black text-white">رادار مراقبة الكلمات المفتاحية في المجموعات</h2>
            <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold">
              اقتباس ورد ذكي
            </span>
          </div>
          <p className="text-xs text-slate-400">
            يرصد الكلمات المستهدفة في مجموعات واتساب (مثل "مطلوب"، "سعر"، "أريد شراء") ويرد بالاقتباس أو بالخاص تلقائياً
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold rounded-2xl shadow-lg shadow-amber-950/40 flex items-center gap-2 cursor-pointer transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة كلمة مفتاحية للرادار</span>
        </button>
      </div>

      {/* Search & Stats Bar */}
      <div className="flex items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-3 rounded-2xl">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="البحث في كلمات الرادار..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
          />
        </div>
        <div className="text-xs text-slate-400 flex items-center gap-2 font-bold">
          <span>إجمالي الكلمات المراقبة: {keywords.length}</span>
          <span className="text-amber-400">({keywords.filter((k) => k.isEnabled).length} نشطة)</span>
        </div>
      </div>

      {/* Radar Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((item) => (
          <div
            key={item.id}
            className={`bg-slate-900 border rounded-3xl p-5 shadow-xl transition-all space-y-3 ${
              item.isEnabled ? 'border-slate-800 hover:border-amber-500/40' : 'border-slate-800/50 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
                <h3 className="font-black text-sm text-white">"{item.keyword}"</h3>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">
                  {item.category}
                </span>
              </div>

              {/* Action Switch Toggle */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={item.isEnabled}
                  onChange={(e) => handleToggle(item.id, e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
              </label>
            </div>

            {/* Reply Details */}
            <div className="bg-slate-950 rounded-2xl p-3 border border-slate-800 text-xs text-slate-300">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                  {item.actionType === 'quote_reply' ? (
                    <>
                      <MessageCircle className="w-3.5 h-3.5 text-amber-400" />
                      اقتباس الرسالة والرد في المجموعة
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5 text-teal-400" />
                      إرسال رد خاص (DM) للمرسل
                    </>
                  )}
                </span>
                {item.useAI ? (
                  <span className="text-[10px] bg-purple-950 text-purple-300 border border-purple-500/30 px-2 py-0.2 rounded-full font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    رد ذكاء اصطناعي
                  </span>
                ) : (
                  <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.2 rounded-full">
                    نص مخصص
                  </span>
                )}
              </div>
              <p className="line-clamp-2 leading-relaxed">
                {item.customReply || 'توليد الرد الآلي بواسطة الذكاء الاصطناعي مع الاستناد لقاعدة المعرفة.'}
              </p>
            </div>

            {/* Bottom Meta & Delete */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                  تم الرصد: {item.matchCount} مرة
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  منع التكرار: {item.cooldownMinutes} دقيقة
                </span>
              </div>
              <button
                onClick={() => handleDelete(item.id)}
                className="text-slate-500 hover:text-rose-400 cursor-pointer transition-colors p-1"
                title="حذف"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Keyword Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-black text-sm text-white flex items-center gap-2">
                <Radar className="w-4 h-4 text-amber-400" />
                <span>إضافة كلمة مفتاحية جديدة للرادار</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-500 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddKeyword} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">الكلمة المفتاحية المستهدفة</label>
                <input
                  type="text"
                  value={keywordText}
                  onChange={(e) => setKeywordText(e.target.value)}
                  placeholder="مثال: مطلوب، أريد شراء، وظيفة، توصيل"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">التصنيف</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="مثال: طلبات، مبيعات، استفسارات"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">إجراء الرد التلقائي</label>
                <select
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="quote_reply">اقتباس الرسالة والرد في المجموعة مباشرة</option>
                  <option value="direct_dm">إرسال رد خاص (DM) للشخص الذي كتب الكلمة</option>
                </select>
              </div>

              <div className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <input
                  type="checkbox"
                  id="useAI"
                  checked={useAI}
                  onChange={(e) => setUseAI(e.target.checked)}
                  className="accent-amber-500"
                />
                <label htmlFor="useAI" className="text-xs text-slate-300 font-bold cursor-pointer">
                  استخدام الذكاء الاصطناعي لتوليد رد ذكي مخصص للطلب
                </label>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  نص الرد المخصص (اختياري، يترك فارغاً لاعتماد الذكاء الاصطناعي)
                </label>
                <textarea
                  rows={2}
                  value={customReply}
                  onChange={(e) => setCustomReply(e.target.value)}
                  placeholder="اكتب الرد التلقائي الذي ترغب به..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  نافذة منع التكرار للمرسل ({cooldownMinutes} دقيقة)
                </label>
                <input
                  type="range"
                  min="2"
                  max="60"
                  step="2"
                  value={cooldownMinutes}
                  onChange={(e) => setCooldownMinutes(parseInt(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white text-xs cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-amber-950 cursor-pointer transition-colors"
                >
                  حفظ وتفعيل الكلمة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
