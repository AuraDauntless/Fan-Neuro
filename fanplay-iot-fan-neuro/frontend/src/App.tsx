import React, { useState } from 'react';
import { Workspace } from './pages/Workspace';
import { LiveSession } from './pages/LiveSession';
import { Analytics } from './pages/Analytics';
import { Activity, LayoutDashboard, Radio, BarChart3, HelpCircle } from 'lucide-react';
import type { Song, EEGDataPayload } from './types';
import logo from './assets/logo.jpg';

type Tab = 'workspace' | 'live' | 'analytics';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('workspace');
  const [showColabModal, setShowColabModal] = useState(false);
  const [songs, setSongs] = useState<Song[]>([]);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [preRecordedData, setPreRecordedData] = useState<EEGDataPayload[] | null>(null);

  React.useEffect(() => {
    // Fetch 5 focus/brainwave tracks from iTunes Search API
    fetch('https://itunes.apple.com/search?term=focus+brainwave&limit=5&media=music&entity=song')
      .then(res => res.json())
      .then(data => {
        if (data.results) {
          const fetchedSongs: Song[] = data.results.map((r: any) => ({
            id: r.trackId.toString(),
            title: r.trackName,
            artist: r.artistName,
            streamUrl: r.previewUrl,
            artworkUrl: r.artworkUrl100
          }));
          setSongs(fetchedSongs);
          if (fetchedSongs.length > 0) {
            setSelectedSong(fetchedSongs[0]); // Select first by default
          }
        }
      })
      .catch(err => console.error('Failed to fetch songs:', err));
  }, []);

  return (
    <div className="h-screen w-full flex flex-col bg-[#0B0F19] text-white font-sans overflow-hidden">
      {/* Top Navigation Bar */}
      <nav className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-20">
        <div className="flex items-center gap-3">
          <img src={logo} alt="FanPlay IOT Logo" className="w-10 h-10 object-contain rounded-lg" />
          <h1 className="text-xl font-black tracking-tight text-white">
            FanPlay <span className="text-electric">Neuro</span>
          </h1>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-slate-800/50 p-1 rounded-xl border border-slate-800">
          <button 
            onClick={() => setActiveTab('workspace')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'workspace' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <LayoutDashboard size={16} />
            <span className="hidden sm:inline">Workspace</span>
          </button>
          <button 
            onClick={() => setActiveTab('live')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'live' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Radio size={16} className={activeTab === 'live' ? 'text-electric animate-pulse' : ''} />
            <span className="hidden sm:inline">Live Session</span>
          </button>
          <button 
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'analytics' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <BarChart3 size={16} />
            <span className="hidden sm:inline">Analytics</span>
          </button>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowColabModal(true)}
            className="text-slate-400 hover:text-electric transition-colors flex items-center gap-2 text-sm font-medium"
          >
            <HelpCircle size={18} />
            <span className="hidden sm:inline">Colab Integration</span>
          </button>
          
          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span className="text-xs font-bold text-emerald-500">Engine Ready</span>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto p-6 relative">
        {/* Background ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] bg-electric/5 rounded-full blur-[120px] pointer-events-none -z-10"></div>
        
        <div className="max-w-7xl mx-auto h-full animate-in fade-in duration-500">
          {activeTab === 'workspace' && (
            <Workspace 
              onLaunch={() => setActiveTab('live')} 
              songs={songs}
              selectedSong={selectedSong}
              onSelectSong={setSelectedSong}
              preRecordedData={preRecordedData}
              onSetPreRecordedData={setPreRecordedData}
            />
          )}
          {activeTab === 'live' && (
            <LiveSession 
              onSessionEnd={() => setActiveTab('analytics')} 
              selectedSong={selectedSong}
              preRecordedData={preRecordedData}
            />
          )}
          {activeTab === 'analytics' && <Analytics />}
        </div>
      </main>

      {/* Colab Instructions Modal */}
      {showColabModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="glass-panel w-full max-w-3xl max-h-[80vh] flex flex-col relative">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-xl font-bold">Colab Model Integration</h2>
              <button onClick={() => setShowColabModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="p-6 overflow-y-auto prose prose-invert prose-yellow max-w-none text-slate-300">
              <h3>To attach your real AI Model:</h3>
              <ol className="space-y-4">
                <li>Train your model on Google Colab and export it as <code>eeg_model.pth</code> or <code>.joblib</code></li>
                <li>Place the model file inside the <code>backend/app/services/</code> directory.</li>
                <li>Add any required ML libraries (e.g., <code>torch</code>, <code>scikit-learn</code>) to <code>backend/requirements.txt</code>.</li>
                <li>Edit <code>backend/app/services/neuro_processor.py</code> to load the model file and replace the dummy logic in <code>process_eeg_frame()</code> with your actual inference code.</li>
                <li>Restart the FastAPI backend server. The Live Session will instantly begin showing your model's real predictions!</li>
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
