import { useState, useEffect, useRef } from 'react';
import type { EEGDataPayload } from '../types';

export function useEEGData(isPlaying: boolean, preRecordedData?: EEGDataPayload[] | null) {
  const [currentFrame, setCurrentFrame] = useState<EEGDataPayload | null>(null);
  const timeRef = useRef(0);
  const frameIndexRef = useRef(0);
  const channels = ['F1', 'F2', 'Fz', 'P1', 'P2', 'Pz', 'O1', 'O2'] as const;

  useEffect(() => {
    let interval: number;

    if (isPlaying) {
      interval = setInterval(() => {
        // If we have uploaded JSON data, play it back frame by frame
        if (preRecordedData && preRecordedData.length > 0) {
          setCurrentFrame(preRecordedData[frameIndexRef.current]);
          
          // Loop back to start if we reach the end of the recording
          frameIndexRef.current = (frameIndexRef.current + 1) % preRecordedData.length;
        } 
        // Otherwise, use the mathematical mock generator (simulator mode)
        else {
          const payload: Partial<EEGDataPayload> = {};
          
          channels.forEach((ch, idx) => {
            const samples = [];
            for (let i = 0; i < 25; i++) {
              const t = timeRef.current + i * 0.004; 
              
              let value = 0;
              if (ch.startsWith('F')) {
                value = Math.sin(t * 2 * Math.PI * 15) * 5 + (Math.random() * 2 - 1); 
              } else if (ch.startsWith('O')) {
                value = Math.sin(t * 2 * Math.PI * 10) * 8 + (Math.random() * 2 - 1); 
              } else {
                value = Math.sin(t * 2 * Math.PI * 12) * 6 + (Math.random() * 2 - 1); 
              }
              
              value += Math.sin(t * 2 * Math.PI * 2 + idx) * 2; 
              
              samples.push(Number(value.toFixed(2)));
            }
            payload[ch as keyof EEGDataPayload] = samples;
          });

          timeRef.current += 0.1;
          setCurrentFrame(payload as EEGDataPayload);
        }
      }, 100);
    } else {
      timeRef.current = 0;
      frameIndexRef.current = 0;
      setCurrentFrame(null);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, preRecordedData]);

  return { currentFrame };
}
