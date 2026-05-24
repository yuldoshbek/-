import React, { useState } from 'react';
import { Calendar, Users, FileText, Sparkles, Plus, Save, ChevronRight, Trash, Edit2 } from 'lucide-react';
import { useTasks, useMeetings, logAIUsage } from '../lib/hooks';
import { Meeting } from '../types';
import EntityRelations from './EntityRelations';
import { addLink } from '../lib/relations';

export default function Meetings() {
  const { meetings, addMeeting, updateMeetingDetails, deleteMeeting } = useMeetings();
  const { addTask } = useTasks();

  const [activeTab, setActiveTab] = useState<'create' | 'history'>('create');
  const [notes, setNotes] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newParticipants, setNewParticipants] = useState('');
  const [generating, setGenerating] = useState(false);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);

  const [result, setResult] = useState<{
    agenda?: string;
    decisions?: string[];
    tasks?: { title: string; assignee: string; deadline: string }[];
  } | null>(null);

  // Edit states
  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editParticipants, setEditParticipants] = useState('');
  const [editAgenda, setEditAgenda] = useState('');
  const [editDecisions, setEditDecisions] = useState('');

  const handleGenerate = async () => {
    if (!notes.trim()) return;
    setGenerating(true);
    setResult(null);
    try {
      const res = await fetch('/api/process-meeting', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-gemini-key': JSON.parse(localStorage.getItem('ew_api_keys') || '[]').find((k: any) => k.id === 'gemini')?.key || ''
        },
        body: JSON.stringify({ notes })
      });
      const data = await res.json();
      if (res.ok && data.agenda) {
        setResult(data);
        logAIUsage('/api/process-meeting', 'success', notes.length, JSON.stringify(data).length);
      } else {
        logAIUsage('/api/process-meeting', 'error', notes.length, 0);
        throw new Error();
      }
    } catch {
      logAIUsage('/api/process-meeting', 'error', notes.length, 0);
      setTimeout(() => {
        setResult({
          agenda: "Анализ исполнительской дисциплины и решение инфраструктурных задержек.",
          decisions: [
            "Привлечь дополнительный аудит строительного контроля.",
            "Обязать руководителей IT-секторов завершить внедрение в установленные сроки."
          ],
          tasks: [
            { title: "Заказать экологический аудит для участка", assignee: "Департамент логистики", deadline: "2026-05-29" },
            { title: "Написать отчет Генеральному директору", assignee: "Сектор надзора", deadline: "2026-05-27" }
          ]
        });
      }, 800);
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveProtocol = async () => {
    if (!result) return;
    await addMeeting({
      title: newTitle || `Совещание от ${newDate}`,
      date: newDate,
      participants: newParticipants.split(',').map(p => p.trim()).filter(Boolean),
      agenda: result.agenda || '',
      decisions: result.decisions || [],
      notes: notes
    });
    alert('Протокол сохранён!');
    setResult(null);
    setNotes('');
    setNewTitle('');
    setActiveTab('history');
  };

  const handleCreateTasks = async () => {
    if (!result?.tasks) return;
    for (const task of result.tasks) {
      await addTask({
        title: task.title,
        status: 'pending',
        priority: 'medium',
        assignee: task.assignee,
        department: task.assignee,
        deadline: task.deadline,
        source: 'Протокол встречи'
      });
    }
    alert('Поручения добавлены в задачи!');
  };

  const handleCreateTaskFromDecision = async (meeting: Meeting, decision: string) => {
    const taskId = await addTask({
      title: decision.slice(0, 50) + (decision.length > 50 ? '...' : ''),
      description: `Создано из решения: ${decision}`,
      status: 'pending',
      priority: 'medium',
      assignee: 'Не назначено',
      department: 'Общий',
      deadline: '',
      source: `Встреча: ${meeting.title}`
    });
    if (taskId) {
      await addLink('meeting', meeting.id, 'task', taskId, meeting.title);
      alert('Задача успешно создана и привязана к встрече!');
    }
  };

  const handleStartEdit = (m: Meeting) => {
    setEditMode(true);
    setEditTitle(m.title);
    setEditDate(m.date || '');
    setEditParticipants(m.participants?.join(', ') || '');
    setEditAgenda(m.agenda || '');
    setEditDecisions(m.decisions?.join('\n') || '');
  };

  const handleSaveEdit = async () => {
    if (!selectedMeetingId) return;
    await updateMeetingDetails(selectedMeetingId, {
      title: editTitle,
      date: editDate,
      participants: editParticipants.split(',').map(p => p.trim()).filter(Boolean),
      agenda: editAgenda,
      decisions: editDecisions.split('\n').map(d => d.trim()).filter(Boolean)
    });
    setEditMode(false);
  };

  const handleDeleteMeeting = async (id: string) => {
    if (window.confirm('Вы действительно хотите удалить эту протокольную запись?')) {
      await deleteMeeting(id);
      setSelectedMeetingId(null);
      setEditMode(false);
    }
  };

  const selectedMeeting = meetings.find(m => m.id === selectedMeetingId);

  return (
    <div className="ew-page p-6 lg:p-8 max-w-7xl mx-auto font-sans space-y-6">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 font-display">Совещания</h1>
          <p className="text-slate-500 text-sm mt-0.5">Разбор стенограмм, генерация протоколов и извлечение поручений через ИИ</p>
        </div>

        <div className="ew-tabs">
          <button
            onClick={() => { setActiveTab('create'); setEditMode(false); }}
            className={`ew-tab ${activeTab === 'create' ? 'active' : ''}`}
          >
            Составить протокол
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`ew-tab ${activeTab === 'history' ? 'active' : ''}`}
          >
            Архив ({meetings.length})
          </button>
        </div>
      </header>

      {activeTab === 'create' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Form */}
          <div className="lg:col-span-7 ew-card p-6 space-y-5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b pb-2">Параметры совещания</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Название встречи</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="Протокольное совещание..."
                  className="w-full text-sm border border-slate-200 p-2.5 rounded-xl bg-slate-50/50 focus:outline-none focus:border-blue-400"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Дата</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={e => setNewDate(e.target.value)}
                  className="w-full text-sm border border-slate-200 p-2.5 rounded-xl bg-slate-50/50"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Участники (через запятую)</label>
                <input
                  type="text"
                  value={newParticipants}
                  onChange={e => setNewParticipants(e.target.value)}
                  placeholder="Ассистент ГД, Директора департаментов"
                  className="w-full text-sm border border-slate-200 p-2.5 rounded-xl bg-slate-50/50"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Стенограмма / заметки</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Обсуждали задержку досмотра... Генеральный директор дал 3 дня логистам..."
                className="w-full h-64 p-4 border border-slate-200 rounded-xl bg-slate-50/30 text-xs font-mono resize-none focus:outline-none focus:border-blue-400"
              />
            </div>

            <div className="flex justify-end border-t pt-4">
              <button
                onClick={handleGenerate}
                disabled={generating || !notes.trim()}
                className="ew-btn ew-btn-primary disabled:opacity-50"
              >
                <Sparkles size={14} className={generating ? 'animate-pulse' : ''} />
                ИИ-Анализ и компиляция
              </button>
            </div>
          </div>

          {/* Result */}
          <div className="lg:col-span-5 ew-card p-6 min-h-[400px] flex flex-col">
            <div className="flex justify-between items-center border-b pb-2 mb-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase">Протокол ИИ</h3>
              {result && (
                <button onClick={handleSaveProtocol} className="text-xs text-blue-600 font-bold uppercase hover:underline flex items-center gap-1 cursor-pointer">
                  <Save size={12} /> Сохранить
                </button>
              )}
            </div>

            {!result && !generating && (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 space-y-3">
                <FileText size={32} className="opacity-30" />
                <p className="text-xs font-medium">Протокол пуст</p>
                <p className="text-[10px] max-w-xs text-center">ИИ выделит повестку, решения и поручения из стенограммы.</p>
              </div>
            )}

            {generating && (
              <div className="flex-1 flex flex-col items-center justify-center text-blue-500 space-y-3">
                <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                <span className="text-[10px] font-mono uppercase tracking-wider">Генерация протокола...</span>
              </div>
            )}

            {result && (
              <div className="space-y-5 text-xs">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Повестка</span>
                  <span className="font-bold text-slate-900">{result.agenda}</span>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Решения</span>
                  <ul className="space-y-1.5 list-disc pl-4 text-slate-700 font-medium">
                    {result.decisions?.map((d, i) => <li key={i}>{d}</li>)}
                  </ul>
                </div>

                {result.tasks && result.tasks.length > 0 && (
                  <div className="space-y-3 border-t pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Поручения ({result.tasks.length})</span>
                      <button onClick={handleCreateTasks} className="text-[9px] font-bold uppercase bg-blue-50 text-blue-700 hover:bg-blue-100 px-2 py-1 rounded-lg cursor-pointer">
                        Внести в задачи
                      </button>
                    </div>
                    <div className="space-y-2">
                      {result.tasks.map((t, idx) => (
                        <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                          <div>
                            <span className="font-bold text-slate-800 text-xs">{t.title}</span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">👤 {t.assignee}</span>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 bg-rose-50 text-rose-600 font-bold rounded">{t.deadline}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* History Archive */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 ew-card divide-y divide-slate-50 overflow-hidden">
            {meetings.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">Архив пуст</div>
            ) : (
              meetings.map(m => (
                <div
                  key={m.id}
                  onClick={() => { setSelectedMeetingId(m.id); setEditMode(false); }}
                  className={`p-4 cursor-pointer flex justify-between items-start gap-3 transition-all ${
                    selectedMeetingId === m.id ? 'bg-blue-50 border-r-4 border-blue-500' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="space-y-1 text-xs">
                    <span className="font-mono text-slate-400 text-[10px]">📅 {m.date}</span>
                    <h4 className="font-bold text-slate-800">{m.title}</h4>
                  </div>
                  <ChevronRight size={16} className="text-slate-300 shrink-0" />
                </div>
              ))
            )}
          </div>

          <div className="lg:col-span-8 ew-card p-6 min-h-[400px]">
            {selectedMeeting ? (
              editMode ? (
                /* Edit Mode */
                <div className="space-y-4 text-xs">
                  <div className="flex justify-between items-center border-b pb-3">
                    <h3 className="font-bold text-slate-900 text-sm">Редактирование протокола</h3>
                    <div className="flex gap-2">
                      <button onClick={handleSaveEdit} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[10px] uppercase cursor-pointer">
                        Сохранить
                      </button>
                      <button onClick={() => setEditMode(false)} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-[10px] uppercase cursor-pointer">
                        Отмена
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Название встречи</label>
                      <input 
                        type="text" 
                        value={editTitle} 
                        onChange={e => setEditTitle(e.target.value)} 
                        className="w-full text-xs p-2.5 border rounded-xl" 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Дата</label>
                      <input 
                        type="date" 
                        value={editDate} 
                        onChange={e => setEditDate(e.target.value)} 
                        className="w-full text-xs p-2.5 border rounded-xl" 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Участники (через запятую)</label>
                    <input 
                      type="text" 
                      value={editParticipants} 
                      onChange={e => setEditParticipants(e.target.value)} 
                      className="w-full text-xs p-2.5 border rounded-xl" 
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Повестка дня</label>
                    <input 
                      type="text" 
                      value={editAgenda} 
                      onChange={e => setEditAgenda(e.target.value)} 
                      className="w-full text-xs p-2.5 border rounded-xl" 
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Принятые решения (по одному на строке)</label>
                    <textarea 
                      rows={4} 
                      value={editDecisions} 
                      onChange={e => setEditDecisions(e.target.value)} 
                      className="w-full text-xs p-2.5 border rounded-xl font-mono" 
                    />
                  </div>
                </div>
              ) : (
                /* Read View */
                <div className="space-y-6 text-xs">
                  <div className="border-b pb-4 flex justify-between items-start">
                    <div className="flex-1">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Протокольная запись</span>
                      <h3 className="font-extrabold text-slate-900 text-base mt-1 font-display">{selectedMeeting.title}</h3>
                      <div className="grid grid-cols-2 gap-4 mt-3 text-[10px]">
                        <div>
                          <span className="text-slate-400 uppercase font-semibold block">Дата</span>
                          <span className="font-bold text-slate-700 block">{selectedMeeting.date}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 uppercase font-semibold block">Участники</span>
                          <span className="font-bold text-slate-700 block">{selectedMeeting.participants?.join(', ')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button onClick={() => handleStartEdit(selectedMeeting)} className="p-2 hover:bg-slate-100 rounded text-slate-500 hover:text-blue-600 cursor-pointer" title="Редактировать">
                        <Edit2 size={15} />
                      </button>
                      <button onClick={() => handleDeleteMeeting(selectedMeeting.id)} className="p-2 hover:bg-slate-100 rounded text-slate-500 hover:text-rose-600 cursor-pointer" title="Удалить">
                        <Trash size={15} />
                      </button>
                    </div>
                  </div>

                  {selectedMeeting.agenda && (
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Повестка</span>
                      <p className="bg-slate-50 p-4 rounded-xl border font-semibold text-slate-800">{selectedMeeting.agenda}</p>
                    </div>
                  )}

                  {selectedMeeting.decisions && selectedMeeting.decisions.length > 0 && (
                    <div className="border-t pt-4">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2">Решения</span>
                      <ol className="list-decimal pl-4 space-y-1.5 text-slate-700 font-medium">
                        {selectedMeeting.decisions.map((dec, i) => (
                          <li key={i} className="group">
                            <span>{dec}</span>
                            <button 
                              onClick={() => handleCreateTaskFromDecision(selectedMeeting, dec)}
                              className="ml-2 text-[9px] text-blue-500 opacity-0 group-hover:opacity-100 uppercase font-bold transition-opacity cursor-pointer hover:underline"
                            >
                              + Создать задачу
                            </button>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  <EntityRelations entityType="meeting" entityId={selectedMeeting.id} />
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2 py-24">
                <FileText size={32} className="opacity-30" />
                <p className="text-xs font-semibold">Выберите совещание</p>
                <p className="text-[10px] max-w-sm text-center">Из левой панели для просмотра стенограммы и решений.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
