import React, { useState, useEffect, useCallback } from 'react';
import { 
  TvDevice, 
  ControllerMode, 
  ControllerStyle 
} from './types.ts';
import { Navbar } from './components/Navbar.tsx';
import { GamepadController } from './components/GamepadController.tsx';
import { SmartTvRemote } from './components/SmartTvRemote.tsx';
import { AirMouseTrackpad } from './components/AirMouseTrackpad.tsx';
import { AppLauncher } from './components/AppLauncher.tsx';
import { TclTvSimulator } from './components/TclTvSimulator.tsx';
import { NetworkScannerModal } from './components/NetworkScannerModal.tsx';
import { TclPairingAssistantModal } from './components/TclPairingAssistantModal.tsx';
import { BluetoothPairingModal } from './components/BluetoothPairingModal.tsx';
import { soundFX } from './services/soundEffects.ts';
import { haptics } from './services/haptics.ts';
import { FullscreenManager } from './services/fullscreenService.ts';
import { DirectTvBridge } from './services/directTvBridge.ts';
import { BluetoothTvDevice, bluetoothManager } from './services/bluetoothGamepadService.ts';

export default function App() {
  const [currentMode, setCurrentMode] = useState<ControllerMode>('gamepad');
  const [device, setDevice] = useState<TvDevice | null>(null);
  const [bluetoothDevice, setBluetoothDevice] = useState<BluetoothTvDevice | null>(null);
  const [devicesList, setDevicesList] = useState<TvDevice[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [showPairingModal, setShowPairingModal] = useState(false);
  const [showBluetoothModal, setShowBluetoothModal] = useState(false);
  const [showSimulator, setShowSimulator] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lastDispatchedCommand, setLastDispatchedCommand] = useState('');

  // Track fullscreen changes across browsers
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(FullscreenManager.isFullscreen());
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    await FullscreenManager.toggleFullscreen();
    setIsFullscreen(FullscreenManager.isFullscreen());
  };

  // Subscribe to Bluetooth state
  useEffect(() => {
    const unsub = bluetoothManager.subscribe((connected, dev) => {
      setBluetoothDevice(dev);
    });
    return () => unsub();
  }, []);

  // Scan network
  const scanNetwork = useCallback(async (subnet = '192.168.1', targetIp?: string) => {
    setIsScanning(true);
    try {
      const url = targetIp 
        ? `/api/tv/scan?subnet=${encodeURIComponent(subnet)}&ip=${encodeURIComponent(targetIp)}`
        : `/api/tv/scan?subnet=${encodeURIComponent(subnet)}`;

      const res = await fetch(url);
      const data = await res.json();

      if (data.success && data.devices) {
        setDevicesList(data.devices);
        if (!device && data.devices.length > 0) {
          setDevice(data.devices[0]);
        }
      }
    } catch (err) {
      console.error('Error escaneando red:', err);
    } finally {
      setIsScanning(false);
    }
  }, [device]);

  useEffect(() => {
    scanNetwork();
  }, [scanNetwork]);

  // Send commands using Bluetooth (if connected) or Direct LAN Bridge / Proxy
  const handleSendCommand = async (cmd: string, type: 'press' | 'down' | 'up' = 'press') => {
    setLastDispatchedCommand(cmd);

    // 1. If Bluetooth is active, transmit over Bluetooth HID
    if (bluetoothManager.isConnected) {
      bluetoothManager.sendBluetoothCommand(cmd, type);
    }

    // 2. Transmit over Local Wi-Fi Bridge
    if (device) {
      DirectTvBridge.sendDirectCommand(device, cmd, type);
    }

    // Update local state optimistically
    setDevice(prev => {
      if (!prev) return prev;
      if (cmd === 'VolumeUp') return { ...prev, volume: Math.min(100, prev.volume + 2), muted: false };
      if (cmd === 'VolumeDown') return { ...prev, volume: Math.max(0, prev.volume - 2) };
      if (cmd === 'VolumeMute') return { ...prev, muted: !prev.muted };
      if (cmd === 'Power') return { ...prev, powerState: prev.powerState === 'on' ? 'standby' : 'on' };
      if (cmd === 'ToggleGameMode') return { ...prev, gameMode: !prev.gameMode };
      if (cmd.startsWith('HDMI')) return { ...prev, inputSource: cmd, currentApp: `Entrada ${cmd}` };
      return prev;
    });
  };

  // Sincronización Inicio + OK
  const handleSyncPairing = async (comboType: 'home_ok' | 'assistant_voice') => {
    if (bluetoothManager.isConnected) {
      await bluetoothManager.sendBluetoothPairingSync();
    }
    if (device) {
      const result = await DirectTvBridge.sendPairingSyncDirect(device, comboType);
      if (result.success) {
        setDevice(prev => prev ? { ...prev, paired: true, voiceSensitivity: comboType === 'assistant_voice' ? 'ultra' : 'high' } : prev);
      }
    }
  };

  // Launch apps
  const handleLaunchApp = async (appId: string) => {
    try {
      const res = await fetch('/api/tv/launch-app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: device?.id,
          appId,
        }),
      });
      const data = await res.json();
      if (data.success && data.tvState) {
        setDevice(data.tvState);
      }
    } catch (err) {
      console.error('Error lanzando app:', err);
    }
  };

  // Manual IP connect
  const handleManualConnect = async (ip: string, port: number, protocol: string, name: string) => {
    const res = await fetch('/api/tv/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ip, port, protocol, name }),
    });
    const data = await res.json();
    if (data.success && data.device) {
      setDevice(data.device);
      setDevicesList(prev => [data.device, ...prev.filter(d => d.id !== data.device.id)]);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col selection:bg-neutral-700 pb-8">
      
      {/* Top Navigation */}
      <Navbar
        currentMode={currentMode}
        onSelectMode={setCurrentMode}
        device={device}
        bluetoothDevice={bluetoothDevice}
        onOpenScanner={() => setShowScannerModal(true)}
        onOpenPairing={() => setShowPairingModal(true)}
        onOpenBluetooth={() => setShowBluetoothModal(true)}
        showSimulator={showSimulator}
        onToggleSimulator={() => setShowSimulator(!showSimulator)}
        soundEnabled={soundEnabled}
        onToggleSound={() => {
          const next = !soundEnabled;
          setSoundEnabled(next);
          soundFX.enabled = next;
        }}
        hapticsEnabled={hapticsEnabled}
        onToggleHaptics={() => {
          const next = !hapticsEnabled;
          setHapticsEnabled(next);
          haptics.enabled = next;
        }}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-3 flex flex-col items-center">
        
        {/* Minimal TV Screen Simulator */}
        {showSimulator && (
          <TclTvSimulator
            device={device}
            lastCommand={lastDispatchedCommand}
          />
        )}

        {/* Selected View */}
        <div className="w-full flex justify-center mt-2">
          {currentMode === 'gamepad' && (
            <GamepadController
              device={device}
              onSendCommand={handleSendCommand}
              isFullscreen={isFullscreen}
              onToggleFullscreen={toggleFullscreen}
              onOpenPairing={() => setShowPairingModal(true)}
            />
          )}

          {currentMode === 'remote' && (
            <SmartTvRemote
              device={device}
              onSendCommand={handleSendCommand}
              onLaunchApp={handleLaunchApp}
              onOpenPairingModal={() => setShowPairingModal(true)}
            />
          )}

          {currentMode === 'trackpad' && (
            <AirMouseTrackpad
              device={device}
              onSendCommand={handleSendCommand}
            />
          )}

          {currentMode === 'apps' && (
            <AppLauncher
              device={device}
              onLaunchApp={handleLaunchApp}
              onSendCommand={handleSendCommand}
            />
          )}
        </div>

      </main>

      {/* Modals */}
      <NetworkScannerModal
        isOpen={showScannerModal}
        onClose={() => setShowScannerModal(false)}
        onSelectDevice={setDevice}
        currentDevice={device}
        devices={devicesList}
        onScan={scanNetwork}
        isScanning={isScanning}
        onManualConnect={handleManualConnect}
      />

      <TclPairingAssistantModal
        isOpen={showPairingModal}
        onClose={() => setShowPairingModal(false)}
        device={device}
        onSyncPairing={handleSyncPairing}
        onSendCommand={handleSendCommand}
      />

      <BluetoothPairingModal
        isOpen={showBluetoothModal}
        onClose={() => setShowBluetoothModal(false)}
        onBluetoothConnected={setBluetoothDevice}
        onSendCommand={handleSendCommand}
      />

    </div>
  );
}
