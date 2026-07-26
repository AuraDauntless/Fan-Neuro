import React, { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import type { EEGDataPayload } from '../hooks/useMockEEGData';

type EEGChartProps = {
  currentFrame: EEGDataPayload | null;
};

// Colors for the 8 channels
const CHANNEL_COLORS: Record<keyof EEGDataPayload, string> = {
  F1: '#38bdf8', // sky-400
  F2: '#818cf8', // indigo-400
  Fz: '#c084fc', // purple-400
  P1: '#f472b6', // pink-400
  P2: '#fb7185', // rose-400
  Pz: '#fb923c', // orange-400
  O1: '#facc15', // yellow-400 (electric)
  O2: '#4ade80', // green-400
};

export const EEGChart: React.FC<EEGChartProps> = ({ currentFrame }) => {
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    if (currentFrame) {
      // Convert the 8 arrays of 25 samples into an array of objects for Recharts
      // We will only keep the latest frame for real-time visualization to avoid performance issues
      const numSamples = currentFrame.F1?.length || 0;
      const newChartData = [];
      
      for (let i = 0; i < numSamples; i++) {
        const point: any = { time: i };
        (Object.keys(currentFrame) as Array<keyof EEGDataPayload>).forEach(ch => {
          point[ch] = currentFrame[ch][i];
        });
        newChartData.push(point);
      }
      
      setChartData(newChartData);
    } else {
      // Clear data when stopped
      setChartData([]);
    }
  }, [currentFrame]);

  return (
    <div className="glass-panel p-4 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4 px-2">
        <h3 className="text-sm font-semibold text-slate-400 tracking-widest uppercase">Telemetry Stream (250Hz)</h3>
        {chartData.length > 0 && <span className="flex h-2 w-2 rounded-full bg-electric animate-pulse"></span>}
      </div>
      
      <div className="flex-1 w-full relative">
        {!chartData.length && (
          <div className="absolute inset-0 flex items-center justify-center text-slate-500 font-medium">
            Waiting for stream...
          </div>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="time" hide />
            <YAxis 
              domain={[-15, 15]} 
              tick={{fill: '#475569', fontSize: 10}} 
              axisLine={false} 
              tickLine={false} 
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#f8fafc' }}
              itemStyle={{ fontSize: '12px' }}
              labelStyle={{ display: 'none' }}
              isAnimationActive={false}
            />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} iconType="circle" />
            
            {(Object.keys(CHANNEL_COLORS) as Array<keyof EEGDataPayload>).map((ch) => (
              <Line 
                key={ch}
                type="monotone" 
                dataKey={ch} 
                stroke={CHANNEL_COLORS[ch]} 
                strokeWidth={1.5} 
                dot={false}
                isAnimationActive={false} // Disable animation for real-time performance
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
