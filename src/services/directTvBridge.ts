import { TvDevice } from '../types.ts';

export interface CommandDispatchResult {
  success: boolean;
  status: 'delivered' | 'cors_beacon_sent' | 'server_relayed' | 'network_error' | 'mixed_content_warning';
  channel: 'direct_http' | 'form_post' | 'server_proxy' | 'bluetooth' | 'adb';
  statusCode?: number;
  message: string;
}

// Multi-Protocol Engine for Physical TCL Smart TVs
// Supports Roku ECP (port 8060), Android TV ADB (port 5555), Google TV Remote (6466/6467), and T-Cast
export class DirectTvBridge {
  private static hiddenIframe: HTMLIFrameElement | null = null;
  private static hiddenForm: HTMLFormElement | null = null;

  // Initialize hidden form element for CORS-free submissions
  private static initForm() {
    if (typeof document === 'undefined' || this.hiddenIframe) return;
    try {
      const iframe = document.createElement('iframe');
      iframe.name = 'tcl_direct_bridge_frame';
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
      this.hiddenIframe = iframe;

      const form = document.createElement('form');
      form.method = 'POST';
      form.target = 'tcl_direct_bridge_frame';
      form.style.display = 'none';
      document.body.appendChild(form);
      this.hiddenForm = form;
    } catch (e) {
      console.warn('Sandbox initialization note:', e);
    }
  }

  // Execute direct command to TCL TV
  public static async sendCommand(
    device: TvDevice,
    command: string,
    type: 'press' | 'down' | 'up' = 'press'
  ): Promise<CommandDispatchResult> {
    if (!device || !device.ip) {
      return {
        success: false,
        status: 'network_error',
        channel: 'direct_http',
        message: 'No hay dirección IP configurada para el televisor.',
      };
    }

    const ip = device.ip;
    const protocol = device.protocol;
    this.initForm();

    // Protocol 1: TCL Roku TV (Port 8060)
    if (protocol === 'roku') {
      const action = type === 'down' ? 'keydown' : (type === 'up' ? 'keyup' : 'keypress');
      const rokuKey = this.mapRokuKey(command);

      // Attempt 1: Direct in-browser Fetch (no-cors)
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 900);

        await fetch(`http://${ip}:8060/${action}/${rokuKey}`, {
          method: 'POST',
          mode: 'no-cors',
          signal: controller.signal,
        });

        clearTimeout(timer);

        // Also trigger via Form POST to maximize delivery across browser sandbox constraints
        if (this.hiddenForm) {
          this.hiddenForm.action = `http://${ip}:8060/${action}/${rokuKey}`;
          this.hiddenForm.submit();
        }

        return {
          success: true,
          status: 'delivered',
          channel: 'direct_http',
          message: `Comando ${rokuKey} enviado a ${ip}:8060 (Roku ECP).`,
        };
      } catch (err: any) {
        console.warn('Direct Roku fetch note:', err?.message);
      }
    }

    // Protocol 2 & Fallback: Server-side Relay / Proxy
    try {
      const res = await fetch('/api/tv/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: device.id,
          tvIp: ip,
          protocol,
          command,
          type,
        }),
      });

      const data = await res.json();
      if (data.realSent) {
        return {
          success: true,
          status: 'delivered',
          channel: 'server_proxy',
          statusCode: data.httpStatus,
          message: `✓ Comando ${command} confirmado por la TV (${ip}).`,
        };
      } else if (data.realError) {
        return {
          success: false,
          status: 'network_error',
          channel: 'server_proxy',
          message: `Aviso del televisor: ${data.realError}`,
        };
      }

      return {
        success: true,
        status: 'server_relayed',
        channel: 'server_proxy',
        message: `Comando ${command} transmitido hacia ${ip}.`,
      };
    } catch (proxyErr: any) {
      return {
        success: false,
        status: 'network_error',
        channel: 'server_proxy',
        message: `Error de red al conectar con ${ip}: ${proxyErr.message}`,
      };
    }
  }

  // Sincronización Inicio + OK (Home + Select)
  public static async sendPairingSync(
    device: TvDevice,
    comboType: 'home_ok' | 'assistant_voice'
  ): Promise<CommandDispatchResult> {
    if (!device || !device.ip) {
      return {
        success: false,
        status: 'network_error',
        channel: 'direct_http',
        message: 'No hay IP configurada.',
      };
    }

    if (comboType === 'home_ok') {
      await this.sendCommand(device, 'Home', 'down');
      await this.sendCommand(device, 'Select', 'down');
      
      setTimeout(async () => {
        await this.sendCommand(device, 'Home', 'up');
        await this.sendCommand(device, 'Select', 'up');
      }, 2500);

      return {
        success: true,
        status: 'delivered',
        channel: 'direct_http',
        message: `Señales Inicio + OK transmitidas a ${device.ip}. Si el TV es Android/Google TV, activa Depuración de red (ADB).`,
      };
    } else {
      await this.sendCommand(device, 'Assistant', 'down');
      await this.sendCommand(device, 'Voice', 'down');

      setTimeout(async () => {
        await this.sendCommand(device, 'Assistant', 'up');
        await this.sendCommand(device, 'Voice', 'up');
      }, 2000);

      return {
        success: true,
        status: 'delivered',
        channel: 'direct_http',
        message: `Señal de Asistente de Voz enviada a ${device.ip}.`,
      };
    }
  }

  // Key mappings for Roku ECP
  private static mapRokuKey(cmd: string): string {
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
      'Rev': 'Rev',
      'Fwd': 'Fwd',
      'Assistant': 'Search',
      'Voice': 'Search',
      'L1': 'Rev',
      'R1': 'Fwd',
      'L2': 'InstantReplay',
      'R2': 'Info',
      'Start': 'Home',
      'Select_Btn': 'Back',
    };
    return map[cmd] || cmd;
  }
}
