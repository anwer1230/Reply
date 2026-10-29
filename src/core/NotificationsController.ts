/**
 * NotificationsController.ts - org.telegram.messenger.NotificationsController
 * Handles push notifications and sound alerts across accounts.
 */

import { notificationEngine } from '../services/NotificationEngine';
import { telegramAudio } from '../utils/audioNotification';

export class NotificationsController {
  private static instances = new Map<number, NotificationsController>();
  private currentAccount: number;

  public static getInstance(account: number = 0): NotificationsController {
    if (!NotificationsController.instances.has(account)) {
      NotificationsController.instances.set(account, new NotificationsController(account));
    }
    return NotificationsController.instances.get(account)!;
  }

  private constructor(account: number) {
    this.currentAccount = account;
  }

  public showNotification(title: string, message: string, chatId?: string, avatar?: string): void {
    // 1. In-app banner & queue
    notificationEngine.showNotification({
      title,
      body: message,
      chatId,
      avatar,
      category: 'message',
    });

    // 2. Play sound
    telegramAudio.playMessageReceived();
  }

  public playSound(soundType: 'received' | 'sent' | 'chime' = 'received'): void {
    if (soundType === 'sent') {
      telegramAudio.playMessageSent();
    } else if (soundType === 'chime') {
      telegramAudio.playMessageChime();
    } else {
      telegramAudio.playMessageReceived();
    }
  }
}

export const notificationsController = NotificationsController.getInstance(0);
