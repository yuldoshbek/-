import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { Employee, Department } from '../types';
import { Plus, Search, User, Building, MoreVertical, Briefcase, X, Trash2 } from 'lucide-react';
import { useEmployees, useDepartments } from '../lib/hooks';

export default function Team() {
  const { getLabel } = useWorkspace();
  const { employees, addEmployee, deleteEmployee } = useEmployees();
  const { departments } = useDepartments();
  const [activeTab, setActiveTab] = useState<'employees' | 'departments'>('employees');
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

  return (
    <div className="ew-page p-6 lg:p-8 max-w-7xl mx-auto h-full flex flex-col font-sans">
      <header className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 font-display">
            {getLabel('team')}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Управление структурой, назначение ответственных и аналитика KPI
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

      <div className="flex gap-4 mb-6 border-b border-slate-200 shrink-0">
        <button
          onClick={() => setActiveTab('employees')}
          className={`pb-3 px-1 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'employees' ? 'border-blue-500 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          {getLabel('team')}
        </button>
        <button
          onClick={() => setActiveTab('departments')}
          className={`pb-3 px-1 text-sm font-bold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'departments' ? 'border-blue-500 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Структура (Отделы)
        </button>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 pb-10">
        {activeTab === 'employees' ? (
          filteredEmployees.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 text-slate-400">
              Сотрудники не найдены.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredEmployees.map(emp => {
                const dept = departments.find(d => d.id === emp.departmentId);
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
                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1 text-slate-600">
                        <Building size={14} className="text-slate-400" />
                        {dept?.name || 'Нет отдела'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full font-semibold ${
                        emp.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 
                        emp.status === 'vacation' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {emp.status === 'active' ? 'В офисе' : emp.status === 'vacation' ? 'В отпуске' : 'Неактивен'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                    <span className="text-[10px] uppercase font-bold text-slate-400">Задач</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg text-center">
                    <span className="block text-xl font-bold text-rose-600">{dept.overdueCount}</span>
                    <span className="text-[10px] uppercase font-bold text-slate-400">Просрочено</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg text-center">
                    <span className="block text-xl font-bold text-emerald-600">{dept.kpi}%</span>
                    <span className="text-[10px] uppercase font-bold text-slate-400">KPI</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 font-sans">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
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
                  className="w-full text-xs border border-slate-200 p-2.5 rounded-xl bg-slate-50/50 focus:outline-none focus:border-blue-400 font-medium"
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
                  className="w-full text-xs border border-slate-200 p-2.5 rounded-xl bg-slate-50/50 focus:outline-none focus:border-blue-400 font-medium"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Отдел</label>
                <select
                  value={newDeptId}
                  onChange={e => setNewDeptId(e.target.value)}
                  className="w-full text-xs border border-slate-200 p-2.5 rounded-xl bg-slate-50/50 focus:outline-none focus:border-blue-400 font-semibold"
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
                  className="w-full text-xs border border-slate-200 p-2.5 rounded-xl bg-slate-50/50 focus:outline-none focus:border-blue-400 font-semibold"
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
