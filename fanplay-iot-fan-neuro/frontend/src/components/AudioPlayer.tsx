import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, Activity } from 'lucide-react';

type AudioPlayerProps = {
  isPlaying: boolean;
  onPlayPause: () => void;
  trackName: string;
  artistName: string;
  streamUrl?: string;
  artworkUrl?: string;
};

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  isPlaying,
  onPlayPause,
  trackName,
  artistName,
  streamUrl,
  artworkUrl
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentTimeStr, setCurrentTimeStr] = useState('0:00');
  const [durationStr, setDurationStr] = useState('0:30'); // iTunes previews are 30s

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => console.error("Audio play failed:", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, streamUrl]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const duration = audioRef.current.duration || 30;
      setProgress((current / duration) * 100);
      
      const currentMins = Math.floor(current / 60);
      const currentSecs = Math.floor(current % 60);
      setCurrentTimeStr(`${currentMins}:${currentSecs.toString().padStart(2, '0')}`);
    }
  };

  return (
    <div className="glass-panel p-6 flex flex-col justify-between h-full relative overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-electric opacity-5 rounded-full blur-3xl pointer-events-none"></div>
      
      {/* Hidden Audio Element */}
      {streamUrl && (
        <audio 
          ref={audioRef} 
          src={streamUrl} 
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => {
            if (isPlaying) onPlayPause(); // Pause when ended
          }}
          preload="auto"
        />
      )}

      <div className="flex items-start justify-between mb-8 z-10">
        <div className="flex items-center gap-4">
          {artworkUrl && (
            <div className="w-16 h-16 rounded-lg overflow-hidden shadow-lg border border-slate-700/50">
              <img src={artworkUrl} alt="Album Art" className="w-full h-full object-cover" />
            </div>
          )}
          <div>
            <h2 className="text-2xl font-bold text-white mb-1 line-clamp-1">{trackName}</h2>
            <p className="text-slate-400 font-medium line-clamp-1">{artistName}</p>
          </div>
        </div>
        <div className={`p-3 rounded-full shrink-0 ${isPlaying ? 'bg-[#FACC15]/20 text-[#FACC15]' : 'bg-slate-800 text-slate-500'}`}>
          <Activity size={24} className={isPlaying ? 'animate-pulse' : ''} />
        </div>
      </div>

      <div className="space-y-6 z-10">
        {/* Fake waveform visualizer (reactive to play state) */}
        <div className="h-16 flex items-center justify-between gap-1 px-2">
          {Array.from({ length: 40 }).map((_, i) => (
            <div
              key={i}
              className={`w-1 rounded-full ${isPlaying ? 'bg-[#FACC15]' : 'bg-slate-700'}`}
              style={{
                height: isPlaying ? `${Math.max(15, Math.random() * 100)}%` : '15%',
                transition: 'height 0.2s ease',
                opacity: isPlaying ? 0.8 : 0.3
              }}
            ></div>
          ))}
        </div>

        {/* Real Progress bar */}
        <div className="space-y-2">
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-slate-400 rounded-full" style={{ width: `${progress}%`, transition: 'width 0.1s linear' }}></div>
          </div>
          <div className="flex justify-between text-xs text-slate-500 font-medium">
            <span>{currentTimeStr}</span>
            <span>{durationStr}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between pt-2">
          <button className="text-slate-400 hover:text-white transition-colors">
            <Volume2 size={20} />
          </button>
          
          <div className="flex items-center gap-6">
            <button className="text-slate-400 hover:text-white transition-colors">
              <SkipBack size={24} />
            </button>
            <button 
              onClick={onPlayPause}
              className="w-14 h-14 rounded-full bg-white text-slate-900 flex items-center justify-center hover:scale-105 hover:bg-slate-100 transition-all shadow-lg"
            >
              {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
            </button>
            <button className="text-slate-400 hover:text-white transition-colors">
              <SkipForward size={24} />
            </button>
          </div>
          
          <div className="w-5"></div> {/* Spacer for centering */}
        </div>
      </div>
    </div>
  );
};
