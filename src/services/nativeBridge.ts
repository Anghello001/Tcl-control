import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Network } from '@capacitor/network';

export class NativeBridge {
  public static isNative(): boolean {
    return Capacitor.isNativePlatform();
  }

  public static getPlatform(): string {
    return Capacitor.getPlatform();
  }

  // Native Haptic pulse
  public static async triggerHaptic(style: 'light' | 'medium' | 'heavy' = 'light'): Promise<void> {
    if (this.isNative()) {
      try {
        const impact = style === 'heavy' ? ImpactStyle.Heavy : (style === 'medium' ? ImpactStyle.Medium : ImpactStyle.Light);
        await Haptics.impact({ style: impact });
        return;
      } catch (e) {
        console.warn('Native haptics error:', e);
      }
    }

    // Web vibration fallback
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      const duration = style === 'heavy' ? 45 : (style === 'medium' ? 25 : 12);
      navigator.vibrate(duration);
    }
  }

  // Native Notification vibration
  public static async triggerSuccessHaptic(): Promise<void> {
    if (this.isNative()) {
      try {
        await Haptics.notification({ type: NotificationType.Success });
        return;
      } catch {}
    }
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([20, 40, 30]);
    }
  }

  // Native Network monitoring
  public static async getNetworkStatus(): Promise<{ connected: boolean; connectionType: string }> {
    try {
      const status = await Network.getStatus();
      return {
        connected: status.connected,
        connectionType: status.connectionType,
      };
    } catch {
      return {
        connected: typeof navigator !== 'undefined' ? navigator.onLine : true,
        connectionType: 'wifi',
      };
    }
  }
}
