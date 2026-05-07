import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Skull, Fingerprint, ChevronRight, ArrowLeft, Trophy, Loader } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/puzzles';

const DETECTIVE = {
  name: 'Jency Infantcia',
  title: 'Finance Expert Turned Detective',
  bio: "Once a renowned financial analyst, Jency Infantcia left Wall Street to pursue her true passion: solving murder mysteries. Her sharp analytical mind and attention to detail make her the precinct's most brilliant detective.",
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

const speak = (input) => {
  if (!window.speechSynthesis) return;
  const text = typeof input === 'string' ? input : input?.text;
  if (!text) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
};

export default function App() {
  const [gameState, setGameState] = useState('menu');
  const [puzzle, setPuzzle] = useState(null);
  const [shuffledSuspects, setShuffledSuspects] = useState([]);
  const [shuffledWeapons, setShuffledWeapons] = useState([]);
  const [selections, setSelections] = useState({});
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [attempts, setAttempts] = useState(2);
  const [showSolution, setShowSolution] = useState(false);
  const [isFailing, setIsFailing] = useState(false);
  const failAudioRef = useRef(null);
  const winAudioRef = useRef(null);

  const dragSuspectRef = useRef(null);
  const ghostRef = useRef(null);

  // --- Speech Logic ---
  const speakAsync = (text) =>
    new Promise((resolve) => {
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.9;
      u.onend = resolve;
      u.onerror = resolve;
      window.speechSynthesis.speak(u);
    });

  const speakAllClues = async () => {
    if (!window.speechSynthesis || !puzzle?.clues) return;
    window.speechSynthesis.cancel();
    for (const clue of puzzle.clues) await speakAsync(clue.text);
  };

  const speakSolution = async () => {
    if (!window.speechSynthesis || !puzzle?.solution) return;
    const { Suspects, Weapons, Justification } = puzzle.solution;
    window.speechSynthesis.cancel();
    for (const text of [
      `You failed, Jency.`,
      `The killer was ${Suspects.join(', ')}`,
      `The weapon used was ${Weapons.join(', ')}`,
      `Here is why. ${Justification}`,
    ]) await speakAsync(text);
  };

  useEffect(() => {
  if (gameState === 'menu') {
    const greeting = "Hi Jency, Hope you are having a great day!";
    
    // Try to speak the greeting (works better on localhost than HTTPS)
    if (window.speechSynthesis) {
      try {
        const utter = new SpeechSynthesisUtterance(greeting);
        utter.rate = 0.9;
        utter.onerror = () => console.warn('Speech synthesis unavailable');
        window.speechSynthesis.speak(utter);
      } catch (err) {
        console.warn('Speech synthesis error:', err);
      }
    }
  }
}, [gameState]);

  // --- Mobile Drag Fix: Global Listeners ---
  useEffect(() => {
    const handleGlobalTouchMove = (e) => {
      if (!ghostRef.current) return;
      // This is the CRITICAL fix: prevents the "Blank Screen" by stopping 
      // the browser from trying to scroll/refresh while dragging
      if (e.cancelable) e.preventDefault(); 
      
      const t = e.touches[0];
      const g = ghostRef.current;
      g.style.left = `${t.clientX - g._ox}px`;
      g.style.top = `${t.clientY - g._oy}px`;
    };

    const handleGlobalTouchEnd = (e) => {
      if (!ghostRef.current) return;
      
      const t = e.changedTouches[0];
      const weaponName = getWeaponAtPoint(t.clientX, t.clientY);
      
      if (weaponName && dragSuspectRef.current) {
        const suspectName = dragSuspectRef.current.name;

        setSelections(prev => {
          const newSelections = { ...prev };
          
          // Clear existing assignment for this suspect
          delete newSelections[suspectName];

          // Clear any other suspect assigned to this weapon
          Object.keys(newSelections).forEach(key => {
            if (newSelections[key] === weaponName) {
              delete newSelections[key];
            }
          });

          return { ...newSelections, [suspectName]: weaponName };
        });
      }

      ghostRef.current.remove();
      ghostRef.current = null;
      dragSuspectRef.current = null;
    };

    window.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
    window.addEventListener('touchend', handleGlobalTouchEnd);
    
    return () => {
      window.removeEventListener('touchmove', handleGlobalTouchMove);
      window.removeEventListener('touchend', handleGlobalTouchEnd);
    };
  }, []);

  const getWeaponAtPoint = (x, y) => {
    if (ghostRef.current) ghostRef.current.style.display = 'none';
    const el = document.elementFromPoint(x, y);
    if (ghostRef.current) ghostRef.current.style.display = 'block';
    if (!el) return null;
    let node = el;
    while (node && node !== document.body) {
      if (node.dataset?.weapon) return node.dataset.weapon;
      node = node.parentElement;
    }
    return null;
  };

  const onTouchStart = (suspect) => (e) => {
    dragSuspectRef.current = suspect;
    const t = e.touches[0];
    const sourceEl = e.currentTarget;
    const rect = sourceEl.getBoundingClientRect();
    const ghost = sourceEl.cloneNode(true);
    
    Object.assign(ghost.style, {
      position: 'fixed',
      left: `${rect.left}px`,
      top: `${rect.top}px`,
      width: `${rect.width}px`,
      opacity: '0.7',
      pointerEvents: 'none',
      zIndex: '9999',
      margin: '0',
      transition: 'none',
      backgroundColor: '#18181b',
      border: '1px solid #be123c'
    });
    
    ghost._ox = t.clientX - rect.left;
    ghost._oy = t.clientY - rect.top;
    document.body.appendChild(ghost);
    ghostRef.current = ghost;
  };

  // --- Desktop Handlers ---
  const onDragStart = (e, suspect) => {
    e.dataTransfer.setData('suspect', JSON.stringify(suspect));
  };
  const onDrop = (e, weapon) => {
    const suspectData = e.dataTransfer.getData('suspect');
    if (!suspectData) return;
    const suspect = JSON.parse(suspectData);

    setSelections(prev => {
      const newSelections = { ...prev };
      
      // Step 1: Remove this suspect from any other weapon they were assigned to
      delete newSelections[suspect.name];

      // Step 2: Remove any other suspect that was assigned to THIS weapon
      Object.keys(newSelections).forEach(key => {
        if (newSelections[key] === weapon.name) {
          delete newSelections[key];
        }
      });

      // Step 3: Create the new link
      return { ...newSelections, [suspect.name]: weapon.name };
    });
  };
  const allowDrop = (e) => e.preventDefault();

  // --- API / Game Logic ---
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
      const suspects = data.categories.find(c => c.name === 'Suspects')?.items || [];
      const weapons  = data.categories.find(c => c.name === 'Weapons')?.items  || [];
      setPuzzle(data);
      setShuffledSuspects(shuffleArray(suspects));
      setShuffledWeapons(shuffleArray(weapons));
      setSelections({});
      setGameState('playing');
      setAttempts(2);
      setShowSolution(false);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const submitVerdict = async () => {
    if (attempts <= 0) return;
    setLoading(true);
    try {
      const solution = {
        Suspects: Object.keys(selections),
        Weapons: Object.values(selections),
      };
      const res = await fetch(`${API_BASE_URL}/${puzzle.id}/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ solution }),
      });
      const data = await res.json();

      if (data.isCorrect) {
        winAudioRef.current?.play().catch(() => {});
        setGameState('won');
      } else {
        const remaining = attempts - 1;
        setAttempts(remaining);

        if (remaining === 0) {
          setErrorMsg('Case failed. Revealing truth...');
          setShowSolution(true);
          setIsFailing(true);
          failAudioRef.current?.play().catch(() => {});

          // We await the speech so the user can read/hear everything
          // before the UI disappears
          await speakSolution();

          // Optional: Small delay after speaking so it doesn't feel abrupt
          await new Promise(resolve => setTimeout(resolve, 2000));

          // Reset everything and go back to menu
          setIsFailing(false);
          setErrorMsg('');
          setGameState('menu');
          setShowSolution(false);
          setAttempts(2);
          setSelections({});
        } else {
          setErrorMsg(`Wrong. ${remaining} attempt left.`);
        }
      }
    } catch (err) {
      setErrorMsg("Forensic server error.");
    } finally {
      setLoading(false);
    }
  };

  // --- Views ---
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
        <div className="text-center mb-6 p-4 bg-rose-950/30 border border-rose-900/40 rounded">
          <p className="text-rose-400 italic text-sm">Hi Jency, Hope you are having a great day!</p>
        </div>
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
          <button
            onClick={() => setGameState('menu')}
            className="px-12 py-4 bg-rose-800 text-white font-black uppercase tracking-widest hover:bg-rose-700"
          >
            Next Case
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-[#0a0a0c] text-slate-300 font-serif ${isFailing ? 'animate-pulse bg-rose-950/20' : ''}`}>
      <nav className="p-6 border-b border-rose-900/20 bg-black flex justify-between items-center sticky top-0 z-50">
        <button onClick={() => setGameState('menu')} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-rose-500">
          <ArrowLeft size={16} /> Quit
        </button>
        <div className="flex flex-col items-center text-center">
          <span className="uppercase font-black tracking-widest text-white italic text-xs">{puzzle?.title}</span>
          <span className="text-rose-500 text-[9px] italic mt-1">Detective {DETECTIVE.name}</span>
        </div>
        <div className="w-10" />
      </nav>

      <main className="max-w-7xl mx-auto p-6 lg:p-12 grid lg:grid-cols-12 gap-12">
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-zinc-900/40 p-8 border-l-2 border-rose-800">
            <h3 className="text-rose-600 font-black text-[10px] uppercase mb-4 flex items-center gap-3 tracking-[0.4em]">
              <Fingerprint size={20} /> Case Notes
            </h3>
            <button onClick={speakAllClues} className="text-xs text-rose-500 mb-4 block hover:underline">🔊 Read Clues</button>
            <p className="text-zinc-400 italic mb-8 text-sm leading-relaxed">"{puzzle?.description}"</p>
            <div className="space-y-4">
              {puzzle?.clues?.map((clue, i) => (
                <div key={i} className="flex gap-3 border-b border-white/5 pb-4 last:border-0">
                  <ChevronRight size={14} className="text-rose-900 mt-1 flex-shrink-0" />
                  <p onClick={() => speak(clue)} className="text-xs text-zinc-300 cursor-pointer hover:text-rose-400">{clue.text}</p>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={submitVerdict}
            disabled={Object.keys(selections).length === 0 || loading}
            className="w-full py-6 bg-rose-800 hover:bg-rose-700 disabled:bg-zinc-900 text-white font-black uppercase tracking-widest text-[10px]"
          >
            {loading ? 'Processing...' : 'Submit Verdict'}
          </button>

          <audio ref={failAudioRef} src="/fail.mp3" preload="auto" />
          <audio ref={winAudioRef} src="/win.mp3" preload="auto" />

          {showSolution && puzzle && (
            <div className="mt-6 p-6 border border-rose-800 bg-black animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <h3 className="text-rose-500 font-black mb-2 uppercase text-xs tracking-widest">Case Closed</h3>
              <p className="text-sm text-white font-bold">Culprit: {puzzle.solution.Suspects.join(', ')}</p>
              <p className="text-sm text-white font-bold">Weapon: {puzzle.solution.Weapons.join(', ')}</p>
              <p className="text-xs text-zinc-400 mt-4 italic leading-relaxed">{puzzle.solution.Justification}</p>
            </div>
          )}

          {errorMsg && !showSolution && (
            <p className="text-rose-600 text-[10px] uppercase font-black text-center animate-bounce">{errorMsg}</p>
          )}
        </div>

        <div className="lg:col-span-8 grid md:grid-cols-2 gap-12">
          {/* Suspects */}
          <div className="space-y-4">
            <h4 className="text-[10px] text-zinc-600 uppercase font-black tracking-[0.4em] mb-6">The Suspects</h4>
            {shuffledSuspects.map(s => (
              <div
                key={s.name}
                draggable
                onDragStart={(e) => onDragStart(e, s)}
                onTouchStart={onTouchStart(s)}
                className="p-5 border border-white/5 bg-zinc-900/40 cursor-grab active:cursor-grabbing select-none touch-none"
              >
                <p className="font-black text-xs pointer-events-none">{s.name}</p>
                <p className="text-[10px] text-rose-400 pointer-events-none mb-1">{s.alias}</p>
                <p className="text-[10px] text-zinc-400 pointer-events-none line-clamp-2">{s.description}</p>
                <p className="text-[10px] text-rose-600 mt-2 pointer-events-none">Motive: {s.motive}</p>
              </div>
            ))}
          </div>

          {/* Weapons */}
          <div className="space-y-4">
            <h4 className="text-[10px] text-zinc-600 uppercase font-black tracking-[0.4em] mb-6">The Weapons</h4>
            {shuffledWeapons.map(w => {
              const matchedTo = Object.keys(selections).find(k => selections[k] === w.name);
              return (
                <div
                  key={w.name}
                  data-weapon={w.name}
                  onDrop={(e) => onDrop(e, w)}
                  onDragOver={allowDrop}
                  className={`p-5 border transition-all duration-300 ${
                    matchedTo ? 'border-emerald-700/60 bg-emerald-950/20' : 'border-white/10 bg-zinc-900/30'
                  }`}
                >
                  <p className="font-black text-xs pointer-events-none">{w.name}</p>
                  <p className="text-[10px] text-zinc-400 pointer-events-none">{w.description}</p>
                  {matchedTo && (
                    <p className="text-[9px] text-emerald-500 mt-2 font-black uppercase tracking-widest">
                      ✓ Linked to: {matchedTo}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}