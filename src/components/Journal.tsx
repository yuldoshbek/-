import React, { useState } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { JournalEntry } from '../types';
import { Plus, Search, AlertOctagon, CheckSquare, AlertTriangle, ArrowRight } from 'lucide-react';
import { useTasks } from '../lib/hooks';
import { addLink } from '../lib/relations';
import EntityRelations from './EntityRelations';
import AIAdvisor from './AIAdvisor';

const MOCK_JOURNAL: JournalEntry[] = [
  { id: 'j-1', type: 'decision', title: 'Внедрение новой системы контроля', description: 'Решено перейти на новую систему с 1 июня.', status: 'closed', priority: 'high', userId: 'guest', createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'j-2', type: 'risk', title: 'Срыв сроков поставки оборудования', description: 'Поставщик задерживает отправку серверов на 2 недели.', status: 'in_progress', priority: 'critical', userId: 'guest', createdAt: Date.now(), updatedAt: Date.now() },
  { id: 'j-3', type: 'complaint', title: 'Проблема с кондиционером', description: 'Сотрудники жалуются на духоту в отделе продаж.', status: 'open', priority: 'medium', userId: 'guest', createdAt: Date.now(), updatedAt: Date.now() },
];

export default function Journal() {
  const { getLabel } = useWorkspace();
  const { addTask } = useTasks();
  const [entries, setEntries] = useState<JournalEntry[]>(MOCK_JOURNAL);
  const [filterType, setFilterType] = useState<'all' | 'complaint' | 'decision' | 'risk'>('all');
  const [searchQuery, setSearchQuery] = useState('');

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
          <button className="ew-btn ew-btn-primary whitespace-nowrap">
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
    </div>
  );
}
