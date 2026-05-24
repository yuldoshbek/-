import React, { useEffect, useState } from 'react';
import { useTasks, useMeetings, useLetters, useReports } from '../lib/hooks';
import { auth } from '../firebase';
import { 
  CheckSquare, Calendar, Mail, FileText, Sparkles, 
  ArrowRight, Clock, AlertTriangle, TrendingUp, Plus,
  BarChart3
} from 'lucide-react';
import { Link } from 'react-router';

export default function Dashboard() {
  const { tasks } = useTasks();
  const { meetings } = useMeetings();
  const { letters } = useLetters();
  const { reports } = useReports();

  const [userName, setUserName] = useState('');
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    if (auth.currentUser) {
      setUserName(auth.currentUser.displayName || 'Администратор');
    } else {
      setUserName('Гость');
    }

    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Доброе утро');
    else if (hour < 18) setGreeting('Добрый день');
    else setGreeting('Добрый вечер');
  }, []);

  // Compute metrics
  const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress');
  const overdueTasks = tasks.filter(t => t.status === 'overdue' || (t.deadline && new Date(t.deadline) < new Date() && t.status !== 'completed'));
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const urgentTasks = tasks.filter(t => t.priority === 'urgent' && t.status !== 'completed');

  const today = new Date().toISOString().split('T')[0];
  const todayMeetings = meetings.filter(m => m.date === today);

  // Recent activity feed
  const recentItems = [
    ...tasks.slice(0, 3).map(t => ({
      type: 'task' as const,
      title: t.title,
      time: new Date(t.updatedAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      status: t.status,
      link: '/tasks'
    })),
    ...meetings.slice(0, 2).map(m => ({
      type: 'meeting' as const,
      title: m.title,
      time: m.date || '',
      status: 'scheduled' as string,
      link: '/meetings'
    })),
  ].sort((a, b) => 0).slice(0, 6);

  const kpiCards = [
    {
      label: 'Активные задачи',
      value: pendingTasks.length,
      total: tasks.length,
      icon: <CheckSquare size={20} />,
      color: 'blue',
      link: '/tasks',
      trend: completedTasks.length > 0 ? `${completedTasks.length} завершено` : undefined
    },
    {
      label: 'Встречи',
      value: todayMeetings.length,
      total: meetings.length,
      icon: <Calendar size={20} />,
      color: 'green',
      link: '/meetings',
      trend: todayMeetings.length > 0 ? 'Сегодня' : 'Нет на сегодня'
    },
    {
      label: 'Письма',
      value: letters.filter(l => l.status === 'draft').length,
      total: letters.length,
      icon: <Mail size={20} />,
      color: 'amber',
      link: '/letters',
      trend: `${letters.filter(l => l.status === 'sent').length} отправлено`
    },
    {
      label: 'Просрочено',
      value: overdueTasks.length,
      total: tasks.length,
      icon: <AlertTriangle size={20} />,
      color: 'rose',
      link: '/tasks',
      trend: overdueTasks.length > 0 ? 'Требует внимания' : 'Всё в порядке'
    }
  ];

  const formatDate = () => {
    const d = new Date();
    return d.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <div className="ew-page p-6 lg:p-8 max-w-7xl mx-auto font-sans space-y-8">

      {/* ═══ Welcome Header ═══ */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <p className="text-sm text-slate-500 font-medium capitalize">{formatDate()}</p>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 font-display mt-1">
            {greeting}, {userName}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {pendingTasks.length} активных задач • {todayMeetings.length} встреч сегодня
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
            <span className="ew-pulse" />
            <span>Система активна</span>
          </div>
        </div>
      </header>

      {/* ═══ KPI Cards ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi, i) => (
          <Link key={i} to={kpi.link} className="group">
            <div className={`ew-kpi ${kpi.color} group-hover:shadow-lg transition-shadow`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{kpi.label}</p>
                  <p className="text-3xl font-extrabold text-slate-900 mt-2 font-display">{kpi.value}</p>
                  {kpi.trend && (
                    <p className="text-[11px] text-slate-400 mt-1 font-medium">{kpi.trend}</p>
                  )}
                </div>
                <div className={`p-2.5 rounded-xl ${
                  kpi.color === 'blue' ? 'bg-blue-50 text-blue-500' :
                  kpi.color === 'green' ? 'bg-emerald-50 text-emerald-500' :
                  kpi.color === 'amber' ? 'bg-amber-50 text-amber-500' :
                  'bg-rose-50 text-rose-500'
                }`}>
                  {kpi.icon}
                </div>
              </div>

              {/* Mini progress bar */}
              {kpi.total > 0 && (
                <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5">
                  <div
                    className={`h-full rounded-full transition-all ${
                      kpi.color === 'blue' ? 'bg-blue-500' :
                      kpi.color === 'green' ? 'bg-emerald-500' :
                      kpi.color === 'amber' ? 'bg-amber-500' :
                      'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min((kpi.value / Math.max(kpi.total, 1)) * 100, 100)}%` }}
                  />
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* ═══ Quick Actions + Activity Feed ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Quick Actions */}
        <div className="ew-card p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 font-display">Быстрые действия</h2>

          <div className="space-y-2">
            {[
              { label: 'Новая задача', icon: <Plus size={16} />, link: '/tasks', color: 'bg-blue-50 text-blue-600 hover:bg-blue-100' },
              { label: 'Новая встреча', icon: <Calendar size={16} />, link: '/meetings', color: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' },
              { label: 'ИИ-Ассистент', icon: <Sparkles size={16} />, link: '/ai-assistant', color: 'bg-violet-50 text-violet-600 hover:bg-violet-100' },
              { label: 'Составить письмо', icon: <Mail size={16} />, link: '/letters', color: 'bg-amber-50 text-amber-600 hover:bg-amber-100' },
            ].map((action, i) => (
              <Link
                key={i}
                to={action.link}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${action.color}`}
              >
                {action.icon}
                {action.label}
                <ArrowRight size={14} className="ml-auto opacity-40" />
              </Link>
            ))}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="lg:col-span-2 ew-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 font-display">Последние события</h2>
            <span className="text-[10px] text-slate-400 font-mono uppercase">Обновлено сейчас</span>
          </div>

          {recentItems.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <Clock size={28} className="mx-auto opacity-30" />
              <p className="text-xs font-medium">Нет недавней активности</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {recentItems.map((item, i) => (
                <Link key={i} to={item.link} className="flex items-center justify-between py-3 hover:bg-slate-50 -mx-2 px-2 rounded-lg transition-colors group">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-lg ${
                      item.type === 'task' ? 'bg-blue-50 text-blue-500' : 'bg-emerald-50 text-emerald-500'
                    }`}>
                      {item.type === 'task' ? <CheckSquare size={14} /> : <Calendar size={14} />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 truncate">{item.title}</p>
                      <p className="text-[10px] text-slate-400">
                        {item.type === 'task' ? 'Задача' : 'Встреча'} • {item.time}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${
                      item.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                      item.status === 'overdue' ? 'bg-rose-50 text-rose-600' :
                      item.status === 'in_progress' ? 'bg-blue-50 text-blue-600' :
                      'bg-slate-100 text-slate-500'
                    }`}>
                      {item.status === 'completed' ? 'Выполнено' :
                       item.status === 'overdue' ? 'Просрочено' :
                       item.status === 'in_progress' ? 'В работе' :
                       item.status === 'scheduled' ? 'Запланировано' :
                       'Ожидает'}
                    </span>
                    <ArrowRight size={12} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ═══ Urgent Tasks Alert ═══ */}
      {urgentTasks.length > 0 && (
        <div className="ew-card p-5 border-l-4 border-l-rose-500 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-rose-500" />
            <h3 className="text-sm font-bold text-slate-900">Срочные задачи ({urgentTasks.length})</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {urgentTasks.slice(0, 6).map(task => (
              <Link key={task.id} to="/tasks" className="p-3 bg-rose-50/50 rounded-xl hover:bg-rose-50 transition-colors">
                <p className="text-xs font-semibold text-slate-800 truncate">{task.title}</p>
                <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
                  {task.deadline && <span>📅 {task.deadline}</span>}
                  {task.department && <span>• {task.department}</span>}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
