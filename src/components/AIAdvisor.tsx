import React, { useEffect, useState, useCallback } from 'react';
import { Sparkles, AlertTriangle, Lightbulb, RefreshCw, Zap } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';
import { analyzeModuleContext } from '../lib/ai-context';

interface AIAdvisorProps {
  moduleName: string;
  contextData: any;
}

export default function AIAdvisor({ moduleName, contextData }: AIAdvisorProps) {
  const { profile } = useWorkspace();
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<{
    insights: string[];
    warnings: string[];
    actions: { label: string; action: string }[];
  } | null>(null);

  const performAnalysis = useCallback(async () => {
    // Only perform analysis if we have data to analyze
    if (!contextData || (Array.isArray(contextData) && contextData.length === 0)) {
      setAnalysis(null);
      return;
    }

    setLoading(true);
    try {
      const result = await analyzeModuleContext(profile, moduleName, contextData);
      setAnalysis(result);
    } catch (e) {
      console.error('AIAdvisor error:', e);
    } finally {
      setLoading(false);
    }
  }, [profile, moduleName, contextData]);

  // Optionally auto-run on mount or when moduleName changes,
  // but to save API calls, we might want to let the user trigger it,
  // or we just auto-run it once. Let's auto-run on mount.
  useEffect(() => {
    performAnalysis();
    // Intentionally omitting contextData from dependency array to avoid loop 
    // and too many API calls if data changes frequently.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleName, profile]);

  if (!analysis && !loading) {
    return (
      <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
            <Sparkles size={16} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-800">ИИ-Советник</h3>
            <p className="text-[10px] text-slate-500">Нажмите, чтобы получить аналитику по этому разделу.</p>
          </div>
        </div>
        <button onClick={performAnalysis} className="p-2 bg-white hover:bg-blue-50 hover:text-blue-600 rounded-lg shadow-sm border border-slate-200 text-slate-500 transition-colors">
          <RefreshCw size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-slate-900 to-[#0F172A] rounded-2xl p-5 shadow-lg border border-slate-800 relative overflow-hidden">
      {/* Decorative pulse */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full" />
      
      <div className="relative z-10 flex flex-col md:flex-row gap-6">
        {/* Left Side: Header & Status */}
        <div className="md:w-1/4 shrink-0 border-b md:border-b-0 md:border-r border-slate-800 pb-4 md:pb-0 md:pr-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-blue-400 mb-1">
              <Sparkles size={16} />
              <span className="text-[10px] font-bold uppercase tracking-wider">AI Advisor</span>
            </div>
            <h3 className="text-base font-bold text-white leading-tight">Сводка по модулю</h3>
            <p className="text-[10px] text-slate-400 mt-1">ИИ анализирует текущий контекст</p>
          </div>
          
          <button 
            onClick={performAnalysis} 
            disabled={loading}
            className="mt-4 w-full flex items-center justify-center gap-2 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-medium text-slate-300 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            Обновить
          </button>
        </div>

        {/* Right Side: Content */}
        <div className="flex-1">
          {loading ? (
            <div className="h-full flex items-center justify-center min-h-[100px]">
              <div className="flex flex-col items-center gap-2">
                <div className="w-5 h-5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                <span className="text-[10px] text-blue-400 font-mono">Анализ контекста...</span>
              </div>
            </div>
          ) : analysis ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              
              {/* Insights & Warnings */}
              <div className="space-y-3">
                {analysis.warnings.length > 0 && (
                  <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 text-rose-400 mb-1.5">
                      <AlertTriangle size={12} />
                      <span className="text-[10px] font-bold uppercase">Внимание</span>
                    </div>
                    <ul className="space-y-1">
                      {analysis.warnings.map((w, i) => (
                        <li key={i} className="text-xs text-rose-200 leading-snug">• {w}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {analysis.insights.length > 0 && (
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 text-blue-400 mb-1.5">
                      <Lightbulb size={12} />
                      <span className="text-[10px] font-bold uppercase">Инсайты</span>
                    </div>
                    <ul className="space-y-1">
                      {analysis.insights.map((w, i) => (
                        <li key={i} className="text-xs text-blue-100 leading-snug">• {w}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-emerald-400 mb-1.5 px-1">
                  <Zap size={12} />
                  <span className="text-[10px] font-bold uppercase">Рекомендованные действия</span>
                </div>
                {analysis.actions.length === 0 ? (
                  <div className="text-xs text-slate-500 italic px-1">Нет доступных быстрых действий.</div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {analysis.actions.map((act, i) => (
                      <button key={i} className="text-left w-full p-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 transition-colors group flex items-center justify-between">
                        <span className="text-xs text-slate-200 font-medium">{act.label}</span>
                        <div className="w-5 h-5 rounded-md bg-slate-700 group-hover:bg-blue-500 flex items-center justify-center transition-colors">
                          <Sparkles size={10} className="text-slate-400 group-hover:text-white" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
