import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Brain, 
  Settings2, 
  Type, 
  Eye, 
  Clock, 
  Send, 
  RefreshCw, 
  AlertCircle,
  Layout,
  Maximize2,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { localSimplify } from './services/localSimplifier';
import { simplifyText } from './services/geminiService';
import { ProfileMode, SimplifiedContent } from './types';
import { useFocusTimer } from './hooks/useFocusTimer';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [mode, setMode] = useState<ProfileMode>('normal');
  const [inputText, setInputText] = useState('');
  const [content, setContent] = useState<SimplifiedContent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mouseY, setMouseY] = useState(0);
  const [useAI, setUseAI] = useState(false);
  const [adhdChunkIndex, setAdhdChunkIndex] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    fontSize: 18,
    lineHeight: 1.6,
    bgColor: '#ffffff'
  });

  const { showNudge, resetTimer } = useFocusTimer(mode === 'adhd' && !!content);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => setMouseY(e.clientY);
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleSimplify = async () => {
    if (!inputText || inputText.length < 50) {
      alert("Please enter some text to simplify.");
      return;
    }

    if (!useAI) {
      // Instant local processing (~10ms)
      const start = performance.now();
      const result = localSimplify(inputText);
      const end = performance.now();
      console.log(`Local simplification took ${end - start}ms`);
      setContent(result);
      setAdhdChunkIndex(0);
      return;
    }

    // AI processing (slower but deeper)
    setIsLoading(true);
    try {
      const result = await simplifyText(inputText);
      setContent(result);
      setAdhdChunkIndex(0);
    } catch (error) {
      console.error(error);
      alert("Failed to simplify text. Falling back to local mode.");
      setContent(localSimplify(inputText));
      setAdhdChunkIndex(0);
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = () => {
    if (!content) return null;

    if (mode === 'dyslexia') {
      return (
        <div 
          className="space-y-8 dyslexia-mode p-8 rounded-2xl shadow-sm border border-neutral-200 transition-colors"
          style={{ 
            backgroundColor: settings.bgColor,
            fontSize: `${settings.fontSize}px`,
            lineHeight: settings.lineHeight
          }}
        >
          <div className="flex justify-start mb-4">
            <button onClick={() => setContent(null)} className="flex items-center gap-2 text-blue-600 font-bold hover:underline">
              <ChevronRight className="w-4 h-4 rotate-180" />
              Back
            </button>
          </div>
          <section>
            <h2 className="text-2xl font-bold mb-4 text-blue-800">Summary</h2>
            <p className="text-xl">{content.summary}</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold mb-4 text-blue-800">Key Points</h2>
            <ul className="list-disc pl-8 space-y-4">
              {content.bulletPoints.map((point, i) => (
                <li key={i} className="text-xl">
                  {point.split(' ').map((word, j) => {
                    const isKeyword = content.keywords.some(k => word.toLowerCase().includes(k.toLowerCase()));
                    return (
                      <span key={j} className={cn(isKeyword && "bg-yellow-200 font-bold px-1 rounded")}>
                        {word}{' '}
                      </span>
                    );
                  })}
                </li>
              ))}
            </ul>
          </section>
        </div>
      );
    }

    if (mode === 'adhd') {
      const currentChunk = content.chunks[adhdChunkIndex];
      const progress = ((adhdChunkIndex + 1) / content.chunks.length) * 100;

      return (
        <div className="space-y-12 adhd-mode max-w-2xl mx-auto py-12 min-h-[70vh] flex flex-col justify-center">
          {mode === 'adhd' && (
            <div 
              className="focus-ruler" 
              style={{ top: `${mouseY - 20}px` }}
            />
          )}
          
          <div className="flex justify-between items-center mb-4">
            <button onClick={() => setContent(null)} className="flex items-center gap-2 text-neutral-500 font-bold hover:text-neutral-900 transition-colors group">
              <div className="p-2 rounded-full bg-neutral-100 group-hover:bg-neutral-200">
                <ChevronRight className="w-4 h-4 rotate-180" />
              </div>
              Back
            </button>
            <div className="flex flex-col items-end">
              <span className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-1">Focus Mode</span>
              <span className="text-sm font-mono text-neutral-400">
                {adhdChunkIndex + 1} / {content.chunks.length}
              </span>
            </div>
          </div>

          <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden mb-8">
            <motion.div 
              className="h-full bg-blue-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          <AnimatePresence mode="wait">
            <motion.div 
              key={adhdChunkIndex}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="p-12 rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-neutral-100 relative overflow-hidden group min-h-[400px] flex flex-col justify-center text-center transition-colors"
              style={{ 
                backgroundColor: settings.bgColor,
                fontSize: `${settings.fontSize}px`,
                lineHeight: settings.lineHeight
              }}
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 to-blue-600" />
              
              <div className="mb-8 opacity-20">
                <Brain className="w-12 h-12 mx-auto text-blue-600" />
              </div>

              <p className="text-3xl md:text-4xl leading-relaxed text-neutral-800 font-lexend font-medium" style={{ fontSize: 'inherit', lineHeight: 'inherit' }}>
                {currentChunk}
              </p>
              
              <div className="mt-12 flex justify-center gap-1">
                {content.chunks.map((_, i) => (
                  <div 
                    key={i} 
                    className={cn(
                      "w-2 h-2 rounded-full transition-all duration-300",
                      i === adhdChunkIndex ? "w-6 bg-blue-500" : "bg-neutral-200"
                    )}
                  />
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-between gap-6 mt-12">
            <button 
              disabled={adhdChunkIndex === 0}
              onClick={() => setAdhdChunkIndex(prev => prev - 1)}
              className="flex-1 py-5 bg-neutral-100 hover:bg-neutral-200 disabled:opacity-30 rounded-3xl font-bold flex items-center justify-center gap-3 transition-all active:scale-95"
            >
              <ChevronRight className="w-6 h-6 rotate-180" />
              Previous
            </button>
            <button 
              disabled={adhdChunkIndex === content.chunks.length - 1}
              onClick={() => setAdhdChunkIndex(prev => prev + 1)}
              className="flex-1 py-5 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-30 rounded-3xl font-bold flex items-center justify-center gap-3 shadow-lg shadow-blue-200 transition-all active:scale-95"
            >
              Next
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
          
          <div className="flex justify-center mt-8">
            <button onClick={() => setContent(null)} className="px-8 py-2 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-full text-sm font-bold transition-all">
              Exit
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        <div className="flex justify-start">
          <button onClick={() => setContent(null)} className="flex items-center gap-2 text-neutral-500 font-bold hover:text-neutral-900">
            <ChevronRight className="w-4 h-4 rotate-180" />
            Back
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <div 
              className="p-8 rounded-2xl shadow-sm border border-neutral-200 transition-colors"
              style={{ 
                backgroundColor: settings.bgColor,
                fontSize: `${settings.fontSize}px`,
                lineHeight: settings.lineHeight
              }}
            >
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2" style={{ fontSize: '1.25rem' }}>
                <BookOpen className="w-5 h-5 text-blue-600" />
                Simplified Text
              </h2>
              <div className="space-y-4 text-neutral-700 leading-relaxed" style={{ fontSize: 'inherit', lineHeight: 'inherit' }}>
                {content.chunks.map((chunk, i) => <p key={i}>{chunk}</p>)}
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
              <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Summary
              </h3>
              <p className="text-sm text-blue-800 leading-relaxed">{content.summary}</p>
            </div>
            
            <div className="bg-white p-6 rounded-2xl border border-neutral-200">
              <h3 className="font-bold text-neutral-900 mb-3">Keywords</h3>
              <div className="flex flex-wrap gap-2">
                {content.keywords.map((k, i) => (
                  <span key={i} className="px-3 py-1 bg-neutral-100 text-neutral-600 rounded-full text-sm">
                    {k}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={cn(
      "min-h-screen transition-colors duration-300",
      mode === 'dyslexia' ? "bg-neutral-100" : "bg-neutral-50",
      mode === 'adhd' && "overflow-x-hidden"
    )}>
      {/* Header */}
      <header className={cn(
        "sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-neutral-200 px-6 py-4 transition-all",
        mode === 'adhd' && "opacity-20 hover:opacity-100"
      )}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
              <Brain className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight hidden sm:block">
              Adaptive<span className="text-blue-600">Learn</span>
            </h1>
          </div>

          <div className="flex items-center gap-2 bg-neutral-100 p-1 rounded-xl">
            <button 
              onClick={() => setMode('normal')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                mode === 'normal' ? "bg-white shadow-sm text-blue-600" : "text-neutral-500 hover:text-neutral-700"
              )}
            >
              <Layout className="w-4 h-4" />
              Normal
            </button>
            <button 
              onClick={() => setMode('dyslexia')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                mode === 'dyslexia' ? "bg-white shadow-sm text-blue-600" : "text-neutral-500 hover:text-neutral-700"
              )}
            >
              <Type className="w-4 h-4" />
              Dyslexia
            </button>
            <button 
              onClick={() => setMode('adhd')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                mode === 'adhd' ? "bg-white shadow-sm text-blue-600" : "text-neutral-500 hover:text-neutral-700"
              )}
            >
              <Maximize2 className="w-4 h-4" />
              ADHD
            </button>
            <div className="w-px h-4 bg-neutral-300 mx-1" />
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                showSettings ? "bg-blue-600 text-white shadow-sm" : "text-neutral-500 hover:text-neutral-700"
              )}
            >
              <Settings2 className="w-4 h-4" />
              Settings
            </button>
          </div>
        </div>
      </header>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-6 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-neutral-200 p-6 space-y-6"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-neutral-900 flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-blue-600" />
                Visual Settings
              </h3>
              <button onClick={() => setShowSettings(false)} className="text-neutral-400 hover:text-neutral-600">
                <Maximize2 className="w-4 h-4 rotate-45" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">Font Size ({settings.fontSize}px)</label>
                <input 
                  type="range" 
                  min="14" 
                  max="32" 
                  value={settings.fontSize} 
                  onChange={(e) => setSettings(s => ({ ...s, fontSize: parseInt(e.target.value) }))}
                  className="w-full h-1.5 bg-neutral-100 rounded-full appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">Line Height ({settings.lineHeight})</label>
                <input 
                  type="range" 
                  min="1" 
                  max="2.5" 
                  step="0.1"
                  value={settings.lineHeight} 
                  onChange={(e) => setSettings(s => ({ ...s, lineHeight: parseFloat(e.target.value) }))}
                  className="w-full h-1.5 bg-neutral-100 rounded-full appearance-none cursor-pointer accent-blue-600"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">Background Color</label>
                <div className="flex gap-2">
                  {[
                    { name: 'White', color: '#ffffff' },
                    { name: 'Cream', color: '#fdf6e3' },
                    { name: 'Paper', color: '#f5f5f4' },
                    { name: 'Blue', color: '#f0f9ff' },
                    { name: 'Green', color: '#f0fdf4' }
                  ].map((c) => (
                    <button
                      key={c.color}
                      onClick={() => setSettings(s => ({ ...s, bgColor: c.color }))}
                      className={cn(
                        "w-8 h-8 rounded-full border-2 transition-all",
                        settings.bgColor === c.color ? "border-blue-600 scale-110 shadow-sm" : "border-transparent"
                      )}
                      style={{ backgroundColor: c.color }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>
            </div>

            <button 
              onClick={() => setSettings({ fontSize: 18, lineHeight: 1.6, bgColor: '#ffffff' })}
              className="w-full py-2 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              Reset to Default
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          {!content ? (
            <motion.div 
              key="input"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-3xl mx-auto space-y-8"
            >
              <div className="text-center space-y-4">
                <h2 className="text-4xl font-bold text-neutral-900">Transform your learning.</h2>
                <p className="text-neutral-500 text-lg">Paste a complex academic text below to simplify it for your needs.</p>
              </div>

              <div className="bg-white p-8 rounded-3xl shadow-xl border border-neutral-200 space-y-6">
                <div className="flex items-center justify-between px-2">
                  <label className="text-sm font-semibold text-neutral-600 flex items-center gap-2">
                    <Settings2 className="w-4 h-4" />
                    Processing Mode
                  </label>
                  <div className="flex bg-neutral-100 p-1 rounded-lg">
                    <button 
                      onClick={() => setUseAI(false)}
                      className={cn(
                        "px-3 py-1 text-xs font-bold rounded-md transition-all",
                        !useAI ? "bg-white shadow-sm text-blue-600" : "text-neutral-400"
                      )}
                    >
                      Instant (10ms)
                    </button>
                    <button 
                      onClick={() => setUseAI(true)}
                      className={cn(
                        "px-3 py-1 text-xs font-bold rounded-md transition-all",
                        useAI ? "bg-white shadow-sm text-blue-600" : "text-neutral-400"
                      )}
                    >
                      AI Deep
                    </button>
                  </div>
                </div>

                <textarea 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Paste your academic text here..."
                  className="w-full h-64 p-6 rounded-2xl bg-neutral-50 border-none focus:ring-2 focus:ring-blue-500 resize-none text-lg"
                />
                
                <button 
                  onClick={handleSimplify}
                  disabled={isLoading || !inputText}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-300 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-200"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Simplifying with AI...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Process Text
                    </>
                  )}
                </button>
              </div>

            </motion.div>
          ) : (
            <motion.div 
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              {renderContent()}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ADHD Nudge Modal */}
      <AnimatePresence>
        {showNudge && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 right-8 z-50"
          >
            <div className="bg-white p-6 rounded-3xl shadow-2xl border-2 border-blue-500 max-w-sm space-y-4">
              <div className="flex items-center gap-3 text-blue-600">
                <AlertCircle className="w-6 h-6" />
                <h4 className="font-bold text-lg">Time for a break?</h4>
              </div>
              <p className="text-neutral-600">You've been on this section for a while. Would you like to:</p>
              <div className="grid grid-cols-1 gap-2">
                <button onClick={resetTimer} className="w-full py-2 bg-blue-50 text-blue-600 rounded-xl font-bold hover:bg-blue-100 transition-colors">
                  Take a short break
                </button>
                <button onClick={() => { setMode('dyslexia'); resetTimer(); }} className="w-full py-2 bg-neutral-50 text-neutral-600 rounded-xl font-bold hover:bg-neutral-100 transition-colors">
                  Switch focus mode
                </button>
                <button onClick={resetTimer} className="w-full py-2 text-neutral-400 text-sm hover:underline">
                  Dismiss
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className={cn(
        "mt-24 border-t border-neutral-200 py-12 px-6 transition-opacity",
        mode === 'adhd' && "opacity-0"
      )}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2 text-neutral-400">
            <Brain className="w-5 h-5" />
            <span className="font-medium">AdaptiveLearn Prototype</span>
          </div>
          <div className="flex gap-8 text-neutral-400 text-sm">
          </div>
        </div>
      </footer>
    </div>
  );
}
