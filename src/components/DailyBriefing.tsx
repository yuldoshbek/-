import React, { useState } from 'react';
import { 
  Sparkles, 
  Calendar, 
  AlertTriangle, 
  FileText, 
  Mail, 
  Clock, 
  TrendingUp, 
  Info 
} from 'lucide-react';

export default function DailyBriefing() {
  const [briefDate] = useState(() => {
    const d = new Date();
    return d.toLocaleDateString('ru-RU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  });

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6 font-sans">
      <header className="border-b border-slate-200/60 pb-5">
        <span className="text-xs font-bold text-blue-600 uppercase tracking-widest font-display">Утренний дайджест руководителя</span>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-display mt-1">Центр ежедневного брифинга (Daily Briefing)</h1>
        <p className="text-slate-500 text-sm mt-0.5">Автоматическая агрегация ключевых событий, утренних показателей деятельности ведомств ТМК на {briefDate}.</p>
      </header>

      {/* AI Intelligence Greeting Card */}
      <div className="bg-gradient-to-br from-[#0F2042] to-[#1E3E7A] border border-blue-900 text-blue-100 rounded-3xl p-6 shadow-md relative overflow-hidden space-y-4">
        <div className="absolute right-0 top-0 -translate-y-8 translate-x-8 w-44 h-44 rounded-full bg-blue-500/10 blur-2xl" />
        
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-500/20 text-blue-300 rounded-xl">
            <Sparkles size={18} className="animate-pulse" />
          </div>
          <span className="text-xs font-extrabold font-mono tracking-widest text-blue-300">ИНТЕЛЛЕКТУАЛЬНАЯ СВОДКА EXECUTIVE OS</span>
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-extrabold text-white font-display tracking-tight leading-snug">
            Приветствуем Вас в операционном дне, Администратор.
          </h2>
          <p className="text-xs leading-relaxed text-blue-200">
            Сегодня наблюдается стабильный индекс исполнительской дисциплины на уровне <strong className="text-white font-mono">92.4%</strong>. 
            Основной приоритет дня — согласование бюджетной росписи по Департаменту IT и предотвращение задержек трансфертных накладных во 2-м секторе поставок.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Morning Checklist Tasks */}
        <div className="bg-white border rounded-2xl p-5 shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 border-b pb-2">
            <Calendar size={14} className="text-blue-500" />
            <span>Главные приоритеты на сегодня</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div className="flex gap-3 items-start p-2 hover:bg-slate-50 rounded-xl transition-colors">
              <input type="checkbox" defaultChecked className="mt-0.5 h-4 w-4 rounded text-blue-600 cursor-pointer" />
              <div>
                <span className="font-bold text-slate-800">Провести коллегию по вопросу узла Яллама</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Встреча запланирована на 11:30 в Секторе Логистики.</span>
              </div>
            </div>

            <div className="flex gap-3 items-start p-2 hover:bg-slate-50 rounded-xl transition-colors">
              <input type="checkbox" className="mt-0.5 h-4 w-4 rounded text-blue-600 cursor-pointer" />
              <div>
                <span className="font-bold text-slate-800">Согласовать проект по цифровизации госорганов</span>
                <span className="text-[10px] text-zinc-400 block mt-0.5">Докладчик: Ахмедов У.М. Срок до вечера.</span>
              </div>
            </div>

            <div className="flex gap-3 items-start p-2 hover:bg-slate-50 rounded-xl transition-colors">
              <input type="checkbox" className="mt-0.5 h-4 w-4 rounded text-blue-600 cursor-pointer" />
              <div>
                <span className="font-bold text-slate-800">Срез отчетов от сотрудников (Май)</span>
                <span className="text-[10px] text-zinc-400 block mt-0.5">Утвердить поступившие отчеты Кадыровой Малики.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Critical Notifications */}
        <div className="bg-white border rounded-2xl p-5 shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 border-b pb-2">
            <AlertTriangle size={14} className="text-rose-500" />
            <span>Обращения и критические сигналы</span>
          </h3>

          <div className="space-y-3.5 text-xs text-slate-600">
            <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-100/80 space-y-1">
              <span className="text-[8px] font-bold text-rose-600 uppercase tracking-wider block">Таможня & Риск задержки</span>
              <p className="font-semibold text-slate-800 text-[11px]">Жалоба №14-А от ООО "КаргоЛинк" удерживается свыше 48 часов!</p>
              <span className="text-[10px] text-slate-400 block font-mono">Дедлайн рассмотрения: 25 Мая 2026</span>
            </div>

            <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100/80 space-y-1">
              <span className="text-[8px] font-bold text-amber-600 uppercase tracking-wider block">Дисциплинарный контроль</span>
              <p className="font-semibold text-slate-800 text-[11px]">2 поручения находятся в статусе "просрочено" в ведомстве Логистики.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
