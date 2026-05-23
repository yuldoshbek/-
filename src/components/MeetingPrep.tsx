import React, { useState } from 'react';
import { 
  Calendar, 
  Search, 
  Plus, 
  Trash2, 
  CheckSquare, 
  Users, 
  FileText, 
  Sparkles 
} from 'lucide-react';

interface PrepItem {
  id: string;
  checklistName: string;
  status: 'pending' | 'completed';
}

const mockPreps: PrepItem[] = [
  { id: 'prep-1', checklistName: 'Заказать конференц-зал и проверить ЖК дисплей', status: 'completed' },
  { id: 'prep-2', checklistName: 'Согласовать повестку дня с Юрисконсультом Администрации', status: 'pending' },
  { id: 'prep-3', checklistName: 'Разослать печатные раздаточные материалы членам правления', status: 'pending' }
];

export default function MeetingPrep() {
  const [preps, setPreps] = useState<PrepItem[]>(mockPreps);
  const [newCheck, setNewCheck] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCheck.trim()) return;

    const fresh: PrepItem = {
      id: `prep-${Date.now()}`,
      checklistName: newCheck.trim(),
      status: 'pending'
    };

    setPreps([...preps, fresh]);
    setNewCheck('');
  };

  const handleToggle = (id: string) => {
    setPreps(preps.map(p => p.id === id ? { ...p, status: p.status === 'completed' ? 'pending' : 'completed' } : p));
  };

  const handleDelete = (id: string) => {
    setPreps(preps.filter(p => p.id !== id));
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6 font-sans">
      <header className="border-b border-slate-200/60 pb-5">
        <span className="text-xs font-bold text-[#4B5563] uppercase tracking-widest font-display">Планирование Коллегий</span>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-display mt-1">Центр подготовки к совещанию (Meeting Prep Center)</h1>
        <p className="text-slate-500 text-sm mt-0.5">Вспомогательный чек-лист организатора, резервирование залов, сбор повесток и распределение презентаций ТМК.</p>
      </header>

      {/* Checklist area */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white border rounded-2xl p-5 shadow-xs space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 border-b pb-2">
            <CheckSquare size={14} className="text-blue-500" />
            <span>Чек-лист организационного протокольника</span>
          </h3>

          <form onSubmit={handleAdd} className="flex gap-2">
            <input 
              id="prep-checklist-input"
              type="text" 
              placeholder="Новое организационное действие..." 
              value={newCheck}
              onChange={e => setNewCheck(e.target.value)}
              className="w-full text-xs p-2 border rounded-xl"
            />
            <button 
              type="submit"
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1 text-xs rounded-xl"
            >
              Добавить
            </button>
          </form>

          <div className="space-y-2.5 pt-2">
            {preps.map(p => (
              <div key={p.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl hover:bg-slate-100/70 transition-all font-sans text-xs">
                <div className="flex gap-2.5 items-center">
                  <input 
                    type="checkbox" 
                    checked={p.status === 'completed'} 
                    onChange={() => handleToggle(p.id)}
                    className="h-4 w-4 text-blue-600 border-slate-300 rounded cursor-pointer"
                  />
                  <span className={`${p.status === 'completed' ? 'line-through text-slate-400 font-medium' : 'font-bold text-slate-700'}`}>{p.checklistName}</span>
                </div>

                <button 
                  onClick={() => handleDelete(p.id)}
                  className="text-slate-400 hover:text-rose-600 transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Resources card */}
        <div className="bg-gradient-to-br from-[#111827] to-[#1F2937] text-slate-105 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-amber-400" />
            <span className="text-xs font-mono font-bold tracking-wider text-amber-400 uppercase">Организационный навигатор ТМК</span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Помощник позволяет увязать подготовку с облачным Google Drive. Создайте папку на Гугл Диске, залейте туда документы встречи, и они автоматически подтянутся в отчеты участников.
          </p>

          <div className="space-y-2 text-xs border-t border-slate-800 pt-3">
            <div className="font-bold text-white">Регламент проверки:</div>
            <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
              <li>За 48 часов: рассылка повестки.</li>
              <li>За 24 часа: загрузка докладов и презентаций.</li>
              <li>За 2 часа: проверка связи в аудио-зале.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
