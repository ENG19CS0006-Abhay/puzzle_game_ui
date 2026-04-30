import React, { useState } from 'react';
import { Skull, Fingerprint, ShieldAlert, AlertTriangle, Trophy, Loader, ChevronRight, ArrowLeft, RefreshCw } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/puzzles';

const DETECTIVE = {
  name: 'Jency Infentica',
  title: 'Finance Expert Turned Detective',
  bio: 'Once a renowned financial analyst, Jency Infentica left Wall Street to pursue her true passion: solving murder mysteries. Her sharp analytical mind and attention to detail make her the precinct\'s most brilliant detective.',
};

const shuffleArray = (array) => {
  if (!array || !Array.isArray(array)) return [];
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

export default function App() {
  const [gameState, setGameState] = useState('menu');
  const [puzzle, setPuzzle] = useState(null);
  const [shuffledSuspects, setShuffledSuspects] = useState([]);
  const [shuffledWeapons, setShuffledWeapons] = useState([]);
  const [selections, setSelections] = useState({});
  const [activeSuspect, setActiveSuspect] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 1. IMPROVED DATA PARSER: Forces all items to be strings immediately
  const processItems = (categoryName, categories) => {
    const category = categories.find(c => c.name.toLowerCase().includes(categoryName.toLowerCase()));
    if (!category || !category.items) return [];
    
    return category.items.map(item => {
      if (typeof item === 'string') return item;
      // Handle { name: "...", occupation: "..." } or similar
      return item.name || item.Name || item.title || "Unknown Item";
    });
  };

  const startInvestigation = async (diff) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const response = await fetch(`${API_BASE_URL}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ difficulty: diff }),
      });
      
      if (!response.ok) throw new Error('Could not reach the precinct database.');
      const data = await response.json();
      
      if (!data || !data.categories) throw new Error('Forensic file is unreadable.');

      // 2. STRIP OBJECTS: Convert items to strings before they ever hit the state
      const suspects = processItems('suspect', data.categories);
      const weapons = processItems('weapon', data.categories);

      setPuzzle(data);
      setShuffledSuspects(shuffleArray(suspects));
      setShuffledWeapons(shuffleArray(weapons));
      setSelections({});
      setGameState('playing');
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMatch = (weaponName) => {
    if (!activeSuspect) return;
    if (selections[activeSuspect] === weaponName) {
      const newSelections = { ...selections };
      delete newSelections[activeSuspect];
      setSelections(newSelections);
    } else {
      setSelections(prev => ({ ...prev, [activeSuspect]: weaponName }));
    }
    setActiveSuspect(null);
  };

  const submitVerdict = async () => {
    setLoading(true);
    try {
      const solution = {
        Suspects: Object.keys(selections),
        Weapons: Object.values(selections)
      };
      const response = await fetch(`${API_BASE_URL}/${puzzle.id}/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ solution }),
      });
      const data = await response.json();
      if (data.isCorrect) {
        setGameState('won');
      } else {
        setErrorMsg(data.message || "Your theory doesn't hold water, Detective.");
      }
    } catch (err) {
      setErrorMsg("Verification failed.");
    } finally {
      setLoading(false);
    }
  };

  if (loading && gameState === 'menu') {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-rose-600 font-serif">
        <Loader className="animate-spin mb-6" size={50} />
        <p className="uppercase tracking-[0.5em] text-[10px] font-black">Scanning Crime Scene...</p>
      </div>
    );
  }

  if (gameState === 'menu') {
    return (
      <div className="min-h-screen bg-[#050505] text-slate-200 flex flex-col items-center justify-center p-6 font-serif">
        <Skull className="text-rose-800 mb-8 animate-pulse" size={80} />
        <h1 className="text-6xl md:text-8xl font-black mb-4 italic tracking-tighter text-center uppercase">
          CRIME <span className="text-rose-700">SCENE</span> AI
        </h1>
        <p className="text-zinc-500 uppercase tracking-[0.6em] mb-2 text-[10px] font-bold">Noir Logical Deduction</p>
        
        <div className="mb-12 text-center">
          <p className="text-rose-500 font-black text-sm uppercase tracking-widest mb-1">{DETECTIVE.name}</p>
          <p className="text-zinc-400 text-[11px] italic">{DETECTIVE.title}</p>
        </div>
        
        {errorMsg && (
          <div className="mb-8 p-4 bg-rose-950/20 border border-rose-900/40 text-rose-500 text-[10px] uppercase font-bold text-center">
            {errorMsg}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-6">
          {['easy', 'medium', 'hard'].map(level => (
            <button 
              key={level} 
              onClick={() => startInvestigation(level)}
              className="px-10 py-5 bg-zinc-900 border border-white/5 hover:border-rose-700 transition-all uppercase font-black text-xs tracking-widest"
            >
              {level}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (gameState === 'won') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 font-serif text-center">
        <div>
          <Trophy size={100} className="text-rose-600 mx-auto mb-8" />
          <h2 className="text-6xl font-black text-white mb-4 uppercase italic">Case Solved</h2>
          <p className="text-rose-400 mb-6 text-sm italic">Another brilliant deduction by {DETECTIVE.name}</p>
          <p className="text-zinc-400 mb-8 text-xs max-w-md mx-auto">The finance expert's keen eye for detail and logical prowess have once again brought a killer to justice.</p>
          <button onClick={() => setGameState('menu')} className="px-12 py-4 bg-rose-800 text-white font-black uppercase tracking-widest hover:bg-rose-700">
            Next Case
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-slate-300 font-serif">
      <nav className="p-6 border-b border-rose-900/20 bg-black flex justify-between items-center sticky top-0 z-50">
        <button onClick={() => setGameState('menu')} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-rose-500">
          <ArrowLeft size={16} /> Quit
        </button>
        <div className="flex flex-col items-center">
          <span className="uppercase font-black tracking-widest text-white italic text-xs">
            {puzzle?.title}
          </span>
          <span className="text-rose-500 text-[9px] italic mt-1">Detective {DETECTIVE.name}</span>
        </div>
        <div className="w-10" />
      </nav>

      <main className="max-w-7xl mx-auto p-6 lg:p-12 grid lg:grid-cols-12 gap-12">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-zinc-900/40 p-8 border-l-2 border-rose-800">
            <h3 className="text-rose-600 font-black text-[10px] uppercase mb-4 flex items-center gap-3 tracking-[0.4em]">
              <Fingerprint size={20} /> Detective's Case Notes
            </h3>
            <div className="mb-6 p-3 bg-rose-950/30 border-l border-rose-700">
              <p className="text-rose-400 text-[10px] font-bold uppercase mb-1">Lead Investigator</p>
              <p className="text-rose-300 text-xs italic">{DETECTIVE.name} - {DETECTIVE.title}</p>
            </div>
            <p className="text-zinc-400 italic mb-8 text-sm leading-relaxed">"{puzzle?.description}"</p>
            <div className="space-y-4">
              {puzzle?.clues?.map((clue, i) => (
                <div key={i} className="flex gap-3 border-b border-white/5 pb-4 last:border-0">
                  <ChevronRight size={14} className="text-rose-900 mt-1 flex-shrink-0" />
                  <p className="text-xs text-zinc-300">{clue.text}</p>
                </div>
              ))}
            </div>
          </div>
          
          <button 
            onClick={submitVerdict}
            disabled={Object.keys(selections).length === 0}
            className="w-full py-6 bg-rose-800 hover:bg-rose-700 disabled:bg-zinc-900 text-white font-black uppercase tracking-widest text-[10px]"
          >
            Submit Verdict
          </button>
          
          {errorMsg && <p className="text-rose-600 text-[10px] uppercase font-black text-center">{errorMsg}</p>}
        </div>

        <div className="lg:col-span-8 grid md:grid-cols-2 gap-12">
          {/* Suspects List */}
          <div className="space-y-4">
            <h4 className="text-[10px] text-zinc-600 uppercase font-black tracking-[0.4em] mb-6">The Suspects</h4>
            {shuffledSuspects.map(name => (
              <button
                key={name}
                onClick={() => setActiveSuspect(name === activeSuspect ? null : name)}
                className={`w-full p-6 text-left border transition-all ${
                  activeSuspect === name ? 'border-rose-600 bg-rose-950/20' : 'border-white/5 bg-zinc-900/30'
                } ${selections[name] ? 'border-emerald-900/40' : ''}`}
              >
                <span className="font-black text-xs uppercase tracking-widest">{name}</span>
              </button>
            ))}
          </div>

          {/* Weapons List */}
          <div className="space-y-4">
            <h4 className="text-[10px] text-zinc-600 uppercase font-black tracking-[0.4em] mb-6">The Weapons</h4>
            {shuffledWeapons.map(name => {
              const matchedTo = Object.keys(selections).find(k => selections[k] === name);
              return (
                <button
                  key={name}
                  onClick={() => handleMatch(name)}
                  disabled={!activeSuspect && !matchedTo}
                  className={`w-full p-6 text-left border transition-all ${
                    activeSuspect && selections[activeSuspect] === name 
                      ? 'border-rose-600 bg-rose-950/20' 
                      : matchedTo ? 'border-zinc-800 bg-black' : activeSuspect ? 'border-white/10' : 'opacity-20'
                  }`}
                >
                  <span className="font-black text-xs uppercase tracking-widest">{name}</span>
                  {matchedTo && (
                    <span className="block text-[8px] text-rose-800 mt-2 font-black uppercase">
                      Linked: {matchedTo}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
