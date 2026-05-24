import React, { useState } from 'react';
import { useTasks, useDepartments } from '../lib/hooks';
import { 
  Plus, 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertTriangle, 
  LayoutGrid, 
  List, 
  Search, 
  Calendar,
  Edit2,
  Trash2
} from 'lucide-react';
import { Task } from '../types';
import EntityRelations from './EntityRelations';
import AIAdvisor from './AIAdvisor';

export default function Tasks() {
  const { tasks, loading, addTask, updateTaskStatus, updateTaskDetails, deleteTask } = useTasks();
  const { departments } = useDepartments();
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  
  // States for filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedPriority, setSelectedPriority] = useState('All');

  // New task form modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState<Task['priority']>('medium');
  const [newDept, setNewDept] = useState('Департамент IT и цифровизации');
  const [newAssignee, setNewAssignee] = useState('');
  const [newDeadline, setNewDeadline] = useState(() => new Date().toISOString().split('T')[0]);
  const [newSource, setNewSource] = useState('Поручение дирекции');

  // Editing task state
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPriority, setEditPriority] = useState<Task['priority']>('medium');
  const [editDept, setEditDept] = useState('');
  const [editAssignee, setEditAssignee] = useState('');
  const [editDeadline, setEditDeadline] = useState('');
  const [editStatus, setEditStatus] = useState<Task['status']>('pending');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    await addTask({
      title: newTitle,
      description: newDesc,
      priority: newPriority,
      department: newDept,
      assignee: newAssignee || 'Не назначен',
      deadline: newDeadline,
      source: newSource,
      status: 'pending'
    });
    setNewTitle('');
    setNewDesc('');
    setNewAssignee('');
    setShowAddModal(false);
  };

  const handleEditClick = (task: Task) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditDesc(task.description || '');
    setEditPriority(task.priority || 'medium');
    setEditDept(task.department || 'Департамент IT и цифровизации');
    setEditAssignee(task.assignee || '');
    setEditDeadline(task.deadline || '');
    setEditStatus(task.status || 'pending');
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    await updateTaskDetails(editingTask.id, {
      title: editTitle,
      description: editDesc,
      priority: editPriority,
      department: editDept,
      assignee: editAssignee,
      deadline: editDeadline,
      status: editStatus
    });
    setEditingTask(null);
  };

  const handleDeleteClick = async (id: string) => {
    if (window.confirm('Вы действительно хотите удалить это поручение?')) {
      await deleteTask(id);
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (task.assignee && task.assignee.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesDept = selectedDept === 'All' || task.department === selectedDept;
    const matchesPriority = selectedPriority === 'All' || task.priority === selectedPriority;
    return matchesSearch && matchesDept && matchesPriority;
  });

  const handleAIAction = (actionId: string, label: string) => {
    if (actionId.startsWith('create_task')) {
      setNewTitle(label.replace(/^Создать задачу:?\s*/i, ''));
      setNewDesc('Рекомендация ИИ-оркестратора.');
      setNewAssignee('');
      setShowAddModal(true);
    } else if (actionId.startsWith('remind_') || actionId.startsWith('send_')) {
      alert(`Действие выполнено: ${label} (Имитация отправки уведомления)`);
    } else {
      alert(`Система зафиксировала действие: ${label}`);
    }
  };

  const kanbanColumns: { id: Task['status']; title: string; color: string }[] = [
    { id: 'pending', title: 'Ожидает (Pending)', color: 'bg-slate-100 text-slate-800 border-t-slate-400' },
    { id: 'in_progress', title: 'В работе (In Progress)', color: 'bg-blue-50 text-blue-800 border-t-blue-500' },
    { id: 'completed', title: 'Выполнено (Completed)', color: 'bg-emerald-50 text-emerald-800 border-t-emerald-500' },
    { id: 'overdue', title: 'Просрочено (Overdue)', color: 'bg-rose-50 text-rose-800 border-t-rose-500' }
  ];

  if (loading) return <div className="p-8 text-center text-slate-400">Загрузка поручений...</div>;

  return (
    <div className="ew-page p-6 lg:p-8 max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* Page Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 font-display">Задачи</h1>
          <p className="text-slate-500 text-sm mt-0.5">Контроль поручений и задач департаментов</p>
        </div>

        <div className="flex gap-3">
          {/* View Toggle Badges */}
          <div className="ew-tabs">
            <button 
              onClick={() => setViewMode('table')}
              className={`ew-tab flex items-center gap-1.5 ${viewMode === 'table' ? 'active' : ''}`}
            >
              <List size={14} />
              <span>Таблица</span>
            </button>
            <button 
              onClick={() => setViewMode('kanban')}
              className={`ew-tab flex items-center gap-1.5 ${viewMode === 'kanban' ? 'active' : ''}`}
            >
              <LayoutGrid size={14} />
              <span>Канбан</span>
            </button>
          </div>

          <button 
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs uppercase cursor-pointer transition-colors shadow-sm"
          >
            <Plus size={16} />
            <span>Добавить Поручение</span>
          </button>
        </div>
      </header>

      {/* AI Advisor Panel */}
      <div className="mb-4">
        <AIAdvisor moduleName="tasks" contextData={filteredTasks} onExecuteAction={handleAIAction} />
      </div>

      {/* Filter and Search Panel */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Поиск по задачам, исполнителям..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full text-sm border border-slate-200 bg-slate-50/50 pl-9 pr-4 py-1.5 rounded-lg focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <select 
            value={selectedDept}
            onChange={e => setSelectedDept(e.target.value)}
            className="text-xs border border-slate-200 p-2 rounded-lg bg-white font-medium"
          >
            <option value="All">Все департаменты</option>
            {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
          </select>

          <select 
            value={selectedPriority}
            onChange={e => setSelectedPriority(e.target.value)}
            className="text-xs border border-slate-200 p-2 rounded-lg bg-white font-medium"
          >
            <option value="All">Все приоритеты</option>
            <option value="urgent">Срочно</option>
            <option value="high">Высокий</option>
            <option value="medium">Средний</option>
            <option value="low">Низкий</option>
          </select>
        </div>
      </div>

      {/* Add Task Modal overlay */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleAdd} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xl max-w-xl w-full space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base font-display">Постановка нового поручения</h3>
              <button type="button" onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 text-sm">Закрыть</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Краткая формулировка поручения</label>
                <input 
                  type="text" required autoFocus
                  placeholder="Например: Согласовать финансовую ведомость..."
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full text-sm border border-slate-200 p-2.5 rounded-lg bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Детальное описание / Инструкции</label>
                <textarea 
                  rows={2}
                  placeholder="Укажите подробный план действий..."
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  className="w-full text-sm border border-slate-200 p-2.5 rounded-lg bg-slate-50/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Приоритет</label>
                  <select 
                    value={newPriority}
                    onChange={e => setNewPriority(e.target.value as any)}
                    className="w-full text-xs border border-slate-200 p-2.5 rounded-lg bg-white font-medium"
                  >
                    <option value="low">Низкий (Low)</option>
                    <option value="medium">Средний (Medium)</option>
                    <option value="high">Высокий (High)</option>
                    <option value="urgent">Срочно (Urgent)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Департамент</label>
                  <select 
                    value={newDept}
                    onChange={e => setNewDept(e.target.value)}
                    className="w-full text-xs border border-slate-200 p-2.5 rounded-lg bg-white font-medium"
                  >
                    {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Исполнитель (ФИО)</label>
                  <input 
                    type="text"
                    required
                    placeholder="Ахмедов У.М."
                    value={newAssignee}
                    onChange={e => setNewAssignee(e.target.value)}
                    className="w-full text-sm border border-slate-200 p-2.5 rounded-lg bg-slate-50/50"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Крайний срок (Дедлайн)</label>
                  <input 
                    type="date"
                    value={newDeadline}
                    onChange={e => setNewDeadline(e.target.value)}
                    className="w-full text-sm border border-slate-200 p-2.5 rounded-lg bg-slate-50/50"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button 
                type="button" 
                onClick={() => setShowAddModal(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-lg text-xs"
              >
                ОТМЕНА
              </button>
              <button 
                type="submit" 
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg text-xs"
              >
                СОЗДАТЬ
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Task Modal overlay */}
      {editingTask && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleEditSave} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xl max-w-xl w-full space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base font-display">Редактирование поручения</h3>
              <button type="button" onClick={() => setEditingTask(null)} className="text-slate-400 hover:text-slate-600 text-sm">Закрыть</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Формулировка поручения</label>
                <input 
                  type="text" required autoFocus
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="w-full text-sm border border-slate-200 p-2.5 rounded-lg bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Детальное описание / Инструкции</label>
                <textarea 
                  rows={2}
                  value={editDesc}
                  onChange={e => setEditDesc(e.target.value)}
                  className="w-full text-sm border border-slate-200 p-2.5 rounded-lg bg-slate-50/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Приоритет</label>
                  <select 
                    value={editPriority}
                    onChange={e => setEditPriority(e.target.value as any)}
                    className="w-full text-xs border border-slate-200 p-2.5 rounded-lg bg-white font-medium"
                  >
                    <option value="low">Низкий (Low)</option>
                    <option value="medium">Средний (Medium)</option>
                    <option value="high">Высокий (High)</option>
                    <option value="urgent">Срочно (Urgent)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Департамент</label>
                  <select 
                    value={editDept}
                    onChange={e => setEditDept(e.target.value)}
                    className="w-full text-xs border border-slate-200 p-2.5 rounded-lg bg-white font-medium"
                  >
                    {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Исполнитель</label>
                  <input 
                    type="text" required
                    value={editAssignee}
                    onChange={e => setEditAssignee(e.target.value)}
                    className="w-full text-sm border border-slate-200 p-2.5 rounded-lg bg-slate-50/50"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Дедлайн</label>
                  <input 
                    type="date"
                    value={editDeadline}
                    onChange={e => setEditDeadline(e.target.value)}
                    className="w-full text-sm border border-slate-200 p-2.5 rounded-lg bg-slate-50/50"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Текущий статус</label>
                  <select 
                    value={editStatus}
                    onChange={e => setEditStatus(e.target.value as any)}
                    className="w-full text-xs border border-slate-200 p-2.5 rounded-lg bg-white font-medium"
                  >
                    <option value="pending">Ожидает (Pending)</option>
                    <option value="in_progress">В работе (In Progress)</option>
                    <option value="completed">Выполнено (Completed)</option>
                    <option value="overdue">Просрочено (Overdue)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button 
                type="button" 
                onClick={() => setEditingTask(null)}
                className="bg-slate-100 hover:bg-slate-250 text-slate-700 font-bold px-4 py-2 rounded-lg text-xs"
              >
                ОТМЕНА
              </button>
              <button 
                type="submit" 
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg text-xs"
              >
                СОХРАНИТЬ
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Table View */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-[10px] text-slate-400 uppercase font-bold tracking-wider font-display">
                <th className="py-3 px-4 w-12 text-center">Статус</th>
                <th className="py-3 px-4">Поручение / Инструкции</th>
                <th className="py-3 px-4">Ответственный ведомства</th>
                <th className="py-3 px-4">Приоритет</th>
                <th className="py-3 px-4">Дедлайн</th>
                <th className="py-3 px-4 w-24 text-center">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 italic-stripes text-xs">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">Активных поручений по критериям фильтра не найдено.</td>
                </tr>
              ) : (
                filteredTasks.map(task => (
                  <tr key={task.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 text-center">
                      <select 
                        value={task.status}
                        onChange={e => updateTaskStatus(task.id, e.target.value as any)}
                        className={`text-[9px] font-bold p-1 rounded-md uppercase border ${task.status === 'completed' ? 'bg-emerald-50 text-emerald-800' : task.status === 'in_progress' ? 'bg-blue-50 text-blue-800' : task.status === 'overdue' ? 'bg-rose-50 text-rose-800' : 'bg-slate-100'}`}
                      >
                        <option value="pending">Ожидает</option>
                        <option value="in_progress">В работе</option>
                        <option value="completed">Готово</option>
                        <option value="overdue">Сорвано</option>
                      </select>
                    </td>
                    <td className="py-3 px-4 max-w-sm">
                      <div className="space-y-0.5">
                        <span className={`font-semibold block ${task.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-900'}`}>{task.title}</span>
                        {task.description && <span className="text-[10px] text-slate-400 block line-clamp-1">{task.description}</span>}
                        <EntityRelations entityType="task" entityId={task.id} compact={true} />
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-700 block">{task.assignee}</span>
                        <span className="text-[9px] text-slate-400 block">{task.department}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-md font-bold text-[9px] uppercase tracking-wider ${task.priority === 'urgent' ? 'bg-rose-100 text-rose-800' : task.priority === 'high' ? 'bg-amber-100 text-amber-800' : 'bg-slate-150 text-slate-600'}`}>
                        {task.priority?.toUpperCase() || 'MEDIUM'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`font-mono text-[10px] ${task.status === 'overdue' ? 'text-rose-600 font-bold' : 'text-slate-500'}`}>{task.deadline || 'Без срока'}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button onClick={() => handleEditClick(task)} className="p-1 hover:bg-slate-100 rounded text-blue-600 cursor-pointer" title="Редактировать">
                          <Edit2 size={13} />
                        </button>
                        <button onClick={() => handleDeleteClick(task.id)} className="p-1 hover:bg-slate-100 rounded text-rose-600 cursor-pointer" title="Удалить">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* Kanban View */
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
          {kanbanColumns.map(col => {
            const colTasks = filteredTasks.filter(t => t.status === col.id);
            return (
              <div key={col.id} className="bg-[#FAFBFD]/80 rounded-xl border border-slate-200 shadow-sm p-4 h-[550px] overflow-auto flex flex-col space-y-3">
                <div className={`p-2.5 rounded-lg border-t-4 text-xs font-bold uppercase flex justify-between items-center ${col.color}`}>
                  <span>{col.title}</span>
                  <span className="bg-white/80 border border-slate-300 p-1 text-[9px] rounded leading-none">{colTasks.length}</span>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto">
                  {colTasks.length === 0 ? (
                    <div className="h-20 border border-dashed border-slate-200 rounded-lg flex items-center justify-center text-slate-400 text-[10px] text-center p-3">Нет задач в этой категории.</div>
                  ) : (
                    colTasks.map(task => (
                      <div key={task.id} className="bg-white p-3 rounded-lg border border-slate-200/80 shadow-xs space-y-2 group hover:shadow-sm">
                        <div className="flex justify-between items-start gap-1">
                          <span className="text-[10px] font-bold text-slate-700 leading-tight block">{task.title}</span>
                        </div>
                        {task.description && <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">{task.description}</p>}
                        <EntityRelations entityType="task" entityId={task.id} compact={true} />
                        
                        <div className="flex justify-between items-center pt-2 border-t border-slate-100 text-[9px] font-bold text-slate-400">
                          <span className="truncate max-w-[90px] text-slate-600">👤 {task.assignee}</span>
                          <span className="text-slate-500 font-mono">📅 {task.deadline}</span>
                        </div>

                        <div className="flex justify-end gap-1.5 pt-1">
                          <button onClick={() => handleEditClick(task)} className="text-[9px] text-blue-600 hover:underline font-bold cursor-pointer">ИЗМЕНИТЬ</button>
                          <button onClick={() => handleDeleteClick(task.id)} className="text-[9px] text-rose-600 hover:underline font-bold cursor-pointer">УДАЛИТЬ</button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
