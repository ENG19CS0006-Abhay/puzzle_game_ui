import React, { useState, useRef } from 'react';
import { Skull, Fingerprint, ChevronRight, ArrowLeft, Trophy, Loader } from 'lucide-react';

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

  // ── Touch drag state ──────────────────────────────────────────────────────
  const dragSuspectRef = useRef(null);   // the suspect being dragged
  const ghostRef = useRef(null);         // floating clone element
  const weaponRefsMap = useRef({});      // { [weaponName]: domNode }

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
      const suspects = data.categories.find(c => c.name === 'Suspects')?.items || [];
      const weapons  = data.categories.find(c => c.name === 'Weapons')?.items  || [];
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
        failAudioRef.current?.pause();
        failAudioRef.current.currentTime = 0;
        winAudioRef.current?.play().catch(() => {});
        setGameState('won');
      } else {
        const remaining = attempts - 1;
        setAttempts(remaining);
        if (remaining === 0) {
          setErrorMsg('Case failed. Revealing truth...');
          setShowSolution(true);
          setIsFailing(true);
          await speakSolution();
          setIsFailing(false);
          setGameState('menu');
          setShowSolution(false);
          setAttempts(2);
          setSelections({});
        } else {
          setErrorMsg(`Wrong. ${remaining} attempt left.`);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Desktop drag handlers ─────────────────────────────────────────────────
  const onDragStart = (e, suspect) => {
    e.dataTransfer.setData('suspect', JSON.stringify(suspect));
  };

  const onDrop = (e, weapon) => {
    const suspect = JSON.parse(e.dataTransfer.getData('suspect'));
    setSelections(prev => ({ ...prev, [suspect.name]: weapon.name }));
  };

  const allowDrop = (e) => e.preventDefault();

  // ── Mobile touch handlers ─────────────────────────────────────────────────
  const createGhost = (el, x, y) => {
    const rect = el.getBoundingClientRect();
    const ghost = el.cloneNode(true);
    ghost.style.position = 'fixed';
    ghost.style.left = `${rect.left}px`;
    ghost.style.top  = `${rect.top}px`;
    ghost.style.width  = `${rect.width}px`;
    ghost.style.opacity = '0.75';
    ghost.style.pointerEvents = 'none';
    ghost.style.zIndex = '9999';
    ghost.style.transition = 'none';
    ghost.style.margin = '0';
    document.body.appendChild(ghost);
    ghostRef.current = ghost;
    // offset so finger is centred on card
    ghostRef.current._offsetX = x - rect.left;
    ghostRef.current._offsetY = y - rect.top;
  };

  const moveGhost = (x, y) => {
    if (!ghostRef.current) return;
    ghostRef.current.style.left = `${x - ghostRef.current._offsetX}px`;
    ghostRef.current.style.top  = `${y - ghostRef.current._offsetY}px`;
  };

  const removeGhost = () => {
    ghostRef.current?.remove();
    ghostRef.current = null;
  };

  const getWeaponUnderPoint = (x, y) => {
    // Temporarily hide ghost so elementFromPoint works
    if (ghostRef.current) ghostRef.current.style.display = 'none';
    const el = document.elementFromPoint(x, y);
    if (ghostRef.current) ghostRef.current.style.display = '';

    if (!el) return null;
    // Walk up DOM to find a weapon card (data-weapon attribute)
    let node = el;
    while (node && node !== document.body) {
      if (node.dataset?.weapon) return node.dataset.weapon;
      node = node.parentElement;
    }
    return null;
  };

  const onTouchStart = (suspect) => (e) => {
    dragSuspectRef.current = suspect;
    const touch = e.touches[0];
    createGhost(e.currentTarget, touch.clientX, touch.clientY);
  };

  const onTouchMove = (e) => {
    e.preventDefault(); // prevents page scroll while dragging
    const touch = e.touches[0];
    moveGhost(touch.clientX, touch.clientY);
  };

  const onTouchEnd = (e) => {
    const touch = e.changedTouches[0];
    const weaponName = getWeaponUnderPoint(touch.clientX, touch.clientY);
    removeGhost();
    if (weaponName && dragSuspectRef.current) {
      setSelections(prev => ({ ...prev, [dragSuspectRef.current.name]: weaponName }));
    }
    dragSuspectRef.current = null;
  };

  // ─────────────────────────────────────────────────────────────────────────

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
          <p className="text-zinc-400 mb-8 text-xs max-w-md mx-auto">
            The finance expert's keen eye for detail and logical prowess have once again brought a killer to justice.
          </p>
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
    <div className={`min-h-screen bg-[#0a0a0c] text-slate-300 font-serif ${isFailing ? 'fail-animate' : ''}`}>
      <nav className="p-6 border-b border-rose-900/20 bg-black flex justify-between items-center sticky top-0 z-50">
        <button
          onClick={() => setGameState('menu')}
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-rose-500"
        >
          <ArrowLeft size={16} /> Quit
        </button>
        <div className="flex flex-col items-center">
          <span className="uppercase font-black tracking-widest text-white italic text-xs">{puzzle?.title}</span>
          <span className="text-rose-500 text-[9px] italic mt-1">Detective {DETECTIVE.name}</span>
        </div>
        <div className="w-10" />
      </nav>

      <main className="max-w-7xl mx-auto p-6 lg:p-12 grid lg:grid-cols-12 gap-12">
        {/* ── Left panel: clues + submit ── */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-zinc-900/40 p-8 border-l-2 border-rose-800">
            <h3 className="text-rose-600 font-black text-[10px] uppercase mb-4 flex items-center gap-3 tracking-[0.4em]">
              <Fingerprint size={20} /> Detective's Case Notes
            </h3>
            <button onClick={speakAllClues} className="text-xs text-rose-500 mb-4 block">
              🔊 Read Clues
            </button>
            <div className="mb-6 p-3 bg-rose-950/30 border-l border-rose-700">
              <p className="text-rose-400 text-[10px] font-bold uppercase mb-1">Lead Investigator</p>
              <p className="text-rose-300 text-xs italic">{DETECTIVE.name} — {DETECTIVE.title}</p>
            </div>
            <p className="text-zinc-400 italic mb-8 text-sm leading-relaxed">"{puzzle?.description}"</p>
            <div className="space-y-4">
              {puzzle?.clues?.map((clue, i) => (
                <div key={i} className="flex gap-3 border-b border-white/5 pb-4 last:border-0">
                  <ChevronRight size={14} className="text-rose-900 mt-1 flex-shrink-0" />
                  <p
                    onClick={() => speak(clue)}
                    className="text-xs text-zinc-300 cursor-pointer hover:text-rose-400"
                  >
                    {clue.text}
                  </p>
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

          <audio ref={failAudioRef} src="/fail.mp3" preload="auto" />
          <audio ref={winAudioRef} src="/win.mp3" preload="auto" />

          {showSolution && (
            <div className="mt-6 p-6 border border-rose-800 bg-black">
              <h3 className="text-rose-500 font-black mb-2">Case Closed</h3>
              <p className="text-sm text-white">Culprit: {puzzle.solution.Suspects.join(', ')}</p>
              <p className="text-sm text-white">Weapon: {puzzle.solution.Weapons.join(', ')}</p>
              <p className="text-xs text-zinc-400 mt-4 italic">{puzzle.solution.Justification}</p>
            </div>
          )}

          {errorMsg && (
            <p className="text-rose-600 text-[10px] uppercase font-black text-center">{errorMsg}</p>
          )}

          {/* Mobile hint */}
          <p className="text-zinc-600 text-[10px] uppercase tracking-widest text-center lg:hidden">
            Drag a suspect card onto a weapon to link them
          </p>
        </div>

        {/* ── Right panel: suspects + weapons ── */}
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
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                className="p-5 border border-white/5 bg-zinc-900/40 cursor-grab active:cursor-grabbing select-none touch-none"
              >
                <p className="font-black text-xs">{s.name}</p>
                <p className="text-[10px] text-rose-400">{s.alias}</p>
                <p className="text-[10px] text-zinc-400">{s.occupation}</p>
                <p className="text-[10px] italic">{s.description}</p>
                <p className="text-[10px] text-rose-600">Motive: {s.motive}</p>
              </div>
            ))}
          </div>

          {/* Weapons — data-weapon attribute lets touch handler identify drop target */}
          <div className="space-y-4">
            <h4 className="text-[10px] text-zinc-600 uppercase font-black tracking-[0.4em] mb-6">The Weapons</h4>
            {shuffledWeapons.map(w => {
              const matchedTo = Object.keys(selections).find(k => selections[k] === w.name);
              return (
                <div
                  key={w.name}
                  data-weapon={w.name}
                  ref={el => { weaponRefsMap.current[w.name] = el; }}
                  onDrop={(e) => onDrop(e, w)}
                  onDragOver={allowDrop}
                  className={`p-5 border bg-zinc-900/30 transition-colors ${
                    matchedTo
                      ? 'border-emerald-700/60 bg-emerald-950/20'
                      : 'border-white/10'
                  }`}
                >
                  <p className="font-black text-xs pointer-events-none">{w.name}</p>
                  <p className="text-[10px] text-zinc-400 pointer-events-none">{w.description}</p>
                  {matchedTo && (
                    <p className="text-[9px] text-emerald-500 mt-2 pointer-events-none">
                      ✓ Assigned to: {matchedTo}
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