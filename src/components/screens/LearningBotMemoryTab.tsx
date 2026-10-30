import React, { useState, useEffect } from 'react';
import {
  Brain,
  Plus,
  Trash2,
  Sparkles,
  BookOpen,
  DollarSign,
  ShieldAlert,
  HelpCircle,
  Phone,
  Search,
  CheckCircle,
  Send,
  RefreshCw,
} from 'lucide-react';
import { KnowledgeMemory } from '../../types';
import { automationService } from '../../core/automationService';
import { aiService } from '../../core/aiService';

interface LearningBotMemoryTabProps {
  onShowToast: (msg: string) => void;
}

export const LearningBotMemoryTab: React.FC<LearningBotMemoryTabProps> = ({ onShowToast }) => {
  const [memories, setMemories] = useState<KnowledgeMemory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // New Memory Form
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'service' | 'pricing' | 'policy' | 'faq' | 'contact_info'>('service');
  const [content, setContent] = useState('');

  // Interactive Memory Tester
  const [testerQuestion, setTesterQuestion] = useState('');
  const [testerReply, setTesterReply] = useState('');
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    loadMemories();
  }, []);

  const loadMemories = () => {
    setMemories(automationService.getKnowledgeMemories());
  };

  const handleAddMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    automationService.addKnowledgeMemory({
      title: title.trim(),
      category,
      content: content.trim(),
    });

    onShowToast('تمت إضافة المعلومة إلى ذاكرة بوت التعلم بنجاح');
    setShowAddModal(false);
    setTitle('');
    setContent('');
    loadMemories();
  };

  const handleDelete = (id: string) => {
    automationService.deleteKnowledgeMemory(id);
    onShowToast('تم حذف المعلومة من الذاكرة');
    loadMemories();
  };

  const handleTestMemoryBot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testerQuestion.trim()) return;

    setIsTesting(true);
    setTesterReply('');

    try {
      const res = await aiService.generateReply({
        message: testerQuestion,
        senderName: 'عميل تجريبي',
        knowledgeMemories: memories,
      });
      setTesterReply(res.replyText);
    } catch (err: unknown) {
      setTesterReply('حدث خطأ أثناء استدعاء الذكاء الاصطناعي: ' + (err as Error).message);
    } finally {
      setIsTesting(false);
    }
  };

  const filtered = memories.filter((m) => {
    const matchesSearch =
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'all' || m.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const getCategoryBadge = (cat: KnowledgeMemory['category']) => {
    switch (cat) {
      case 'pricing':
        return { label: 'أسعار وباقات', icon: DollarSign, color: 'text-emerald-400 bg-emerald-950/60 border-emerald-500/30' };
      case 'service':
        return { label: 'خدمات ومنتجات', icon: BookOpen, color: 'text-blue-400 bg-blue-950/60 border-blue-500/30' };
      case 'policy':
        return { label: 'سياسات وشروط', icon: ShieldAlert, color: 'text-amber-400 bg-amber-950/60 border-amber-500/30' };
      case 'faq':
        return { label: 'أسئلة شائعة', icon: HelpCircle, color: 'text-purple-400 bg-purple-950/60 border-purple-500/30' };
      case 'contact_info':
        return { label: 'معلومات اتصال', icon: Phone, color: 'text-teal-400 bg-teal-950/60 border-teal-500/30' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Brain className="w-5 h-5 text-purple-400" />
            <h2 className="text-lg font-black text-white">بوت التعلم الذكي والذاكرة الدائمة (Knowledge Base)</h2>
            <span className="text-[10px] bg-purple-950 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded-full font-bold">
              تخزين دائم JSON
            </span>
          </div>
          <p className="text-xs text-slate-400">
            أضف خدماتك وأسعارك وشروطك؛ يتعلمها الذكاء الاصطناعي ويستخدمها فورياً للإجابة على استفسارات عملاء واتساب بدقة
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold rounded-2xl shadow-lg shadow-purple-950/40 flex items-center gap-2 cursor-pointer transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة معلومة جديدة للذاكرة</span>
        </button>
      </div>

      {/* Interactive Memory Tester Drawer */}
      <div className="bg-slate-900/90 border border-purple-500/30 rounded-3xl p-5 shadow-xl">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-bold text-white">تجربة إجابات البوت استناداً لذاكرة النظام</h3>
        </div>

        <form onSubmit={handleTestMemoryBot} className="flex gap-2 mb-3">
          <input
            type="text"
            value={testerQuestion}
            onChange={(e) => setTesterQuestion(e.target.value)}
            placeholder="اسأل البوت سؤالاً عن أسعارك أو خدماتك لاختبار دقته..."
            className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
          />
          <button
            type="submit"
            disabled={isTesting || !testerQuestion.trim()}
            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-2xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors"
          >
            {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            <span>سؤال البوت</span>
          </button>
        </form>

        {testerReply && (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs leading-relaxed text-purple-100 animate-in fade-in">
            <span className="text-[10px] text-purple-400 font-bold block mb-1">إجابة البوت من الذاكرة:</span>
            {testerReply}
          </div>
        )}
      </div>

      {/* Categories Filter & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-3 rounded-2xl">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'الكل' },
            { id: 'pricing', label: 'الأسعار' },
            { id: 'service', label: 'الخدمات' },
            { id: 'policy', label: 'الشروط' },
            { id: 'faq', label: 'الأسئلة الشائعة' },
            { id: 'contact_info', label: 'الاتصال' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1 rounded-xl text-xs font-bold cursor-pointer transition-colors whitespace-nowrap ${
                selectedCategory === cat.id
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث في الذاكرة..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-8 pl-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* Memory Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((item) => {
          const badge = getCategoryBadge(item.category);
          const Icon = badge.icon;
          return (
            <div
              key={item.id}
              className="bg-slate-900 border border-slate-800 hover:border-purple-500/40 rounded-3xl p-5 shadow-xl transition-all space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full border font-bold flex items-center gap-1.5 ${badge.color}`}>
                  <Icon className="w-3 h-3" />
                  {badge.label}
                </span>
                <span className="text-[10px] text-slate-500">
                  {new Date(item.updatedAt).toLocaleDateString('ar-SA')}
                </span>
              </div>

              <h3 className="font-black text-sm text-white">{item.title}</h3>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-3 rounded-2xl border border-slate-800/80">
                {item.content}
              </p>

              <div className="flex justify-end pt-1">
                <button
                  onClick={() => handleDelete(item.id)}
                  className="text-slate-500 hover:text-rose-400 text-xs flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>حذف المعلومة</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Memory Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-black text-sm text-white flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-400" />
                <span>إضافة معلومة جديدة لذاكرة بوت واتساب</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-500 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddMemory} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">عنوان المعلومة أو الخدمة</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: أسعار باقات الرد الذكي الشهرية"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">التصنيف</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                >
                  <option value="service">خدمات ومنتجات</option>
                  <option value="pricing">أسعار وباقات</option>
                  <option value="policy">سياسات وشروط</option>
                  <option value="faq">أسئلة شائعة</option>
                  <option value="contact_info">معلومات تواصل</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">التفاصيل والمعلومات الدقيقة</label>
                <textarea
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="اكتب المعلومات والأسعار بالتفصيل. سيستخدمها الذكاء الاصطناعي للإجابة على عملائك..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-purple-500 resize-none leading-relaxed"
                  required
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
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-950 cursor-pointer transition-colors"
                >
                  حفظ في الذاكرة الدائمة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
