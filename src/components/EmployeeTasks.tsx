import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Plus, 
  Filter, 
  CheckSquare, 
  MessageSquare, 
  UserPlus, 
  FileCheck2 
} from 'lucide-react';

interface EmployeeTask {
  id: string;
  employeeName: string;
  role: string;
  department: string;
  taskTitle: string;
  status: 'active' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high' | 'critical';
  deadline: string;
  kpiImpact: number;
  comments: string[];
}

const initialEmployeeTasks: EmployeeTask[] = [
  {
    id: 'emp-t-1',
    employeeName: 'Ахмедов Рустам',
    role: 'Ведущий инженер',
    department: 'Департамент IT и цифровизации',
    taskTitle: 'Проверить интеграцию почты в СЭД по новому API',
    status: 'active',
    priority: 'high',
    deadline: '2026-05-26',
    kpiImpact: 15,
    comments: ['Логи на сервере чистые', 'Ожидаем подтверждения токена ГТК']
  },
  {
    id: 'emp-t-2',
    employeeName: 'Кадырова Малика',
    role: 'Старший экономист',
    department: 'Финансовый департамент',
    taskTitle: 'Сверить расчеты по НДС за 1-й квартал с налоговой',
    status: 'completed',
    priority: 'high',
    deadline: '2026-05-20',
    kpiImpact: 20,
    comments: ['Акт сверки подписан', 'Разрешений больше не требуется']
  },
  {
    id: 'emp-t-3',
    employeeName: 'Юсупов Тимур',
    role: 'Менеджер по закупкам',
    department: 'Департамент логистики и закупок',
    taskTitle: 'Оформить заявки на растаможку трубной партии №44',
    status: 'overdue',
    priority: 'critical',
    deadline: '2026-05-22',
    kpiImpact: 25,
    comments: ['Таможня задерживает досмотр - ждем содействия']
  },
  {
    id: 'emp-t-4',
    employeeName: 'Сабиров Алишер',
    role: 'Аналитик СЭД',
    department: 'Аналитический сектор',
    taskTitle: 'Подготовить аналитический срез по просрочкам в майских задачах',
    status: 'active',
    priority: 'medium',
    deadline: '2026-05-27',
    kpiImpact: 10,
    comments: []
  }
];

export default function EmployeeTasks() {
  const [tasks, setTasks] = useState<EmployeeTask[]>(() => {
    const saved = localStorage.getItem('tmk_employee_tasks');
    return saved ? JSON.parse(saved) : initialEmployeeTasks;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('Все');
  const [selectedStatus, setSelectedStatus] = useState('Все');
  const [commentInput, setCommentInput] = useState<{ [key: string]: string }>({});

  // Note creation states
  const [showAddForm, setShowAddForm] = useState(false);
  const [employeeName, setEmployeeName] = useState('');
  const [role, setRole] = useState('');
  const [department, setDepartment] = useState('Департамент IT и цифровизации');
  const [taskTitle, setTaskTitle] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [deadline, setDeadline] = useState('');
  const [kpiImpact, setKpiImpact] = useState(10);

  useEffect(() => {
    localStorage.setItem('tmk_employee_tasks', JSON.stringify(tasks));
  }, [tasks]);

  const departments = ['Все', 'Департамент IT и цифровизации', 'Финансовый департамент', 'Департамент логистики и закупок', 'Аналитический сектор'];

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeName.trim() || !taskTitle.trim() || !deadline) return;

    const newTask: EmployeeTask = {
      id: `emp-t-${Date.now()}`,
      employeeName,
      role: role || 'Специалист',
      department,
      taskTitle,
      status: 'active',
      priority,
      deadline,
      kpiImpact,
      comments: []
    };

    setTasks([newTask, ...tasks]);
    setEmployeeName('');
    setRole('');
    setTaskTitle('');
    setDeadline('');
    setKpiImpact(10);
    setShowAddForm(false);
  };

  const handleStatusChange = (id: string, status: 'active' | 'completed' | 'overdue') => {
    setTasks(tasks.map(t => t.id === id ? { ...t, status } : t));
  };

  const handleAddComment = (id: string) => {
    const comment = commentInput[id];
    if (!comment || !comment.trim()) return;

    setTasks(tasks.map(t => {
      if (t.id === id) {
        return { ...t, comments: [...t.comments, comment.trim()] };
      }
      return t;
    }));

    setCommentInput({ ...commentInput, [id]: '' });
  };

  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.taskTitle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = selectedDept === 'Все' || t.department === selectedDept;
    const matchesStatus = selectedStatus === 'Все' || t.status === selectedStatus;
    return matchesSearch && matchesDept && matchesStatus;
  });

  // Calculate statistics
  const activeCount = tasks.filter(t => t.status === 'active').length;
  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const overdueCount = tasks.filter(t => t.status === 'overdue').length;
  const averageKpiImpact = tasks.length ? Math.round(tasks.reduce((acc, current) => acc + current.kpiImpact, 0) / tasks.length) : 0;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 font-sans">
      <header className="border-b border-slate-200/60 pb-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs font-bold text-blue-600 uppercase tracking-widest font-display">Операционный контроль</span>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-display mt-1">Задачи сотрудников (Employee Tasks)</h1>
          <p className="text-slate-500 text-sm mt-0.5">Персональная матрица поручений специалистов, аналитика КПЭ и трекинг ведомственных подзадач.</p>
        </div>

        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs uppercase cursor-pointer"
        >
          <UserPlus size={15} />
          <span>Назначить задачу</span>
        </button>
      </header>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        <div className="p-5 bg-white border border-slate-200/80 rounded-2xl flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">В работе</span>
            <span className="text-2xl font-extrabold text-blue-600 font-mono">{activeCount}</span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
            <TrendingUp size={20} />
          </div>
        </div>

        <div className="p-5 bg-white border border-slate-200/80 rounded-2xl flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Завершено</span>
            <span className="text-2xl font-extrabold text-emerald-600 font-mono">{completedCount}</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <CheckCircle size={20} />
          </div>
        </div>

        <div className="p-5 bg-white border border-slate-200/80 rounded-2xl flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Просрочено</span>
            <span className="text-2xl font-extrabold text-rose-600 font-mono">{overdueCount}</span>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
            <AlertTriangle size={20} />
          </div>
        </div>

        <div className="p-5 bg-white border border-slate-200/80 rounded-2xl flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Среднее КПЭ-влияние</span>
            <span className="text-2xl font-extrabold text-slate-800 font-mono">+{averageKpiImpact}%</span>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
            <FileCheck2 size={20} />
          </div>
        </div>
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="bg-white border rounded-2xl p-6 shadow-sm max-w-2xl mx-auto space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Форма распределения новой задачи</h3>
          <form onSubmit={handleAddTask} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-slate-500 block">ФИО Исполнителя</label>
              <input 
                id="emp-name"
                type="text" 
                placeholder="Сабиров Шерзод"
                value={employeeName}
                onChange={e => setEmployeeName(e.target.value)}
                className="w-full text-xs p-2.5 border rounded-xl"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-slate-500 block">Должность</label>
              <input 
                id="emp-role"
                type="text" 
                placeholder="Главный технолог"
                value={role}
                onChange={e => setRole(e.target.value)}
                className="w-full text-xs p-2.5 border rounded-xl"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] font-bold uppercase text-slate-500 block">Название поручения / задачи</label>
              <input 
                id="emp-task-title"
                type="text" 
                placeholder="Разработать регламент прохождения узлов..."
                value={taskTitle}
                onChange={e => setTaskTitle(e.target.value)}
                className="w-full text-xs p-2.5 border rounded-xl"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-slate-500 block">Департамент</label>
              <select 
                id="emp-dept"
                value={department}
                onChange={e => setDepartment(e.target.value)}
                className="w-full text-xs p-2.5 border rounded-xl"
              >
                {departments.filter(d => d !== 'Все').map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-slate-500 block">Приоритет</label>
              <select 
                id="emp-priority"
                value={priority}
                onChange={e => setPriority(e.target.value as any)}
                className="w-full text-xs p-2.5 border rounded-xl"
              >
                <option value="low">Низкий (Low)</option>
                <option value="medium">Средний (Medium)</option>
                <option value="high">Высокий (High)</option>
                <option value="critical">Критический (Critical)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-slate-500 block">Крайний срок (Deadline)</label>
              <input 
                id="emp-deadline"
                type="date"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
                className="w-full text-xs p-2.5 border rounded-xl"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-slate-500 block">Влияние на КПЭ отдела (%)</label>
              <input 
                id="emp-kpi"
                type="number"
                min="1"
                max="100"
                value={kpiImpact}
                onChange={e => setKpiImpact(Number(e.target.value))}
                className="w-full text-xs p-2.5 border rounded-xl"
                required
              />
            </div>

            <div className="md:col-span-2 pt-2 flex justify-end gap-2 text-xs font-bold">
              <button 
                type="button" 
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 hover:bg-slate-100 rounded-lg"
              >
                Отмена
              </button>
              <button 
                type="submit" 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Назначить
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters & search row */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50 border p-4 rounded-2xl">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
          <input 
            id="emp-search"
            type="text" 
            placeholder="Поиск по исполнителю или задаче..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full text-xs border bg-white pl-8 pr-4 py-2 rounded-xl text-slate-800"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Dept filter */}
          <select 
            id="emp-filter-dept"
            value={selectedDept}
            onChange={e => setSelectedDept(e.target.value)}
            className="text-xs p-2 border rounded-xl bg-white text-slate-700 font-bold"
          >
            <option value="Все">Все разделы</option>
            {departments.filter(d => d !== 'Все').map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          {/* Status filter */}
          <select 
            id="emp-filter-status"
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
            className="text-xs p-2 border rounded-xl bg-white text-slate-700 font-bold"
          >
            <option value="Все">Все статусы</option>
            <option value="active">В работе</option>
            <option value="completed">Завершенные</option>
            <option value="overdue">Просроченные</option>
          </select>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredTasks.map(task => (
          <div 
            key={task.id} 
            className="bg-white border rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:shadow transition-shadow"
          >
            <div className="space-y-3">
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono text-blue-600 font-bold uppercase tracking-wider block">{task.department}</span>
                  <h3 className="font-bold text-slate-800 text-xs leading-snug">{task.taskTitle}</h3>
                </div>

                <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase shrink-0 ${
                  task.priority === 'critical' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                  task.priority === 'high' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                  task.priority === 'medium' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                  'bg-slate-50 text-slate-700 border border-slate-200'
                }`}>
                  {task.priority === 'critical' ? 'Критичный' : task.priority === 'high' ? 'Высокий' : 'Средний'}
                </span>
              </div>

              {/* Employee Assignee card */}
              <div className="p-3 bg-slate-50 rounded-xl flex items-center gap-3">
                <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                  <Users size={16} />
                </div>
                <div>
                  <div className="font-bold text-slate-800 text-[11px]">{task.employeeName}</div>
                  <div className="text-[10px] text-slate-400">{task.role}</div>
                </div>
              </div>

              {/* Timeline info */}
              <div className="grid grid-cols-2 gap-4 text-[11px] font-mono border-y border-slate-100 py-2">
                <div className="flex items-center gap-1.5 text-slate-500">
                  <Clock size={13} />
                  <span>Дедлайн: {task.deadline}</span>
                </div>
                <div className="text-right text-indigo-600 font-bold">
                  КПЭ: +{task.kpiImpact}% к рейтингу
                </div>
              </div>

              {/* Comments list */}
              {task.comments.length > 0 && (
                <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block flex items-center gap-1">
                    <MessageSquare size={10} />
                    <span>Ход исполнения</span>
                  </span>
                  <ul className="space-y-1 text-[10px] text-slate-600 list-disc list-inside">
                    {task.comments.map((comment, index) => (
                      <li key={index} className="leading-snug">{comment}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Actions workflow trigger */}
            <div className="flex gap-2 items-center justify-between pt-2">
              <div className="flex gap-1.5">
                <button 
                  onClick={() => handleStatusChange(task.id, 'completed')}
                  className={`text-[10px] uppercase font-extrabold px-3 py-1.5 rounded-lg border transition-colors ${task.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 cursor-default' : 'hover:bg-slate-50 text-slate-500 border-slate-200'}`}
                >
                  Завершить
                </button>
                <button 
                  onClick={() => handleStatusChange(task.id, 'overdue')}
                  className={`text-[10px] uppercase font-extrabold px-3 py-1.5 rounded-lg border transition-colors ${task.status === 'overdue' ? 'bg-rose-50 text-rose-700 border-rose-200 cursor-default' : 'hover:bg-slate-50 text-slate-500 border-slate-200'}`}
                >
                  Разметить задержку
                </button>
              </div>

              {/* Comment field input */}
              <div className="flex gap-1 flex-1 max-w-[200px]">
                <input 
                  id={`comment-input-${task.id}`}
                  type="text"
                  placeholder="Добавить отчет..."
                  value={commentInput[task.id] || ''}
                  onChange={e => setCommentInput({ ...commentInput, [task.id]: e.target.value })}
                  className="p-1 border text-[10px] rounded-lg w-full"
                />
                <button 
                  onClick={() => handleAddComment(task.id)}
                  className="bg-slate-850 hover:bg-slate-900 border text-slate-700 px-2 rounded-lg text-[10px] font-bold"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
