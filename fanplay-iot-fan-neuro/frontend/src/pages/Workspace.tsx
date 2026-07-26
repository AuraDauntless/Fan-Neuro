import React, { useRef } from 'react';
import { Play, Settings, Database, Headphones, Music2, Upload, FileJson, Activity } from 'lucide-react';
import type { Song, EEGDataPayload } from '../types';

type WorkspaceProps = {
  onLaunch: () => void;
  songs: Song[];
  selectedSong: Song | null;
  onSelectSong: (song: Song) => void;
  preRecordedData: EEGDataPayload[] | null;
  onSetPreRecordedData: (data: EEGDataPayload[] | null) => void;
};

export const Workspace: React.FC<WorkspaceProps> = ({ 
  onLaunch, 
  songs, 
  selectedSong, 
  onSelectSong,
  preRecordedData,
  onSetPreRecordedData
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (Array.isArray(json) && json.length > 0 && 'F1' in json[0]) {
          onSetPreRecordedData(json);
        } else {
          alert('Invalid JSON format. Expected an array of EEG frames.');
        }
      } catch (error) {
        alert('Failed to parse JSON file.');
        console.error(error);
      }
    };
    reader.readAsText(file);
    
    // Reset input so the same file can be uploaded again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      {/* Left Column: Music Library */}
      <div className="lg:col-span-2 glass-panel p-6 overflow-y-auto">
        <div className="flex items-center gap-3 mb-6 sticky top-0 bg-[#0B0F19]/80 backdrop-blur-sm py-2 z-10">
          <Headphones className="text-electric" />
          <h2 className="text-xl font-bold">Audio Library</h2>
        </div>
        
        <div className="space-y-4">
          {songs.length === 0 ? (
            <div className="text-center text-slate-500 py-10 flex flex-col items-center">
              <Music2 size={40} className="mb-4 opacity-30" />
              <p>Fetching tracks from iTunes...</p>
            </div>
          ) : (
            songs.map(song => {
              const isActive = selectedSong?.id === song.id;
              
              return (
                <div 
                  key={song.id}
                  onClick={() => onSelectSong(song)}
                  className={`rounded-xl p-4 flex items-center justify-between transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-slate-800/50 border-2 border-electric/50 shadow-[0_0_15px_rgba(250,204,21,0.1)]' 
                      : 'bg-slate-800/20 border-2 border-transparent hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center relative overflow-hidden shrink-0">
                      {song.artworkUrl ? (
                        <img src={song.artworkUrl} alt={song.title} className="absolute inset-0 w-full h-full object-cover" />
                      ) : null}
                      <Play size={20} className={isActive ? 'text-electric drop-shadow-md z-10' : 'text-white drop-shadow-md z-10'} />
                      <div className="absolute inset-0 bg-slate-900/40 z-0"></div>
                    </div>
                    <div>
                      <h3 className={`font-bold line-clamp-1 ${isActive ? 'text-electric' : 'text-slate-200'}`}>
                        {song.title}
                      </h3>
                      <p className="text-sm text-slate-400 line-clamp-1">{song.artist}</p>
                    </div>
                  </div>
                  
                  {/* Visualizer stub for active item */}
                  {isActive && (
                    <div className="hidden md:flex items-center gap-0.5 h-6 opacity-60">
                      {Array.from({ length: 20 }).map((_, i) => (
                        <div key={i} className="w-1 bg-electric rounded-full" style={{ height: `${Math.random() * 100}%` }}></div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Column: Configuration & Launch */}
      <div className="glass-panel p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-6">
          <Settings className="text-slate-400" />
          <h2 className="text-xl font-bold">Telemetry Config</h2>
        </div>

        <div className="flex-1 space-y-6">
          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Device Profile</label>
            <div className="bg-slate-800 rounded-lg p-3 border border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database size={16} className="text-slate-400" />
                <span className="text-sm font-medium text-slate-200">8-Channel BCI Simulator</span>
              </div>
              <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-md font-bold">Ready</span>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Data Source</span>
            </label>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => onSetPreRecordedData(null)}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                  !preRecordedData 
                    ? 'bg-electric/10 border-electric text-electric' 
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Activity size={18} />
                  <span className="font-semibold text-sm">Live Simulator</span>
                </div>
                {!preRecordedData && <div className="w-2 h-2 rounded-full bg-electric animate-pulse"></div>}
              </button>

              <button 
                onClick={() => fileInputRef.current?.click()}
                className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                  preRecordedData 
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' 
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileJson size={18} />
                  <span className="font-semibold text-sm">
                    {preRecordedData ? `JSON Loaded (${preRecordedData.length} frames)` : 'Upload Pre-recorded JSON'}
                  </span>
                </div>
                <Upload size={16} className="opacity-50" />
              </button>
              
              <input 
                type="file" 
                accept=".json"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden" 
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Stream Rate</label>
            <div className="flex gap-2">
              <button className="flex-1 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm font-medium text-slate-400 hover:text-white transition-colors">50 Hz</button>
              <button className="flex-1 py-2 rounded-lg bg-electric/10 border border-electric/50 text-sm font-bold text-electric">250 Hz</button>
              <button className="flex-1 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm font-medium text-slate-400 hover:text-white transition-colors">500 Hz</button>
            </div>
          </div>
        </div>

        <button 
          onClick={onLaunch}
          className="primary-button w-full mt-8 py-4 text-lg"
        >
          Launch Live Session
        </button>
      </div>
    </div>
  );
};
