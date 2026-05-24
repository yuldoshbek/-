import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { Employee, Department } from '../types';
import { 
  Plus, 
  Search, 
  User, 
  Building, 
  Briefcase, 
  X, 
  Trash2,
  TrendingUp,
  BarChart2,
  History,
  ShieldCheck,
  UserCheck,
  Percent,
  Calendar
} from 'lucide-react';
import { useEmployees, useDepartments, useEmployeeTasks } from '../lib/hooks';

export default function Team() {
  const { getLabel } = useWorkspace();
  const { employees, addEmployee, deleteEmployee, loading: loadingEmployees } = useEmployees();
  const { departments } = useDepartments();
  const { employeeTasks } = useEmployeeTasks();

  // Sub-tabs state
  const [activeTab, setActiveTab] = useState<'employees' | 'departments' | 'responsibility' | 'workload' | 'history'>('employees');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newPosition, setNewPosition] = useState('');
  const [newDeptId, setNewDeptId] = useState('');
  const [newStatus, setNewStatus] = useState<'active' | 'vacation' | 'inactive'>('active');

  // Set default department ID on load
  useEffect(() => {
    if (departments.length > 0 && !newDeptId) {
      setNewDeptId(departments[0].id);
    }
  }, [departments, newDeptId]);

  const filteredEmployees = employees.filter(e => 
    e.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.position.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmitEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName.trim() || !newPosition.trim() || !newDeptId) return;

    try {
      await addEmployee({
        fullName: newFullName.trim(),
        position: newPosition.trim(),
        departmentId: newDeptId,
        status: newStatus
      });
      alert('Сотрудник успешно добавлен!');
      setNewFullName('');
      setNewPosition('');
      setShowAddModal(false);
    } catch (err: any) {
      alert('Ошибка при добавлении: ' + err.message);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Вы уверены, что хотите удалить сотрудника ${name}?`)) {
      await deleteEmployee(id);
    }
  };

  // Helper to count tasks assigned to an employee name
  const getTasksCount = (fullName: string) => {
    return employeeTasks.filter(et => et.employeeName.toLowerCase() === fullName.toLowerCase()).length;
  };

  return (
    <div className="ew-page p-6 lg:p-8 max-w-7xl mx-auto h-full flex flex-col font-sans">
      
      {/* Page Header */}
      <header className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 shrink-0 border-b pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 font-display">
            {getLabel('people')}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            База сотрудников, оргструктура, KPI отделов и распределение рабочей нагрузки
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Поиск по ФИО, должности..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 w-full md:w-64"
            />
          </div>
          {activeTab === 'employees' && (
            <button 
              onClick={() => setShowAddModal(true)} 
              className="ew-btn ew-btn-primary whitespace-nowrap cursor-pointer"
            >
              <Plus size={16} /> Добавить
            </button>
          )}
        </div>
      </header>

      {/* Sub-tab navigation */}
      <div className="flex gap-6 mb-6 border-b border-slate-200 shrink-0 overflow-x-auto">
        {[
          { id: 'employees', label: 'Сотрудники' },
          { id: 'departments', label: 'Отделы и KPI' },
          { id: 'responsibility', label: 'Ответственность' },
          { id: 'workload', label: 'Нагрузка' },
          { id: 'history', label: 'История кадровых изменений' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-3 px-1 text-sm font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === tab.id 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 pb-10">
        
        {/* ═══ 1. EMPLOYEES TAB ═══ */}
        {activeTab === 'employees' && (
          loadingEmployees ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 text-slate-400">Загрузка...</div>
          ) : filteredEmployees.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 text-slate-400">
              Сотрудники не найдены.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 animate-fadeIn">
              {filteredEmployees.map(emp => {
                const dept = departments.find(d => d.id === emp.departmentId);
                const taskCount = getTasksCount(emp.fullName);
                return (
                  <div key={emp.id} className="ew-card p-5 group flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold shrink-0">
                          {emp.fullName.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 leading-tight">{emp.fullName}</h3>
                          <p className="text-xs text-slate-500 mt-0.5">{emp.position}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDelete(emp.id, emp.fullName)}
                        className="text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-slate-50 rounded"
                        title="Удалить"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="flex items-center gap-1 text-slate-600 font-medium">
                        <Building size={13} className="text-slate-400" />
                        {dept?.name || 'Нет отдела'}
                      </span>
                      
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 font-bold rounded">
                          Задач: {taskCount}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full font-semibold ${
                          emp.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 
                          emp.status === 'vacation' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {emp.status === 'active' ? 'В офисе' : emp.status === 'vacation' ? 'В отпуске' : 'Неактивен'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* ═══ 2. DEPARTMENTS & KPI TAB ═══ */}
        {activeTab === 'departments' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fadeIn">
            {departments.map(dept => (
              <div key={dept.id} className="ew-card p-5 flex flex-col gap-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                      <Briefcase size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{dept.name}</h3>
                      <p className="text-xs text-slate-500">Руководитель: {dept.head}</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-auto">
                  <div className="p-3 bg-slate-50 rounded-lg text-center">
                    <span className="block text-xl font-bold text-slate-800">{dept.tasksCount}</span>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Задач в работе</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg text-center">
                    <span className="block text-xl font-bold text-rose-600">{dept.overdueCount}</span>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Сорвано</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg text-center">
                    <span className="block text-xl font-bold text-emerald-600">{dept.kpi}%</span>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Индекс KPI</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ═══ 3. RESPONSIBILITY TAB ═══ */}
        {activeTab === 'responsibility' && (
          <div className="bg-white border rounded-2xl overflow-hidden shadow-sm animate-fadeIn">
            <div className="p-4 bg-slate-50 border-b">
              <h3 className="font-bold text-slate-800 text-sm">Зоны ответственности и кураторы ведомств</h3>
            </div>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="p-3">Подразделение / Департамент</th>
                  <th className="p-3">Руководитель (Куратор)</th>
                  <th className="p-3">Зона операционного контроля</th>
                  <th className="p-3">Статус KPI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {departments.map(dept => (
                  <tr key={dept.id} className="hover:bg-slate-50/50">
                    <td className="p-3 font-bold text-slate-800">{dept.name}</td>
                    <td className="p-3 font-semibold text-slate-700">👤 {dept.head}</td>
                    <td className="p-3 text-slate-500 font-medium">
                      {dept.name.includes('IT') ? 'Цифровизация, сервера, базы данных, ИИ-интеграция' :
                       dept.name.includes('Финансы') ? 'Бюджетирование, аудит, налоги, отчетность' :
                       dept.name.includes('Геология') ? 'Разведка, лицензирование, карты и ресурсы' :
                       dept.name.includes('Канцелярия') ? 'СЭД, архивы, входящая почта, регламенты' :
                       'Внутренние операционные регламенты и кадровая стабильность'}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded font-mono font-bold ${
                        dept.kpi >= 90 ? 'bg-emerald-50 text-emerald-800' :
                        dept.kpi >= 75 ? 'bg-blue-50 text-blue-800' : 'bg-rose-50 text-rose-800'
                      }`}>{dept.kpi}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ═══ 4. WORKLOAD TAB ═══ */}
        {activeTab === 'workload' && (
          <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-6 animate-fadeIn">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">График распределения рабочей нагрузки персонала</h3>
              <p className="text-slate-400 text-[11px] mt-0.5">Количество активных операционных задач, закрепленных за специалистами</p>
            </div>

            <div className="space-y-4">
              {employees.map(emp => {
                const taskCount = getTasksCount(emp.fullName);
                const loadPercentage = Math.min(taskCount * 25, 100); // 4 tasks = 100% capacity
                return (
                  <div key={emp.id} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-800">{emp.fullName} <span className="text-slate-400 font-medium">({emp.position})</span></span>
                      <span className={`${taskCount > 3 ? 'text-rose-600 font-bold' : 'text-slate-600'}`}>
                        {taskCount} задач {taskCount > 3 ? '(Перегружен)' : taskCount === 0 ? '(Свободен)' : '(Оптимально)'}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden flex">
                      <div 
                        style={{ width: `${loadPercentage}%` }} 
                        className={`h-full rounded-full transition-all duration-500 ${
                          taskCount > 3 ? 'bg-rose-500' :
                          taskCount > 1 ? 'bg-blue-500' : 'bg-emerald-500'
                        }`} 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ 5. HISTORY TAB ═══ */}
        {activeTab === 'history' && (
          <div className="bg-white border rounded-2xl overflow-hidden shadow-sm max-w-xl mx-auto animate-fadeIn">
            <div className="p-4 bg-slate-50 border-b flex items-center gap-1.5">
              <History size={16} className="text-slate-500" />
              <h3 className="font-bold text-slate-800 text-sm">Журнал кадровых событий и изменений</h3>
            </div>

            <div className="divide-y divide-slate-100 text-xs p-4 space-y-4">
              {[
                { name: 'Ахмедов Рустам', action: 'загрузил еженедельный отчет по IT сектору', date: '24.05.2026' },
                { name: 'Кадырова Малика', action: 'согласовала отчет финансового департамента', date: '23.05.2026' },
                { name: 'Иванов Александр', action: 'зачислен в штат в Департамент IT на должность Старший разработчик', date: '19.05.2026' }
              ].map((log, i) => (
                <div key={i} className="flex gap-3 items-start font-medium text-slate-700">
                  <div className="w-2.5 h-2.5 bg-blue-500 rounded-full mt-1 shrink-0" />
                  <div className="flex-1">
                    <span className="font-bold text-slate-900">{log.name}</span> {log.action}
                    <span className="text-[10px] text-slate-400 font-mono block mt-0.5">⏱ {log.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden">
            <header className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm font-display">Добавить сотрудника</h3>
              <button 
                type="button" 
                onClick={() => setShowAddModal(false)} 
                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={16} />
              </button>
            </header>

            <form onSubmit={handleSubmitEmployee} className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">ФИО сотрудника</label>
                <input
                  type="text"
                  value={newFullName}
                  onChange={e => setNewFullName(e.target.value)}
                  placeholder="Иванов Иван Иванович"
                  className="w-full text-xs border border-slate-200 p-2.5 rounded-xl bg-slate-50/50 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Должность</label>
                <input
                  type="text"
                  value={newPosition}
                  onChange={e => setNewPosition(e.target.value)}
                  placeholder="Младший специалист / Руководитель..."
                  className="w-full text-xs border border-slate-200 p-2.5 rounded-xl bg-slate-50/50 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Отдел</label>
                <select
                  value={newDeptId}
                  onChange={e => setNewDeptId(e.target.value)}
                  className="w-full text-xs border border-slate-200 p-2.5 rounded-xl bg-slate-50/50 focus:outline-none"
                >
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Статус работы</label>
                <select
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value as any)}
                  className="w-full text-xs border border-slate-200 p-2.5 rounded-xl bg-slate-50/50 focus:outline-none font-semibold"
                >
                  <option value="active">В офисе (Active)</option>
                  <option value="vacation">В отпуске (Vacation)</option>
                  <option value="inactive">Неактивен (Inactive)</option>
                </select>
              </div>

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
                  Сохранить
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
