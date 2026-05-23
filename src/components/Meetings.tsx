import React, { useState } from 'react';
import { Calendar as CalendarIcon, Users, FileText, Sparkles, Plus, Clock } from 'lucide-react';
import { useTasks } from '../lib/hooks';

export default function Meetings() {
  const [notes, setNotes] = useState('');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{
    agenda?: string;
    decisions?: string[];
    tasks?: { title: string; assignee: string; deadline: string }[];
  } | null>(null);

  const { addTask } = useTasks();

  const handleGenerate = async () => {
    if (!notes.trim()) return;
    setGenerating(true);
    setResult(null);
    try {
      const res = await fetch('/api/process-meeting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes })
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
      } else {
        alert(data.error || 'Ошибка при обработке');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  const handleCreateTasks = async () => {
    if (!result?.tasks) return;
    for (const task of result.tasks) {
      await addTask({
        title: task.title,
        status: 'pending',
        priority: 'medium',
        assignee: task.assignee,
        deadline: task.deadline,
        source: 'Протокол встречи'
      });
    }
    alert('Задачи успешно добавлены!');
  };

  return (
    <div className="max-w-5xl mx-auto p-8">
      <div className="flex items-center gap-3 mb-8">
        <CalendarIcon className="text-blue-600" size={28} />
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Встречи и Протоколы</h1>
          <p className="text-slate-500 mt-1">Автоматическое создание протоколов и извлечение задач</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col">
          <label className="block text-sm font-semibold text-slate-700 mb-2">Стенограмма или Черновик</label>
          <textarea 
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Вставьте ваши заметки со встречи... Например: Сегодня обсуждали бюджет с отделом финансов. Решили сократить расходы на 10%. Финансисты должны сдать отчет к пятнице."
            className="w-full flex-1 min-h-[300px] p-4 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-slate-700"
          />
          
          <div className="mt-4 flex justify-end">
            <button 
              onClick={handleGenerate}
              disabled={generating || !notes.trim()}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg font-medium transition-colors cursor-pointer"
            >
              <Sparkles size={18} className={generating ? 'animate-pulse' : ''} />
              {generating ? 'Анализ...' : 'Сформировать Протокол'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col overflow-hidden">
          <h2 className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-4 border-b border-slate-100 pb-2">Результат Анализа</h2>
          
          {!result && !generating && (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
              <FileText size={48} className="mb-4 opacity-20" />
              <p>Вставьте текст и нажмите «Сформировать Протокол», чтобы ИИ выделил решения и задачи.</p>
            </div>
          )}

          {generating && (
            <div className="flex-1 flex items-center justify-center text-blue-400">
              <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
            </div>
          )}

          {result && (
            <div className="flex-1 overflow-auto animate-in fade-in space-y-6">
              <div>
                <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <FileText size={16} className="text-slate-400" />
                  Повестка (Kun tartibi)
                </h3>
                <p className="text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">{result.agenda}</p>
              </div>

              <div>
                <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <Users size={16} className="text-slate-400" />
                  Принятые решения (Qarorlar)
                </h3>
                <ul className="space-y-2">
                  {result.decisions?.map((decision, i) => (
                    <li key={i} className="flex gap-2 text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <span className="text-blue-500 font-bold w-4">{i + 1}.</span>
                      {decision}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                    <Clock size={16} className="text-slate-400" />
                    Поручения (Topshiriqlar)
                  </h3>
                  {result.tasks && result.tasks.length > 0 && (
                    <button 
                      onClick={handleCreateTasks}
                      className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={14} /> Добавить в Трекер
                    </button>
                  )}
                </div>
                
                {result.tasks?.length === 0 ? (
                  <p className="text-slate-500 italic text-sm">Задачи не обнаружены.</p>
                ) : (
                  <div className="space-y-2">
                    {result.tasks?.map((task, i) => (
                      <div key={i} className="bg-white border border-slate-200 p-3 rounded-lg flex flex-col gap-1 shadow-sm">
                        <span className="font-medium text-slate-900">{task.title}</span>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          {task.assignee && <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600">👤 {task.assignee}</span>}
                          {task.deadline && <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded font-medium">⏰ {task.deadline}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
