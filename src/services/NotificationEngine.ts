/**
 * NotificationEngine.ts - In-App Banner and Push Notification Engine
 * Manages reactive notification queue, sound triggers, navigation callbacks,
 * and native Web Notification integrations.
 */

import { InAppNotification, NotificationCategory } from '../types';
import { telegramAudio } from '../utils/audioNotification';
import { NotificationCenter } from '../core/NotificationCenter';

export class NotificationEngine {
  private static instance: NotificationEngine;
  private notifications: InAppNotification[] = [];
  private listeners: ((notifs: InAppNotification[]) => void)[] = [];
  private navigationHandler: ((chatId: string, reply?: any) => void) | null = null;
  private muteChecker: ((chatId: string) => boolean) | null = null;
  private soundEnabled: boolean = true;
  private dismissTimers = new Map<string, any>();

  public static getInstance(): NotificationEngine {
    if (!NotificationEngine.instance) {
      NotificationEngine.instance = new NotificationEngine();
    }
    return NotificationEngine.instance;
  }

  public registerNavigationHandler(fn: (chatId: string, reply?: any) => void): void {
    this.navigationHandler = fn;
  }

  public registerMuteChecker(fn: (chatId: string) => boolean): void {
    this.muteChecker = fn;
  }

  public setSoundEffectsEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
    telegramAudio.setEnabled(enabled);
  }

  public isMuted(chatId?: string): boolean {
    if (!chatId || !this.muteChecker) return false;
    try {
      return this.muteChecker(chatId);
    } catch {
      return false;
    }
  }

  public navigateToChat(chatId?: string, reply?: any): void {
    if (chatId && this.navigationHandler) {
      this.navigationHandler(chatId, reply);
    }
  }

  public async requestBrowserPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    try {
      const perm = await Notification.requestPermission();
      return perm === 'granted';
    } catch {
      return false;
    }
  }

  public showNotification(notif: {
    category?: NotificationCategory;
    title: string;
    body: string;
    avatar?: string;
    chatId?: string;
    chatTitle?: string;
    senderName?: string;
    isSilent?: boolean;
    replyAction?: boolean;
    messageText?: string;
    id?: string;
  }): InAppNotification {
    const isChatMuted = notif.chatId ? this.isMuted(notif.chatId) : false;
    const shouldMute = isChatMuted && notif.category !== 'keyword_alert';

    const newNotif: InAppNotification = {
      id: notif.id || `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      category: notif.category || 'message',
      title: notif.title,
      body: notif.body,
      avatar: notif.avatar,
      chatId: notif.chatId,
      chatTitle: notif.chatTitle || notif.title,
      senderName: notif.senderName,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSilent: notif.isSilent || shouldMute,
      replyAction: notif.replyAction,
      messageText: notif.messageText || notif.body,
    };

    // 1. Play audio chime if sound is enabled and notification is not muted
    if (this.soundEnabled && !newNotif.isSilent) {
      try {
        if (newNotif.category === 'keyword_alert') {
          telegramAudio.playMessageChime();
        } else {
          telegramAudio.playMessageReceived();
        }
      } catch (err) {
        console.warn('[NotificationEngine] Audio chime error:', err);
      }
    }

    // 2. Dispatch native Browser Web Notification
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const nativeNotif = new Notification(newNotif.title, {
          body: newNotif.body,
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          tag: newNotif.chatId || newNotif.id,
          silent: newNotif.isSilent,
        });

        nativeNotif.onclick = () => {
          window.focus();
          this.navigateToChat(newNotif.chatId);
          nativeNotif.close();
        };
      } catch (e) {
        console.warn('[NotificationEngine] Native notification dispatch error:', e);
      }
    }

    // 3. Update in-app notifications queue
    this.notifications = [newNotif, ...this.notifications.filter((n) => n.id !== newNotif.id)].slice(0, 4);
    this.notifySubscribers();

    // 4. Auto-dismiss after 5 seconds
    const timer = setTimeout(() => {
      this.dismissNotification(newNotif.id);
    }, 5200);
    this.dismissTimers.set(newNotif.id, timer);

    // 5. Broadcast to Telegram NotificationCenter
    NotificationCenter.getInstance(0).postNotificationName(
      NotificationCenter.notificationsCountUpdated,
      this.notifications.length
    );

    return newNotif;
  }

  public dismissNotification(id: string): void {
    if (this.dismissTimers.has(id)) {
      clearTimeout(this.dismissTimers.get(id));
      this.dismissTimers.delete(id);
    }
    this.notifications = this.notifications.filter((n) => n.id !== id);
    this.notifySubscribers();
  }

  public clearAll(): void {
    this.dismissTimers.forEach((timer) => clearTimeout(timer));
    this.dismissTimers.clear();
    this.notifications = [];
    this.notifySubscribers();
  }

  public getActiveNotifications(): InAppNotification[] {
    return this.notifications;
  }

  public handleIncoming(message: any, chat?: any, activeChatId?: string): void {
    if (!message || message.isOutgoing) return;

    // Check if user is currently looking at this active chat
    const isCurrentActiveChat = activeChatId && String(message.chatId) === String(activeChatId);
    const isDocHidden = typeof document !== 'undefined' && document.hidden;

    // If viewing the current chat and document is visible, play sound only
    if (isCurrentActiveChat && !isDocHidden) {
      if (this.soundEnabled && !this.isMuted(message.chatId)) {
        telegramAudio.playMessageReceived();
      }
      return;
    }

    const title = chat?.title || message.senderName || 'رسالة جديدة';
    const body = message.text || (message.media ? '📷 مرفق وسائط' : 'رسالة جديدة');

    this.showNotification({
      category: 'message',
      title,
      body,
      chatId: message.chatId,
      chatTitle: chat?.title,
      senderName: message.senderName,
      avatar: chat?.avatar || message.senderAvatar,
      replyAction: true,
      messageText: message.text,
    });
  }

  public subscribe(fn: (notifs: InAppNotification[]) => void): () => void {
    this.listeners.push(fn);
    // Send current state immediately
    fn(this.notifications);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  private notifySubscribers(): void {
    const copy = [...this.notifications];
    this.listeners.forEach((l) => {
      try {
        l(copy);
      } catch (err) {
        console.error('[NotificationEngine] Subscriber notification error:', err);
      }
    });
  }
}

export const notificationEngine = NotificationEngine.getInstance();
