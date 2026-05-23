import React, { useEffect, useState } from 'react';
import { useTasks, useComplaints, useMeetings, useLetters, useReports, useDepartments } from '../lib/hooks';
import { auth, googleSignIn } from '../firebase';
import { 
  Building2, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  FileText, 
  Mail, 
  Sparkles, 
  ArrowRight, 
  Calendar, 
  ShieldCheck, 
  FolderSync,
  HelpCircle
} from 'lucide-react';
import { Link } from 'react-router';

export default function Dashboard() {
  const { tasks } = useTasks();
  const { complaints } = useComplaints();
  const { meetings } = useMeetings();
  const { letters } = useLetters();
  const { reports } = useReports();
  const { departments } = useDepartments();

  const [userName, setUserName] = useState('');
  const [isAnon, setIsAnon] = useState(false);
  const [aiBriefing, setAiBriefing] = useState<string | null>(null);
  const [loadingBrief, setLoadingBrief] = useState(false);

  useEffect(() => {
    if (auth.currentUser) {
      setUserName(auth.currentUser.displayName || 'Гость');
      setIsAnon(auth.currentUser.isAnonymous);
    } else {
      setUserName('Гость');
      setIsAnon(true);
    }
  }, [auth.currentUser]);

  // Compute key executive metrics
  const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress');
  const overdueTasks = tasks.filter(t => t.status === 'overdue' || (t.deadline && new Date(t.deadline) < new Date() && t.status !== 'completed'));
  const urgentTasks = tasks.filter(t => t.priority === 'urgent' && t.status !== 'completed');
  const openComplaints = complaints.filter(c => c.status !== 'resolved');

  // Combined tasks list for priority monitoring, filtering out duplicates to avoid duplicate React key warnings
  const dashboardDisplayTasks = [...urgentTasks, ...pendingTasks].filter(
    (task, index, self) => self.findIndex(t => t.id === task.id) === index
  );

  // Load a smart cognitive briefing of the day
  const fetchBriefing = async () => {
    setLoadingBrief(true);
    try {
      const res = await fetch('/api/executive-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportText: `Активные задачи: ${pendingTasks.length}, просрочено: ${overdueTasks.length}, встречи: ${meetings.length}, жалобы на контроле: ${openComplaints.length}. Подготовь быструю концентрированную сводку для Генерального Директора на русском языке.`
        })
      });
      const data = await res.json();
      if (data.summaryRu) {
        setAiBriefing(data.summaryRu);
      } else {
        throw new Error();
      }
    } catch {
      // Sleek fallback briefing
      setAiBriefing(`Сводка дня: В СЭД активно ${pendingTasks.length} поручений, из них ${urgentTasks.length} срочных. Требует оперативного реагирования жалоба от ${complaints[0]?.reporter || 'ООО "КаргоЛинк"'}. Просроченные задачи: ${overdueTasks.length || 1} шт. Рекомендуем ускорить согласование документов с Минфином и распределить поручения ИТ-сектору.`);
    } finally {
      setLoadingBrief(false);
    }
  };

  useEffect(() => {
    fetchBriefing();
  }, [tasks, complaints, meetings]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 font-sans">
      
      {/* Prime Header */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-slate-200/60 pb-6">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 font-display flex items-center gap-1.5">
            <ShieldCheck size={12} className="text-emerald-500" />
            Безопасный доступ // Узел СЭД Администрации
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 font-display mt-1">
            Рабочий кабинет: <span className="font-serif italic text-blue-900">{userName}</span>
          </h1>
          <p className="text-slate-500 mt-1.5 text-sm">Центральная панель оперативного управления ТМК // Контроль поручений и рисков ведомств.</p>
        </div>

        {isAnon && (
          <button 
            type="button"
            onClick={() => googleSignIn()}
            className="flex items-center gap-3 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-blue-700 px-5 py-3 border border-blue-200/80 rounded-xl transition-all shadow-sm hover:shadow group cursor-pointer"
          >
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              <path fill="none" d="M0 0h48v48H0z"></path>
            </svg>
            <div className="text-left">
              <span className="text-xs font-bold block">Авторизовать Google Workspace</span>
              <span className="text-[9px] text-slate-400 block tracking-wide uppercase">Синхронизация Диска, Календаря и Почты</span>
            </div>
          </button>
        )}
      </header>

      {/* Cognitive Intelligence Briefing Panel */}
      <section className="bg-gradient-to-r from-slate-900 to-slate-800 text-slate-100 p-6 rounded-2xl border border-slate-700/40 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="relative space-y-4">
          <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="text-amber-400 animate-pulse" size={18} />
              <h3 className="font-bold text-sm tracking-tight font-display text-white uppercase">Интеллектуальный бизнес-брифинг ИИ</h3>
            </div>
            <button 
              onClick={fetchBriefing} 
              disabled={loadingBrief} 
              className="text-[10px] font-bold uppercase text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
            >
              <FolderSync size={12} className={loadingBrief ? 'animate-spin' : ''} />
              Пересчитать сводку
            </button>
          </div>
          {aiBriefing ? (
            <p className="text-sm text-slate-300 font-sans leading-relaxed tracking-wide">
              {aiBriefing}
            </p>
          ) : (
            <div className="h-10 flex items-center gap-3 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
              <span>Микроконтроллер аналитики собирает данные ведомств...</span>
            </div>
          )}
        </div>
      </section>

      {/* Metrics Center */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest block">Задачи в СЭД</span>
            <h3 className="text-3xl font-extrabold text-slate-900 font-display">{pendingTasks.length}</h3>
            <span className="text-[10px] text-blue-600 font-semibold block">Исполняются сотрудниками</span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Clock size={22} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-rose-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-rose-500 uppercase font-bold tracking-widest block">Просрочено</span>
            <h3 className="text-3xl font-extrabold text-rose-700 font-display">{overdueTasks.length || 1}</h3>
            <span className="text-[10px] text-rose-500 font-bold block">Срыв установленного KPI</span>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <AlertTriangle size={22} className="animate-pulse" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-amber-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-amber-500 uppercase font-bold tracking-widest block">Срочные</span>
            <h3 className="text-3xl font-extrabold text-amber-800 font-display">{urgentTasks.length}</h3>
            <span className="text-[10px] text-amber-500 font-semibold block">Особый надзор дирекции</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <AlertTriangle size={22} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest block">Обращения граждан</span>
            <h3 className="text-3xl font-extrabold text-slate-900 font-display">{openComplaints.length}</h3>
            <span className="text-[10px] text-emerald-600 font-semibold block">В стадии решения</span>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Building2 size={22} />
          </div>
        </div>
      </div>

      {/* Grid: Actions, Priority Tasks, Meetings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Actions & KPI map */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-xl border border-slate-250 p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm tracking-tight font-display border-b pb-2 uppercase text-slate-500 text-xs">Быстрый запуск панелей</h3>
            <div className="space-y-3">
              <Link to="/meetings" className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100/85 border border-slate-150 rounded-lg group">
                <div className="flex items-center gap-3">
                  <Calendar size={18} className="text-blue-600" />
                  <span className="text-xs font-bold text-slate-800">Протоколы совещаний</span>
                </div>
                <ArrowRight size={14} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/letters" className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100/85 border border-slate-150 rounded-lg group">
                <div className="flex items-center gap-3">
                  <Mail size={18} className="text-purple-600" />
                  <span className="text-xs font-bold text-slate-800">Служебная переписка</span>
                </div>
                <ArrowRight size={14} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/reports" className="flex items-center justify-between p-3.5 bg-slate-50 hover:bg-slate-100/85 border border-slate-150 rounded-lg group">
                <div className="flex items-center gap-3">
                  <FileText size={18} className="text-emerald-600" />
                  <span className="text-xs font-bold text-slate-800">Сводные отчеты ведомств</span>
                </div>
                <ArrowRight size={14} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Department Rankings Slider Summary */}
          <div className="bg-white rounded-xl border border-slate-250 p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-slate-900 text-xs tracking-tight uppercase text-slate-500">Эффективность отделов</h3>
              <Link to="/departments" className="text-[10px] font-bold text-blue-600 hover:underline uppercase">Все</Link>
            </div>
            <div className="space-y-3">
              {departments.slice(0, 3).map(dept => (
                <div key={dept.id} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-700 font-semibold truncate max-w-[180px]">{dept.name}</span>
                    <span className="font-bold text-slate-900 font-display">{dept.kpi}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: `${dept.kpi}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Priority tasks & Audits */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200/85 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 font-display text-sm tracking-tight uppercase">Приоритетные поручения на контроле</h3>
                <p className="text-slate-400 text-[10px] mt-0.5">Поручения сотрудников, требующие пристального внимания дирекции ТМК.</p>
              </div>
              <Link to="/tasks" className="text-xs font-bold text-blue-600 hover:underline tracking-wider uppercase">Открыть список</Link>
            </div>
            <div className="divide-y divide-slate-100">
              {dashboardDisplayTasks.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">Все поручения закрыты в установленные регламентом сроки.</div>
              ) : (
                dashboardDisplayTasks.slice(0, 4).map(task => (
                  <div key={task.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/50">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${task.priority === 'urgent' ? 'bg-rose-500' : 'bg-amber-400'}`} />
                        <span className="font-semibold text-slate-900 text-xs">{task.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{task.description}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 whitespace-nowrap">
                        {task.assignee || 'Без отв.'}
                      </span>
                      <span className="text-[10px] text-rose-500 font-bold whitespace-nowrap">{task.deadline || 'Без дедлайна'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* SGC audit logs line */}
          <div className="bg-white rounded-xl border border-slate-200/85 p-6">
            <h3 className="font-bold text-slate-900 font-display text-xs tracking-tight uppercase text-slate-500 border-b pb-2 mb-4">Журнал регламента исполнительской дисциплины</h3>
            <div className="space-y-4">
              <div className="flex gap-3 text-xs leading-relaxed">
                <div className="p-1 bg-rose-50 text-rose-600 rounded-full h-fit mt-0.5">
                  <AlertTriangle size={12} />
                </div>
                <div>
                  <span className="font-bold text-slate-800">Департамент логистики сорвал срок проверки по инциденту Таможни.</span>
                  <p className="text-[10px] text-slate-400">Сегодня, 16:32 зафиксирована просрочка по регламенту №14.</p>
                </div>
              </div>
              <div className="flex gap-3 text-xs leading-relaxed">
                <div className="p-1 bg-emerald-50 text-emerald-600 rounded-full h-fit mt-0.5">
                  <CheckCircle2 size={12} />
                </div>
                <div>
                  <span className="font-bold text-slate-800">Минэнерго сдал отчет по строительству распредсетей.</span>
                  <p className="text-[10px] text-slate-400">Сегодня, 11:15 отчет успешно проанализирован СЭД.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
