import { TvDevice } from '../types.ts';

export interface ScanProgress {
  scanned: number;
  total: number;
  currentSubnet: string;
  percent: number;
  foundDevices: TvDevice[];
}

export class LanScannerService {
  // Common TV gateway subnets
  public static commonSubnets = [
    '192.168.1',
    '192.168.0',
    '192.168.100',
    '10.0.0',
    '192.168.18',
    '192.168.8',
  ];

  // Common high-probability host suffixes for Smart TVs (DHCP ranges & static)
  public static topHostSuffixes = [
    100, 101, 102, 103, 104, 105, 110, 120, 130, 140, 145, 150, 160, 170, 180, 182, 190, 200, 
    2, 3, 4, 5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 80, 90, 210, 220, 230, 240, 250, 254
  ];

  // Test an individual IP from client browser
  public static async probeDirectIp(ip: string, timeoutMs = 600): Promise<TvDevice | null> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      // 1. Check Roku ECP (Port 8060)
      const res = await fetch(`http://${ip}:8060/query/device-info`, {
        method: 'GET',
        signal: controller.signal,
        mode: 'cors',
      }).catch(() => null);

      clearTimeout(timer);

      if (res && res.ok) {
        const text = await res.text();
        const modelMatch = text.match(/<model-name>([^<]+)<\/model-name>/i);
        const nameMatch = text.match(/<user-device-name>([^<]+)<\/user-device-name>/i);
        const serialMatch = text.match(/<serial-number>([^<]+)<\/serial-number>/i);

        const devName = nameMatch ? nameMatch[1] : (modelMatch ? `TCL Roku TV (${modelMatch[1]})` : `TCL Smart TV (${ip})`);
        const model = modelMatch ? modelMatch[1] : 'TCL Roku 4K TV';

        return {
          id: `roku-${ip.replace(/\./g, '-')}`,
          name: devName,
          model,
          ip,
          port: 8060,
          protocol: 'roku',
          online: true,
          powerState: 'on',
          volume: 20,
          muted: false,
          currentApp: 'Smart TV Home',
          inputSource: 'HDMI 1',
          gameMode: true,
          vrrEnabled: true,
          refreshRate: '120Hz VRR',
          latencyMs: 6,
          lastSeen: Date.now(),
        };
      }
    } catch {
      clearTimeout(timer);
    }

    return null;
  }

  // Scan a subnet with real-time progress updates
  public static async scanSubnet(
    subnet: string,
    onProgress?: (p: ScanProgress) => void
  ): Promise<TvDevice[]> {
    const found: TvDevice[] = [];
    const targets = this.topHostSuffixes.map(s => `${subnet}.${s}`);
    const total = targets.length;
    let scanned = 0;

    // Batch in concurrency chunks of 8
    const chunkSize = 8;
    for (let i = 0; i < targets.length; i += chunkSize) {
      const chunk = targets.slice(i, i + chunkSize);
      const promises = chunk.map(async ip => {
        const dev = await this.probeDirectIp(ip, 700);
        if (dev) {
          found.push(dev);
        }
        scanned++;
        if (onProgress) {
          onProgress({
            scanned,
            total,
            currentSubnet: subnet,
            percent: Math.round((scanned / total) * 100),
            foundDevices: [...found],
          });
        }
      });

      await Promise.all(promises);
    }

    return found;
  }
}
