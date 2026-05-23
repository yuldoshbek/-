import React, { useState } from 'react';
import { FileText, Sparkles, TrendingUp, AlertTriangle, PlayCircle } from 'lucide-react';

export default function Reports() {
  const [reportText, setReportText] = useState('');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{
    summaryRu?: string;
    summaryUz?: string;
    risks?: string[];
    nextSteps?: string[];
    proposedDecisions?: string[];
  } | null>(null);

  const handleGenerate = async () => {
    if (!reportText.trim()) return;
    setGenerating(true);
    setResult(null);
    try {
      const res = await fetch('/api/executive-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportText })
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
      } else {
        alert(data.error || 'Ошибка при обработке отчета');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-8">
      <div className="flex items-center gap-3 mb-8">
        <FileText className="text-blue-600" size={28} />
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Отчеты (Executive Summary)</h1>
          <p className="text-slate-500 mt-1">Преобразование длинных отчетов в краткую выжимку</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
          <label className="block text-sm font-semibold text-slate-700 mb-2">Текст отчета или документа</label>
          <textarea 
            value={reportText}
            onChange={e => setReportText(e.target.value)}
            placeholder="Вставьте сюда текст длинного отчета..."
            className="w-full flex-1 min-h-[300px] p-4 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-slate-700"
          />
          
          <div className="mt-4 flex justify-end">
            <button 
              onClick={handleGenerate}
              disabled={generating || !reportText.trim()}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg font-medium transition-colors cursor-pointer"
            >
              <Sparkles size={18} className={generating ? 'animate-pulse' : ''} />
              {generating ? 'Анализ...' : 'Сделать Выжимку'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col overflow-hidden">
          <h2 className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-4 border-b border-slate-100 pb-2">Сводка (Briefing)</h2>
          
          {!result && !generating && (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
              <TrendingUp size={48} className="mb-4 opacity-20" />
              <p>Вставьте текст отчета, чтобы получить краткую выжимку, риски и варианты решений.</p>
            </div>
          )}

          {generating && (
            <div className="flex-1 flex items-center justify-center text-slate-400">
              <div className="w-8 h-8 rounded-full border-2 border-slate-600 border-t-transparent animate-spin" />
            </div>
          )}

          {result && (
            <div className="flex-1 overflow-auto animate-in fade-in space-y-6">
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Краткое содержание (RU)</h3>
                <p className="text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100">{result.summaryRu}</p>
              </div>

              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Qisqa mazmuni (UZ)</h3>
                <p className="text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100 font-serif italic">{result.summaryUz}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {result.risks && result.risks.length > 0 && (
                  <div className="bg-red-50 border border-red-100 p-4 rounded-lg">
                    <h3 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                      <AlertTriangle size={16} /> Риски
                    </h3>
                    <ul className="list-disc list-inside text-sm text-red-800 space-y-1">
                      {result.risks.map((r, i) => <li key={i}>{r}</li>)}
                    </ul>
                  </div>
                )}

                {result.nextSteps && result.nextSteps.length > 0 && (
                  <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-lg">
                    <h3 className="font-semibold text-emerald-900 mb-2 flex items-center gap-2">
                      <PlayCircle size={16} /> Следующие шаги
                    </h3>
                    <ul className="list-disc list-inside text-sm text-emerald-800 space-y-1">
                      {result.nextSteps.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                )}
              </div>

              {result.proposedDecisions && result.proposedDecisions.length > 0 && (
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Варианты решений</h3>
                  <div className="space-y-2">
                    {result.proposedDecisions.map((decision, i) => (
                      <div key={i} className="bg-white border border-slate-200 p-3 rounded-lg flex items-start gap-3 shadow-sm">
                        <span className="flex items-center justify-center bg-slate-900 text-white w-6 h-6 rounded-full text-xs font-bold shrink-0">{String.fromCharCode(65 + i)}</span>
                        <p className="text-sm text-slate-700 font-medium pt-0.5">{decision}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
