import React, { useState, useEffect } from 'react';
import { CheckSquare, Plus, ExternalLink, Circle, CheckCircle2 } from 'lucide-react';
import { getAccessToken } from '../firebase';

export default function GoogleTasks() {
  const [taskLists, setTaskLists] = useState<any[]>([]);
  const [selectedList, setSelectedList] = useState<string | null>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  useEffect(() => {
    fetchTaskLists();
  }, []);

  useEffect(() => {
    if (selectedList) {
      fetchTasks(selectedList);
    }
  }, [selectedList]);

  const fetchTaskLists = async () => {
    setLoading(true);
    try {
      const token = await getAccessToken();
      if (!token) return;
      const res = await fetch(
        'https://tasks.googleapis.com/tasks/v1/users/@me/lists',
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      const data = await res.json();
      if (data.items) {
        setTaskLists(data.items);
        if (data.items.length > 0) {
          setSelectedList(data.items[0].id);
        }
      }
    } catch (e) {
      console.error('Error fetching task lists', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async (listId: string) => {
    setLoading(true);
    try {
      const token = await getAccessToken();
      if (!token) return;
      const res = await fetch(
        `https://tasks.googleapis.com/tasks/v1/lists/${listId}/tasks?showHidden=true`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      const data = await res.json();
      if (data.items) {
        setTasks(data.items);
      } else {
        setTasks([]);
      }
    } catch (e) {
      console.error('Error fetching tasks', e);
    } finally {
      setLoading(false);
    }
  };

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !selectedList) return;
    
    try {
      const token = await getAccessToken();
      if (!token) return;
      
      const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${selectedList}/tasks`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: newTaskTitle
        })
      });
      const data = await res.json();
      if (data.id) {
        setNewTaskTitle('');
        await fetchTasks(selectedList);
      }
    } catch (e) {
      console.error('Error creating task', e);
    }
  };

  const toggleTaskStatus = async (task: any) => {
    if (!selectedList) return;
    try {
      const token = await getAccessToken();
      if (!token) return;
      
      const newStatus = task.status === 'completed' ? 'needsAction' : 'completed';
      const res = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${selectedList}/tasks/${task.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...task,
          status: newStatus
        })
      });
      const data = await res.json();
      if (data.id) {
        setTasks(tasks.map((t: any) => t.id === task.id ? data : t));
      }
    } catch (e) {
      console.error('Error updating task', e);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <CheckSquare className="text-blue-600" size={28} />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Google Tasks</h1>
            <p className="text-slate-500 mt-1">Manage your synced tasks</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-1 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-fit">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <h2 className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Списки (Lists)</h2>
          </div>
          <div className="divide-y divide-slate-100 p-2">
            {taskLists.map(list => (
              <button
                key={list.id}
                onClick={() => setSelectedList(list.id)}
                className={`w-full text-left p-3 rounded-lg text-sm font-medium transition-colors ${selectedList === list.id ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'}`}
              >
                {list.title}
              </button>
            ))}
            {taskLists.length === 0 && !loading && (
              <div className="p-4 text-center text-slate-400 text-sm">No lists found</div>
            )}
          </div>
        </div>

        <div className="md:col-span-3 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <h2 className="text-[10px] font-bold tracking-widest text-slate-500 uppercase text-center inline-block w-full">Задачи (Tasks)</h2>
          </div>
          
          <div className="p-4 border-b border-slate-100">
            <form onSubmit={addTask} className="flex gap-2">
              <input 
                type="text" 
                placeholder="Новая задача..." 
                value={newTaskTitle}
                onChange={e => setNewTaskTitle(e.target.value)}
                className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button 
                type="submit" 
                disabled={!newTaskTitle.trim() || !selectedList}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center"
              >
                <Plus size={18} />
              </button>
            </form>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-500">Загрузка...</div>
          ) : tasks.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <CheckSquare size={48} className="mx-auto mb-4 opacity-20" />
              <p>В этом списке нет задач.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {tasks.map(task => (
                <div key={task.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => toggleTaskStatus(task)}
                      className={`${task.status === 'completed' ? 'text-blue-600' : 'text-slate-300 hover:text-slate-400'}`}
                    >
                      {task.status === 'completed' ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                    </button>
                    <span className={`font-medium ${task.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-900'}`}>{task.title}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
