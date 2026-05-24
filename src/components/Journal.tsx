import React, { useState } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { JournalEntry } from '../types';
import { Plus, Search, AlertOctagon, CheckSquare, AlertTriangle, ArrowRight, X } from 'lucide-react';
import { useTasks, useComplaints, useDecisions, useRisks } from '../lib/hooks';
import { addLink } from '../lib/relations';
import EntityRelations from './EntityRelations';
import AIAdvisor from './AIAdvisor';

export default function Journal() {
  const { getLabel } = useWorkspace();
  const { addTask } = useTasks();
  const { complaints, addComplaint } = useComplaints();
  const { decisions, addDecision } = useDecisions();
  const { risks, addRisk } = useRisks();

  // Modal creation states
  const [showAddModal, setShowAddModal] = useState(false);
  const [newType, setNewType] = useState<'complaint' | 'decision' | 'risk'>('risk');
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');

  const [filterType, setFilterType] = useState<'all' | 'complaint' | 'decision' | 'risk'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Map and merge hooks into a unified registry
  const entries: JournalEntry[] = [
    ...complaints.map(c => ({
      id: c.id,
      type: 'complaint' as const,
      title: c.title,
      description: c.description,
      status: c.status === 'resolved' ? 'closed' as const : c.status === 'in_progress' ? 'in_progress' as const : 'open' as const,
      priority: 'medium' as const,
      userId: c.userId || 'guest',
      createdAt: c.createdAt,
      updatedAt: c.updatedAt || c.createdAt
    })),
    ...decisions.map(d => ({
      id: d.id,
      type: 'decision' as const,
      title: d.title,
      description: d.summary || '',
      status: d.status === 'Действует' ? 'open' as const : 'closed' as const,
      priority: d.category === 'Стратегическое' ? 'high' as const : 'medium' as const,
      userId: d.userId || 'guest',
      createdAt: d.createdAt,
      updatedAt: d.updatedAt
    })),
    ...risks.map(r => ({
      id: r.id,
      type: 'risk' as const,
      title: r.title,
      description: r.mitidgationPlan || '',
      status: r.status === 'active' ? 'open' as const : 'closed' as const,
      priority: r.level === 'critical' ? 'critical' as const : r.level === 'high' ? 'high' as const : r.level === 'medium' ? 'medium' as const : 'low' as const,
      userId: r.userId || 'guest',
      createdAt: r.createdAt,
      updatedAt: r.updatedAt
    }))
  ].sort((a, b) => b.createdAt - a.createdAt);

  const filtered = entries.filter(e => {
    if (filterType !== 'all' && e.type !== filterType) return false;
    if (searchQuery && !e.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'decision': return <CheckSquare size={16} className="text-emerald-500" />;
      case 'risk': return <AlertTriangle size={16} className="text-rose-500" />;
      case 'complaint': return <AlertOctagon size={16} className="text-amber-500" />;
      default: return null;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'decision': return 'Решение';
      case 'risk': return 'Риск';
      case 'complaint': return 'Жалоба/Обращение';
      default: return type;
    }
  };

  const handleCreateTaskFromJournal = async (entry: JournalEntry) => {
    const taskId = await addTask({
      title: `[${getTypeLabel(entry.type)}] ${entry.title}`.slice(0, 100),
      description: `Запись журнала: ${entry.description}`,
      status: 'pending',
      priority: entry.priority === 'critical' ? 'urgent' : entry.priority === 'high' ? 'high' : 'medium',
      assignee: 'Не назначено',
      department: 'Общий',
      deadline: '',
      source: `Журнал: ${getTypeLabel(entry.type)}`
    });
    if (taskId) {
      await addLink('journal', entry.id, 'task', taskId, entry.title);
      alert('Задача успешно создана и привязана к записи!');
    }
  };

  const handleAIAction = async (actionId: string, label: string) => {
    if (actionId.startsWith('create_task')) {
      await addTask({
        title: label.replace(/^Создать задачу:?\s*/i, ''),
        description: 'Задача создана по рекомендации ИИ-оркестратора из модуля Журнал.',
        status: 'pending',
        priority: 'high',
        assignee: 'Не назначено',
        department: 'Общий',
        deadline: '',
        source: 'AI Advisor'
      });
      alert(`Задача "${label}" успешно создана! Перейдите в раздел Задачи.`);
    } else {
      alert(`Имитация действия: ${label}`);
    }
  };

  return (
    <div className="ew-page p-6 lg:p-8 max-w-6xl mx-auto h-full flex flex-col font-sans">
      <header className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 font-display">
            {getLabel('journal')}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Единый реестр решений, рисков и обращений для быстрого реагирования
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Поиск..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 w-full md:w-64"
            />
          </div>
          <button 
            type="button"
            onClick={() => setShowAddModal(true)} 
            className="ew-btn ew-btn-primary whitespace-nowrap cursor-pointer"
          >
            <Plus size={16} /> Создать запись
          </button>
        </div>
      </header>

      {/* AI Advisor Panel */}
      <div className="mb-6 shrink-0">
        <AIAdvisor moduleName="journal" contextData={filtered} onExecuteAction={handleAIAction} />
      </div>

      <div className="flex gap-4 mb-6 border-b border-slate-200 shrink-0 overflow-x-auto pb-1">
        {[
          { id: 'all', label: 'Все записи' },
          { id: 'decision', label: 'Решения' },
          { id: 'risk', label: 'Риски' },
          { id: 'complaint', label: 'Жалобы' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setFilterType(t.id as any)}
            className={`pb-3 px-1 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
              filterType === t.id ? 'border-blue-500 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 pb-10 space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center p-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500">
            Записей не найдено.
          </div>
        ) : (
          filtered.map(entry => (
            <div key={entry.id} className="ew-card p-4 hover:shadow-md transition-shadow group flex items-start gap-4 cursor-pointer">
              <div className={`p-2.5 rounded-xl shrink-0 ${
                entry.type === 'decision' ? 'bg-emerald-50' : 
                entry.type === 'risk' ? 'bg-rose-50' : 'bg-amber-50'
              }`}>
                {getIcon(entry.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-slate-900 truncate pr-4">{entry.title}</h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${
                    entry.priority === 'critical' ? 'bg-rose-100 text-rose-700' :
                    entry.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {entry.priority}
                  </span>
                </div>
                
                <p className="text-sm text-slate-500 line-clamp-2 mb-3">{entry.description}</p>
                
                <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
                  <span>{getTypeLabel(entry.type)}</span>
                  <span>•</span>
                  <span className={
                    entry.status === 'open' ? 'text-amber-500' : 
                    entry.status === 'in_progress' ? 'text-blue-500' : 'text-emerald-500'
                  }>
                    {entry.status === 'open' ? 'Открыто' : entry.status === 'in_progress' ? 'В работе' : 'Закрыто'}
                  </span>
                </div>
                
                <EntityRelations entityType="journal" entityId={entry.id} compact={true} />
              </div>

              <div className="shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={(e) => { e.stopPropagation(); handleCreateTaskFromJournal(entry); }}
                  className="p-2 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 rounded-lg text-slate-400 transition-colors flex items-center gap-1" 
                  title="Создать задачу на основе записи"
                >
                  <span className="text-[10px] font-bold uppercase hidden md:inline">Создать задачу</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Dialog for Adding Entry */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <header className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm font-display">Новая запись в реестр</h3>
              <button 
                type="button" 
                onClick={() => setShowAddModal(false)} 
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={16} />
              </button>
            </header>

            <form 
              onSubmit={async (e) => {
                e.preventDefault();
                if (!newTitle.trim() || !newDesc.trim()) return;
                try {
                  if (newType === 'complaint') {
                    await addComplaint({
                      title: newTitle,
                      description: newDesc,
                      category: 'Жалоба',
                      status: 'pending',
                      reporter: 'Заявитель',
                      deadline: ''
                    });
                  } else if (newType === 'decision') {
                    await addDecision({
                      referenceNo: 'DEC-' + Date.now().toString().slice(-4),
                      title: newTitle,
                      category: 'Организационное',
                      date: new Date().toISOString().split('T')[0],
                      signer: 'Руководитель',
                      status: 'Действует',
                      summary: newDesc
                    });
                  } else {
                    await addRisk({
                      title: newTitle,
                      category: 'Финансовый',
                      level: newPriority,
                      mitidgationPlan: newDesc,
                      reporter: 'Аналитик',
                      status: 'active'
                    });
                  }
                  alert('Запись успешно создана!');
                  setNewTitle('');
                  setNewDesc('');
                  setShowAddModal(false);
                } catch (err: any) {
                  alert('Ошибка создания записи: ' + err.message);
                }
              }} 
              className="p-6 space-y-4 text-xs"
            >
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Тип записи</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'risk', label: 'Риск' },
                    { id: 'decision', label: 'Решение' },
                    { id: 'complaint', label: 'Обращение' }
                  ].map(t => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setNewType(t.id as any)}
                      className={`py-2 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                        newType === t.id 
                          ? 'bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-500/10' 
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Заголовок</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="Введите заголовок записи..."
                  className="w-full text-xs border border-slate-200 p-2.5 rounded-xl bg-slate-50/50 focus:outline-none focus:border-blue-400 font-medium"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Описание / Решение</label>
                <textarea
                  rows={4}
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  placeholder="Опишите суть решения, риска (и план нивелирования) или обращения..."
                  className="w-full text-xs border border-slate-200 p-2.5 rounded-xl bg-slate-50/50 focus:outline-none focus:border-blue-400"
                  required
                />
              </div>

              {newType === 'risk' && (
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Уровень критичности</label>
                  <select
                    value={newPriority}
                    onChange={e => setNewPriority(e.target.value as any)}
                    className="w-full text-xs border border-slate-200 p-2.5 rounded-xl bg-slate-50/50 focus:outline-none focus:border-blue-400 font-semibold"
                  >
                    <option value="low">Низкий (Low)</option>
                    <option value="medium">Средний (Medium)</option>
                    <option value="high">Высокий (High)</option>
                    <option value="critical">Критический (Critical)</option>
                  </select>
                </div>
              )}

              <footer className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border rounded-xl font-bold hover:bg-slate-50 text-slate-600 transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="ew-btn ew-btn-primary"
                >
                  Создать запись
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
