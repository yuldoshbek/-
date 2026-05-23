import React, { useState } from 'react';
import { 
  Bell, 
  Search, 
  Plus, 
  Trash2, 
  Check, 
  Calendar, 
  Clock, 
  Sliders 
} from 'lucide-react';
import { useReminders } from '../lib/hooks';
import { RemindItem } from '../types';

export default function Reminders() {
  const { reminders, addReminder, updateReminderStatus, deleteReminder } = useReminders();

  const [text, setText] = useState('');
  const [datetime, setDatetime] = useState('');
  const [method, setMethod] = useState<RemindItem['method']>('Telegram');
  const [showAdd, setShowAdd] = useState(false);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !datetime) return;

    addReminder({
      text: text.trim(),
      datetime,
      method,
      status: 'pending'
    });

    setText('');
    setDatetime('');
    setShowAdd(false);
  };

  const handleComplete = (id: string) => {
    updateReminderStatus(id, 'sent');
  };

  const handleDelete = (id: string) => {
    deleteReminder(id);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6 font-sans">
      <header className="border-b border-slate-200/60 pb-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs font-bold text-amber-600 uppercase tracking-widest font-display">Контроль дедлайнов</span>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-display mt-1">Напоминания (Reminders)</h1>
          <p className="text-slate-500 text-sm mt-0.5">Push-уведомления исполнителям, периодические напоминания в Telegram и SMS СЭД Администрации.</p>
        </div>

        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs uppercase cursor-pointer"
        >
          <Plus size={15} />
          <span>Добавить триггер</span>
        </button>
      </header>

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-white border rounded-2xl p-5 shadow-xs space-y-4 text-xs max-w-lg mx-auto">
          <h3 className="text-xs font-bold uppercase text-slate-800">Настройка планировщика СЭД</h3>
          
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Суть напоминания / Текст PUSH</label>
            <input 
              id="rem-text"
              type="text" 
              placeholder="Собрать подписи уполномоченных замов..." 
              value={text}
              onChange={e => setText(e.target.value)}
              className="w-full p-2 border rounded-xl font-medium"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Дата и время</label>
              <input 
                id="rem-datetime"
                type="datetime-local" 
                value={datetime}
                onChange={e => setDatetime(e.target.value)}
                className="w-full p-2 border rounded-xl"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Канал связи</label>
              <select 
                id="rem-method"
                value={method}
                onChange={e => setMethod(e.target.value as any)}
                className="w-full p-2 border rounded-xl font-bold"
              >
                <option value="Telegram">Telegram Авто-бот</option>
                <option value="SMS">СМС Шлюз</option>
                <option value="Sber-Push">Executive OS Push</option>
                <option value="Email">Электронная почта</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 text-xs pt-2">
            <button type="button" onClick={() => setShowAdd(false)} className="px-3 py-1.5 hover:bg-slate-100 rounded-lg">Отмена</button>
            <button type="submit" className="px-3 py-1.5 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-700">Активировать</button>
          </div>
        </form>
      )}

      {/* List of active notifications */}
      <div className="bg-white border rounded-2xl p-6 shadow-xs space-y-4">
        <h3 className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Bell size={14} className="text-amber-500 animate-bounce" />
          <span>Активные триггеры оповещения</span>
        </h3>

        <div className="space-y-3">
          {reminders.map(rem => (
            <div key={rem.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50 border p-4 rounded-xl gap-4">
              <div className="space-y-1">
                <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase font-mono ${
                  rem.status === 'sent' ? 'bg-slate-200 text-slate-600' : 'bg-amber-100 text-amber-800'
                }`}>
                  {rem.method} // {rem.status === 'sent' ? 'Отправлено' : 'Ожидает'}
                </span>
                <p className="font-bold text-slate-800 text-xs leading-snug">{rem.text}</p>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                  <Clock size={12} />
                  <span>{new Date(rem.datetime).toLocaleString('ru-RU')}</span>
                </div>
              </div>

              <div className="flex gap-1.5 self-end sm:self-auto">
                {rem.status === 'pending' && (
                  <button 
                    onClick={() => handleComplete(rem.id)}
                    className="p-1 px-2.5 bg-emerald-50 hover:bg-emerald-105 border border-emerald-250 text-emerald-700 rounded-lg text-[10px] font-bold flex items-center gap-0.5"
                    title="Пометить как исполненное"
                  >
                    <Check size={12} />
                    <span>Отправить сейчас</span>
                  </button>
                )}
                <button 
                  onClick={() => handleDelete(rem.id)}
                  className="p-1 px-2 hover:bg-rose-50 border text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}

          {reminders.length === 0 && (
            <p className="text-center text-slate-400 text-xs py-8">Нет настроенных напоминаний.</p>
          )}
        </div>
      </div>
    </div>
  );
}
