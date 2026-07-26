import React, { useState, useRef } from 'react';
import { Download, Brain, Clock, Activity, Upload, BarChart2, Radio } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, Cell, PieChart, Pie } from 'recharts';

export const Analytics: React.FC = () => {
  const [timelineData, setTimelineData] = useState<any[]>([]);
  const [histogramData, setHistogramData] = useState<any[]>([]);
  const [brainwaveData, setBrainwaveData] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processResults = (results: any[]) => {
    // Convert backend results to timeline format
    const newTimeline = results.map((r) => ({
      time: Math.round(r.time_start),
      focusLevel: r.confidence * 100,
      state: r.state,
      dominant_wave: r.dominant_wave,
      snr: r.snr
    }));
    
    setTimelineData(newTimeline);
    
    // Calculate histogram data
    let activeCount = 0;
    let dormantCount = 0;
    
    // Calculate brainwave distribution
    const waveCounts: Record<string, number> = {
      "Delta": 0, "Theta": 0, "Alpha": 0, "Beta": 0, "Gamma": 0
    };
    
    results.forEach(r => {
      if (r.state === 'Active') activeCount++;
      else dormantCount++;
      
      if (r.dominant_wave && waveCounts[r.dominant_wave] !== undefined) {
        waveCounts[r.dominant_wave]++;
      }
    });
    
    setHistogramData([
      { name: 'Active', value: activeCount, color: '#FACC15' }, // Electric Yellow
      { name: 'Dormant', value: dormantCount, color: '#475569' } // Slate
    ]);

    const colors: Record<string, string> = {
      "Delta": "#3b82f6", // Blue
      "Theta": "#8b5cf6", // Purple
      "Alpha": "#10b981", // Emerald
      "Beta": "#f59e0b",  // Amber
      "Gamma": "#ef4444"  // Red
    };

    const newBrainwaveData = Object.entries(waveCounts)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({
        name,
        value,
        color: colors[name] || "#475569"
      }));

    setBrainwaveData(newBrainwaveData);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8000/api/upload-edf', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      if (data.results) {
        processResults(data.results);
      } else {
        alert('Failed to process EDF: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error(error);
      alert('Network error connecting to backend.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const downloadJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(timelineData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "telemetry_log.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };
  
  const avgFocus = timelineData.length > 0 ? Math.round(
    timelineData.reduce((acc, val) => acc + val.focusLevel, 0) / timelineData.length
  ) : 0;
  
  const avgSnr = timelineData.length > 0 ? (
    timelineData.reduce((acc, val) => acc + val.snr, 0) / timelineData.length
  ).toFixed(1) : '--';

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl">
          <p className="text-slate-300 mb-1">{`Time: ${label}s`}</p>
          <p className="text-electric font-bold">{`Focus: ${data.focusLevel.toFixed(1)}%`}</p>
          {data.dominant_wave && <p className="text-emerald-400 mt-1">{`Wave: ${data.dominant_wave}`}</p>}
          {data.snr !== undefined && <p className="text-sky-400 mt-1">{`SNR: ${data.snr} dB`}</p>}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col gap-6 h-full overflow-y-auto pb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">Session Analytics</h2>
        <div className="flex items-center gap-3">
          <input 
            type="file" 
            accept=".edf"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-2 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 px-4 py-2 rounded-lg transition-colors border border-emerald-500/50"
          >
            <Upload size={18} className={isUploading ? 'animate-bounce' : ''} />
            <span className="font-semibold">{isUploading ? 'Processing...' : 'Test EDF File'}</span>
          </button>
          
          <button 
            onClick={downloadJSON}
            disabled={timelineData.length === 0}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors border border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={18} />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-panel p-6 border-t-4 border-t-electric">
          <div className="flex items-center gap-3 text-slate-400 mb-2">
            <Brain size={20} />
            <h3 className="font-semibold uppercase tracking-widest text-xs">Total Focus Time</h3>
          </div>
          <p className="text-4xl font-black">{timelineData.length > 0 ? avgFocus : '--'}<span className="text-xl text-slate-500 font-medium">%</span></p>
          <p className="text-xs text-electric mt-2">Aggregated session average</p>
        </div>
        
        <div className="glass-panel p-6 border-t-4 border-t-sky-400">
          <div className="flex items-center gap-3 text-slate-400 mb-2">
            <Radio size={20} />
            <h3 className="font-semibold uppercase tracking-widest text-xs">Signal Quality</h3>
          </div>
          <p className="text-4xl font-black text-sky-400">{avgSnr}<span className="text-xl text-slate-500 font-medium">dB</span></p>
          <p className="text-xs text-slate-500 mt-2">Average SNR</p>
        </div>

        <div className="glass-panel p-6 border-t-4 border-t-purple-400">
          <div className="flex items-center gap-3 text-slate-400 mb-2">
            <Activity size={20} />
            <h3 className="font-semibold uppercase tracking-widest text-xs">Model Pipeline</h3>
          </div>
          <p className="text-2xl font-black text-purple-400 mt-2">PyTorch EEGNet</p>
          <p className="text-xs text-slate-500 mt-2">PSD Band Extraction</p>
        </div>

        <div className="glass-panel p-6 border-t-4 border-t-emerald-400">
          <div className="flex items-center gap-3 text-slate-400 mb-2">
            <Clock size={20} />
            <h3 className="font-semibold uppercase tracking-widest text-xs">Data Points</h3>
          </div>
          <p className="text-4xl font-black">{timelineData.length}</p>
          <p className="text-xs text-slate-500 mt-2">Total temporal frames</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-[400px]">
        {/* Timeline Chart */}
        <div className="glass-panel p-6 lg:col-span-2 flex flex-col min-h-[300px]">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-6">Cognitive State Timeline</h3>
          <div className="flex-1 w-full flex items-center justify-center">
            {timelineData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorFocus" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FACC15" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#FACC15" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis 
                    dataKey="time" 
                    tick={{fill: '#475569', fontSize: 12}} 
                    axisLine={false} 
                    tickLine={false}
                    tickFormatter={(val) => `${val}s`}
                  />
                  <YAxis 
                    domain={[0, 100]} 
                    tick={{fill: '#475569', fontSize: 12}} 
                    axisLine={false} 
                    tickLine={false} 
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="focusLevel" 
                    stroke="#FACC15" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorFocus)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-slate-500">
                <Activity size={40} className="mx-auto mb-4 opacity-20" />
                <p>Upload an EDF file to visualize timeline data.</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {/* Brainwave Distribution */}
          <div className="glass-panel p-6 flex flex-col flex-1 min-h-[250px]">
            <div className="flex items-center gap-3 text-slate-400 mb-2">
              <Activity size={20} />
              <h3 className="text-sm font-semibold uppercase tracking-widest">Brainwave Bands</h3>
            </div>
            
            <div className="flex-1 w-full flex items-center justify-center">
              {brainwaveData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={brainwaveData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {brainwaveData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#f8fafc' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-slate-500">
                  <Activity size={40} className="mx-auto mb-4 opacity-20" />
                  <p>Upload to see bands.</p>
                </div>
              )}
            </div>
            {/* Legend */}
            {brainwaveData.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center mt-2">
                {brainwaveData.map(b => (
                  <div key={b.name} className="flex items-center gap-1 text-xs">
                    <div className="w-3 h-3 rounded-full" style={{backgroundColor: b.color}}></div>
                    <span className="text-slate-300">{b.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Histogram */}
          <div className="glass-panel p-6 flex flex-col flex-1 min-h-[200px]">
            <div className="flex items-center gap-3 text-slate-400 mb-4">
              <BarChart2 size={20} />
              <h3 className="text-sm font-semibold uppercase tracking-widest">Active vs Dormant</h3>
            </div>
            
            <div className="flex-1 w-full flex items-center justify-center">
              {histogramData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={histogramData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="name" tick={{fill: '#475569'}} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip 
                      cursor={{fill: '#1e293b'}}
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#f8fafc' }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {histogramData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-slate-500">
                  <BarChart2 size={40} className="mx-auto mb-4 opacity-20" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
