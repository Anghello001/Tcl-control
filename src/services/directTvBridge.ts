import { TvDevice } from '../types.ts';

// Direct Client-Side Local Wi-Fi Bridge
// Executes commands directly from the user's browser to the Smart TV on their home Wi-Fi
export class DirectTvBridge {
  public static async sendDirectCommand(
    device: TvDevice,
    command: string,
    type: 'press' | 'down' | 'up' = 'press'
  ): Promise<{ success: boolean; mode: 'direct_lan' | 'cloud_proxy'; error?: string }> {
    if (!device || !device.ip) {
      return { success: false, mode: 'cloud_proxy', error: 'Sin IP' };
    }

    // 1. If Roku TV Protocol (port 8060): Direct in-browser HTTP POST
    if (device.protocol === 'roku' && !device.ip.startsWith('127.0.0.1')) {
      const endpoint = type === 'down' ? 'keydown' : (type === 'up' ? 'keyup' : 'keypress');
      const rokuKey = this.mapRokuKey(command);
      
      if (rokuKey) {
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 900);
          
          await fetch(`http://${device.ip}:8060/${endpoint}/${rokuKey}`, {
            method: 'POST',
            mode: 'no-cors', // Bypasses browser CORS for LAN devices
            signal: controller.signal,
          });
          
          clearTimeout(timer);
          return { success: true, mode: 'direct_lan' };
        } catch (e: any) {
          console.log('Fallo envío directo LAN, usando proxy:', e.message);
        }
      }
    }

    // 2. Fallback to Server Proxy
    try {
      const res = await fetch('/api/tv/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: device.id,
          command,
          type,
        }),
      });
      return { success: res.ok, mode: 'cloud_proxy' };
    } catch (err: any) {
      return { success: false, mode: 'cloud_proxy', error: err.message };
    }
  }

  // Sincronización Inicio + OK enviada directamente
  public static async sendPairingSyncDirect(
    device: TvDevice,
    comboType: 'home_ok' | 'assistant_voice'
  ): Promise<{ success: boolean; message: string }> {
    if (!device || !device.ip) {
      return { success: false, message: 'Dispositivo no configurado' };
    }

    try {
      if (device.protocol === 'roku') {
        const keys = comboType === 'home_ok' ? ['Home', 'Select'] : ['Search'];
        for (const k of keys) {
          fetch(`http://${device.ip}:8060/keypress/${k}`, { method: 'POST', mode: 'no-cors' }).catch(() => {});
        }
      }

      await fetch('/api/tv/pair-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: device.id,
          comboType,
        }),
      });

      return {
        success: true,
        message: comboType === 'home_ok'
          ? 'Comando Inicio + OK enviado al televisor.'
          : 'Comando Asistente + Voz enviado al televisor.',
      };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  private static mapRokuKey(cmd: string): string | null {
    const map: Record<string, string> = {
      'Up': 'Up',
      'Down': 'Down',
      'Left': 'Left',
      'Right': 'Right',
      'Select': 'Select',
      'ButtonA': 'Select',
      'ButtonB': 'Back',
      'ButtonX': 'Info',
      'ButtonY': 'Home',
      'Back': 'Back',
      'Home': 'Home',
      'VolumeUp': 'VolumeUp',
      'VolumeDown': 'VolumeDown',
      'VolumeMute': 'VolumeMute',
      'Power': 'PowerOff',
      'Play': 'Play',
      'Pause': 'Play',
      'Assistant': 'Search',
      'Voice': 'Search',
    };
    return map[cmd] || null;
  }
}
