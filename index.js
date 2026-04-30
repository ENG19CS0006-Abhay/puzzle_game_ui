import React, { useState, useEffect, useMemo } from 'react';
import { Sun, Moon, RefreshCw, HelpCircle, CheckCircle2, XCircle, Trophy, Lightbulb, ChevronRight, Menu, X } from 'lucide-react';

// --- Logic Engine Utilities ---
const DIFFICULTIES = {
  EASY: { size: 3, label: 'Easy' },
  MEDIUM: { size: 4, label: 'Medium' },
  HARD: { size: 5, label: 'Hard' }
};

const CATEGORIES = [
  { name: 'People', items: ['Alice', 'Bob', 'Charlie', 'Diana', 'Ethan'] },
  { name: 'Colors', items: ['Red', 'Blue', 'Green', 'Yellow', 'Purple'] },
  { name: 'Pets', items: ['Cat', 'Dog', 'Bird', 'Fish', 'Rabbit'] },
  { name: 'Cities', items: ['Tokyo', 'Paris', 'London', 'Berlin', 'Rome'] },
  { name: 'Hobbies', items: ['Chess', 'Music', 'Sports', 'Art', 'Coding'] }
];

const App = () => {
  const [darkMode, setDarkMode] = useState(true);
  const [difficulty, setDifficulty] = useState(DIFFICULTIES.EASY);
  const [gameState, setGameState] = useState('menu'); // menu, playing, won
  const [puzzle, setPuzzle] = useState(null);
  const [grid, setGrid] = useState({}); // Stores cell states: null, 'check', 'cross'
  const [hints, setHints] = useState([]);
  const [showTutorial, setShowTutorial] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Initialize Theme
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Generate a new puzzle
  const generatePuzzle = (diff = difficulty) => {
    const size = diff.size;
    const shuffledCats = [...CATEGORIES].sort(() => 0.5 - Math.random());
    const selectedCats = shuffledCats.slice(0, 3);
    
    // Pick specific items for this game session
    const gameCats = selectedCats.map(cat => ({
      name: cat.name,
      items: [...cat.items].sort(() => 0.5 - Math.random()).slice(0, size)
    }));

    const cat1 = gameCats[0].items;
    const cat2 = [...gameCats[1].items].sort(() => 0.5 - Math.random());
    const cat3 = [...gameCats[2].items].sort(() => 0.5 - Math.random());
    
    const solution = cat1.map((item, idx) => ({
      c1: item,
      c2: cat2[idx],
      c3: cat3[idx]
    }));

    // Generate specific clues based on the randomized solution
    const newHints = [
      `${solution[0].c1} is definitely not associated with the color ${solution[1].c2}.`,
      `${solution[1].c1} is the one who enjoys ${solution[1].c3}.`,
      `The person who likes ${cat2[0]} is not from ${cat3[1] || 'the same group'}.`,
      `${cat1[size-1]} prefers the item associated with ${cat2[size-1]}.`,
      `Either ${solution[0].c1} or ${solution[size-1].c1} is from ${cat3[0]}.`
    ].slice(0, size + 1);

    setPuzzle({
      categories: gameCats,
      solution
    });
    setHints(newHints);
    setGrid({});
    setGameState('playing');
    setErrorMsg('');
  };

  const handleCellClick = (rowItem, colItem) => {
    const key = `${rowItem}-${colItem}`;
    const current = grid[key];
    let next = null;
    if (!current) next = 'cross';
    else if (current === 'cross') next = 'check';
    else next = null;

    setGrid({ ...grid, [key]: next });
  };

  const checkWin = () => {
    const size = difficulty.size;
    let correctMatches = 0;
    
    // We check if the "checks" in the grid match the generated solution for Category 1 vs Category 2
    puzzle.solution.forEach(s => {
      if (grid[`${s.c1}-${s.c2}`] === 'check') {
        correctMatches++;
      }
    });

    if (correctMatches === size) {
      setGameState('won');
    } else {
      setErrorMsg('The logic doesn\'t quite line up yet. Keep investigating!');
      setTimeout(() => setErrorMsg(''), 3000);
    }
  };

  const IconButton = ({ icon: Icon, onClick, label }) => (
    <button 
      onClick={onClick}
      className="p-2 rounded-xl transition-all duration-200 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
      title={label}
    >
      <Icon size={20} />
    </button>
  );

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} font-sans`}>
      {/* Navigation */}
      <nav className="border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex justify-between items-center sticky top-0 bg-inherit/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/20">L</div>
          <span className="font-bold text-xl tracking-tight">LogicAI</span>
        </div>
        <div className="flex items-center gap-2">
          <IconButton icon={HelpCircle} onClick={() => setShowTutorial(true)} label="How to play" />
          <IconButton 
            icon={darkMode ? Sun : Moon} 
            onClick={() => setDarkMode(!darkMode)} 
            label="Toggle Theme" 
          />
          {gameState === 'playing' && (
            <button 
              onClick={() => setGameState('menu')}
              className="ml-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-all shadow-md active:scale-95"
            >
              Quit
            </button>
          )}
        </div>
      </nav>

      <main className="max-w-6xl mx-auto p-6">
        {gameState === 'menu' && (
          <div className="flex flex-col items-center justify-center py-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-5xl md:text-6xl font-extrabold mb-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent text-center px-4">
              Train Your Neural Network
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mb-12 text-lg text-center max-w-lg">
              Challenge your brain with procedurally generated logic grid puzzles. Decipher the clues and solve the mystery.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
              {Object.entries(DIFFICULTIES).map(([key, diff]) => (
                <button
                  key={key}
                  onClick={() => {
                    setDifficulty(diff);
                    generatePuzzle(diff);
                  }}
                  className="group relative p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl hover:border-indigo-500 dark:hover:border-indigo-500 transition-all hover:shadow-2xl hover:shadow-indigo-500/10 overflow-hidden text-left"
                >
                  <div className="mb-4 text-indigo-500 font-bold tracking-widest text-xs uppercase">{diff.label}</div>
                  <div className="text-3xl font-bold mb-2 text-slate-800 dark:text-white">Level {diff.size}x{diff.size}</div>
                  <div className="text-slate-500 text-sm leading-relaxed">Solve cross-references across multiple data points using deductive logic.</div>
                  <div className="mt-6 flex items-center text-indigo-500 font-semibold text-sm group-hover:translate-x-2 transition-transform">
                    Initialize Game <ChevronRight size={18} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {gameState === 'playing' && puzzle && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
            {/* Clues Panel */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm sticky top-24">
                <div className="flex items-center gap-2 mb-6 text-indigo-500">
                  <Lightbulb size={20} className="animate-pulse" />
                  <h2 className="font-bold uppercase tracking-wider text-sm">Decrypted Clues</h2>
                </div>
                <ul className="space-y-4">
                  {hints.map((hint, i) => (
                    <li key={i} className="flex gap-4 text-slate-600 dark:text-slate-300 group cursor-default">
                      <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                        {i + 1}
                      </span>
                      <p className="leading-relaxed text-sm">{hint}</p>
                    </li>
                  ))}
                </ul>
                
                {errorMsg && (
                  <div className="mt-6 p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-medium rounded-xl animate-in shake duration-300">
                    {errorMsg}
                  </div>
                )}

                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                  <button 
                    onClick={checkWin}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition-all transform active:scale-95 shadow-lg shadow-indigo-500/25"
                  >
                    Validate Solution
                  </button>
                  <button 
                    onClick={() => generatePuzzle()}
                    className="w-full mt-3 py-3 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl font-medium flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400 text-sm transition-all"
                  >
                    <RefreshCw size={14} /> Reset Grid
                  </button>
                </div>
              </div>
            </div>

            {/* Game Grid */}
            <div className="lg:col-span-8 overflow-x-auto pb-4">
              <div className="min-w-fit bg-white dark:bg-slate-900 p-10 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm inline-block">
                <table className="border-separate border-spacing-0">
                  <thead>
                    <tr>
                      <th className="w-32"></th>
                      {puzzle.categories[1].items.map((item, idx) => (
                        <th key={idx} className="px-1 py-4">
                          <div className="flex items-end justify-center h-32 pb-4">
                             <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                              {item}
                            </span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {puzzle.categories[0].items.map((rowItem, rIdx) => (
                      <tr key={rIdx}>
                        <td className="p-3 text-right font-bold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider border-r border-slate-100 dark:border-slate-800 pr-6">
                          {rowItem}
                        </td>
                        {puzzle.categories[1].items.map((colItem, cIdx) => {
                          const state = grid[`${rowItem}-${colItem}`];
                          return (
                            <td 
                              key={cIdx}
                              onClick={() => handleCellClick(rowItem, colItem)}
                              className={`
                                w-20 h-20 border border-slate-100 dark:border-slate-800 cursor-pointer transition-all
                                flex items-center justify-center relative group
                                ${state === 'check' ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}
                              `}
                            >
                              {state === 'cross' && <XCircle size={28} className="text-rose-400 animate-in zoom-in-50 duration-200" strokeWidth={1.5} />}
                              {state === 'check' && <CheckCircle2 size={28} className="text-indigo-500 animate-in zoom-in-50 duration-200" strokeWidth={1.5} />}
                              <div className="absolute inset-0 opacity-0 group-hover:opacity-10 bg-indigo-500 pointer-events-none transition-opacity" />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-8 flex items-center justify-between px-2">
                  <div className="text-[10px] text-indigo-500 font-black uppercase tracking-[0.2em]">{puzzle.categories[0].name}</div>
                  <div className="text-[10px] text-indigo-500 font-black uppercase tracking-[0.2em]">{puzzle.categories[1].name}</div>
                </div>
              </div>
              
              <div className="mt-8 flex gap-4 items-center justify-center text-sm text-slate-500">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full border border-slate-300 dark:border-slate-700"></div> Empty</div>
                <div className="flex items-center gap-2"><XCircle size={14} className="text-rose-400" /> False</div>
                <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-indigo-500" /> True</div>
              </div>
            </div>
          </div>
        )}

        {gameState === 'won' && (
          <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6">
            <div className="bg-white dark:bg-slate-900 p-12 rounded-[2.5rem] max-w-md w-full text-center border border-slate-200 dark:border-slate-800 shadow-2xl animate-in zoom-in-95 duration-500">
              <div className="w-24 h-24 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-3xl flex items-center justify-center mx-auto mb-8 text-white shadow-xl rotate-12">
                <Trophy size={48} />
              </div>
              <h2 className="text-4xl font-black mb-3 text-slate-900 dark:text-white">Success!</h2>
              <p className="text-slate-500 dark:text-slate-400 mb-10 leading-relaxed">Logic verified. You have successfully mapped the neural connections for this dataset.</p>
              <button 
                onClick={() => setGameState('menu')}
                className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-lg transition-all transform active:scale-95 shadow-lg shadow-indigo-500/30"
              >
                Accept New Mission
              </button>
            </div>
          </div>
        )}

        {showTutorial && (
          <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-6">
            <div className="bg-white dark:bg-slate-900 p-10 rounded-[2rem] max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl relative animate-in slide-in-from-bottom-8 duration-300">
              <button onClick={() => setShowTutorial(false)} className="absolute top-8 right-8 text-slate-400 hover:text-slate-600 transition-colors">
                <X size={24} />
              </button>
              <h2 className="text-3xl font-black mb-8 text-slate-900 dark:text-white">Operation Guide</h2>
              <div className="space-y-6 text-slate-600 dark:text-slate-400">
                <div className="flex gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 font-bold flex-shrink-0">01</div>
                  <p className="text-sm leading-relaxed">Read the <b>Decrypted Clues</b>. They establish fixed or negative relationships between entities.</p>
                </div>
                <div className="flex gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-rose-600 font-bold flex-shrink-0">02</div>
                  <p className="text-sm leading-relaxed">Single click a cell to mark an <b>X</b>. This means the two items are definitely NOT paired.</p>
                </div>
                <div className="flex gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 font-bold flex-shrink-0">03</div>
                  <p className="text-sm leading-relaxed">Double click (or cycle) to mark a <b>Check</b>. This indicates a confirmed match based on your deductions.</p>
                </div>
              </div>
              <button 
                onClick={() => setShowTutorial(false)}
                className="w-full mt-10 py-4 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-2xl font-bold shadow-xl active:scale-95 transition-transform"
              >
                Acknowledge
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className="mt-20 border-t border-slate-200 dark:border-slate-800 py-12 text-center">
        <p className="text-slate-500 dark:text-slate-600 text-[10px] uppercase tracking-[0.3em] font-bold">Encrypted Connection Established // Logic Engine 4.0</p>
      </footer>
    </div>
  );
};

export default App;
