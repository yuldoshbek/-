import React, { useState } from 'react';
import { useTasks, useDepartments, useEmployeeTasks, useReminders } from '../lib/hooks';
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
  Trash2,
  Sparkles,
  Send,
  Bell,
  Check
} from 'lucide-react';
import { Task, EmployeeTask, RemindItem } from '../types';
import EntityRelations from './EntityRelations';
import AIAdvisor from './AIAdvisor';
import { getAIHeaders } from '../lib/ai-context';

export default function Tasks() {
  const { tasks, loading, addTask, updateTaskStatus, updateTaskDetails, deleteTask } = useTasks();
  const { departments } = useDepartments();
  const { employeeTasks, loading: loadingEmpTasks, addEmployeeTask, updateEmployeeTask } = useEmployeeTasks();
  const { reminders, loading: loadingReminders, addReminder, updateReminderStatus, deleteReminder } = useReminders();

  const [activeTab, setActiveTab] = useState<'directives' | 'employee_tasks' | 'reminders' | 'delays' | 'ai_help'>('directives');
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  
  // States for filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedPriority, setSelectedPriority] = useState('All');

  // Employee tasks form state
  const [showAddEmpTaskModal, setShowAddEmpTaskModal] = useState(false);
  const [empName, setEmpName] = useState('');
  const [empRole, setEmpRole] = useState('');
  const [empDept, setEmpDept] = useState('Департамент IT и цифровизации');
  const [empTaskTitle, setEmpTaskTitle] = useState('');
  const [empPriority, setEmpPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [empDeadline, setEmpDeadline] = useState(() => new Date().toISOString().split('T')[0]);
  const [empKpi, setEmpKpi] = useState(10);

  // Reminders form state
  const [showAddRemModal, setShowAddRemModal] = useState(false);
  const [remText, setRemText] = useState('');
  const [remDatetime, setRemDatetime] = useState(() => new Date().toISOString().slice(0, 16));
  const [remMethod, setRemMethod] = useState<'SMS' | 'Telegram' | 'Sber-Push' | 'Email'>('Telegram');

  // AI Help states
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

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

  const handleAddEmpTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empTaskTitle.trim() || !empName.trim()) return;
    await addEmployeeTask({
      employeeName: empName,
      role: empRole || 'Сотрудник',
      department: empDept,
      taskTitle: empTaskTitle,
      status: 'active',
      priority: empPriority as any,
      deadline: empDeadline,
      kpiImpact: empKpi,
      comments: []
    });
    setEmpName('');
    setEmpRole('');
    setEmpTaskTitle('');
    setShowAddEmpTaskModal(false);
  };

  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!remText.trim()) return;
    await addReminder({
      text: remText,
      datetime: remDatetime,
      method: remMethod,
      status: 'pending'
    });
    setRemText('');
    setShowAddRemModal(false);
  };

  const handleAskAI = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    setAiResponse('');
    try {
      const headers = getAIHeaders();

      const res = await fetch('/api/ai/analyze-context', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          prompt: `Пользователь просит помочь с формулировкой или анализом задачи: "${aiQuery}". Сформулируй 3 идеальных варианта поручения и выдели ключевые риски. Отвечай на русском языке.`,
          systemPrompt: `Ты — ИИ-помощник по управлению задачами в Assistant OS.`,
          jsonMode: false
        })
      });
      if (res.ok) {
        const data = await res.json();
        setAiResponse(data.text ? data.text : (data.insights ? data.insights.join('\n\n') : (data.error || JSON.stringify(data, null, 2))));
      } else {
        const err = await res.json().catch(() => ({}));
        setAiResponse(`Ошибка ИИ: ${err.error || 'Неизвестная ошибка'}`);
      }
    } catch (err: any) {
      setAiResponse(`Ошибка связи с сервером: ${err.message}`);
    } finally {
      setAiLoading(false);
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

    if (loading || loadingEmpTasks || loadingReminders) {
    return <div className="p-8 text-center text-slate-400">Загрузка поручений и настроек...</div>;
  }

  const delayedTasks = filteredTasks.filter(task => {
    const isOverdue = task.status === 'overdue' || (task.deadline && new Date(task.deadline) < new Date() && task.status !== 'completed');
    return isOverdue;
  });

  return (
    <div className="ew-page p-6 lg:p-8 max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* Page Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 font-display">Задачи</h1>
          <p className="text-slate-500 text-sm mt-0.5">Поручения руководства, планирование задач и напоминаний</p>
        </div>

        <div className="flex gap-3">
          {activeTab === 'directives' && (
            <>
              <div className="ew-tabs">
                <button 
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`ew-tab flex items-center gap-1.5 ${viewMode === 'table' ? 'active' : ''}`}
                >
                  <List size={14} />
                  <span>Таблица</span>
                </button>
                <button 
                  type="button"
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
            </>
          )}

          {activeTab === 'employee_tasks' && (
            <button 
              type="button"
              onClick={() => setShowAddEmpTaskModal(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs uppercase cursor-pointer transition-colors shadow-sm"
            >
              <Plus size={16} />
              <span>Добавить Задачу Сотрудника</span>
            </button>
          )}

          {activeTab === 'reminders' && (
            <button 
              type="button"
              onClick={() => setShowAddRemModal(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs uppercase cursor-pointer transition-colors shadow-sm"
            >
              <Plus size={16} />
              <span>Создать Напоминание</span>
            </button>
          )}
        </div>
      </header>

      {/* Sub-tab navigation */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-6 -mb-px overflow-x-auto">
          {[
            { id: 'directives', label: 'Поручения' },
            { id: 'employee_tasks', label: 'Задачи сотрудников' },
            { id: 'reminders', label: 'Напоминания' },
            { id: 'delays', label: 'Задержки' },
            { id: 'ai_help', label: 'AI-помощь' }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-4 px-1 text-sm font-semibold border-b-2 cursor-pointer transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* ═══ 1. DIRECTIVES TAB ═══ */}
      {activeTab === 'directives' && (
        <div className="space-y-6">
          <AIAdvisor moduleName="tasks" contextData={filteredTasks} onExecuteAction={handleAIAction} />

          {/* Filter Panel */}
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

          {/* Directives list table */}
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
                <tbody className="divide-y divide-slate-100 text-xs">
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
      )}

      {/* ═══ 2. EMPLOYEE TASKS TAB ═══ */}
      {activeTab === 'employee_tasks' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
            <h3 className="font-bold text-slate-800 text-sm">Оперативные задачи сотрудников</h3>
            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-mono font-bold rounded">
              Всего: {employeeTasks.length}
            </span>
          </div>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="p-3">Сотрудник</th>
                <th className="p-3">Департамент / Роль</th>
                <th className="p-3">Задача</th>
                <th className="p-3">Приоритет</th>
                <th className="p-3">KPI Влияние</th>
                <th className="p-3">Дедлайн</th>
                <th className="p-3">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employeeTasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-400">Нет распределенных задач для сотрудников.</td>
                </tr>
              ) : (
                employeeTasks.map(et => (
                  <tr key={et.id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-bold text-slate-700">{et.employeeName}</td>
                    <td className="p-3">
                      <span className="font-semibold block text-slate-600">{et.role}</span>
                      <span className="text-[10px] text-slate-400 block">{et.department}</span>
                    </td>
                    <td className="p-3 text-slate-700 font-semibold">{et.taskTitle}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                        et.priority === 'critical' ? 'bg-rose-100 text-rose-800' :
                        et.priority === 'high' ? 'bg-amber-100 text-amber-800' :
                        et.priority === 'medium' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {et.priority}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-blue-600">+{et.kpiImpact}% KPI</td>
                    <td className="p-3 font-mono text-slate-500">{et.deadline}</td>
                    <td className="p-3">
                      <select
                        value={et.status}
                        onChange={(e) => updateEmployeeTask(et.id, { status: e.target.value as any })}
                        className={`text-[10px] font-bold p-1 rounded border ${
                          et.status === 'completed' ? 'bg-emerald-50 text-emerald-800' :
                          et.status === 'overdue' ? 'bg-rose-50 text-rose-800' : 'bg-blue-50 text-blue-800'
                        }`}
                      >
                        <option value="active">В работе</option>
                        <option value="completed">Выполнено</option>
                        <option value="overdue">Просрочено</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ═══ 3. REMINDERS TAB ═══ */}
      {activeTab === 'reminders' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
            <h3 className="font-bold text-slate-800 text-sm">Активные напоминания ИИ-Ассистента</h3>
            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-mono font-bold rounded">
              Всего: {reminders.length}
            </span>
          </div>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="p-3">Текст напоминания</th>
                <th className="p-3">Дата и время</th>
                <th className="p-3">Канал</th>
                <th className="p-3">Статус</th>
                <th className="p-3 text-center">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reminders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-400">Список напоминаний пуст.</td>
                </tr>
              ) : (
                reminders.map(rem => (
                  <tr key={rem.id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-semibold text-slate-700">{rem.text}</td>
                    <td className="p-3 font-mono text-slate-500">{new Date(rem.datetime).toLocaleString('ru-RU')}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-bold text-[10px]">
                        💬 {rem.method}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                        rem.status === 'sent' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700 animate-pulse'
                      }`}>
                        {rem.status === 'sent' ? 'Отправлено' : 'Ожидает'}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex justify-center gap-1.5">
                        {rem.status === 'pending' && (
                          <button
                            onClick={() => updateReminderStatus(rem.id, 'sent')}
                            className="p-1 hover:bg-emerald-50 rounded text-emerald-600 font-bold text-[10px]"
                            title="Отправить сейчас"
                          >
                            <Check size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => deleteReminder(rem.id)}
                          className="p-1 hover:bg-rose-50 rounded text-rose-600"
                          title="Удалить"
                        >
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
      )}

      {/* ═══ 4. DELAYS TAB ═══ */}
      {activeTab === 'delays' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-rose-50 border-b flex justify-between items-center text-rose-800">
            <h3 className="font-bold text-sm flex items-center gap-1.5">
              <AlertTriangle size={16} />
              Просроченные и задержанные поручения
            </h3>
            <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-mono font-bold rounded">
              Найдено задержек: {delayedTasks.length}
            </span>
          </div>
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                <th className="py-3 px-4">Статус</th>
                <th className="py-3 px-4">Поручение / Департамент</th>
                <th className="py-3 px-4">Ответственный</th>
                <th className="py-3 px-4">Приоритет</th>
                <th className="py-3 px-4">Дедлайн</th>
                <th className="py-3 px-4 text-center">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {delayedTasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">Задержек по дедлайнам не обнаружено. Отличная работа!</td>
                </tr>
              ) : (
                delayedTasks.map(task => (
                  <tr key={task.id} className="hover:bg-slate-50/50 bg-rose-50/10">
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded font-bold text-[9px] uppercase tracking-wider">
                        Просрочено
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-sm">
                      <span className="font-semibold block text-slate-900">{task.title}</span>
                      <span className="text-[10px] text-slate-400 block">{task.department}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-700 block">{task.assignee}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md font-bold text-[9px] uppercase bg-rose-100 text-rose-800">
                        {task.priority?.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-[10px] text-rose-600 font-bold">📅 {task.deadline}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button onClick={() => handleEditClick(task)} className="p-1 hover:bg-slate-150 rounded text-blue-600 cursor-pointer" title="Редактировать">
                          <Edit2 size={13} />
                        </button>
                        <button onClick={() => handleDeleteClick(task.id)} className="p-1 hover:bg-slate-150 rounded text-rose-600 cursor-pointer" title="Удалить">
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
      )}

      {/* ═══ 5. AI HELP TAB ═══ */}
      {activeTab === 'ai_help' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 ew-card p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="text-blue-500" size={18} />
              <h3 className="font-bold text-slate-800 text-base">ИИ-Помощник по формулировке поручений</h3>
            </div>
            <p className="text-xs text-slate-500">
              Введите сырые мысли, тезисы или диктовку встречи. ИИ составит идеальные тексты задач, назначит приоритет и предупредит о возможных рисках со сроками.
            </p>
            <form onSubmit={handleAskAI} className="space-y-3">
              <textarea
                rows={4}
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                placeholder="Пример: нужно что бы Александр к среде подготовил бюджетную ведомость по финансам, иначе юристы не смогут согласовать лицензию..."
                className="w-full text-xs p-3 border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-none focus:border-blue-400 placeholder:text-slate-400"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={aiLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  {aiLoading ? <RefreshCw size={13} className="animate-spin" /> : <Send size={13} />}
                  Оптимизировать
                </button>
              </div>
            </form>

            {aiResponse && (
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 space-y-2">
                <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider">Предложение ИИ:</h4>
                <div className="text-xs text-blue-900 whitespace-pre-wrap leading-relaxed">
                  {aiResponse}
                </div>
              </div>
            )}
          </div>

          <div className="ew-card p-6 space-y-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Рекомендации оркестратора</h4>
            <div className="space-y-3 text-xs text-slate-600 leading-normal">
              <div className="p-3 bg-slate-50 rounded-lg border">
                <p className="font-bold text-slate-800 mb-1">💡 Четкие дедлайны</p>
                Старайтесь указывать конкретные даты в поручениях. Задачи без сроков выполняются на 45% медленнее.
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border">
                <p className="font-bold text-slate-800 mb-1">💡 KPI влияние</p>
                Привязывайте KPI влияние к задачам сотрудников. Это повышает мотивацию исполнителей.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODALS ═══ */}

      {/* Add Task Modal */}
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
                    type="text" required
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

      {/* Edit Task Modal */}
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
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-lg text-xs"
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

      {/* Add Employee Task Modal */}
      {showAddEmpTaskModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleAddEmpTask} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xl max-w-xl w-full space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base font-display">Назначить задачу сотруднику</h3>
              <button type="button" onClick={() => setShowAddEmpTaskModal(false)} className="text-slate-400 hover:text-slate-600 text-sm">Закрыть</button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">ФИО Сотрудника</label>
                  <input
                    type="text" required
                    placeholder="Например: Иванов А.И."
                    value={empName}
                    onChange={e => setEmpName(e.target.value)}
                    className="w-full text-sm border border-slate-200 p-2.5 rounded-lg bg-slate-50/50"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Должность / Роль</label>
                  <input
                    type="text" required
                    placeholder="Например: Разработчик"
                    value={empRole}
                    onChange={e => setEmpRole(e.target.value)}
                    className="w-full text-sm border border-slate-200 p-2.5 rounded-lg bg-slate-50/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Наименование задачи</label>
                <input
                  type="text" required
                  placeholder="Обновить отчетность по кварталу..."
                  value={empTaskTitle}
                  onChange={e => setEmpTaskTitle(e.target.value)}
                  className="w-full text-sm border border-slate-200 p-2.5 rounded-lg bg-slate-50/50"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Приоритет</label>
                  <select
                    value={empPriority}
                    onChange={e => setEmpPriority(e.target.value as any)}
                    className="w-full text-xs border border-slate-200 p-2.5 rounded-lg bg-white font-medium"
                  >
                    <option value="low">Низкий</option>
                    <option value="medium">Средний</option>
                    <option value="high">Высокий</option>
                    <option value="critical">Критический</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Департамент</label>
                  <select
                    value={empDept}
                    onChange={e => setEmpDept(e.target.value)}
                    className="w-full text-xs border border-slate-200 p-2.5 rounded-lg bg-white font-medium"
                  >
                    {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Дедлайн</label>
                  <input
                    type="date"
                    value={empDeadline}
                    onChange={e => setEmpDeadline(e.target.value)}
                    className="w-full text-sm border border-slate-200 p-2.5 rounded-lg bg-slate-50/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Влияние на KPI (%)</label>
                <input
                  type="number" min="1" max="100"
                  value={empKpi}
                  onChange={e => setEmpKpi(parseInt(e.target.value) || 10)}
                  className="w-full text-sm border border-slate-200 p-2.5 rounded-lg bg-slate-50/50 font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button 
                type="button" 
                onClick={() => setShowAddEmpTaskModal(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-lg text-xs"
              >
                ОТМЕНА
              </button>
              <button 
                type="submit" 
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg text-xs"
              >
                НАЗНАЧИТЬ
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Reminder Modal */}
      {showAddRemModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleAddReminder} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xl max-w-md w-full space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base font-display">Создать новое напоминание</h3>
              <button type="button" onClick={() => setShowAddRemModal(false)} className="text-slate-400 hover:text-slate-600 text-sm">Закрыть</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Текст напоминания</label>
                <input
                  type="text" required autoFocus
                  placeholder="Пример: Созвониться с директором..."
                  value={remText}
                  onChange={e => setRemText(e.target.value)}
                  className="w-full text-sm border border-slate-200 p-2.5 rounded-lg bg-slate-50/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Дата и время</label>
                  <input
                    type="datetime-local" required
                    value={remDatetime}
                    onChange={e => setRemDatetime(e.target.value)}
                    className="w-full text-sm border border-slate-200 p-2.5 rounded-lg bg-slate-50/50 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Канал уведомления</label>
                  <select
                    value={remMethod}
                    onChange={e => setRemMethod(e.target.value as any)}
                    className="w-full text-xs border border-slate-200 p-2.5 rounded-lg bg-white font-medium"
                  >
                    <option value="Telegram">Telegram</option>
                    <option value="SMS">SMS</option>
                    <option value="Email">Email</option>
                    <option value="Sber-Push">Push-уведомление</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button 
                type="button" 
                onClick={() => setShowAddRemModal(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-lg text-xs"
              >
                ОТМЕНА
              </button>
              <button 
                type="submit" 
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg text-xs"
              >
                ДОБАВИТЬ
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
