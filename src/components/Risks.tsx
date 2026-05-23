import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Search, 
  Plus, 
  ShieldAlert, 
  CheckCircle, 
  Clock, 
  HelpCircle 
} from 'lucide-react';
import { useRisks } from '../lib/hooks';
import { ExecutiveRisk } from '../types';

export default function Risks() {
  const { risks, addRisk, mitigationRisk } = useRisks();

  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  
  // New States
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ExecutiveRisk['category']>('Логистика');
  const [level, setLevel] = useState<ExecutiveRisk['level']>('high');
  const [mitPlan, setMitPlan] = useState('');
  const [reporter, setReporter] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    addRisk({
      title: title.trim(),
      category,
      level,
      mitidgationPlan: mitPlan.trim() || 'Разработка защитных мер поручена ответственным департаментам.',
      reporter: reporter.trim() || 'Администратор СЭД',
      status: 'active'
    });

    setTitle('');
    setMitPlan('');
    setReporter('');
    setShowAdd(false);
  };

  const handleMitigated = (id: string) => {
    mitigationRisk(id);
  };

  const filtered = risks.filter(r => r.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 font-sans">
      <header className="border-b border-slate-200/60 pb-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs font-bold text-rose-600 uppercase tracking-widest font-display">Безопасность и Комплайнс</span>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-display mt-1">Карта операционных рисков (Risks)</h1>
          <p className="text-slate-500 text-sm mt-0.5">Ранжирование угроз СЭД, финансовые лимиты, выявление узких мест и превентивные планы митигации.</p>
        </div>

        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 bg-rose-600 hover:bg-rose-705 text-white font-bold px-4 py-2.5 rounded-xl text-xs uppercase cursor-pointer"
        >
          <Plus size={15} />
          <span>Регистрировать риск</span>
        </button>
      </header>

      {showAdd && (
        <form onSubmit={handleSubmit} className="bg-white border rounded-2xl p-6 shadow-xs max-w-2xl mx-auto space-y-4 text-xs">
          <h3 className="text-xs font-bold uppercase text-slate-800">Фиксация инцидента / Риска в реестре ТМК</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Наименование риска</label>
              <input 
                id="risk-title"
                type="text" 
                placeholder="Риск сбоя баз данных СЭД при нагрузочном тесте..." 
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full p-2 border rounded-xl"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Отрасль / Категория</label>
              <select 
                id="risk-category"
                value={category}
                onChange={e => setCategory(e.target.value as any)}
                className="w-full p-2 border rounded-xl"
              >
                <option value="Логистика">Логистика</option>
                <option value="Финансовый">Финансовый</option>
                <option value="Информационный">Информационный</option>
                <option value="Кадровый">Кадровый</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Уровень критичности</label>
              <select 
                id="risk-level"
                value={level}
                onChange={e => setLevel(e.target.value as any)}
                className="w-full p-2 border rounded-xl"
              >
                <option value="low">Низкий (Low)</option>
                <option value="medium">Средний (Medium)</option>
                <option value="high">Высокий (High)</option>
                <option value="critical">Критический (Critical)</option>
              </select>
            </div>
            <div className="col-span-2 space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Антикризисный план митигации (Mitigation Plan)</label>
              <textarea 
                id="risk-mitigation"
                rows={2} 
                value={mitPlan}
                onChange={e => setMitPlan(e.target.value)}
                placeholder="Описать конкретные шаги, дублирующие контуры и лимиты ответственности..."
                className="w-full p-2 border rounded-xl"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Инициатор / Рапортующий</label>
              <input 
                id="risk-reporter"
                type="text" 
                value={reporter}
                onChange={e => setReporter(e.target.value)}
                className="w-full p-2 border rounded-xl"
                required
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 text-xs pt-2">
            <button type="button" onClick={() => setShowAdd(false)} className="px-3 py-1.5 hover:bg-slate-100 rounded-lg">Отмена</button>
            <button type="submit" className="px-3 py-1.5 bg-rose-600 text-white font-bold rounded-lg">Опубликовать в реестр</button>
          </div>
        </form>
      )}

      {/* List of risks */}
      <div className="space-y-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
          <input 
            id="risk-search"
            type="text" 
            placeholder="Быстрый поиск рисков..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full text-xs border bg-white pl-8 pr-4 py-2 rounded-xl"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map(risk => (
            <div key={risk.id} className="bg-white border rounded-2xl p-5 shadow-xs hover:shadow transition-shadow space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-slate-50 p-2 border rounded-xl">
                  <span className="text-[9px] font-mono font-bold uppercase text-slate-400">{risk.category}</span>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase font-mono ${
                    risk.level === 'critical' ? 'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse' :
                    risk.level === 'high' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                    'bg-slate-50 text-slate-600'
                  }`}>
                    {risk.level === 'critical' ? 'Критический' : risk.level === 'high' ? 'Высокий' : 'Средний'}
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="font-bold text-slate-800 text-xs">{risk.title}</h3>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/50">
                    <span className="text-[8px] font-bold text-rose-500 uppercase tracking-wider block">Действия по снижению угрозы</span>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed font-sans">{risk.mitidgationPlan}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-3 flex justify-between items-center text-[10px] text-slate-400">
                <span className="font-semibold block truncate max-w-[150px]">{risk.reporter}</span>
                {risk.status === 'active' ? (
                  <button 
                    onClick={() => handleMitigated(risk.id)}
                    className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-[9px] font-bold uppercase"
                  >
                    Решить инцидент
                  </button>
                ) : (
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <CheckCircle size={13} /> Угроза устранена
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
