import React from 'react';
import type { EEGDataPayload } from '../hooks/useMockEEGData';

type BrainMapProps = {
  currentFrame: EEGDataPayload | null;
};

// Electrode coordinates on a 200x250 SVG grid
const ELECTRODES = {
  F1: { cx: 70, cy: 60 },
  F2: { cx: 130, cy: 60 },
  Fz: { cx: 100, cy: 45 },
  P1: { cx: 70, cy: 190 },
  P2: { cx: 130, cy: 190 },
  Pz: { cx: 100, cy: 205 },
  O1: { cx: 80, cy: 230 },
  O2: { cx: 120, cy: 230 },
};

export const BrainMap: React.FC<BrainMapProps> = ({ currentFrame }) => {
  // Simple function to determine if a channel is highly active based on the last value
  const isActive = (channel: keyof EEGDataPayload) => {
    if (!currentFrame) return false;
    const values = currentFrame[channel];
    if (!values || values.length === 0) return false;
    const lastValue = Math.abs(values[values.length - 1]);
    return lastValue > 6.0; // Threshold for yellow highlighting
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-slate-900/40 rounded-xl border border-slate-800 h-full">
      <h3 className="text-sm font-semibold text-slate-400 mb-6 tracking-widest uppercase">Cortical Mapping</h3>
      <div className="relative w-48 h-64">
        {/* Head outline SVG */}
        <svg viewBox="0 0 200 250" className="w-full h-full drop-shadow-xl" xmlns="http://www.w3.org/2000/svg">
          {/* Base Head Shape */}
          <path
            d="M 100 10 C 160 10 180 60 180 125 C 180 190 150 240 100 240 C 50 240 20 190 20 125 C 20 60 40 10 100 10 Z"
            fill="none"
            stroke="#1e293b"
            strokeWidth="4"
          />
          {/* Nose indication */}
          <path
            d="M 90 10 L 100 0 L 110 10"
            fill="none"
            stroke="#1e293b"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          
          {/* Render Electrodes */}
          {(Object.keys(ELECTRODES) as Array<keyof typeof ELECTRODES>).map((node) => {
            const { cx, cy } = ELECTRODES[node];
            const active = isActive(node);
            
            return (
              <g key={node}>
                {/* Glow effect */}
                {active && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r="12"
                    fill="var(--electric)"
                    opacity="0.3"
                    className="animate-pulse"
                  />
                )}
                {/* Node center */}
                <circle
                  cx={cx}
                  cy={cy}
                  r="6"
                  fill={active ? "var(--electric)" : "#475569"}
                  className={`transition-colors duration-200 ${currentFrame ? 'animate-pulse-slow' : ''}`}
                />
                <text
                  x={cx}
                  y={cy + 18}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  {node}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="mt-8 flex gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-slate-600"></span> Base
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#FACC15]"></span> High Activity
        </div>
      </div>
    </div>
  );
};
