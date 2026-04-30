import React, { useState, useEffect } from 'react';
import { Skull, Fingerprint, ShieldAlert, AlertTriangle, Trophy, Loader, ChevronRight, ArrowLeft, RefreshCw } from 'lucide-react';

const API_BASE_URL = 'http://localhost:3001/api/puzzles';

/**
 * Fisher-Yates Shuffle algorithm to ensure suspects and weapons are not
 * displayed in their logical solution order.
 */
const shuffleArray = (array) => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

export default function AIModernPuzzleGame() {
  const [gameState, setGameState] = useState('menu'); // menu, playing, won
  const [puzzle, setPuzzle] = useState(null);
  const [shuffledSuspects, setShuffledSuspects] = useState([]);
  const [shuffledWeapons, setShuffledWeapons] = useState([]);
  const [selections, setSelections] = useState({}); // { SuspectName: WeaponName }
  const [activeSuspect, setActiveSuspect] = useState(null);
  const [loading, setLoading] = useState(false);
  const [validationMsg, setValidationMsg] = useState('');

  const startInvestigation = async (diff) => {
    setLoading(true);
    setValidationMsg('');
    try {
      const response = await fetch(`${API_BASE_URL}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ difficulty: diff }),
      });
      const data = await response.json();
      
      // Shuffle items for the investigation board
      setShuffledSuspects(shuffleArray(data.categories[0].items));
      setShuffledWeapons(shuffleArray(data.categories[1].items));
      
      setPuzzle(data);
      setSelections({});
      setGameState('playing');
    } catch (err) {
      setValidationMsg("Archives inaccessible. Forensic signal jammed.");
    } finally {
      setLoading(false);
    }
  };

  const handleMatch = (weapon) => {
    if (!activeSuspect) return;
    
    // Toggle logic: If clicking the same weapon, un-link it. Otherwise, link/re-link.
    if (selections[activeSuspect] === weapon) {
      const newSelections = { ...selections };
      delete newSelections[activeSuspect];
      setSelections(newSelections);
    } else {
      setSelections(prev => ({ ...prev, [activeSuspect]: weapon }));
    }
    setActiveSuspect(null);
  };

  const submitVerdict = async () => {
    setLoading(true);
    setValidationMsg('');
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
        setValidationMsg(data.message || "The lab report is inconclusive. Re-examine the clues.");
      }
    } catch (err) {
      setValidationMsg("Deduction transmission failed.");
    } finally {
      setLoading(false);
    }
  };

  const resetBoard = () => {
    setSelections({});
    setActiveSuspect(null);
    setValidationMsg('');
  };

  const returnToPrecinct = () => {
    setGameState('menu');
    setPuzzle(null);
    setSelections({});
    setValidationMsg('');
  };

  if (gameState === 'menu') {
    return (
      <div className="min-h-screen bg-[#050505] text-slate-200 flex flex-col items-center justify-center p-6 font-serif">
        <Skull className="text-rose-800 mb-8 animate-pulse" size={80} />
        <h1 className="text-7xl font-black mb-4 italic tracking-tighter text-center uppercase">
          CRIME <span className="text-rose-700">SCENE</span> AI
        </h1>
        <p className="text-zinc-500 uppercase tracking-[0.5em] mb-16 text-xs italic">Official Noir Dossier System</p>
        
        <div className="flex flex-col sm:flex-row gap-6">
          {['easy', 'medium', 'hard'].map(level => (
            <button 
              key={level} 
              onClick={() => startInvestigation(level)}
              className="group relative overflow-hidden px-12 py-5 bg-zinc-900 border border-white/5 hover:border-rose-700 transition-all uppercase font-bold text-sm tracking-widest"
            >
              <div className="relative z-10 group-hover:text-rose-500">{level} Case</div>
              <div className="absolute inset-0 bg-rose-900/10 translate-y-full group-hover:translate-y-0 transition-transform" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (gameState === 'won') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 font-serif">
        <div className="text-center p-16 border border-rose-900/50 bg-zinc-900/20 backdrop-blur-3xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-rose-600 animate-pulse" />
          <Trophy size={80} className="text-rose-600 mx-auto mb-6" />
          <h2 className="text-6xl font-black text-white mb-2 uppercase italic">Case Closed</h2>
          <p className="text-rose-500 font-bold uppercase tracking-widest mb-12 text-sm">The perpetrator has been identified and detained.</p>
          <button onClick={returnToPrecinct} className="px-12 py-4 bg-rose-700 text-white font-bold uppercase tracking-widest hover:bg-rose-600 transition-colors shadow-lg">
            New Investigation
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-slate-300 font-serif selection:bg-rose-900/30">
      <nav className="p-6 border-b border-rose-900/20 bg-black/90 flex justify-between items-center sticky top-0 z-50 backdrop-blur-md">
        <div className="flex items-center gap-6">
          <button 
            onClick={returnToPrecinct}
            className="group flex items-center gap-2 p-2 px-4 bg-zinc-900/50 border border-white/5 rounded hover:border-rose-700 transition-all"
            title="Return to Precinct"
          >
            <ArrowLeft size={18} className="text-zinc-500 group-hover:text-rose-500" />
            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">Back to Precinct</span>
          </button>
          <div className="flex items-center gap-3">
            <Skull className="text-rose-700" size={24} />
            <span className="uppercase font-black tracking-widest text-lg italic text-white">Dossier #{puzzle?.id}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <button 
            onClick={resetBoard}
            className="flex items-center gap-2 text-[10px] uppercase font-black tracking-[0.2em] text-zinc-500 hover:text-white transition-colors"
          >
            <RefreshCw size={14} /> Clear Board
          </button>
          {loading && <Loader className="animate-spin text-rose-600" size={20} />}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-10 grid lg:grid-cols-12 gap-12">
        {/* Left Panel: Evidence */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-zinc-900/40 p-8 border-l-2 border-rose-800">
            <h3 className="text-rose-600 font-black text-[10px] uppercase mb-6 flex items-center gap-2 tracking-[0.3em]">
              <Fingerprint size={16} /> Forensic Data
            </h3>
            <p className="text-zinc-400 italic mb-8 leading-relaxed text-sm antialiased">"{puzzle?.description}"</p>
            <div className="space-y-4 max-h-[45vh] overflow-y-auto pr-3 custom-scrollbar">
              {puzzle?.clues.map((clue, i) => (
                <div key={i} className="flex gap-4 items-start border-b border-white/5 pb-4 last:border-0">
                  <ChevronRight size={14} className="text-rose-900 mt-1 flex-shrink-0" />
                  <p className="text-sm leading-relaxed text-zinc-300">{clue.text}</p>
                </div>
              ))}
            </div>
          </div>

          {validationMsg && (
            <div className="p-5 bg-rose-950/20 border border-rose-800/40 text-rose-500 text-[10px] font-black uppercase flex items-center gap-4 animate-in fade-in slide-in-from-top-2">
              <AlertTriangle size={20} /> {validationMsg}
            </div>
          )}

          <button 
            onClick={submitVerdict}
            disabled={Object.keys(selections).length === 0 || loading}
            className="w-full py-6 bg-rose-800 hover:bg-rose-700 disabled:bg-zinc-900 disabled:text-zinc-700 text-white font-black uppercase tracking-[0.5em] transition-all text-xs shadow-2xl shadow-rose-900/20"
          >
            {loading ? "Verifying..." : "Submit Verdict"}
          </button>
          <div className="flex justify-between items-center px-1">
             <span className="text-[10px] text-zinc-600 uppercase font-bold tracking-widest">Progress</span>
             <span className="text-[10px] text-rose-700 font-black tracking-widest">{Object.keys(selections).length} / {puzzle?.categories[0].items.length} matched</span>
          </div>
        </div>

        {/* Right Panel: Investigation Board */}
        <div className="lg:col-span-8 space-y-8">
          <div className="grid grid-cols-2 gap-12">
            {/* Shuffled Suspects */}
            <div className="space-y-4">
              <h4 className="text-[10px] text-zinc-600 uppercase font-black tracking-[0.4em] mb-10 pl-2 border-l border-zinc-800">The Lineup</h4>
              {shuffledSuspects.map(s => (
                <button
                  key={s}
                  onClick={() => setActiveSuspect(s === activeSuspect ? null : s)}
                  className={`group w-full p-6 text-left transition-all border relative ${
                    activeSuspect === s 
                      ? 'border-rose-600 bg-rose-950/20 ring-1 ring-rose-600 z-10' 
                      : 'border-white/5 bg-zinc-900/30 hover:border-white/20'
                  } ${selections[s] ? 'border-emerald-900/40 bg-emerald-950/5' : ''}`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm uppercase tracking-wide">{s}</span>
                    {selections[s] && <ShieldAlert size={16} className="text-emerald-700" />}
                  </div>
                </button>
              ))}
            </div>

            {/* Shuffled Weapons */}
            <div className="space-y-4">
              <h4 className="text-[10px] text-zinc-600 uppercase font-black tracking-[0.4em] mb-10 pl-2 border-l border-zinc-800">Forensic Evidence</h4>
              {shuffledWeapons.map(w => {
                const matchedSuspect = Object.keys(selections).find(k => selections[k] === w);
                const isSelectedForActive = activeSuspect && selections[activeSuspect] === w;
                
                return (
                  <button
                    key={w}
                    onClick={() => handleMatch(w)}
                    disabled={!activeSuspect && !matchedSuspect}
                    className={`group w-full p-6 text-left border transition-all ${
                      isSelectedForActive 
                        ? 'border-rose-600 bg-rose-950/20' 
                        : matchedSuspect 
                          ? 'border-zinc-800 bg-black/40' 
                          : activeSuspect 
                            ? 'border-white/10 bg-zinc-900/30 hover:border-rose-800' 
                            : 'border-white/5 bg-zinc-900/10 opacity-30 cursor-default'
                    }`}
                  >
                    <span className="font-bold text-sm uppercase block">{w}</span>
                    {matchedSuspect && (
                      <span className="text-[9px] text-rose-800 mt-3 block font-black uppercase tracking-widest italic group-hover:text-rose-600 transition-colors">
                        Linked to: {matchedSuspect}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          
          {!activeSuspect && Object.keys(selections).length === 0 && (
            <div className="text-center p-16 border border-dashed border-white/5 rounded-2xl bg-zinc-950/30">
              <p className="text-zinc-600 text-[10px] uppercase font-black tracking-[0.3em]">Select a suspect to start linking evidence</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
