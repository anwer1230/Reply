/**
 * VoiceCommander - محرك التحكم الصوتي الذاتي الشامل لتطبيق مركز سرعة إنجاز
 * يدعم الاستماع المستمر، تحويل الأرقام واللهجات العربية، استخلاص النوايا وتنفيذ الأوامر فعلياً
 * يشمل: أيقونة عائمة قابلة للتحريك (Draggable)، حوار تفاعلي ناطق لتسجيل الدخول (كود و2FA)،
 * وتحكم كامل في المراقبة والإرسال وكافة إعدادات النظام.
 */

(function (window, document) {
    'use strict';

    // جدول تحويل الكلمات العربية المنطوقة للأرقام
    const ARABIC_WORD_TO_DIGIT = {
        'صفر': '0', 'زيرو': '0',
        'واحد': '1', 'واحده': '1', 'واحدة': '1', 'الاول': '1', 'الأول': '1',
        'اثنين': '2', 'إثنين': '2', 'اتنين': '2', 'اثنان': '2', 'الثاني': '2',
        'ثلاثة': '3', 'تلاتة': '3', 'ثلاث': '3', 'تلاته': '3', 'الثالث': '3',
        'اربعة': '4', 'أربعة': '4', 'اربع': '4', 'أربع': '4', 'الرابع': '4',
        'خمسة': '5', 'خمس': '5', 'الخامس': '5',
        'ستة': '6', 'ست': '6', 'السادس': '6',
        'سبعة': '7', 'سبع': '7', 'السابع': '7',
        'ثمانية': '8', 'تمانية': '8', 'ثمان': '8', 'تمان': '8', 'الثامن': '8',
        'تسعة': '9', 'تسع': '9', 'التاسع': '9',
        'عشرة': '10', 'عشر': '10',
        'زائد': '+', 'موجب': '+', 'بلس': '+'
    };

    const ARABIC_EASTERN_DIGITS = {
        '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
        '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
    };

    class VoiceCommander {
        constructor() {
            this.recognition = null;
            this.isListening = false;
            this.ttsEnabled = true;
            this.autoRestart = true;
            this.synth = window.speechSynthesis || null;
            this.audioCtx = null;
            this.lastTranscript = '';
            this.processingLock = false;

            // حالة حوار تسجيل الدخول التفاعلي
            // IDLE | AWAITING_CODE | AWAITING_2FA
            this.authFlowState = 'IDLE';
            this.authPhone = '';
            this.authUserId = 'user_1';

            this.init();
        }

        init() {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRecognition) {
                console.warn('[VoiceCommander] SpeechRecognition is not supported in this browser.');
                this.supported = false;
                return;
            }
            this.supported = true;

            this.recognition = new SpeechRecognition();
            this.recognition.lang = 'ar-SA';
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
            this.recognition.maxAlternatives = 1;

            this.bindEvents();
            this.injectUI();
            this.setupDraggable();
        }

        bindEvents() {
            if (!this.recognition) return;

            this.recognition.onstart = () => {
                this.isListening = true;
                this.updateUIState(true);
                this.playTone(440, 0.1);
            };

            this.recognition.onend = () => {
                this.isListening = false;
                this.updateUIState(false);
                // إعادة التشغيل التلقائي إذا كان وضع الاستماع الدائم مفعلاً
                if (this.autoRestart && this.shouldStayActive) {
                    try {
                        this.recognition.start();
                    } catch (_) {}
                }
            };

            this.recognition.onerror = (e) => {
                console.warn('[VoiceCommander] Speech Error:', e.error);
                if (e.error === 'not-allowed') {
                    this.shouldStayActive = false;
                    this.speak('يرجى السماح بصلاحية الميكروفون لاستخدام التحكم الصوتي');
                }
            };

            this.recognition.onresult = (event) => {
                let interimTranscript = '';
                let finalTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript;
                    } else {
                        interimTranscript += transcript;
                    }
                }

                const currentText = (finalTranscript || interimTranscript).trim();
                if (currentText) {
                    this.showTranscript(currentText, Boolean(finalTranscript));
                }

                if (finalTranscript && !this.processingLock) {
                    this.handleVoiceCommand(finalTranscript.trim());
                }
            };
        }

        playTone(freq = 440, duration = 0.15) {
            try {
                if (!this.audioCtx) {
                    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                }
                if (this.audioCtx.state === 'suspended') {
                    this.audioCtx.resume();
                }
                const osc = this.audioCtx.createOscillator();
                const gain = this.audioCtx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
                gain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);
                osc.connect(gain);
                gain.connect(this.audioCtx.destination);
                osc.start();
                osc.stop(this.audioCtx.currentTime + duration);
            } catch (_) {}
        }

        speak(text) {
            if (!this.ttsEnabled || !this.synth || !text) return;
            try {
                this.synth.cancel();
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.lang = 'ar-SA';
                utterance.rate = 1.05;
                utterance.pitch = 1.0;

                const voices = this.synth.getVoices();
                const arVoice = voices.find(v => v.lang.startsWith('ar') || v.name.includes('Arabic'));
                if (arVoice) utterance.voice = arVoice;

                this.setSpeakingState(true);
                utterance.onend = () => this.setSpeakingState(false);
                utterance.onerror = () => this.setSpeakingState(false);
                this.synth.speak(utterance);
            } catch (err) {
                console.warn('[VoiceCommander] TTS Error:', err);
                this.setSpeakingState(false);
            }
        }

        normalizeSpokenDigits(text) {
            if (!text) return '';
            let s = text.trim();

            for (const [k, v] of Object.entries(ARABIC_EASTERN_DIGITS)) {
                s = s.split(k).join(v);
            }

            const words = s.split(/\s+/);
            const converted = words.map(w => {
                const cleaned = w.replace(/[،,.]/g, '');
                return ARABIC_WORD_TO_DIGIT[cleaned] !== undefined ? ARABIC_WORD_TO_DIGIT[cleaned] : w;
            });
            s = converted.join(' ');

            const digitMatches = s.match(/[\d+]+/g);
            return digitMatches ? digitMatches.join('') : '';
        }

        extractNumbers(text) {
            let words = text.split(/\s+/);
            let digitsStr = '';
            for (const w of words) {
                const cleanW = w.replace(/[،,.]/g, '');
                if (ARABIC_WORD_TO_DIGIT[cleanW] !== undefined) {
                    digitsStr += ARABIC_WORD_TO_DIGIT[cleanW];
                } else if (/^\d+$/.test(cleanW)) {
                    digitsStr += cleanW;
                }
            }
            if (digitsStr) return digitsStr;
            return this.normalizeSpokenDigits(text);
        }

        highlight(el) {
            if (!el) return;
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('voice-command-highlight');
            setTimeout(() => {
                el.classList.remove('voice-command-highlight');
            }, 2500);
        }

        // ======================= معالجة الأوامر الصوتية =======================

        async handleVoiceCommand(rawTranscript) {
            const text = rawTranscript.toLowerCase().trim();
            console.log('[VoiceCommander] 🎙️ Received Command:', text);
            this.processingLock = true;

            try {
                // إلغاء أي عملية تسجيل جارية إذا طلب المستخدم
                if (text.includes('إلغاء') || text.includes('الغاء') || text.includes('تراجع')) {
                    if (this.authFlowState !== 'IDLE') {
                        this.authFlowState = 'IDLE';
                        this.speak('تم إلغاء عملية تسجيل الدخول الحالية.');
                        return;
                    }
                }

                // ----------------------------------------------------
                // 1. المسار التفاعلي لحوار تسجيل الدخول (AWAITING_CODE / AWAITING_2FA)
                // ----------------------------------------------------
                if (this.authFlowState === 'AWAITING_CODE') {
                    // المستخدم ينطق الكود
                    const code = this.extractNumbers(text);
                    if (code && code.length >= 3) {
                        await this.interactiveVerifyCode(code);
                        return;
                    }
                    if (text.includes('اعد ارسال') || text.includes('أعد إرسال') || text.includes('ارسل كود جديد')) {
                        await this.cmdResendCode(false);
                        return;
                    }
                }

                if (this.authFlowState === 'AWAITING_2FA') {
                    // المستخدم ينطق كلمة المرور الثنائية
                    let pass = text.replace(/^(كلمة المرور هي|كلمة السر هي|كلمة المرور|الباسورد هو|الباسورد|الرقم السري)\s*/i, '').trim() || text.trim();
                    if (pass) {
                        await this.interactiveVerifyPassword(pass);
                        return;
                    }
                }

                // ----------------------------------------------------
                // 1.5. أمر تسجيل الخروج من حساب (بالاسم أو الرقم)
                // ----------------------------------------------------
                if (text.includes('سجل الخروج') || text.includes('سجل خروج') || text.includes('تسجيل الخروج') || text.includes('تسجيل خروج') || text.includes('اخرج من حساب') || text.includes('الخروج من حساب') || text.includes('خروج من حساب') || text.includes('سجل خروجك') || text.includes('تسجيل خروجي')) {
                    await this.cmdLogoutAccount(text);
                    return;
                }

                // ----------------------------------------------------
                // 2. أمر بدء تسجيل الدخول بالاسم أو الرقم
                // ----------------------------------------------------
                if (text.includes('سجل') || text.includes('دخول') || text.includes('تسجيل الدخول')) {
                    // فحص حساب لميس
                    if (text.includes('لميس') || text.includes('حساب 1') || text.includes('الحساب الاول') || text.includes('الأول') || text.includes('الاول')) {
                        await this.interactiveStartLogin('user_1', '+201120945094', 'حساب لميس');
                        return;
                    }

                    // فحص الحساب الثاني
                    if (text.includes('الثاني') || text.includes('حساب 2')) {
                        await this.interactiveStartLogin('user_2', '+201221349790', 'الحساب الثاني');
                        return;
                    }

                    // فحص الحساب الثالث
                    if (text.includes('الثالث') || text.includes('حساب 3')) {
                        await this.interactiveStartLogin('user_3', '+201148863243', 'الحساب الثالث');
                        return;
                    }

                    // فحص تسجيل الدخول برقم مخصص منطوق
                    const digits = this.extractNumbers(text);
                    if (digits && digits.length >= 8) {
                        await this.interactiveStartLogin(null, digits, digits);
                        return;
                    }
                }

                // ----------------------------------------------------
                // 3. إدخال الكود أو كلمة المرور بشكل مباشر
                // ----------------------------------------------------
                if (text.includes('كود') || text.includes('الكود') || text.includes('الرمز') || text.includes('رمز التحقق')) {
                    const code = this.extractNumbers(text);
                    if (code && code.length >= 3) {
                        await this.interactiveVerifyCode(code);
                        return;
                    }
                }

                if (text.includes('كلمة المرور') || text.includes('الباسورد') || text.includes('السر') || text.includes('رمز سري')) {
                    let pass = text.replace(/.*(كلمة المرور|الباسورد|السر|رمز سري)\s*(هي|هو)?\s*/i, '').trim();
                    if (pass) {
                        await this.interactiveVerifyPassword(pass);
                        return;
                    }
                }

                if (text.includes('اعادة ارسال') || text.includes('إعادة إرسال') || text.includes('ارسل الكود ثاني') || text.includes('ارسل الكود مره')) {
                    const forceSms = text.includes('رسالة') || text.includes('sms') || text.includes('اس ام اس');
                    await this.cmdResendCode(forceSms);
                    return;
                }

                // ----------------------------------------------------
                // 4. التحكم في المراقبة (المراقبة التلقائية الذكية)
                // ----------------------------------------------------
                if (text.includes('مراقبة') || text.includes('المراقبة') || text.includes('رصد') || text.includes('كلمات المراقبة')) {
                    // بدء المراقبة
                    if (text.includes('ابدأ') || text.includes('شغل') || text.includes('تشغيل') || text.includes('تفعيل') || text.includes('استئناف')) {
                        await this.cmdStartMonitoring();
                        return;
                    }

                    // إيقاف المراقبة
                    if (text.includes('اوقف') || text.includes('أوقف') || text.includes('ايقاف') || text.includes('إيقاف') || text.includes('عطل') || text.includes('تعطيل') || text.includes('وقف')) {
                        await this.cmdStopMonitoring();
                        return;
                    }

                    // فحص حالة المراقبة
                    if (text.includes('حالة') || text.includes('وضع') || text.includes('شغالة') || text.includes('نشطة')) {
                        await this.cmdCheckMonitoringStatus();
                        return;
                    }

                    // إضافة كلمة مراقبة
                    if (text.includes('اضف') || text.includes('أضف') || text.includes('اضافة') || text.includes('إضافة') || text.includes('راقب')) {
                        const kw = text.replace(/.*(اضف كلمة مراقبة|أضف كلمة مراقبة|أضف كلمة|اضف كلمة|راقب كلمة|راقب)\s*/i, '').trim();
                        if (kw) {
                            await this.cmdAddWatchWord(kw);
                            return;
                        }
                    }

                    // حذف كلمة مراقبة
                    if (text.includes('احذف') || text.includes('حذف') || text.includes('ازل') || text.includes('أزل') || text.includes('إلغاء مراقبة')) {
                        const kw = text.replace(/.*(احذف كلمة مراقبة|حذف كلمة مراقبة|احذف كلمة|حذف كلمة|إلغاء مراقبة)\s*/i, '').trim();
                        if (kw) {
                            await this.cmdRemoveWatchWord(kw);
                            return;
                        }
                    }

                    // قراءة كلمات المراقبة
                    if (text.includes('اقرأ') || text.includes('ما هي') || text.includes('قائمة') || text.includes('عرض')) {
                        await this.cmdReadWatchWords();
                        return;
                    }
                }

                // الرد التلقائي وإعدادات المراقبة
                if (text.includes('الرد التلقائي') || text.includes('رد تلقائي') || text.includes('الرد على الكلمات')) {
                    if (text.includes('تفعيل') || text.includes('تشغيل')) {
                        await this.cmdToggleKeywordAutoReply(true);
                        return;
                    }
                    if (text.includes('ايقاف') || text.includes('إيقاف') || text.includes('تعطيل')) {
                        await this.cmdToggleKeywordAutoReply(false);
                        return;
                    }
                    if (text.includes('بالخاص') || text.includes('في الخاص') || text.includes('خاص')) {
                        await this.cmdSetKeywordReplyTarget('dm');
                        return;
                    }
                    if (text.includes('المجموعة') || text.includes('المجموعات')) {
                        const disableGroup = text.includes('ايقاف') || text.includes('إيقاف') || text.includes('تعطيل') || text.includes('بدون');
                        await this.cmdSetKeywordReplyTarget('group', !disableGroup);
                        return;
                    }
                    if (text.includes('نص الرد') || text.includes('غير نص الرد')) {
                        const replyText = text.replace(/.*(نص الرد هو|غير نص الرد الى|غير نص الرد إلى|نص الرد)\s*/i, '').trim();
                        if (replyText) {
                            await this.cmdSetKeywordReplyText(replyText);
                            return;
                        }
                    }
                }

                // حساب استلام تنبيهات المراقبة
                if (text.includes('حساب الاستلام') || text.includes('حساب التنبيهات') || text.includes('استلام التنبيهات')) {
                    const target = text.replace(/.*(حساب الاستلام هو|حساب التنبيهات هو|غير حساب الاستلام الى|غير حساب الاستلام إلى|حساب الاستلام)\s*/i, '').trim();
                    if (target) {
                        await this.cmdSetNotificationTarget(target);
                        return;
                    }
                }

                // ----------------------------------------------------
                // 5. التحكم في مهام الإرسال والمراسلة
                // ----------------------------------------------------
                if (text.includes('ابدأ الإرسال') || text.includes('ابدأ الارسال') || text.includes('ارسل الان') || text.includes('إرسال الآن') || text.includes('تشغيل الإرسال') || text.includes('انطلق')) {
                    await this.cmdStartBroadcast();
                    return;
                }

                if (
                    text.includes('اوقف عملية الارسال') || text.includes('أوقف عملية الإرسال') ||
                    text.includes('اوقف عمليه الارسال') || text.includes('أوقف عمليه الإرسال') ||
                    text.includes('وقف عملية الارسال') || text.includes('وقف عملية الإرسال') ||
                    text.includes('وقف عمليه الارسال') || text.includes('وقف عمليه الإرسال') ||
                    text.includes('ايقاف عملية الارسال') || text.includes('إيقاف عملية الإرسال') ||
                    text.includes('ايقاف عمليه الارسال') || text.includes('إيقاف عمليه الإرسال') ||
                    text.includes('اوقف الإرسال') || text.includes('أوقف الإرسال') ||
                    text.includes('اوقف الارسال') || text.includes('أوقف الارسال') ||
                    text.includes('وقف الإرسال') || text.includes('وقف الارسال') ||
                    text.includes('إيقاف الإرسال') || text.includes('ايقاف الارسال') ||
                    text.includes('توقف عن الارسال') || text.includes('توقف عن الإرسال') ||
                    ((text.includes('اوقف') || text.includes('أوقف') || text.includes('وقف') || text.includes('ايقاف') || text.includes('إيقاف')) && (text.includes('ارسال') || text.includes('إرسال') || text.includes('نشر')))
                ) {
                    await this.cmdStopBroadcast();
                    return;
                }

                // نوع الإرسال
                if (text.includes('إرسال للمجموعات') || text.includes('ارسال للمجموعات') || (text.includes('مجموعات') && !text.includes('رد'))) {
                    await this.cmdSelectSendType('groups');
                    return;
                }
                if (text.includes('إرسال للقنوات') || text.includes('ارسال للقنوات') || text.includes('قنوات')) {
                    await this.cmdSelectSendType('channels');
                    return;
                }
                if (text.includes('إرسال فردي') || text.includes('ارسال فردي') || text.includes('فردي') || text.includes('للمستخدمين')) {
                    await this.cmdSelectSendType('users');
                    return;
                }

                // الفاصل الزمني
                if (text.includes('فاصل') || text.includes('الفاصل الزمني')) {
                    const nums = this.extractNumbers(text);
                    if (nums) {
                        let sec = parseInt(nums, 10);
                        if (text.includes('دقيقة') || text.includes('دقايق')) sec = sec * 60;
                        await this.cmdSetInterval(sec);
                        return;
                    }
                }

                // الإرسال الذكي
                if (text.includes('الإرسال الذكي') || text.includes('الارسال الذكي')) {
                    if (text.includes('تفعيل') || text.includes('تشغيل') || text.includes('فعل')) {
                        await this.cmdToggleSmartSend(true);
                        return;
                    }
                    if (text.includes('ايقاف') || text.includes('إيقاف') || text.includes('عطل')) {
                        await this.cmdToggleSmartSend(false);
                        return;
                    }
                }

                // نص الرسالة
                if (text.startsWith('اكتب') || text.includes('نص الرسالة') || text.includes('غير نص الرسالة')) {
                    const msg = text.replace(/^(اكتب في الرسالة|اكتب رسالة|اكتب|نص الرسالة هو|نص الرسالة|غير نص الرسالة إلى|غير نص الرسالة الى)\s*/i, '').trim();
                    if (msg) {
                        await this.cmdSetMessage(msg);
                        return;
                    }
                }

                // حفظ الإعدادات
                if (text.includes('احفظ') || text.includes('حفظ الاعدادات') || text.includes('حفظ الإعدادات') || text.includes('تثبيت')) {
                    await this.cmdSaveSettings();
                    return;
                }

                // روابط قاعدة البيانات السحابية
                if (text.includes('استعرض') || text.includes('روابط') || text.includes('قاعدة البيانات') || text.includes('فحص الروابط') || text.includes('الروابط المحفوظة')) {
                    if (text.includes('بي دي اف') || text.includes('pdf')) {
                        await this.cmdExportLinks('pdf');
                        return;
                    }
                    if (text.includes('نص') || text.includes('نصي') || text.includes('txt') || text.includes('تكست')) {
                        await this.cmdExportLinks('txt');
                        return;
                    }
                    await this.cmdInspectCloudLinks();
                    return;
                }

                // المساعدة وقاموس الأوامر
                if (text.includes('مساعدة') || text.includes('الاوامر') || text.includes('الأوامر') || text.includes('كيف استخدم')) {
                    this.openHelpModal();
                    return;
                }

                // حالة الحساب العامة
                if (text.includes('الحالة') || text.includes('مين متصل') || text.includes('حالة الحساب') || text.includes('وضع النظام')) {
                    await this.cmdCheckStatus();
                    return;
                }

                // تنقل
                if (text.includes('محلل') || text.includes('مستندات') || text.includes('ذكاء اصطناعي')) {
                    this.speak('جارٍ فتح المحلل الذكي للمستندات والصور');
                    window.location.href = '/ai_doc_analyzer';
                    return;
                }

                if (text.includes('الرئيسية') || text.includes('الرئيسيه') || text.includes('لوحة التحكم')) {
                    this.speak('جارٍ الانتقال إلى الصفحة الرئيسية');
                    window.location.href = '/';
                    return;
                }

                // لم يتم التعرف على أمر محدد
                this.speak('سمعت أمرك: ' + rawTranscript + '. يمكنك قول: سجل الدخول بحساب لميس، ابدأ المراقبة، أو ابدأ الإرسال.');

            } catch (err) {
                console.error('[VoiceCommander] Execution Error:', err);
                this.speak('حدث خطأ أثناء تنفيذ الأمر: ' + (err.message || ''));
            } finally {
                setTimeout(() => {
                    this.processingLock = false;
                }, 1200);
            }
        }

        // ======================= التدفق التفاعلي لتسجيل الدخول =======================

        async interactiveStartLogin(uid, phone, displayName) {
            let formattedPhone = phone.startsWith('+') ? phone : ('+' + phone);
            this.authPhone = formattedPhone;
            this.authUserId = uid || 'user_1';

            this.speak(`جارٍ بدء تسجيل الدخول لـ ${displayName || formattedPhone}، وطلب كود التحقق من تيليجرام...`);

            // فتح المودال في الصفحة إن وُجد
            this.showLoginModalInUI(formattedPhone);

            try {
                const response = await fetch('/api/save_login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        phone: formattedPhone,
                        user_id: this.authUserId,
                        password: ''
                    })
                });
                const result = await response.json();

                if (result.already_connected) {
                    this.authFlowState = 'IDLE';
                    this.speak(`الحساب متصل بالفعل ويعمل حالياً بنجاح.`);
                    setTimeout(() => window.location.reload(), 1500);
                    return;
                }

                if (result.code_required || result.pending || result.success) {
                    this.authFlowState = 'AWAITING_CODE';
                    if (result.user_id) this.authUserId = result.user_id;

                    // تحديث واجهة الكود
                    this.showCodeInputInUI();

                    this.speak('تم إرسال كود التحقق إلى حسابك في تيليجرام. ادخل الكود أو انطقه الآن.');
                } else {
                    this.authFlowState = 'IDLE';
                    this.speak(`تعذر بدء تسجيل الدخول: ${result.message || 'يرجى مراجعة الرقم'}`);
                }
            } catch (err) {
                this.authFlowState = 'IDLE';
                this.speak(`حدث خطأ أثناء الاتصال بالخادم: ${err.message || ''}`);
            }
        }

        async interactiveVerifyCode(code) {
            this.speak(`تم استلام الكود ${code.split('').join(' ')}، جارٍ التحقق والتسجيل لدى تيليجرام...`);

            const codeInput = document.getElementById('verificationCode') || document.getElementById('loginCode') || document.querySelector('input[name="code"]');
            if (codeInput) {
                codeInput.value = code;
                codeInput.dispatchEvent(new Event('input'));
                this.highlight(codeInput);
            }

            try {
                const targetUid = this.authUserId || window.currentActiveUserId || 'user_1';
                const response = await fetch('/api/verify_code', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        code: code,
                        user_id: targetUid
                    })
                });
                const result = await response.json();

                if (result.password_required) {
                    this.authFlowState = 'AWAITING_2FA';
                    this.showPasswordInputInUI();
                    this.speak('هذا الحساب محمي بالتحقق بخطوتين. انطق كلمة المرور الثنائية الآن.');
                    return;
                }

                if (result.success) {
                    this.authFlowState = 'IDLE';
                    const name = result.account_name || 'حسابك';
                    this.speak(`تم التحقق والتسجيل بنجاح! تم ربط ${name} بتيليجرام بنجاح.`);
                    setTimeout(() => window.location.reload(), 1500);
                } else {
                    this.speak(`فشل التحقق والتسجيل: ${result.message || 'الكود غير صحيح'}. انطق الكود مرة أخرى أو قل أعد إرسال الكود.`);
                }
            } catch (err) {
                this.speak(`تعذر التحقق من الكود: ${err.message || ''}`);
            }
        }

        async interactiveVerifyPassword(password) {
            this.speak('تم استلام كلمة المرور، جارٍ التحقق بخطوتين والتسجيل النهائي...');

            const passInput = document.getElementById('twoFactorPassword') || document.querySelector('input[type="password"]');
            if (passInput) {
                passInput.value = password;
                passInput.dispatchEvent(new Event('input'));
                this.highlight(passInput);
            }

            try {
                const targetUid = this.authUserId || window.currentActiveUserId || 'user_1';
                const response = await fetch('/api/verify_code', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        password: password,
                        user_id: targetUid
                    })
                });
                const result = await response.json();

                if (result.success) {
                    this.authFlowState = 'IDLE';
                    const name = result.account_name || 'حسابك';
                    this.speak(`تم التحقق والتسجيل بنجاح! تم تسجيل الدخول إلى ${name} وتأكيد الحماية بنجاح.`);
                    setTimeout(() => window.location.reload(), 1500);
                } else {
                    this.speak(`فشلت عملية التحقق: ${result.message || 'كلمة المرور غير صحيحة'}. يرجى نطق كلمة المرور مرة أخرى.`);
                }
            } catch (err) {
                this.speak(`تعذر التحقق من كلمة المرور: ${err.message || ''}`);
            }
        }

        showLoginModalInUI(phone) {
            const phoneInput = document.getElementById('phone');
            if (phoneInput) {
                phoneInput.value = phone;
                this.highlight(phoneInput);
            }
            const modalEl = document.getElementById('loginModal');
            if (modalEl && typeof bootstrap !== 'undefined') {
                const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
                modal.show();
            }
        }

        showCodeInputInUI() {
            const phoneForm = document.getElementById('phoneForm');
            const verifyForm = document.getElementById('verifyForm');
            const passwordForm = document.getElementById('passwordForm');
            if (phoneForm) phoneForm.style.display = 'none';
            if (verifyForm) verifyForm.style.display = 'block';
            if (passwordForm) passwordForm.style.display = 'none';

            const codeInput = document.getElementById('verificationCode');
            if (codeInput) {
                codeInput.focus();
                this.highlight(codeInput);
            }
        }

        showPasswordInputInUI() {
            const phoneForm = document.getElementById('phoneForm');
            const verifyForm = document.getElementById('verifyForm');
            const passwordForm = document.getElementById('passwordForm');
            if (phoneForm) phoneForm.style.display = 'none';
            if (verifyForm) verifyForm.style.display = 'none';
            if (passwordForm) passwordForm.style.display = 'block';

            const passInput = document.getElementById('twoFactorPassword');
            if (passInput) {
                passInput.focus();
                this.highlight(passInput);
            }
        }

        async cmdResendCode(forceSms = false) {
            this.speak(forceSms ? 'جارٍ إعادة إرسال الكود عبر رسالة نصية SMS' : 'جارٍ إعادة إرسال كود التحقق عبر تيليجرام');
            try {
                const targetUid = this.authUserId || window.currentActiveUserId || 'user_1';
                const response = await fetch('/api/resend_code', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ force_sms: forceSms, user_id: targetUid })
                });
                const res = await response.json();
                this.speak(res.message || (res.success ? 'تم إرسال كود جديد، انطقه عند وصوله' : 'تعذر إرسال الكود'));
            } catch (err) {
                this.speak('تعذر الاتصال بالخادم لإعادة إرسال الكود.');
            }
        }

        // ======================= دوال التحكم بالمراقبة =======================

        async cmdStartMonitoring() {
            this.speak('أمر مؤكد: جارٍ تشغيل المراقبة الذكية التلقائية...');
            const startBtn = document.getElementById('startMonitoringBtn');
            if (startBtn) this.highlight(startBtn);

            try {
                // حفظ الإعدادات أولاً ثم بدء المراقبة
                if (typeof window.saveSettings === 'function') {
                    await window.saveSettings();
                }
                const response = await fetch('/api/start_monitoring', { credentials: 'same-origin' });
                const res = await response.json();
                if (res.success) {
                    this.speak('تم تشغيل المراقبة التلقائية الذكية بنجاح، والنظام يرصد كافة المجموعات الآن.');
                    this.updateMonitoringUI(true);
                } else {
                    this.speak(`تعذر تشغيل المراقبة: ${res.message || ''}`);
                }
            } catch (err) {
                this.speak(`حدث خطأ أثناء تشغيل المراقبة: ${err.message || ''}`);
            }
        }

        async cmdStopMonitoring() {
            this.speak('أمر مؤكد: جارٍ إيقاف المراقبة التلقائية...');
            const stopBtn = document.getElementById('stopMonitoringBtn');
            if (stopBtn) this.highlight(stopBtn);

            try {
                const response = await fetch('/api/stop_monitoring', { credentials: 'same-origin' });
                const res = await response.json();
                if (res.success) {
                    this.speak('تم إيقاف المراقبة التلقائية مؤقتاً.');
                    this.updateMonitoringUI(false);
                } else {
                    this.speak(`تعذر إيقاف المراقبة: ${res.message || ''}`);
                }
            } catch (err) {
                this.speak(`حدث خطأ أثناء إيقاف المراقبة: ${err.message || ''}`);
            }
        }

        async cmdCheckMonitoringStatus() {
            try {
                const res = await fetch('/api/get_login_status', { credentials: 'same-origin' });
                const data = await res.json();
                const active = Boolean(data.monitoring_active || data.is_running);
                if (active) {
                    this.speak('المراقبة التلقائية الذكية نشطة وترصد الكلمات في كافة المجموعات وترسل التنبيهات.');
                } else {
                    this.speak('المراقبة التلقائية متوقفة مؤقتاً حالياً. يمكنك قول: ابدأ المراقبة لتشغيلها.');
                }
            } catch (_) {
                this.speak('نظام المراقبة متصل وجاهز للعمل.');
            }
        }

        updateMonitoringUI(isActive) {
            const startBtn = document.getElementById('startMonitoringBtn');
            const stopBtn = document.getElementById('stopMonitoringBtn');
            const banner = document.getElementById('monitoringActiveBanner');

            if (startBtn) startBtn.style.display = isActive ? 'none' : 'block';
            if (stopBtn) stopBtn.style.display = isActive ? 'block' : 'none';
            if (banner) {
                banner.className = isActive ?
                    'alert alert-success d-flex align-items-center justify-content-between p-2 mb-2 rounded-3 shadow-sm border-success' :
                    'alert alert-warning d-flex align-items-center justify-content-between p-2 mb-2 rounded-3 shadow-sm border-warning';
            }
        }

        async cmdAddWatchWord(keyword) {
            const textarea = document.getElementById('watchWords');
            if (!textarea) return;

            let words = textarea.value.split('\n').map(w => w.trim()).filter(Boolean);
            if (words.includes(keyword)) {
                this.speak(`الكلمة "${keyword}" موجودة بالفعل ضمن قائمة كلمات المراقبة.`);
                return;
            }

            words.push(keyword);
            textarea.value = words.join('\n');
            textarea.dispatchEvent(new Event('input'));
            this.highlight(textarea);

            await this.persistSettings();
            this.speak(`تمت إضافة كلمة "${keyword}" إلى قائمة المراقبة وحفظها بنجاح.`);
        }

        async cmdRemoveWatchWord(keyword) {
            const textarea = document.getElementById('watchWords');
            if (!textarea) return;

            let words = textarea.value.split('\n').map(w => w.trim()).filter(Boolean);
            const filtered = words.filter(w => w !== keyword && !w.includes(keyword));

            if (filtered.length === words.length) {
                this.speak(`لم يتم العثور على كلمة "${keyword}" في قائمة المراقبة.`);
                return;
            }

            textarea.value = filtered.join('\n');
            textarea.dispatchEvent(new Event('input'));
            this.highlight(textarea);

            await this.persistSettings();
            this.speak(`تم حذف كلمة "${keyword}" من قائمة كلمات المراقبة بنجاح.`);
        }

        async cmdReadWatchWords() {
            const textarea = document.getElementById('watchWords');
            if (!textarea) return;
            const words = textarea.value.split('\n').map(w => w.trim()).filter(Boolean);
            if (words.length === 0) {
                this.speak('قائمة كلمات المراقبة فارغة حالياً. يمكنك إضافة كلمات بقول: أضف كلمة مراقبة [اسم الكلمة].');
            } else {
                this.speak(`يوجد ${words.length} كلمات مراقبة: ${words.slice(0, 8).join('، ')}.`);
            }
        }

        async cmdToggleKeywordAutoReply(enable) {
            const check = document.getElementById('keywordAutoReplyEnabled');
            if (check) {
                check.checked = enable;
                check.dispatchEvent(new Event('change'));
                this.highlight(check.parentElement || check);
            }
            await this.persistSettings();
            this.speak(enable ? 'تم تفعيل الرد التلقائي على كلمات المراقبة.' : 'تم إيقاف الرد التلقائي على كلمات المراقبة.');
        }

        async cmdSetKeywordReplyTarget(target, enable = true) {
            if (target === 'dm') {
                const check = document.getElementById('keywordAutoReplyInDm');
                if (check) {
                    check.checked = enable;
                    check.dispatchEvent(new Event('change'));
                    this.highlight(check.parentElement || check);
                }
                await this.persistSettings();
                this.speak('تم ضبط الرد التلقائي ليكون في المحادثة الخاصة بالعميل.');
            } else if (target === 'group') {
                const check = document.getElementById('keywordAutoReplyInGroup');
                if (check) {
                    check.checked = enable;
                    check.dispatchEvent(new Event('change'));
                    this.highlight(check.parentElement || check);
                }
                await this.persistSettings();
                this.speak(enable ? 'تم تفعيل الرد التلقائي داخل المجموعة أيضاً.' : 'تم إيقاف الرد في المجموعة، وسيقتصر على الخاص فقط.');
            }
        }

        async cmdSetKeywordReplyText(text) {
            const input = document.getElementById('keywordAutoReplyText');
            if (input) {
                input.value = text;
                input.dispatchEvent(new Event('input'));
                this.highlight(input);
            }
            await this.persistSettings();
            this.speak(`تم تحديث نص الرد التلقائي إلى: ${text}`);
        }

        async cmdSetNotificationTarget(target) {
            const input = document.getElementById('keywordNotificationTarget');
            if (input) {
                input.value = target;
                input.dispatchEvent(new Event('input'));
                this.highlight(input);
            }
            await this.persistSettings();
            this.speak(`تم تغيير حساب استلام الإشعارات إلى: ${target}`);
        }

        // ======================= دوال التحكم بالإرسال =======================

        async cmdStartBroadcast() {
            this.speak('أمر مؤكد: جارٍ بدء مهمة الإرسال للمجموعات الآن...');
            const startBtn = document.getElementById('sendNowBtn') || document.getElementById('startBtn');
            if (startBtn) {
                this.highlight(startBtn);
                startBtn.click();
            } else if (typeof window.handleSendNow === 'function') {
                window.handleSendNow();
            }
        }

        async cmdStopBroadcast() {
            try {
                await fetch('/api/send_now/pause', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: window.currentActiveUserId || window.currentUser || 'user_1' })
                });
            } catch (e) {}
            const stopBtn = document.getElementById('stopSendNowBtn') || document.getElementById('pauseResumeSendBtn') || document.getElementById('stopBtn');
            if (stopBtn) {
                this.highlight(stopBtn);
                if (!stopBtn.dataset.state || stopBtn.dataset.state === 'running') {
                    stopBtn.click();
                }
            }
            this.speak('تم إيقاف الإرسال');
            const transcriptEl = document.getElementById('voiceLiveTranscript');
            if (transcriptEl) {
                transcriptEl.innerHTML = '<span style="color:#f59e0b;font-weight:bold;"><i class="fas fa-pause me-1"></i>تم إيقاف الإرسال</span>';
            }
        }

        async cmdLogoutAccount(rawText) {
            let targetUid = null;
            let targetName = '';
            const norm = (rawText || '').replace(/[إأآا]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي');

            for (let i = 1; i <= 5; i++) {
                const words = ['واحد', 'اثنين', 'ثلاثه', 'اربعه', 'خمسه'];
                const ords = ['الاول', 'الثاني', 'الثالث', 'الرابع', 'الخامس'];
                if (norm.includes(`حساب ${i}`) || norm.includes(`حساب رقم ${i}`) || norm.includes(`رقم ${i}`) || norm.includes(ords[i-1]) || norm.includes(`حساب ${words[i-1]}`) || (norm.includes(`${i}`) && norm.includes('حساب'))) {
                    targetUid = `user_${i}`;
                    targetName = `حساب ${i}`;
                    break;
                }
            }
            if (!targetUid) {
                if (norm.includes('لميس')) {
                    targetUid = 'user_1';
                    targetName = 'حساب لميس';
                } else if (norm.includes('انور')) {
                    targetUid = 'user_2';
                    targetName = 'حساب أنور';
                }
            }
            if (!targetUid) {
                targetUid = window.currentActiveUserId || window.currentUser || 'user_1';
                targetName = 'الحساب الحالي';
            }

            try {
                await fetch('/api/user_logout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: targetUid })
                });
            } catch (e) {
                console.warn('Logout API error:', e);
            }

            const responseText = `تم تسجيل الخروج من ${targetName}`;
            this.speak(responseText);
            const transcriptEl = document.getElementById('voiceLiveTranscript');
            if (transcriptEl) {
                transcriptEl.innerHTML = `<span style="color:#ef4444;font-weight:bold;"><i class="fas fa-sign-out-alt me-1"></i>${responseText}</span>`;
            }
            setTimeout(() => {
                if (typeof window.fetchAllAccounts === 'function') {
                    window.fetchAllAccounts();
                }
                setTimeout(() => {
                    window.location.reload();
                }, 800);
            }, 1000);
        }

        async cmdSelectSendType(type) {
            const types = {
                'groups': 'المجموعات',
                'channels': 'القنوات',
                'users': 'المستخدمين (فردي)'
            };
            this.speak(`تم تحديد وجهة الإرسال: ${types[type] || type}`);
            const input = document.querySelector(`input[name="send_type"][value="${type}"]`) || document.getElementById(`send_type_${type}`);
            if (input) {
                input.checked = true;
                input.dispatchEvent(new Event('change'));
                this.highlight(input.parentElement || input);
            }
        }

        async cmdSetInterval(seconds) {
            this.speak(`تم ضبط الفاصل الزمني على ${seconds} ثانية`);
            const delayInput = document.getElementById('delay') || document.getElementById('interval') || document.querySelector('input[name="delay"]');
            if (delayInput) {
                delayInput.value = seconds;
                delayInput.dispatchEvent(new Event('change'));
                this.highlight(delayInput);
            }
            await this.persistSettings();
        }

        async cmdToggleSmartSend(enable) {
            const sanitize = document.getElementById('sanitizeMode') || document.getElementById('smartSendCheck');
            if (sanitize) {
                if (sanitize.tagName === 'SELECT') {
                    sanitize.value = enable ? 'smart' : 'off';
                } else {
                    sanitize.checked = enable;
                }
                sanitize.dispatchEvent(new Event('change'));
                this.highlight(sanitize);
            }
            await this.persistSettings();
            this.speak(enable ? 'تم تفعيل الإرسال الذكي والتحقق التلقائي من البوتات.' : 'تم إيقاف ميزة الإرسال الذكي.');
        }

        async cmdSetMessage(msgText) {
            this.speak('تم وضع نص الرسالة بنجاح');
            const msgArea = document.getElementById('message');
            if (msgArea) {
                msgArea.value = msgText;
                msgArea.dispatchEvent(new Event('input'));
                this.highlight(msgArea);
            }
            await this.persistSettings();
        }

        async cmdSaveSettings() {
            this.speak('جارٍ حفظ وتثبيت كافة الإعدادات');
            await this.persistSettings();
        }

        async persistSettings() {
            const saveBtn = document.getElementById('saveSettingsBtn');
            if (saveBtn) {
                this.highlight(saveBtn);
                saveBtn.click();
            } else if (typeof window.saveSettings === 'function') {
                await window.saveSettings();
            }
        }

        async cmdCheckStatus() {
            try {
                const res = await fetch('/api/get_login_status', { credentials: 'same-origin' });
                const data = await res.json();
                const name = data.account_name || 'حسابك';
                const status = data.logged_in ? 'متصل وموثق' : 'غير متصل حالياً';
                const monitoring = data.monitoring_active ? 'المراقبة التلقائية تعمل' : 'المراقبة متوقفة مؤقتاً';
                this.speak(`الحساب النشط هو ${name}، الحالة: ${status}، و${monitoring}.`);
            } catch (_) {
                this.speak('التطبيق يعمل بشكل طبيعي ومتصل بالخادم.');
            }
        }

        async cmdInspectCloudLinks() {
            this.speak('جارٍ فحص واستعراض كافة روابط قاعدة البيانات السحابية');
            try {
                const res = await fetch('/api/saved_links/inspect_status');
                const data = await res.json();
                if (data.total_links > 0) {
                    this.speak(`قاعدة البيانات السحابية نشطة وتحتوي على ${data.total_links} رابط محفوظ.`);
                } else {
                    this.speak('قاعدة البيانات متصلة ولكن لا توجد روابط محفوظة حالياً.');
                }
            } catch (_) {
                this.speak('تعذر الاتصال بقاعدة البيانات السحابية في الوقت الحالي.');
            }
        }

        async cmdExportLinks(format = 'pdf') {
            if (format === 'pdf') {
                this.speak('جارٍ إنشاء وتصدير ملف الروابط بصيغة PDF إلى جهازك');
                const btn = document.getElementById('exportPdfBtn') || document.getElementById('exportAllPdfBtn');
                if (btn) {
                    this.highlight(btn);
                    btn.click();
                } else if (typeof window.exportSavedLinksPDF === 'function') {
                    window.exportSavedLinksPDF();
                }
            } else {
                this.speak('جارٍ تصدير ملف الروابط النصي TXT إلى جهازك');
                const btn = document.getElementById('exportTxtBtn') || document.getElementById('exportAllTxtBtn');
                if (btn) {
                    this.highlight(btn);
                    btn.click();
                } else if (typeof window.exportSavedLinksTXT === 'function') {
                    window.exportSavedLinksTXT();
                }
            }
        }

        // ======================= إدارة الواجهة والزر القابل للتحريك =======================

        setupDraggable() {
            const btn = document.getElementById('floatingVoiceBtn');
            const container = document.getElementById('voiceCommanderContainer');
            if (!btn || !container) return;

            let isDragging = false;
            let startX = 0, startY = 0;
            let initialX = 0, initialY = 0;
            let dragThresholdPassed = false;

            // استعادة الموضع المخزن من localStorage إن وجد
            const savedLeft = localStorage.getItem('voice_hub_left');
            const savedTop = localStorage.getItem('voice_hub_top');
            if (savedLeft && savedTop) {
                container.style.left = savedLeft + 'px';
                container.style.top = savedTop + 'px';
                container.style.bottom = 'auto';
                container.style.right = 'auto';
            }

            const onPointerDown = (clientX, clientY) => {
                isDragging = true;
                dragThresholdPassed = false;
                startX = clientX;
                startY = clientY;

                const rect = container.getBoundingClientRect();
                initialX = rect.left;
                initialY = rect.top;

                btn.classList.add('is-dragging');
            };

            const onPointerMove = (clientX, clientY) => {
                if (!isDragging) return;

                const dx = clientX - startX;
                const dy = clientY - startY;

                if (!dragThresholdPassed && Math.hypot(dx, dy) > 6) {
                    dragThresholdPassed = true;
                }

                if (dragThresholdPassed) {
                    let newLeft = initialX + dx;
                    let newTop = initialY + dy;

                    // تقييد الحركة داخل حدود الشاشة
                    const maxLeft = window.innerWidth - container.offsetWidth - 12;
                    const maxTop = window.innerHeight - container.offsetHeight - 12;

                    newLeft = Math.max(12, Math.min(newLeft, maxLeft));
                    newTop = Math.max(12, Math.min(newTop, maxTop));

                    container.style.left = `${newLeft}px`;
                    container.style.top = `${newTop}px`;
                    container.style.bottom = 'auto';
                    container.style.right = 'auto';
                }
            };

            const onPointerUp = () => {
                if (!isDragging) return;
                isDragging = false;
                btn.classList.remove('is-dragging');

                if (dragThresholdPassed) {
                    const rect = container.getBoundingClientRect();
                    try {
                        localStorage.setItem('voice_hub_left', Math.round(rect.left));
                        localStorage.setItem('voice_hub_top', Math.round(rect.top));
                    } catch (_) {}
                }
            };

            // أحداث الماوس
            btn.addEventListener('mousedown', (e) => {
                if (e.button !== 0) return;
                onPointerDown(e.clientX, e.clientY);

                const mouseMoveHandler = (ev) => onPointerMove(ev.clientX, ev.clientY);
                const mouseUpHandler = () => {
                    window.removeEventListener('mousemove', mouseMoveHandler);
                    window.removeEventListener('mouseup', mouseUpHandler);
                    onPointerUp();
                };

                window.addEventListener('mousemove', mouseMoveHandler);
                window.addEventListener('mouseup', mouseUpHandler);
            });

            // أحداث اللمس للهواتف والأجهزة اللوحية
            btn.addEventListener('touchstart', (e) => {
                if (e.touches.length !== 1) return;
                const touch = e.touches[0];
                onPointerDown(touch.clientX, touch.clientY);
            }, { passive: true });

            window.addEventListener('touchmove', (e) => {
                if (!isDragging || e.touches.length !== 1) return;
                const touch = e.touches[0];
                onPointerMove(touch.clientX, touch.clientY);
            }, { passive: true });

            window.addEventListener('touchend', () => {
                onPointerUp();
            }, { passive: true });

            // منع تفعيل التسجيل إذا كان المستخدم يقوم بتحريك الأيقونة فقط
            btn.addEventListener('click', (e) => {
                if (dragThresholdPassed) {
                    e.stopImmediatePropagation();
                    e.preventDefault();
                    dragThresholdPassed = false;
                    return false;
                }
                this.toggle();
            });
        }

        toggle() {
            if (this.isListening) {
                this.stop();
            } else {
                this.start();
            }
        }

        start() {
            if (!this.supported) {
                alert('التعرف الصوتي غير مدعوم في متصفحك الحالي. يرجى استخدام Google Chrome أو متصفح يدعم Web Speech API.');
                return;
            }
            this.shouldStayActive = true;
            try {
                this.recognition.start();
                this.speak('نظام الأوامر الصوتية نشط. يمكنك قول: سجل الدخول بحساب لميس، ابدأ المراقبة، أو ابدأ الإرسال.');
            } catch (e) {
                console.warn('[VoiceCommander] Already started or busy:', e);
            }
        }

        stop() {
            this.shouldStayActive = false;
            if (this.recognition) {
                try {
                    this.recognition.stop();
                    this.speak('تم إيقاف وضع الاستماع الصوتي.');
                } catch (_) {}
            }
            this.updateUIState(false);
        }

        toggleTTS() {
            this.ttsEnabled = !this.ttsEnabled;
            const btn = document.getElementById('voiceTtsToggleBtn');
            if (btn) {
                btn.innerHTML = this.ttsEnabled ? '<i class="fas fa-volume-up text-success"></i>' : '<i class="fas fa-volume-mute text-secondary"></i>';
                btn.title = this.ttsEnabled ? 'الرد الصوتي ناطق (مفعّل)' : 'الرد الصوتي صامت';
            }
            if (this.ttsEnabled) this.speak('تم تفعيل الرد الصوتي الناطق.');
        }

        updateUIState(active) {
            const btn = document.getElementById('floatingVoiceBtn');
            const hud = document.getElementById('voiceCommanderHud');
            const wave = document.getElementById('voiceWaveIndicator');

            if (btn) {
                if (active) {
                    btn.classList.add('voice-active');
                    btn.setAttribute('aria-pressed', 'true');
                } else {
                    btn.classList.remove('voice-active');
                    btn.setAttribute('aria-pressed', 'false');
                }
            }

            if (hud) {
                if (active) {
                    hud.classList.add('show');
                } else {
                    hud.classList.remove('show');
                }
            }

            if (wave) {
                wave.style.display = active ? 'flex' : 'none';
            }
        }

        setSpeakingState(isSpeaking) {
            const botIcon = document.getElementById('voiceBotSpeakerIcon');
            if (botIcon) {
                if (isSpeaking) {
                    botIcon.classList.add('voice-speaking-pulse');
                } else {
                    botIcon.classList.remove('voice-speaking-pulse');
                }
            }
        }

        showTranscript(text, isFinal) {
            const display = document.getElementById('voiceLiveTranscript');
            if (display) {
                display.textContent = text;
                display.style.opacity = isFinal ? '1' : '0.75';
                if (isFinal) {
                    display.classList.add('highlight-final');
                    setTimeout(() => display.classList.remove('highlight-final'), 1200);
                }
            }
        }

        openHelpModal() {
            this.speak('هذا قاموس الأوامر الصوتية للتحكم الكامل في تسجيل الدخول والمراقبة والإرسال.');
            const modalEl = document.getElementById('voiceHelpModal');
            if (modalEl && typeof bootstrap !== 'undefined') {
                const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
                modal.show();
            }
        }

        injectUI() {
            if (document.getElementById('voiceCommanderContainer')) return;

            const style = document.createElement('style');
            style.id = 'voiceCommanderStyles';
            style.textContent = `
                /* زر الميكروفون العائم القابل للتحريك */
                .floating-voice-hub {
                    position: fixed;
                    bottom: 24px;
                    left: 24px;
                    z-index: 99999;
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 12px;
                    pointer-events: none;
                    touch-action: none;
                }
                .floating-voice-btn {
                    pointer-events: auto;
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #0088cc 0%, #005f8f 100%);
                    color: #ffffff;
                    border: 2px solid rgba(255, 255, 255, 0.25);
                    box-shadow: 0 8px 24px rgba(0, 136, 204, 0.45);
                    cursor: grab;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.5rem;
                    transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.2s ease;
                    position: relative;
                    user-select: none;
                    -webkit-user-select: none;
                }
                .floating-voice-btn:hover {
                    transform: scale(1.08);
                    box-shadow: 0 10px 30px rgba(0, 136, 204, 0.6);
                }
                .floating-voice-btn.is-dragging {
                    cursor: grabbing !important;
                    transform: scale(1.12) !important;
                    box-shadow: 0 14px 36px rgba(0, 136, 204, 0.8) !important;
                }
                .floating-voice-btn.voice-active {
                    background: linear-gradient(135deg, #e53935 0%, #b71c1c 100%);
                    box-shadow: 0 0 0 0 rgba(229, 57, 53, 0.7);
                    animation: voicePulse 1.8s infinite;
                }
                @keyframes voicePulse {
                    0% {
                        box-shadow: 0 0 0 0 rgba(229, 57, 53, 0.7), 0 8px 25px rgba(229, 57, 53, 0.5);
                    }
                    70% {
                        box-shadow: 0 0 0 18px rgba(229, 57, 53, 0), 0 8px 25px rgba(229, 57, 53, 0.5);
                    }
                    100% {
                        box-shadow: 0 0 0 0 rgba(229, 57, 53, 0), 0 8px 25px rgba(229, 57, 53, 0.5);
                    }
                }
                .voice-pulse-ring {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    border: 2px solid #0088cc;
                    animation: voiceRing 2s linear infinite;
                    opacity: 0;
                    display: none;
                }
                .voice-active .voice-pulse-ring {
                    display: block;
                    border-color: #ff5252;
                }
                @keyframes voiceRing {
                    0% { transform: scale(1); opacity: 0.8; }
                    100% { transform: scale(1.6); opacity: 0; }
                }

                /* شريط HUD السفلي لعرض النص والردود */
                .voice-commander-hud {
                    pointer-events: auto;
                    background: rgba(17, 24, 39, 0.96);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.12);
                    border-radius: 16px;
                    padding: 12px 18px;
                    color: #ffffff;
                    min-width: 300px;
                    max-width: 440px;
                    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
                    display: none;
                    flex-direction: column;
                    gap: 8px;
                    font-size: 0.88rem;
                    direction: rtl;
                    transform: translateY(10px);
                    opacity: 0;
                    transition: all 0.3s ease;
                }
                .voice-commander-hud.show {
                    display: flex;
                    transform: translateY(0);
                    opacity: 1;
                }
                .voice-hud-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    padding-bottom: 6px;
                }
                .voice-hud-title {
                    font-weight: 700;
                    font-size: 0.82rem;
                    color: #60a5fa;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                .voice-live-transcript {
                    font-size: 0.92rem;
                    color: #f3f4f6;
                    font-weight: 500;
                    min-height: 24px;
                    line-height: 1.4;
                    word-break: break-word;
                }
                .voice-live-transcript.highlight-final {
                    color: #34d399;
                    font-weight: 600;
                }

                /* موجات الصوت التفاعلية */
                .voice-waves-container {
                    display: flex;
                    align-items: center;
                    gap: 3px;
                    height: 14px;
                }
                .voice-wave-bar {
                    width: 3px;
                    background: #60a5fa;
                    border-radius: 3px;
                    animation: wavePulse 1s ease-in-out infinite;
                }
                .voice-wave-bar:nth-child(1) { height: 6px; animation-delay: 0.0s; }
                .voice-wave-bar:nth-child(2) { height: 12px; animation-delay: 0.2s; }
                .voice-wave-bar:nth-child(3) { height: 16px; animation-delay: 0.4s; }
                .voice-wave-bar:nth-child(4) { height: 9px; animation-delay: 0.1s; }
                @keyframes wavePulse {
                    0%, 100% { transform: scaleY(0.4); }
                    50% { transform: scaleY(1.4); }
                }

                .voice-speaking-pulse {
                    color: #38bdf8 !important;
                    animation: botPulse 0.8s infinite alternate;
                }
                @keyframes botPulse {
                    from { transform: scale(1); filter: drop-shadow(0 0 2px #38bdf8); }
                    to { transform: scale(1.25); filter: drop-shadow(0 0 8px #0284c7); }
                }

                .voice-command-highlight {
                    outline: 4px solid #0088cc !important;
                    outline-offset: 3px !important;
                    box-shadow: 0 0 25px rgba(0, 136, 204, 0.8) !important;
                    transition: all 0.3s ease !important;
                    transform: scale(1.02) !important;
                }
            `;
            document.head.appendChild(style);

            const container = document.createElement('div');
            container.id = 'voiceCommanderContainer';
            container.className = 'floating-voice-hub';
            container.innerHTML = `
                <div class="voice-commander-hud" id="voiceCommanderHud">
                    <div class="voice-hud-header">
                        <div class="voice-hud-title">
                            <span class="voice-waves-container" id="voiceWaveIndicator">
                                <span class="voice-wave-bar"></span>
                                <span class="voice-wave-bar"></span>
                                <span class="voice-wave-bar"></span>
                                <span class="voice-wave-bar"></span>
                            </span>
                            <span>التحكم الصوتي نشط</span>
                            <i class="fas fa-robot ms-1" id="voiceBotSpeakerIcon" title="مساعد الأوامر الصوتية"></i>
                        </div>
                        <div class="d-flex align-items-center gap-2">
                            <button type="button" class="btn btn-sm btn-link text-white p-0 text-decoration-none" id="voiceTtsToggleBtn" title="كتم / تفعيل الصوت">
                                <i class="fas fa-volume-up text-success"></i>
                            </button>
                            <button type="button" class="btn btn-sm btn-link text-white p-0 text-decoration-none" id="voiceHelpBtn" title="قاموس الأوامر الصوتية">
                                <i class="fas fa-question-circle text-info"></i>
                            </button>
                            <button type="button" class="btn-close btn-close-white" style="font-size:0.65rem;" id="voiceHudCloseBtn" aria-label="إغلاق"></button>
                        </div>
                    </div>
                    <div class="voice-live-transcript" id="voiceLiveTranscript">
                        تحدث بأمرك الآن... (مثال: سجل الدخول بحساب لميس، ابدأ المراقبة، أضف كلمة مراقبة، ابدأ الإرسال)
                    </div>
                </div>

                <button type="button" class="floating-voice-btn" id="floatingVoiceBtn" title="التحكم الصوتي بالتطبيق (اسحب للتحريك / اضغط للتحدث)">
                    <span class="voice-pulse-ring"></span>
                    <i class="fas fa-microphone" id="floatingVoiceIcon"></i>
                </button>
            `;
            document.body.appendChild(container);

            this.injectHelpModal();

            document.getElementById('voiceTtsToggleBtn').addEventListener('click', () => this.toggleTTS());
            document.getElementById('voiceHudCloseBtn').addEventListener('click', () => this.stop());
            document.getElementById('voiceHelpBtn').addEventListener('click', () => this.openHelpModal());
        }

        injectHelpModal() {
            if (document.getElementById('voiceHelpModal')) return;
            const modal = document.createElement('div');
            modal.id = 'voiceHelpModal';
            modal.className = 'modal fade';
            modal.setAttribute('tabindex', '-1');
            modal.setAttribute('aria-hidden', 'true');
            modal.innerHTML = `
                <div class="modal-dialog modal-dialog-centered modal-lg">
                    <div class="modal-content shadow-lg border-0" style="border-radius: 20px; overflow: hidden; direction: rtl;">
                        <div class="modal-header text-white" style="background: linear-gradient(135deg, #0088cc 0%, #005f8f 100%);">
                            <h5 class="modal-title fw-bold">
                                <i class="fas fa-microphone-alt me-2"></i> قاموس الأوامر الصوتية الذكية الشامل
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="إغلاق"></button>
                        </div>
                        <div class="modal-body p-4" style="background: #f8fafc;">
                            <p class="text-muted mb-4">
                                يمكنك التحكم في كافة أقسام التطبيق بحرية تامة وبدون لمس الشاشة، فقط قل أي من الأوامر التالية بصوت واضح:
                            </p>
                            <div class="row g-3">
                                <div class="col-md-6">
                                    <div class="p-3 bg-white rounded-3 shadow-sm border-start border-4 border-primary h-100">
                                        <h6 class="fw-bold text-primary mb-2"><i class="fas fa-sign-in-alt me-1"></i> تسجيل الدخول والحوار التفاعلي</h6>
                                        <ul class="list-unstyled mb-0 small text-secondary">
                                            <li class="mb-1">🔹 <strong>«سجل الدخول بحساب لميس»</strong>: يبدأ تسجيل حساب لميس ويطلب الكود.</li>
                                            <li class="mb-1">🔹 <strong>«سجل الدخول برقم +20...»</strong>: يسجل بأي رقم هاتف تختاره.</li>
                                            <li class="mb-1">🔹 <strong>«الكود هو 12345»</strong> أو نطق الأرقام مباشرة: يدخل كود تيليجرام ويتحقق.</li>
                                            <li class="mb-1">🔹 <strong>«كلمة المرور هي ...»</strong>: يدخل كلمة المرور الثنائية 2FA.</li>
                                            <li class="mb-1">🔹 <strong>«أعد إرسال الكود»</strong>: لإعادة طلب كود جديد.</li>
                                        </ul>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="p-3 bg-white rounded-3 shadow-sm border-start border-4 border-warning h-100">
                                        <h6 class="fw-bold text-warning mb-2"><i class="fas fa-shield-alt me-1"></i> المراقبة الذكية والردود</h6>
                                        <ul class="list-unstyled mb-0 small text-secondary">
                                            <li class="mb-1">🔹 <strong>«ابدأ المراقبة»</strong>: تشغيل رصد الكلمات على مدار الساعة.</li>
                                            <li class="mb-1">🔹 <strong>«أوقف المراقبة»</strong>: إيقاف المراقبة مؤقتاً.</li>
                                            <li class="mb-1">🔹 <strong>«أضف كلمة مراقبة [الكلمة]»</strong>: يضيف الكلمة ويحفظها.</li>
                                            <li class="mb-1">🔹 <strong>«احذف كلمة مراقبة [الكلمة]»</strong>: يحذف الكلمة من النظام.</li>
                                            <li class="mb-1">🔹 <strong>«اقرأ كلمات المراقبة»</strong>: ينطق الكلمات المسجلة.</li>
                                            <li class="mb-1">🔹 <strong>«تفعيل الرد التلقائي»</strong> / <strong>«الرد بالخاص»</strong>.</li>
                                            <li class="mb-1">🔹 <strong>«حساب الاستلام هو me»</strong>: يغير حساب التنبيهات.</li>
                                        </ul>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="p-3 bg-white rounded-3 shadow-sm border-start border-4 border-success h-100">
                                        <h6 class="fw-bold text-success mb-2"><i class="fas fa-paper-plane me-1"></i> مهام الإرسال والمراسلة</h6>
                                        <ul class="list-unstyled mb-0 small text-secondary">
                                            <li class="mb-1">🔹 <strong>«ابدأ الإرسال»</strong> / <strong>«ارسل الآن»</strong>: بدء الإرسال فوراً.</li>
                                            <li class="mb-1">🔹 <strong>«أوقف الإرسال»</strong>: إيقاف الإرسال بلحظتها.</li>
                                            <li class="mb-1">🔹 <strong>«إرسال للمجموعات»</strong> / <strong>«إرسال للقنوات»</strong> / <strong>«إرسال فردي»</strong>.</li>
                                            <li class="mb-1">🔹 <strong>«اضبط الفاصل الزمني 30 ثانية»</strong>.</li>
                                            <li class="mb-1">🔹 <strong>«تفعيل الإرسال الذكي»</strong>: فحص البوتات والرسائل البديلة.</li>
                                            <li class="mb-1">🔹 <strong>«اكتب في الرسالة [نصك]»</strong>: يملأ مربع الرسالة.</li>
                                            <li class="mb-1">🔹 <strong>«احفظ الإعدادات»</strong>: يحفظ التعديلات فوراً.</li>
                                        </ul>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="p-3 bg-white rounded-3 shadow-sm border-start border-4 border-info h-100">
                                        <h6 class="fw-bold text-info mb-2"><i class="fas fa-link me-1"></i> الروابط وقاعدة البيانات</h6>
                                        <ul class="list-unstyled mb-0 small text-secondary">
                                            <li class="mb-1">🔹 <strong>«استعرض روابط قاعدة البيانات»</strong>: يفحص وينطق عددها.</li>
                                            <li class="mb-1">🔹 <strong>«صدّر الروابط ملف PDF»</strong>: ينزل تقرير PDF فورياً.</li>
                                            <li class="mb-1">🔹 <strong>«ما هي حالة الحساب؟»</strong>: ينطق اسم الحساب المتصل ووضعه.</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer bg-white border-top-0 d-flex justify-content-between">
                            <span class="text-muted small"><i class="fas fa-arrows-alt text-primary me-1"></i> يمكنك سحب أيقونة الميكروفون وتحريكها بحرية في أي مكان على الشاشة</span>
                            <button type="button" class="btn btn-primary px-4" data-bs-dismiss="modal">جاهز للتجربة</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }
    }

    // تهيئة المحرك وتثبيته في كائن النطاق العام عند تحميل المستند
    window.addEventListener('DOMContentLoaded', () => {
        window.voiceCommander = new VoiceCommander();
    });

})(window, document);
