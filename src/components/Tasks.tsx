import React, { useState } from 'react';
import { useTasks } from '../lib/hooks';
import { Plus, CheckCircle2, Circle, Clock, AlertTriangle } from 'lucide-react';
import { Task } from '../types';

export default function Tasks() {
  const { tasks, loading, addTask, updateTaskStatus } = useTasks();
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<Task['priority']>('medium');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    await addTask({
      title: newTitle,
      status: 'pending',
      priority: newPriority,
    });
    setNewTitle('');
    setIsAdding(false);
  };

  if (loading) return <div className="p-8">Loading tasks...</div>;

  return (
    <div className="max-w-5xl mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Поручения</h1>
          <p className="text-slate-500 mt-1">Control assignments and executive tasks</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus size={18} />
          Новое поручение
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6">
          <div className="flex gap-4">
            <input 
              autoFocus
              type="text" 
              placeholder="What needs to be done?" 
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select 
              value={newPriority} 
              onChange={e => setNewPriority(e.target.value as any)}
              className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
              <option value="urgent">Urgent</option>
            </select>
            <div className="flex gap-2">
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium">Save</button>
              <button type="button" onClick={() => setIsAdding(false)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg">Cancel</button>
            </div>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 divide-y divide-slate-100">
        {tasks.length === 0 ? (
          <div className="text-center py-12 text-slate-500">Нет активных поручений.</div>
        ) : (
          tasks.map(task => (
            <div key={task.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => updateTaskStatus(task.id, task.status === 'completed' ? 'pending' : 'completed')}
                  className={`${task.status === 'completed' ? 'text-blue-600' : 'text-slate-300 hover:text-slate-400'}`}
                >
                  {task.status === 'completed' ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                </button>
                <div className={`flex flex-col ${task.status === 'completed' ? 'opacity-50' : ''}`}>
                  <span className={`font-medium ${task.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-900'}`}>{task.title}</span>
                  <div className="flex items-center gap-4 mt-1 text-xs text-slate-500 font-medium">
                    {task.priority && (
                      <span className={`flex items-center gap-1 ${task.priority === 'urgent' ? 'text-red-600' : ''}`}>
                        <AlertTriangle size={14} />
                        {task.priority.toUpperCase()}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock size={14} />
                      {new Date(task.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full uppercase tracking-wider
                  ${task.status === 'pending' ? 'bg-amber-100 text-amber-700' : ''}
                  ${task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : ''}
                  ${task.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : ''}
                  ${task.status === 'overdue' ? 'bg-red-100 text-red-700' : ''}
                `}>
                  {task.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
