import React, { useRef, useState, useCallback } from 'react';
import { soundFX } from '../services/soundEffects.ts';
import { haptics } from '../services/haptics.ts';

interface VirtualStickProps {
  label: string;
  subLabel?: string;
  size?: number;
  onMove: (pos: { x: number; y: number; distance: number; angle: number }) => void;
  onClick?: () => void;
}

export const VirtualStick: React.FC<VirtualStickProps> = ({
  label,
  subLabel,
  size = 140,
  onMove,
  onClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });
  const maxRadius = size * 0.38;

  const updatePosition = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

    const clampedDist = Math.min(distance, maxRadius);
    const rad = (angle * Math.PI) / 180;

    const clampedX = Math.cos(rad) * clampedDist;
    const clampedY = Math.sin(rad) * clampedDist;

    const normX = clampedX / maxRadius;
    const normY = clampedY / maxRadius;
    const normDist = clampedDist / maxRadius;

    setKnobPos({ x: clampedX, y: clampedY });
    onMove({ x: normX, y: normY, distance: normDist, angle: (angle + 360) % 360 });
  }, [maxRadius, onMove]);

  const handlePointerStart = (e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setActive(true);
    haptics.lightTap();
    soundFX.playClick(400, 0.03);
    updatePosition(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!active) return;
    e.preventDefault();
    updatePosition(e.clientX, e.clientY);
  };

  const handlePointerEnd = (e: React.PointerEvent) => {
    e.preventDefault();
    setActive(false);
    setKnobPos({ x: 0, y: 0 });
    onMove({ x: 0, y: 0, distance: 0, angle: 0 });
  };

  return (
    <div className="flex flex-col items-center select-none touch-none">
      <div
        ref={containerRef}
        onPointerDown={handlePointerStart}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onDoubleClick={onClick}
        style={{ width: size, height: size }}
        className={`relative rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing transition-colors duration-200 border ${
          active
            ? 'border-neutral-400 bg-neutral-900 shadow-lg'
            : 'border-neutral-800 bg-neutral-950 shadow-inner'
        }`}
      >
        {/* Subtle guides */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
          <div className="w-full h-px bg-neutral-200" />
          <div className="h-full w-px bg-neutral-200 absolute" />
        </div>

        {/* Knob */}
        <div
          style={{
            transform: `translate3d(${knobPos.x}px, ${knobPos.y}px, 0)`,
            width: size * 0.44,
            height: size * 0.44,
          }}
          className={`relative rounded-full flex flex-col items-center justify-center shadow-md transition-transform duration-75 border ${
            active
              ? 'bg-neutral-700 border-neutral-300'
              : 'bg-neutral-800 border-neutral-700'
          }`}
        >
          <div className="w-3 h-3 rounded-full bg-neutral-500 opacity-60" />
        </div>
      </div>

      <span className="text-[11px] font-medium text-neutral-400 mt-2 font-mono">{label}</span>
    </div>
  );
};
