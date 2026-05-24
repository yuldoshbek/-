import React, { useEffect, useState } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { useTasks, useMeetings } from '../lib/hooks';
import { Sparkles, Calendar, AlertTriangle, CheckSquare, Clock, Users } from 'lucide-react';
import { analyzeModuleContext } from '../lib/ai-context';
import { JournalEntry } from '../types';

const MOCK_JOURNAL: JournalEntry[] = [
  { id: 'j-1', type: 'decision', title: 'Внедрение новой системы контроля', description: 'Решено перейти на новую систему с 1 июня.', status: 'closed', priority: 'high', userId: 'guest', createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'j-2', type: 'risk', title: 'Срыв сроков поставки оборудования', description: 'Поставщик задерживает отправку серверов на 2 недели.', status: 'in_progress', priority: 'critical', userId: 'guest', createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'j-3', type: 'complaint', title: 'Проблема с кондиционером', description: 'Сотрудники жалуются на духоту в отделе продаж.', status: 'open', priority: 'medium', userId: 'guest', createdAt: Date.now(), updatedAt: Date.now() },
];

export default function Dashboard() {
  const { profile } = useWorkspace();
  const { tasks } = useTasks();
  const { meetings } = useMeetings();
  const entries = MOCK_JOURNAL;
  
  const [loading, setLoading] = useState(true);
  const [briefing, setBriefing] = useState<string[]>([]);
  
  // Aggregate stats
  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const overdueTasks = tasks.filter(t => t.status === 'overdue');
  const upcomingMeetings = meetings.filter(m => new Date(m.date) >= new Date());
  const criticalRisks = entries.filter(e => e.type === 'risk' && e.status !== 'closed');
  const openComplaints = entries.filter(e => e.type === 'complaint' && e.status !== 'closed');

  useEffect(() => {
    async function fetchBriefing() {
      setLoading(true);
      const data = {
        pendingTasks: pendingTasks.length,
        overdueTasks: overdueTasks.length,
        upcomingMeetings: upcomingMeetings.length,
        criticalRisks: criticalRisks.length,
        openComplaints: openComplaints.length,
      };
      
      try {
        const result = await analyzeModuleContext(profile, 'Утренний брифинг', data);
        setBriefing(result.insights.length > 0 ? result.insights : [
          `Сегодня у вас ${upcomingMeetings.length} встреч и ${pendingTasks.length} открытых задач.`,
          `Обратите внимание на ${overdueTasks.length} просроченных задач.`
        ]);
      } catch (e) {
        setBriefing(['Не удалось загрузить ИИ-сводку. Пожалуйста, проверьте API-ключ.']);
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
  }, [profile]);

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
        
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock size={20} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800 font-display">{pendingTasks.length}</div>
            <div className="text-[10px] uppercase font-bold text-slate-400">В работе</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <AlertTriangle size={20} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800 font-display">{overdueTasks.length}</div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Просрочено</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Calendar size={20} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800 font-display">{upcomingMeetings.length}</div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Встречи</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckSquare size={20} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800 font-display">{criticalRisks.length}</div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Открытые риски</div>
          </div>
        </div>
      </div>

      {/* Quick Access */}
      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
        <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">Быстрый доступ</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button className="p-4 bg-white border border-slate-200 rounded-xl text-left hover:border-blue-300 hover:shadow-md transition-all group">
            <CheckSquare size={20} className="text-slate-400 group-hover:text-blue-500 mb-2 transition-colors" />
            <h4 className="font-bold text-slate-700 text-sm">Новая задача</h4>
            <p className="text-[10px] text-slate-400 mt-1">Поставить поручение</p>
          </button>
          
          <button className="p-4 bg-white border border-slate-200 rounded-xl text-left hover:border-blue-300 hover:shadow-md transition-all group">
            <Users size={20} className="text-slate-400 group-hover:text-blue-500 mb-2 transition-colors" />
            <h4 className="font-bold text-slate-700 text-sm">Собрать встречу</h4>
            <p className="text-[10px] text-slate-400 mt-1">Назначить совещание</p>
          </button>

          <button className="p-4 bg-white border border-slate-200 rounded-xl text-left hover:border-rose-300 hover:shadow-md transition-all group">
            <AlertTriangle size={20} className="text-slate-400 group-hover:text-rose-500 mb-2 transition-colors" />
            <h4 className="font-bold text-slate-700 text-sm">Зафиксировать риск</h4>
            <p className="text-[10px] text-slate-400 mt-1">Добавить в журнал</p>
          </button>
        </div>
      </div>

    </div>
  );
}
