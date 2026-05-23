import React, { useState } from 'react';
import { useDepartments, useTasks } from '../lib/hooks';
import { Users, AlertCircle, Award, CheckSquare, Search, TrendingUp, Info } from 'lucide-react';

export default function Departments() {
  const { departments, updateDepartmentKPI } = useDepartments();
  const { tasks } = useTasks();
  const [searchQuery, setSearchQuery] = useState('');

  // Compute stats on the fly based on tasks
  const getDeptTasksStat = (deptName: string) => {
    const deptTasks = tasks.filter(t => t.department === deptName);
    const active = deptTasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length;
    const completed = deptTasks.filter(t => t.status === 'completed').length;
    const urgent = deptTasks.filter(t => t.priority === 'urgent' && t.status !== 'completed').length;
    return {
      active,
      completed,
      urgent,
      total: deptTasks.length
    };
  };

  const filteredDepts = departments.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()) || d.head.toLowerCase().includes(searchQuery.toLowerCase()));

  // Average Office KPI count
  const avgKPI = Math.round(departments.reduce((acc, current) => acc + current.kpi, 0) / (departments.length || 1));

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 font-sans">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight text-slate-900 dark:text-white">Контроль работы Департаментов</h1>
          <p className="text-slate-500 mt-1 font-sans text-sm">Мониторинг исполнительской дисциплины, ключевых показателей эффективности (КПЭ/КПИ) и нагрузки структурных подразделений.</p>
        </div>
        <div className="bg-slate-900 text-white px-4 py-3 rounded-xl flex items-center gap-3 border border-slate-800">
          <TrendingUp className="text-emerald-400 animate-pulse" size={20} />
          <div>
            <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-widest">Общая исполнительность</span>
            <span className="font-bold text-base font-display text-emerald-300">{avgKPI}% KPI</span>
          </div>
        </div>
      </header>

      {/* Grid of indicators */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Users size={20} />
          </div>
          <div>
            <span className="text-slate-400 text-xs block font-bold uppercase tracking-wider">Групп в структуре</span>
            <h4 className="text-2xl font-bold text-slate-800 mt-0.5">{departments.length} отделов</h4>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <CheckSquare size={20} />
          </div>
          <div>
            <span className="text-slate-400 text-xs block font-bold uppercase tracking-wider">Всего задач на ведомствах</span>
            <h4 className="text-2xl font-bold text-slate-800 mt-0.5">{tasks.length} поручений</h4>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <AlertCircle size={20} />
          </div>
          <div>
            <span className="text-slate-400 text-xs block font-bold uppercase tracking-wider">Срочные в работе</span>
            <h4 className="text-2xl font-bold text-amber-900 mt-0.5">{tasks.filter(t => t.priority === 'urgent' && t.status !== 'completed').length} задач</h4>
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <Award size={20} />
          </div>
          <div>
            <span className="text-slate-400 text-xs block font-bold uppercase tracking-wider">Лидирующий сектор</span>
            <h4 className="text-lg font-bold text-slate-800 truncate mt-0.5">Аналитика (95%)</h4>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden p-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b pb-4">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Поиск департамента / руководителя..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full text-sm border border-slate-200 bg-slate-50/50 pl-9 pr-4 py-1.5 rounded-lg text-slate-800"
            />
          </div>
          <span className="text-xs text-slate-500 font-medium">Рейтинг рассчитывается на основе процента завершенных поручений и соблюдения регламента.</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredDepts.map(dept => {
            const stats = getDeptTasksStat(dept.name);
            return (
              <div key={dept.id} className="bg-slate-50/50 p-5 rounded-xl border border-slate-200/60 shadow-sm space-y-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm leading-tight font-display">{dept.name}</h3>
                    <p className="text-xs text-slate-500 mt-1">Руководитель: <span className="font-semibold text-slate-700">{dept.head}</span></p>
                  </div>
                  <span className={`text-xs font-bold font-display px-2.5 py-1 rounded-lg ${dept.kpi >= 90 ? 'bg-emerald-50 text-emerald-700' : dept.kpi >= 75 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'}`}>
                    KPI {dept.kpi}%
                  </span>
                </div>

                {/* KPI slide-adjust bar for quick control simulation! */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[10px] text-slate-400">
                    <span>Исполнительская дисциплина</span>
                    <span>Редактировать КПЭ (Имитация)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div className={`h-full ${dept.kpi >= 90 ? 'bg-emerald-500' : dept.kpi >= 75 ? 'bg-amber-400' : 'bg-rose-500'}`} style={{ width: `${dept.kpi}%` }} />
                    </div>
                    <input 
                      type="range" 
                      min="10" 
                      max="100" 
                      value={dept.kpi}
                      onChange={e => updateDepartmentKPI(dept.id, Number(e.target.value))}
                      className="w-20 cursor-pointer h-1 bg-slate-200 accent-blue-600 rounded-lg appearance-none"
                    />
                  </div>
                </div>

                {/* Subtasks metrics */}
                <div className="grid grid-cols-3 gap-2 text-center text-[11px] pt-2 border-t border-slate-200/40">
                  <div className="bg-white p-2 border border-slate-100 rounded-lg">
                    <span className="text-slate-400 block font-semibold">Всего в СЭД</span>
                    <span className="font-bold text-slate-800 text-xs mt-0.5 block">{stats.total}</span>
                  </div>
                  <div className="bg-white p-2 border border-slate-100 rounded-lg">
                    <span className="text-slate-400 block font-semibold">Активных</span>
                    <span className="font-bold text-blue-600 text-xs mt-0.5 block">{stats.active}</span>
                  </div>
                  <div className="bg-white p-2 border border-slate-100 rounded-lg">
                    <span className="text-rose-500 block font-semibold">Срочные</span>
                    <span className="font-bold text-rose-600 text-xs mt-0.5 block">{stats.urgent}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Corporate Rule banner */}
      <div className="bg-blue-50/50 border border-blue-200/50 p-4 rounded-xl flex gap-3 text-slate-700 text-xs items-center leading-relaxed">
        <Info className="text-blue-600 shrink-0" size={16} />
        <span>Согласно Регламенту Администрации Кабинета Министров, департаменты с показателем КПЭ ниже 75% автоматически переводятся под повышенный надзор Сектора контроля Executive OS. Срок предоставления пояснительных записок — 24 часа.</span>
      </div>
    </div>
  );
}
