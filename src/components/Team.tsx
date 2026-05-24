import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { Employee, Department } from '../types';
import { Plus, Search, User, Building, MoreVertical, Briefcase } from 'lucide-react';

const MOCK_DEPARTMENTS: Department[] = [
  { id: 'd-1', name: 'Руководство', head: 'CEO', tasksCount: 5, overdueCount: 0, kpi: 100 },
  { id: 'd-2', name: 'Разработка', head: 'CTO', tasksCount: 12, overdueCount: 2, kpi: 85 },
  { id: 'd-3', name: 'Продажи', head: 'CBDO', tasksCount: 8, overdueCount: 1, kpi: 90 },
];

const MOCK_EMPLOYEES: Employee[] = [
  { id: 'e-1', fullName: 'Александр Иванов', position: 'Старший разработчик', departmentId: 'd-2', status: 'active', userId: 'guest', createdAt: Date.now() },
  { id: 'e-2', fullName: 'Елена Петрова', position: 'Менеджер по продажам', departmentId: 'd-3', status: 'active', userId: 'guest', createdAt: Date.now() },
  { id: 'e-3', fullName: 'Дмитрий Сидоров', position: 'Архитектор', departmentId: 'd-2', status: 'vacation', userId: 'guest', createdAt: Date.now() },
];

export default function Team() {
  const { getLabel } = useWorkspace();
  const [employees, setEmployees] = useState<Employee[]>(MOCK_EMPLOYEES);
  const [departments, setDepartments] = useState<Department[]>(MOCK_DEPARTMENTS);
  const [activeTab, setActiveTab] = useState<'employees' | 'departments'>('employees');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEmployees = employees.filter(e => e.fullName.toLowerCase().includes(searchQuery.toLowerCase()));

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
          <button className="ew-btn ew-btn-primary whitespace-nowrap">
            <Plus size={16} /> Добавить
          </button>
        </div>
      </header>

      <div className="flex gap-4 mb-6 border-b border-slate-200 shrink-0">
        <button
          onClick={() => setActiveTab('employees')}
          className={`pb-3 px-1 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'employees' ? 'border-blue-500 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          {getLabel('team')}
        </button>
        <button
          onClick={() => setActiveTab('departments')}
          className={`pb-3 px-1 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'departments' ? 'border-blue-500 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Структура (Отделы)
        </button>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 pb-10">
        {activeTab === 'employees' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredEmployees.map(emp => {
              const dept = departments.find(d => d.id === emp.departmentId);
              return (
                <div key={emp.id} className="ew-card p-5 group flex flex-col">
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
                    <button className="text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreVertical size={16} />
                    </button>
                  </div>
                  <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
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
    </div>
  );
}
