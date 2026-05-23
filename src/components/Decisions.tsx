import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Plus, 
  Trash2, 
  Filter, 
  Calendar, 
  Award, 
  CheckCircle2, 
  Sparkles 
} from 'lucide-react';
import { useDecisions } from '../lib/hooks';
import { Decision } from '../types';

export default function Decisions() {
  const { decisions, addDecision, updateDecisionStatus } = useDecisions();

  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('Все');
  const [showAdd, setShowAdd] = useState(false);

  // Form states
  const [refNo, setRefNo] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'Стратегическое' | 'Кадровое' | 'Финансовое' | 'Организационное'>('Стратегическое');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [signer, setSigner] = useState('Юсупов А.Т.');
  const [summary, setSummary] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !refNo.trim()) return;

    addDecision({
      referenceNo: refNo,
      title: title.trim(),
      category,
      date,
      signer,
      status: 'Действует',
      summary: summary.trim() || 'Текст решения утвержден уполномоченными членами правления.'
    });

    setRefNo('');
    setTitle('');
    setSummary('');
    setShowAdd(false);
  };

  const handleStatusChange = (id: string, status: Decision['status']) => {
    updateDecisionStatus(id, status);
  };

  const filtered = decisions.filter(d => {
    const mSearch = d.title.toLowerCase().includes(search.toLowerCase()) || 
                    d.referenceNo.toLowerCase().includes(search.toLowerCase());
    const mCat = filterCat === 'Все' || d.category === filterCat;
    return mSearch && mCat;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 font-sans">
      <header className="border-b border-slate-200/60 pb-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs font-bold text-blue-600 uppercase tracking-widest font-display">Нормативно-правовая база</span>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-display mt-1">Реестр решений дирекции (Decisions)</h1>
          <p className="text-slate-500 text-sm mt-0.5">Официальные постановления, стратегические приказы и реестр утвержденных ведомственных регламентов.</p>
        </div>

        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2.5 rounded-xl text-xs uppercase"
        >
          <Plus size={15} />
          <span>Опубликовать решение</span>
        </button>
      </header>

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-white border rounded-2xl p-6 shadow-xs max-w-2xl mx-auto space-y-4 text-xs">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest">Новое распоряжение правления</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Регистрационный номер</label>
              <input 
                id="dec-ref-no"
                type="text" 
                placeholder="Р-42/2026" 
                value={refNo}
                onChange={e => setRefNo(e.target.value)}
                className="w-full p-2 border rounded-xl"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Категория решения</label>
              <select 
                id="dec-category"
                value={category}
                onChange={e => setCategory(e.target.value as any)}
                className="w-full p-2 border rounded-xl"
              >
                <option value="Стратегическое">Стратегическое</option>
                <option value="Финансовое">Финансовое</option>
                <option value="Кадровое">Кадровое</option>
                <option value="Организационное">Организационное</option>
              </select>
            </div>
            <div className="col-span-2 space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Название приказа / Постановления</label>
              <input 
                id="dec-title"
                type="text" 
                placeholder="О переподготовке сотрудников проектного офиса..." 
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full p-2 border rounded-xl"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Подписант / Владелец лимита</label>
              <input 
                id="dec-signer"
                type="text" 
                value={signer}
                onChange={e => setSigner(e.target.value)}
                className="w-full p-2 border rounded-xl"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Дата вступления в силу</label>
              <input 
                id="dec-date"
                type="date" 
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full p-2 border rounded-xl"
                required
              />
            </div>
            <div className="col-span-2 space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Аннотация / Пояснительная записка</label>
              <textarea 
                id="dec-summary"
                rows={3} 
                value={summary}
                onChange={e => setSummary(e.target.value)}
                className="w-full p-2 border rounded-xl"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 text-xs pt-2">
            <button type="button" onClick={() => setShowAdd(false)} className="px-3 py-1.5 hover:bg-slate-100 rounded-lg">Отмена</button>
            <button type="submit" className="px-3 py-1.5 bg-blue-600 text-white font-bold rounded-lg">Зарегистрировать</button>
          </div>
        </form>
      )}

      {/* Filter and Search */}
      <div className="flex gap-4 items-center justify-between bg-slate-50 border p-4 rounded-2xl flex-wrap">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
          <input 
            id="dec-search"
            type="text" 
            placeholder="Поиск решений по номеру или ключевым словам..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full text-xs border bg-white pl-8 pr-4 py-2 rounded-xl"
          />
        </div>
        <select 
          id="dec-filter-cat"
          value={filterCat}
          onChange={e => setFilterCat(e.target.value)}
          className="text-xs p-2 border rounded-xl bg-white font-bold"
        >
          <option value="Все">Все категории</option>
          <option value="Стратегическое">Стратегические</option>
          <option value="Финансовое">Финансовые</option>
          <option value="Кадровое">Кадровые</option>
          <option value="Организационное">Организационные</option>
        </select>
      </div>

      {/* Grid of Decisions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map(dec => (
          <div key={dec.id} className="bg-white border rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border">
                <span className="text-[10px] font-mono font-extrabold text-blue-600">{dec.referenceNo}</span>
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase font-mono ${dec.status === 'Действует' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-500'}`}>
                  {dec.status}
                </span>
              </div>
              <div>
                <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest block">{dec.category}</span>
                <h3 className="font-bold text-slate-800 text-xs mt-0.5">{dec.title}</h3>
                <p className="text-slate-600 text-xs mt-2 leading-relaxed">{dec.summary}</p>
              </div>
            </div>

            <div className="border-t pt-4 flex justify-between items-center text-[10px] text-slate-400 font-mono">
              <span className="flex items-center gap-1">
                <Calendar size={12} />
                <span>Утверждено: {dec.date}</span>
              </span>
              <span className="font-semibold text-slate-700">{dec.signer}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
