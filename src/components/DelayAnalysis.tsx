import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Clock, 
  Search, 
  BarChart2, 
  TrendingUp, 
  User, 
  ShieldAlert 
} from 'lucide-react';

interface DelayFact {
  id: string;
  department: string;
  overdueDays: number;
  taskTitle: string;
  responsible: string;
  severity: 'high' | 'medium';
}

const defaultDelays: DelayFact[] = [
  { id: 'del-1', department: 'Департамент логистики и закупок', overdueDays: 6, taskTitle: 'Оформить заявки на растаможку трубной партии', responsible: 'Юсупов Тимур', severity: 'high' },
  { id: 'del-2', department: 'Финансовый департамент', overdueDays: 2, taskTitle: 'Акт сверки расчетов по НДС за 1-й квартал с ведомством', responsible: 'Кадырова Малика', severity: 'medium' }
];

export default function DelayAnalysis() {
  const [delays] = useState<DelayFact[]>(defaultDelays);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 font-sans">
      <header className="border-b border-slate-200/60 pb-5">
        <span className="text-xs font-bold text-rose-600 uppercase tracking-widest font-display">Аналитический сектор</span>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-display mt-1">Оценка и анализ задержек СЭД (Delay Analysis)</h1>
        <p className="text-slate-500 text-sm mt-0.5">Консолидированный трекинг просрочек по департаментам, выявление бутылочных горлышек и персональный анти-рейтинг.</p>
      </header>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border rounded-2xl p-5 shadow-xs flex justify-between items-center">
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-slate-400 uppercase">Средняя просрочка за неделю</span>
            <span className="text-2xl font-extrabold text-rose-600 font-mono">4.2 дня</span>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
            <Clock size={18} />
          </div>
        </div>

        <div className="bg-white border rounded-2xl p-5 shadow-xs flex justify-between items-center">
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-slate-400 uppercase">Наиболее узкое ведомство</span>
            <span className="text-xs font-bold text-slate-800 truncate block max-w-[200px]">Логистика & Закупки</span>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
            <AlertTriangle size={18} />
          </div>
        </div>

        <div className="bg-white border rounded-2xl p-5 shadow-xs flex justify-between items-center">
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-slate-400 uppercase">Снижение индекса дисциплины</span>
            <span className="text-2xl font-extrabold text-amber-600 font-mono">-1.5% за месяц</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
            <TrendingUp size={18} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Overdue charts */}
        <div className="lg:col-span-2 bg-white border p-5 rounded-2xl shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase text-slate-700 tracking-wider">Гистограмма просрочки по департаментам</h3>
          
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-semibold text-slate-800">
                <span>Департамент логистики и закупок</span>
                <span className="font-mono text-rose-600">86% просрочки</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-rose-500 h-full rounded-full" style={{ width: '86%' }} />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-semibold text-slate-800">
                <span>Финансовый департамент</span>
                <span className="font-mono text-amber-500">35% просрочки</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: '35%' }} />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-semibold text-slate-800">
                <span>Департамент IT и цифровизации</span>
                <span className="font-mono text-emerald-600">4% просрочки (Отлично)</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '4%' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Overdue Items List */}
        <div className="bg-white border p-5 rounded-2xl shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase text-slate-700 tracking-wider">Делниквенты СЭД (Список отставаний)</h3>
          
          <div className="space-y-3">
            {delays.map(fact => (
              <div key={fact.id} className="p-3.5 bg-slate-50 border rounded-xl space-y-2">
                <div className="flex justify-between items-start gap-2">
                  <span className="text-[8px] font-mono font-bold uppercase text-slate-400">{fact.department}</span>
                  <span className="text-[10px] bg-rose-50 border border-rose-200 text-rose-700 font-bold px-1.5 py-0.5 rounded uppercase shrink-0">
                    +{fact.overdueDays} дн
                  </span>
                </div>
                <h4 className="font-bold text-slate-800 text-[11px] leading-snug">{fact.taskTitle}</h4>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                  <User size={12} />
                  <span>Ответств: {fact.responsible}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
