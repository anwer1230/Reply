import React, { useState, useEffect } from 'react';
import {
  Clock,
  Plus,
  Send,
  Trash2,
  Image as ImageIcon,
  Users,
  ShieldAlert,
  Calendar,
  CheckCircle,
  AlertCircle,
  Upload,
  Play,
  RotateCcw,
} from 'lucide-react';
import { ScheduledMessage } from '../../types';
import { automationService } from '../../core/automationService';

interface ScheduledMessagesTabProps {
  onShowToast: (msg: string) => void;
}

export const ScheduledMessagesTab: React.FC<ScheduledMessagesTabProps> = ({ onShowToast }) => {
  const [messages, setMessages] = useState<ScheduledMessage[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [targetRecipient, setTargetRecipient] = useState('');
  const [recipientType, setRecipientType] = useState<'contact' | 'group' | 'all_groups'>('group');
  const [messageText, setMessageText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [scheduledDateTime, setScheduledDateTime] = useState('');
  const [intervalDelaySeconds, setIntervalDelaySeconds] = useState(15);
  const [repeat, setRepeat] = useState<'none' | 'daily' | 'weekly'>('none');

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = () => {
    setMessages(automationService.getScheduledMessages());
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setImageUrl(reader.result);
          onShowToast('تم تحميل الصورة بنجاح');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateScheduled = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) {
      onShowToast('يرجى كتابة نص الرسالة');
      return;
    }

    const scheduledTime = scheduledDateTime ? new Date(scheduledDateTime).getTime() : Date.now() + 3600000;

    automationService.addScheduledMessage({
      title: title || 'حملة رسائل مجدولة',
      targetRecipient: targetRecipient || 'مجموعات واتساب المحددة',
      recipientType,
      messageText,
      imageUrl: imageUrl || undefined,
      scheduledTime,
      intervalDelaySeconds,
      repeat,
    });

    onShowToast('تمت جدولة الرسالة بنجاح');
    setShowAddModal(false);
    resetForm();
    loadMessages();
  };

  const resetForm = () => {
    setTitle('');
    setTargetRecipient('');
    setMessageText('');
    setImageUrl('');
    setScheduledDateTime('');
    setIntervalDelaySeconds(15);
    setRepeat('none');
  };

  const handleSendNow = (id: string) => {
    const sent = automationService.sendScheduledMessageNow(id);
    if (sent) {
      onShowToast('تم تنفيذ الإرسال الفوري للرسالة بنجاح');
      loadMessages();
    }
  };

  const handleDelete = (id: string) => {
    automationService.deleteScheduledMessage(id);
    onShowToast('تم حذف الرسالة المجدولة');
    loadMessages();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-5 h-5 text-teal-400" />
            <h2 className="text-lg font-black text-white">الرسائل المجدولة والفورية مع صور</h2>
            <span className="text-[10px] bg-teal-950 text-teal-300 border border-teal-500/40 px-2 py-0.5 rounded-full font-bold">
              حماية مضادة للحظر
            </span>
          </div>
          <p className="text-xs text-slate-400">
            أرسل بروشورات وعروض وصور فوراً أو مجدولة للمجموعات وجهات اتصال واتساب مع فواصل زمنية متغيرة
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold rounded-2xl shadow-lg shadow-teal-950/40 flex items-center gap-2 cursor-pointer transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>جدولة رسالة جديدة مع صورة</span>
        </button>
      </div>

      {/* Messages Queue List */}
      <div className="space-y-4">
        {messages.length === 0 ? (
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-12 text-center text-slate-500">
            <Clock className="w-10 h-10 mx-auto mb-3 opacity-30 text-teal-400" />
            <h4 className="text-sm font-bold text-slate-300 mb-1">لا توجد رسائل مجدولة حالياً</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              يمكنك جدولة إرسال رسائل دورية أو عروض مصورة لمجموعات واتساب مع فواصل زمنية لمنع الحظر.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold cursor-pointer transition-colors"
            >
              إنشاء أول رسالة مجدولة
            </button>
          </div>
        ) : (
          messages.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start gap-4 flex-1">
                {/* Image Thumbnail */}
                {item.imageUrl ? (
                  <div className="w-20 h-20 rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shrink-0">
                    <img src={item.imageUrl} alt="attachment" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0 text-slate-600">
                    <ImageIcon className="w-7 h-7" />
                  </div>
                )}

                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-sm text-white">{item.title}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      item.status === 'sent'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-950 text-amber-300 border border-amber-500/30'
                    }`}>
                      {item.status === 'sent' ? 'تم الإرسال' : 'مجدولة في الانتظار'}
                    </span>
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                      <Users className="w-3 h-3 text-teal-400" />
                      {item.targetRecipient}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                    {item.messageText}
                  </p>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      {new Date(item.scheduledTime).toLocaleString('ar-SA')}
                    </span>
                    <span className="flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                      فارق الحظر: {item.intervalDelaySeconds} ثوانٍ
                    </span>
                    {item.repeat !== 'none' && (
                      <span className="text-teal-400 font-bold">
                        تكرار: {item.repeat === 'daily' ? 'يومياً' : 'أسبوعياً'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-800">
                {item.status !== 'sent' && (
                  <button
                    onClick={() => handleSendNow(item.id)}
                    className="px-3.5 py-2 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>إرسال فوري الآن</span>
                  </button>
                )}
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-2 bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 rounded-xl cursor-pointer transition-colors"
                  title="حذف"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Scheduled Message Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-black text-sm text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-400" />
                <span>جدولة رسالة جديدة مع صور لواتساب</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-500 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateScheduled} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">عنوان الحملة أو الرسالة</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: عروض نهاية الأسبوع الخاصة"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">نوع المستهدفين</label>
                  <select
                    value={recipientType}
                    onChange={(e) => setRecipientType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                  >
                    <option value="group">مجموعة محددة</option>
                    <option value="all_groups">كل مجموعات واتساب</option>
                    <option value="contact">جهة اتصال خاصة</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">اسم المجموعة / الرقم</label>
                  <input
                    type="text"
                    value={targetRecipient}
                    onChange={(e) => setTargetRecipient(e.target.value)}
                    placeholder="مثال: قروب العملاء أو +9665..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">نص الرسالة أو الكابشن</label>
                <textarea
                  rows={3}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="اكتب نص الرسالة التي ستصل للمستلمين..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-teal-500 resize-none"
                  required
                />
              </div>

              {/* Image Attachment Upload */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">إرفاق صورة مع الرسالة</label>
                <div className="flex items-center gap-3">
                  <label className="flex-1 border border-dashed border-slate-700 hover:border-teal-500 rounded-xl p-3 text-center cursor-pointer bg-slate-950/60 transition-colors">
                    <Upload className="w-4 h-4 mx-auto mb-1 text-teal-400" />
                    <span className="text-[11px] text-slate-400 block font-bold">رفع صورة من جهازك</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                  {imageUrl && (
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-teal-500 shrink-0">
                      <img src={imageUrl} alt="preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setImageUrl('')}
                        className="absolute inset-0 bg-black/60 flex items-center justify-center text-rose-400 text-xs font-bold cursor-pointer"
                      >
                        حذف
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Timing & Delay Controls */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">موعد الإرسال المجدول</label>
                  <input
                    type="datetime-local"
                    value={scheduledDateTime}
                    onChange={(e) => setScheduledDateTime(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    فارق الأمان للحظر ({intervalDelaySeconds} ثانية)
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="60"
                    step="5"
                    value={intervalDelaySeconds}
                    onChange={(e) => setIntervalDelaySeconds(parseInt(e.target.value))}
                    className="w-full accent-teal-500 cursor-pointer mt-2"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">التكرار التلقائي</label>
                <select
                  value={repeat}
                  onChange={(e) => setRepeat(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500 cursor-pointer"
                >
                  <option value="none">بدون تكرار (مرة واحدة)</option>
                  <option value="daily">يومياً بنفس الوقت</option>
                  <option value="weekly">أسبوعياً</option>
                </select>
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
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-teal-950 cursor-pointer transition-colors"
                >
                  حفظ وجدولة الرسالة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
