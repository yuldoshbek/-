import React, { useState } from 'react';
import { Mail, Sparkles, Send, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function Letters() {
  const [instruction, setInstruction] = useState('');
  const [style, setStyle] = useState('official');
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [result, setResult] = useState<{
    subject?: string;
    bodyUzbek?: string;
    toneAnalysis?: string;
    warnings?: string;
  } | null>(null);

  const handleGenerate = async () => {
    if (!instruction.trim()) return;
    setGenerating(true);
    setResult(null);
    try {
      const res = await fetch('/api/translate-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instruction, style })
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
      } else {
        alert(data.error || 'Failed to generate');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (result?.bodyUzbek) {
      navigator.clipboard.writeText(result.bodyUzbek);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-8">
      <div className="flex items-center gap-3 mb-8">
        <Mail className="text-blue-600" size={28} />
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Письма (Xatlar)</h1>
          <p className="text-slate-500 mt-1">Smart translation to official Uzbek Latin</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Region */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
          <label className="block text-sm font-semibold text-slate-700 mb-2">Инструкция (на русском)</label>
          <textarea 
            value={instruction}
            onChange={e => setInstruction(e.target.value)}
            placeholder="Например: 'Подготовь письмо в Министерство, что нам нужно согласовать отчет по геологии к 25 мая. Попроси их ускорить процесс.'"
            className="w-full flex-1 min-h-[200px] p-4 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-slate-700"
          />
          
          <div className="mt-4 flex items-center justify-between">
            <select 
              value={style}
              onChange={e => setStyle(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 px-3 py-2 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="official">Strictly Official</option>
              <option value="polite">Polite & Warm</option>
              <option value="demanding">Firm / Urgent</option>
            </select>

            <button 
              onClick={handleGenerate}
              disabled={generating || !instruction.trim()}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2 rounded-lg font-medium transition-colors"
            >
              <Sparkles size={18} className={generating ? 'animate-pulse' : ''} />
              {generating ? 'Генерация...' : 'Сгенерировать письмо'}
            </button>
          </div>
        </div>

        {/* Output Region */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Draft Output</h2>
            {result && (
              <button onClick={copyToClipboard} className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-md">
                {copied ? <Check size={14} className="text-emerald-600"/> : <Copy size={14} />}
                {copied ? 'Copied' : 'Copy Text'}
              </button>
            )}
          </div>

          {!result && !generating && (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-100 rounded-lg p-6 text-center">
              <Mail size={48} className="mb-4 opacity-20" />
              <p>O'zbek tilidagi rasmiy xat shu yerda paydo bo'ladi.</p>
            </div>
          )}

          {generating && (
            <div className="flex-1 flex flex-col items-center justify-center text-blue-400">
              <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin mb-4" />
              <p className="font-medium">Translating and structuring...</p>
            </div>
          )}

          {result && (
            <div className="flex-1 overflow-auto animate-in fade-in duration-300">
              <div className="mb-6 pb-6 border-b border-slate-100">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter mb-1">Mavzu / Subject:</p>
                <div className="font-semibold text-slate-900">{result.subject}</div>
              </div>

              <div className="whitespace-pre-wrap text-slate-800 leading-relaxed font-serif">
                {result.bodyUzbek}
              </div>

              {(result.toneAnalysis || result.warnings) && (
                <div className="mt-8 bg-amber-50 rounded-lg p-4 text-sm border border-amber-100">
                  {result.toneAnalysis && (
                    <div className="mb-2">
                      <strong className="text-amber-800 block mb-1">Tone Analysis:</strong>
                      <span className="text-amber-700">{result.toneAnalysis}</span>
                    </div>
                  )}
                  {result.warnings && (
                    <div>
                      <strong className="text-amber-800 block mb-1">Warnings / Notes:</strong>
                      <span className="text-amber-700">{result.warnings}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
