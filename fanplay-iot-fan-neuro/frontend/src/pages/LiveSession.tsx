import React, { useEffect, useState } from 'react';
import { AudioPlayer } from '../components/AudioPlayer';
import { BrainMap } from '../components/BrainMap';
import { EEGChart } from '../components/EEGChart';
import { useEEGData } from '../hooks/useEEGData';
import { useWebSocket } from '../hooks/useWebSocket';
import type { Song, EEGDataPayload } from '../types';

type LiveSessionProps = {
  onSessionEnd: () => void;
  selectedSong: Song | null;
  preRecordedData: EEGDataPayload[] | null;
};

export const LiveSession: React.FC<LiveSessionProps> = ({ onSessionEnd, selectedSong, preRecordedData }) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const { currentFrame } = useEEGData(isPlaying, preRecordedData);
  // Assume backend is running on localhost:8000
  const { isConnected, cognitiveState, sendEEGData } = useWebSocket('ws://localhost:8000/ws/neuro-stream');

  useEffect(() => {
    // Pipe data to websocket whenever we have a new frame
    if (currentFrame && isConnected) {
      sendEEGData(currentFrame);
    }
  }, [currentFrame, isConnected, sendEEGData]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Top Banner indicating status */}
      <div className="flex items-center justify-between glass-panel px-6 py-3 border-electric/30">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`}></div>
          <span className="text-sm font-bold text-slate-300">
            {isConnected ? 'EEG Link: Connected' : 'EEG Link: Disconnected'}
          </span>
        </div>
        <button onClick={onSessionEnd} className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
          End Session & View Analytics
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
        {/* Left Column */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="h-48">
            <AudioPlayer 
              isPlaying={isPlaying} 
              onPlayPause={handlePlayPause}
              trackName={selectedSong?.title || 'Neural Synchrony'}
              artistName={selectedSong?.artist || 'Dr. Aris Thorne'}
              streamUrl={selectedSong?.streamUrl}
              artworkUrl={selectedSong?.artworkUrl}
            />
          </div>
          <div className="flex-1">
            <BrainMap currentFrame={currentFrame} />
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Readout Container */}
          <div className="glass-panel p-6 flex items-center justify-between relative overflow-hidden">
            <div>
              <h3 className="text-sm font-semibold text-slate-400 tracking-widest uppercase mb-1">Cognitive Classification</h3>
              <p className="text-xs text-slate-500">Real-time inference from Fast API Backend</p>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="text-xs text-slate-500 uppercase tracking-widest mb-1">Confidence</div>
                <div className="text-xl font-mono font-bold text-slate-300">
                  {cognitiveState ? `${(cognitiveState.confidence * 100).toFixed(1)}%` : '---%'}
                </div>
              </div>
              <div className={`px-6 py-3 rounded-lg border-2 ${
                cognitiveState?.state === 'Active' 
                  ? 'border-electric text-electric glow-active bg-electric/10' 
                  : 'border-slate-700 text-slate-500 bg-slate-800'
              } transition-all duration-300`}>
                <span className="text-2xl font-black uppercase tracking-widest">
                  STATE: {cognitiveState ? cognitiveState.state : 'WAITING'}
                </span>
              </div>
            </div>
          </div>

          {/* Chart Container */}
          <div className="flex-1 min-h-[400px]">
            <EEGChart currentFrame={currentFrame} />
          </div>
        </div>
      </div>
    </div>
  );
};
