import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  CheckCircle,
  XCircle,
  Cpu,
  BarChart2,
  FileText,
  RefreshCw,
  Plus,
  ArrowRight,
  TrendingUp,
  Brain,
  MessageSquare,
} from 'lucide-react';
import { ExtractedPattern, Rule } from '../../types';
import { automationService } from '../../core/automationService';
import { aiService } from '../../core/aiService';

interface PatternAnalyzerTabProps {
  onAddRuleFromPattern: (keyword: string, reply: string) => void;
  onShowToast: (msg: string) => void;
}

export const PatternAnalyzerTab: React.FC<PatternAnalyzerTabProps> = ({
  onAddRuleFromPattern,
  onShowToast,
}) => {
  const [patterns, setPatterns] = useState<ExtractedPattern[]>([]);
  const [chatTranscript, setChatTranscript] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    loadPatterns();
  }, []);

  const loadPatterns = () => {
    setPatterns(automationService.getPatterns());
  };

  const handleAnalyzeChat = async () => {
    if (!chatTranscript.trim()) {
      onShowToast('يرجى لصق نص المحادثات لتحليلها');
      return;
    }

    setIsAnalyzing(true);
    try {
      const extracted = await aiService.extractPatternsFromChat(chatTranscript);
      automationService.savePatterns(extracted);
      setPatterns(extracted);
      onShowToast(`تم استخلاص ${extracted.length} أنماط متكررة بنجاح`);
    } catch (err: unknown) {
      onShowToast('حدث خطأ أثناء تحليل المحادثات: ' + (err as Error).message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApprovePattern = (pattern: ExtractedPattern) => {
    onAddRuleFromPattern(pattern.suggestedKeyword, pattern.suggestedReply);
    automationService.updatePatternStatus(pattern.id, 'approved');
    loadPatterns();
    onShowToast(`تم اعتماد النمط وإضافته كقاعدة رد فوري للكلمة: "${pattern.suggestedKeyword}"`);
  };

  const handleRejectPattern = (id: string) => {
    automationService.updatePatternStatus(id, 'rejected');
    loadPatterns();
    onShowToast('تم تجاهل النمط');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-500 p-0.5 shadow-md">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <h2 className="text-lg font-black text-white">التحليل التلقائي للمحادثات واستخلاص أنماط الرد</h2>
            <p className="text-xs text-slate-400">
              يحلل سجلات محادثات واتساب ويستنتج الأسئلة المتكررة ونمط الرد الأمثل لتحويلها بضغطة زر إلى قواعد رد تلقائي
            </p>
          </div>
        </div>
      </div>

      {/* Chat Transcript Input Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">لصق نصوص محادثات واتساب للتحليل</h3>
          </div>
          <button
            type="button"
            onClick={() => {
              setChatTranscript(`العميل: السلام عليكم ورحمة الله، كم سعر الباقة السنوية عندكم؟
الدعم: وعليكم السلام ورحمة الله! سعر الباقة السنوية 999 ريال شاملة كافة التحديثات والدعم.
العميل: هل تدعمون الدفع عند الاستلام أو تحويل بنكي؟
الدعم: نعم نوفر التحويل البنكي والمدفوعات الإلكترونية مدى وفيزا وفاتورة ضريبية.
العميل: هل يعمل النظام 24 ساعة؟
الدعم: نعم النظام آلي بالكامل ويعمل طوال اليوم بدون توقف.`);
            }}
            className="text-[11px] bg-slate-800 hover:bg-slate-700 text-cyan-300 px-3 py-1 rounded-xl cursor-pointer transition-colors"
          >
            📋 تجربة نص محادثات جاهز
          </button>
        </div>

        <textarea
          rows={5}
          value={chatTranscript}
          onChange={(e) => setChatTranscript(e.target.value)}
          placeholder="الصق هنا تصدير محادثات واتساب أو سجل الاستفسارات اليومية ليقوم الذكاء الاصطناعي بتحليلها..."
          className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-white focus:outline-none focus:border-cyan-500 leading-relaxed resize-none"
        />

        <div className="flex justify-end">
          <button
            onClick={handleAnalyzeChat}
            disabled={isAnalyzing || !chatTranscript.trim()}
            className="px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-cyan-950/40 flex items-center gap-2 cursor-pointer transition-all"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>جاري استخلاص وتحليل الأنماط بالذكاء الاصطناعي...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>بدء التحليل واستخراج الأنماط الذكية</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Discovered Patterns List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-cyan-400" />
            <span>الأنماط المستخلصة المقترحة للرد الآلي ({patterns.length})</span>
          </h3>
        </div>

        <div className="space-y-4">
          {patterns.map((item) => (
            <div
              key={item.id}
              className={`bg-slate-900 border rounded-3xl p-5 shadow-xl transition-all space-y-3 ${
                item.status === 'approved'
                  ? 'border-emerald-500/40 bg-emerald-950/10'
                  : item.status === 'rejected'
                  ? 'border-slate-800/40 opacity-50'
                  : 'border-slate-800 hover:border-cyan-500/40'
              }`}
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-500/30 px-2.5 py-0.5 rounded-full font-bold">
                    ثقة التحليل: {item.confidence}%
                  </span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">
                    تكرار في المحادثات: {item.occurrences} مرات
                  </span>
                </div>

                {item.status === 'approved' && (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    معتمد كقاعدة واتساب نشطة
                  </span>
                )}
              </div>

              {/* Pattern Q&A */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 block mb-1 font-bold">السؤال الشائع المستنتج:</span>
                  <p className="text-slate-200 font-medium">{item.userQuestion}</p>
                  <div className="mt-2 text-[10px] text-cyan-400 font-bold">
                    الكلمة المفتاحية المقترحة: [{item.suggestedKeyword}]
                  </div>
                </div>

                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 block mb-1 font-bold">الرد التلقائي المقترح:</span>
                  <p className="text-emerald-300 font-medium leading-relaxed">{item.suggestedReply}</p>
                </div>
              </div>

              {/* Actions */}
              {item.status === 'pending' && (
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
                  <button
                    onClick={() => handleRejectPattern(item.id)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl text-xs cursor-pointer transition-colors"
                  >
                    تجاهل النمط
                  </button>
                  <button
                    onClick={() => handleApprovePattern(item)}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-950 cursor-pointer transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>اعتماد كقاعدة رد فوري في واتساب</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
