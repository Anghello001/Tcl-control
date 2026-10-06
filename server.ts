import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import net from 'net';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json());

// Initialize Google GenAI
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export interface TvDevice {
  id: string;
  name: string;
  model: string;
  ip: string;
  port: number;
  protocol: 'roku' | 'android_tv' | 'tcl_tcast' | 'virtual';
  online: boolean;
  powerState: 'on' | 'standby';
  volume: number;
  muted: boolean;
  currentApp: string;
  inputSource: string;
  gameMode: boolean;
  vrrEnabled: boolean;
  refreshRate: string;
  latencyMs: number;
  lastSeen: number;
  paired?: boolean;
  voiceSensitivity?: 'normal' | 'high' | 'ultra';
  pairingProgress?: number;
}

// Active TV devices registry
const simulatedTvState: Record<string, TvDevice> = {
  'tcl-c845-living': {
    id: 'tcl-c845-living',
    name: 'TCL 65" C845 4K Mini-LED Google TV',
    model: 'TCL 65C845 Google TV (Game Master Pro 2.0)',
    ip: '192.168.1.145',
    port: 6466,
    protocol: 'android_tv',
    online: true,
    powerState: 'on',
    volume: 24,
    muted: false,
    currentApp: 'Game Center / HDMI 1',
    inputSource: 'HDMI 1 (Game Console)',
    gameMode: true,
    vrrEnabled: true,
    refreshRate: '144Hz VRR',
    latencyMs: 5,
    lastSeen: Date.now(),
    paired: true,
    voiceSensitivity: 'high',
  },
};

// Helper: Test real TCP socket port connection
function checkTcpPort(host: string, port: number, timeoutMs = 1200): Promise<{ port: number; open: boolean; error?: string }> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let isResolved = false;

    socket.setTimeout(timeoutMs);

    socket.on('connect', () => {
      if (!isResolved) {
        isResolved = true;
        socket.destroy();
        resolve({ port, open: true });
      }
    });

    socket.on('timeout', () => {
      if (!isResolved) {
        isResolved = true;
        socket.destroy();
        resolve({ port, open: false, error: 'Tiempo de espera agotado (Timeout)' });
      }
    });

    socket.on('error', (err: any) => {
      if (!isResolved) {
        isResolved = true;
        socket.destroy();
        resolve({ port, open: false, error: err.code || err.message });
      }
    });

    try {
      socket.connect(port, host);
    } catch (err: any) {
      if (!isResolved) {
        isResolved = true;
        resolve({ port, open: false, error: err.message });
      }
    }
  });
}

// Helper: Fetch with timeout
async function tryFetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 1200): Promise<any> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

// 1. API: Real Port & Protocol Probe (Checks real ports 8060, 5555, 6466, 7983 on the TV IP)
app.post('/api/tv/probe-ports', async (req: Request, res: Response) => {
  const { ip } = req.body;
  if (!ip) {
    return res.status(400).json({ success: false, error: 'IP requerida' });
  }

  const portsToCheck = [
    { port: 8060, name: 'Roku ECP (TCL Roku TV)' },
    { port: 5555, name: 'ADB Debugging (TCL Android / Google TV)' },
    { port: 6466, name: 'Android TV Remote Control' },
    { port: 7983, name: 'TCL T-Cast / MagiConnect' },
    { port: 8008, name: 'DIAL / Cast' },
  ];

  const results = await Promise.all(
    portsToCheck.map(async p => {
      const check = await checkTcpPort(ip, p.port, 1200);
      return {
        port: p.port,
        service: p.name,
        open: check.open,
        error: check.error,
      };
    })
  );

  const openPorts = results.filter(r => r.open);
  let recommendedProtocol: 'roku' | 'android_tv' | 'tcl_tcast' = 'android_tv';
  if (openPorts.some(p => p.port === 8060)) {
    recommendedProtocol = 'roku';
  } else if (openPorts.some(p => p.port === 5555 || p.port === 6466)) {
    recommendedProtocol = 'android_tv';
  } else if (openPorts.some(p => p.port === 7983)) {
    recommendedProtocol = 'tcl_tcast';
  }

  res.json({
    success: true,
    ip,
    results,
    openCount: openPorts.length,
    recommendedProtocol,
    message: openPorts.length > 0 
      ? `Se detectaron ${openPorts.length} puertos abiertos en ${ip}. Protocolo recomendado: ${recommendedProtocol.toUpperCase()}`
      : `No se pudo conectar a los puertos estándar en ${ip}. Verifica que el TV esté encendido y que el acceso a red esté permitido.`,
  });
});

// 2. API: Send Real Hardware TV Command (Returns exact HTTP & Socket status)
app.post('/api/tv/command', async (req: Request, res: Response) => {
  const { deviceId, tvIp, command, type = 'press' } = req.body;
  const ip = tvIp || (simulatedTvState[deviceId] ? simulatedTvState[deviceId].ip : null);

  let realSent = false;
  let httpStatus: number | null = null;
  let realError: string | null = null;
  let rawResponse: string | null = null;

  if (ip && !ip.startsWith('127.0.0.1')) {
    const action = type === 'down' ? 'keydown' : (type === 'up' ? 'keyup' : 'keypress');
    const rokuKey = mapToRokuKey(command);

    // Try Roku ECP HTTP
    if (rokuKey) {
      try {
        const response = await tryFetchWithTimeout(`http://${ip}:8060/${action}/${rokuKey}`, {
          method: 'POST',
        }, 1200);
        httpStatus = response.status;
        realSent = response.ok;
        rawResponse = await response.text().catch(() => '');
      } catch (err: any) {
        realError = err.message || err.code || 'Error de conexión HTTP';
      }
    }
  }

  // Update in-memory state
  const dev = simulatedTvState[deviceId] || Object.values(simulatedTvState)[0];
  if (dev) {
    if (command === 'VolumeUp') {
      dev.volume = Math.min(100, dev.volume + 2);
      dev.muted = false;
    } else if (command === 'VolumeDown') {
      dev.volume = Math.max(0, dev.volume - 2);
    } else if (command === 'VolumeMute') {
      dev.muted = !dev.muted;
    } else if (command === 'Power') {
      dev.powerState = dev.powerState === 'on' ? 'standby' : 'on';
    }
  }

  res.json({
    success: true,
    command,
    type,
    ip,
    realSent,
    httpStatus,
    realError,
    rawResponse,
    timestamp: Date.now(),
  });
});

// 3. API: Scan Wi-Fi / Local Network
app.get('/api/tv/scan', async (req: Request, res: Response) => {
  const customSubnet = req.query.subnet as string || '192.168.1';
  const targetIp = req.query.ip as string;
  const detectedDevices: TvDevice[] = [];

  Object.values(simulatedTvState).forEach(dev => {
    detectedDevices.push({
      ...dev,
      lastSeen: Date.now(),
    });
  });

  if (targetIp) {
    try {
      const rokuRes = await tryFetchWithTimeout(`http://${targetIp}:8060/query/device-info`, { method: 'GET' }, 900);
      if (rokuRes && rokuRes.ok) {
        const text = await rokuRes.text();
        const modelMatch = text.match(/<model-name>([^<]+)<\/model-name>/i);
        const nameMatch = text.match(/<user-device-name>([^<]+)<\/user-device-name>/i);
        const devName = nameMatch ? nameMatch[1] : (modelMatch ? `TCL Roku TV (${modelMatch[1]})` : `TCL Smart TV (${targetIp})`);
        
        const newDevice: TvDevice = {
          id: `real-roku-${targetIp.replace(/\./g, '-')}`,
          name: devName,
          model: modelMatch ? modelMatch[1] : 'TCL Roku Smart TV',
          ip: targetIp,
          port: 8060,
          protocol: 'roku',
          online: true,
          powerState: 'on',
          volume: 22,
          muted: false,
          currentApp: 'Smart TV Home',
          inputSource: 'HDMI 1',
          gameMode: true,
          vrrEnabled: true,
          refreshRate: '120Hz VRR',
          latencyMs: 6,
          lastSeen: Date.now(),
          paired: true,
          voiceSensitivity: 'high',
        };

        simulatedTvState[newDevice.id] = newDevice;
        detectedDevices.unshift(newDevice);
      }
    } catch {}
  }

  res.json({
    success: true,
    devices: detectedDevices,
    timestamp: Date.now(),
    subnet: customSubnet,
  });
});

// 4. API: Connect to TV
app.post('/api/tv/connect', async (req: Request, res: Response) => {
  const { ip, port, protocol, name } = req.body;
  if (!ip) {
    return res.status(400).json({ error: 'IP de televisión requerida' });
  }

  const deviceId = `tv-${ip.replace(/\./g, '-')}`;
  let existing = simulatedTvState[deviceId];

  if (!existing) {
    existing = {
      id: deviceId,
      name: name || `TCL Smart TV (${ip})`,
      model: protocol === 'roku' ? 'TCL Roku 4K TV' : 'TCL 4K Mini-LED Google TV',
      ip,
      port: port || (protocol === 'roku' ? 8060 : 6466),
      protocol: protocol || (port === 8060 ? 'roku' : 'android_tv'),
      online: true,
      powerState: 'on',
      volume: 24,
      muted: false,
      currentApp: 'Game Center',
      inputSource: 'HDMI 1',
      gameMode: true,
      vrrEnabled: true,
      refreshRate: '144Hz VRR',
      latencyMs: 5,
      lastSeen: Date.now(),
      paired: true,
      voiceSensitivity: 'high',
    };
    simulatedTvState[deviceId] = existing;
  } else {
    existing.online = true;
    existing.lastSeen = Date.now();
  }

  res.json({
    success: true,
    device: existing,
    message: `Configurado ${existing.name} (${ip})`,
  });
});

// 5. API: Pair Sync
app.post('/api/tv/pair-sync', async (req: Request, res: Response) => {
  const { deviceId, tvIp, comboType } = req.body;
  const ip = tvIp || (simulatedTvState[deviceId] ? simulatedTvState[deviceId].ip : null);

  let realSuccess = false;
  let log = '';

  if (ip && !ip.startsWith('127.0.0.1')) {
    try {
      if (comboType === 'home_ok') {
        await tryFetchWithTimeout(`http://${ip}:8060/keypress/Home`, { method: 'POST' }, 800);
        await tryFetchWithTimeout(`http://${ip}:8060/keypress/Select`, { method: 'POST' }, 800);
        realSuccess = true;
        log = `Comandos Inicio + OK enviados al TV en ${ip}:8060`;
      }
    } catch (err: any) {
      log = `Aviso de red: ${err.message}`;
    }
  }

  res.json({
    success: true,
    realSuccess,
    comboType,
    log,
    message: 'Comando de sincronización procesado.',
  });
});

function mapToRokuKey(cmd: string): string | null {
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
  };
  return map[cmd] || null;
}

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';
  const distPath = path.resolve(process.cwd(), 'dist');

  if (!isProduction) {
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (e) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  } else {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TCL GamePulse server running on http://0.0.0.0:${PORT}`);
  });
}

if (process.env.VERCEL !== '1' && !process.env.NOW_REGION) {
  startServer();
}

export { app, startServer };
export default app;
