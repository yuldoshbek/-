import React, { useEffect, useState } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { useTasks, useMeetings, useComplaints, useRisks } from '../lib/hooks';
import { Sparkles, Calendar, AlertTriangle, CheckSquare, Clock, Users } from 'lucide-react';
import { Link } from 'react-router';
import { analyzeModuleContext } from '../lib/ai-context';

export default function Dashboard() {
  const { profile } = useWorkspace();
  const { tasks } = useTasks();
  const { meetings } = useMeetings();
  const { risks } = useRisks();
  const { complaints } = useComplaints();
  
  const [loading, setLoading] = useState(true);
  const [briefing, setBriefing] = useState<string[]>([]);
  
  // Aggregate stats from real hooks
  const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress');
  const overdueTasks = tasks.filter(t => t.status === 'overdue');
  const upcomingMeetings = meetings.filter(m => {
    if (!m.date) return false;
    const mDate = new Date(m.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return mDate >= today;
  });
  const activeRisks = risks.filter(r => r.status === 'active');
  const openComplaints = complaints.filter(c => c.status !== 'resolved');

  useEffect(() => {
    async function fetchBriefing() {
      setLoading(true);
      const data = {
        pendingTasks: pendingTasks.length,
        overdueTasks: overdueTasks.length,
        upcomingMeetings: upcomingMeetings.length,
        activeRisks: activeRisks.length,
        openComplaints: openComplaints.length,
      };
      
      try {
        const result = await analyzeModuleContext(profile, 'Утренний брифинг', data);
        setBriefing(result.insights.length > 0 ? result.insights : [
          `Сегодня у вас ${upcomingMeetings.length} встреч и ${pendingTasks.length} открытых задач.`,
          `Обратите внимание на ${overdueTasks.length} просроченных задач.`
        ]);
      } catch (e) {
        setBriefing(['Не удалось загрузить ИИ-сводку. Пожалуйста, проверьте API-ключ в настройках.']);
      } finally {
        setLoading(false);
      }
    }
    
    // Slight delay to allow local hooks to load from local storage
    const timer = setTimeout(() => {
      fetchBriefing();
    }, 500);
    
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, tasks, meetings, risks, complaints]);

  return (
    <div className="ew-page p-6 lg:p-8 max-w-6xl mx-auto space-y-6 font-sans">
      
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 font-display">
          Обзор (Dashboard)
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">Утренний брифинг и ключевые показатели</p>
      </header>

      {/* AI Briefing Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 shadow-lg text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 blur-3xl rounded-full" />
        <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start">
          <div className="p-4 bg-white/10 rounded-2xl shrink-0">
            <Sparkles size={32} className="text-blue-200" />
          </div>
          <div className="flex-1 space-y-3">
            <h2 className="text-xl font-bold font-display">ИИ-сводка на день</h2>
            {loading ? (
              <div className="flex items-center gap-2 text-blue-200 text-sm">
                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Генерация брифинга...
              </div>
            ) : (
              <ul className="space-y-2 text-sm text-blue-50">
                {briefing.map((item, i) => (
                  <li key={i} className="flex gap-2 items-start">
                    <span className="text-blue-300 mt-1">•</span>
                    <span className="leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <Link 
          to="/tasks" 
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:border-blue-400 transition-all hover:scale-[1.01] cursor-pointer"
        >
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock size={20} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800 font-display">{pendingTasks.length}</div>
            <div className="text-[10px] uppercase font-bold text-slate-400">В работе</div>
          </div>
        </Link>

        <Link 
          to="/tasks" 
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:border-rose-400 transition-all hover:scale-[1.01] cursor-pointer"
        >
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <AlertTriangle size={20} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800 font-display">{overdueTasks.length}</div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Просрочено</div>
          </div>
        </Link>

        <Link 
          to="/meetings" 
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:border-indigo-400 transition-all hover:scale-[1.01] cursor-pointer"
        >
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Calendar size={20} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800 font-display">{upcomingMeetings.length}</div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Встречи</div>
          </div>
        </Link>

        <Link 
          to="/issues" 
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:border-emerald-400 transition-all hover:scale-[1.01] cursor-pointer"
        >
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <AlertTriangle size={20} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800 font-display">{activeRisks.length}</div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Активные риски</div>
          </div>
        </Link>
      </div>

      {/* Quick Access */}
      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
        <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">Быстрый доступ</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link 
            to="/tasks" 
            className="p-4 bg-white border border-slate-200 rounded-xl text-left hover:border-blue-300 hover:shadow-md transition-all group cursor-pointer"
          >
            <CheckSquare size={20} className="text-slate-400 group-hover:text-blue-500 mb-2 transition-colors" />
            <h4 className="font-bold text-slate-700 text-sm">Новая задача</h4>
            <p className="text-[10px] text-slate-400 mt-1">Поставить поручение</p>
          </Link>
          
          <Link 
            to="/meetings" 
            className="p-4 bg-white border border-slate-200 rounded-xl text-left hover:border-blue-300 hover:shadow-md transition-all group cursor-pointer"
          >
            <Users size={20} className="text-slate-400 group-hover:text-blue-500 mb-2 transition-colors" />
            <h4 className="font-bold text-slate-700 text-sm">Собрать встречу</h4>
            <p className="text-[10px] text-slate-400 mt-1">Назначить совещание</p>
          </Link>

          <Link 
            to="/issues" 
            className="p-4 bg-white border border-slate-200 rounded-xl text-left hover:border-rose-300 hover:shadow-md transition-all group cursor-pointer"
          >
            <AlertTriangle size={20} className="text-slate-400 group-hover:text-rose-500 mb-2 transition-colors" />
            <h4 className="font-bold text-slate-700 text-sm">Зафиксировать риск</h4>
            <p className="text-[10px] text-slate-400 mt-1">Добавить в журнал</p>
          </Link>
        </div>
      </div>

    </div>
  );
}
