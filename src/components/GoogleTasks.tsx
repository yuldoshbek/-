import React, { useState, useEffect } from 'react';
import { CheckSquare, Plus, Circle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { getAccessToken } from '../firebase';

export default function GoogleTasks() {
  const [taskLists, setTaskLists] = useState<any[]>([]);
  const [selectedList, setSelectedList] = useState<string | null>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [unauthorized, setUnauthorized] = useState(false);

  const fetchTaskLists = async () => {
    setLoading(true);
    setUnauthorized(false);
    try {
      const token = await getAccessToken();
      if (!token) {
        setUnauthorized(true);
        setLoading(false);
        return;
      }
      const res = await fetch(
        'https://tasks.googleapis.com/tasks/v1/users/@me/lists',
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      if (res.status === 401 || res.status === 403) {
        setUnauthorized(true);
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (data.items) {
        setTaskLists(data.items);
        if (data.items.length > 0) {
          setSelectedList(data.items[0].id);
        }
      }
    } catch {
      setUnauthorized(true);
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

  useEffect(() => {
    fetchTaskLists();
  }, []);

  useEffect(() => {
    if (selectedList) {
      fetchTasks(selectedList);
    }
  }, [selectedList]);

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
    <div className="p-8 max-w-7xl mx-auto space-y-6 font-sans">
      
      <header className="border-b border-slate-200/60 pb-5">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest font-display">Облачная интеграция</span>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-display mt-1">Интеграция Google Tasks</h1>
        <p className="text-slate-500 text-sm mt-0.5">Служебный маппинг личных проектных задач и списков из учетной записи Google СЭД.</p>
      </header>

      {unauthorized ? (
        <div className="bg-amber-50/50 border border-amber-200 p-8 rounded-2xl flex flex-col items-center text-center space-y-4 max-w-2xl mx-auto mt-12 py-16 shadow-xs">
          <ShieldAlert size={48} className="text-amber-600" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">Режим безопасности: Google Workspace заблокирован</h3>
            <p className="text-xs text-slate-500 font-medium max-w-md">Вы авторизовались как Гость или Свободный администратор. Для двухсторонней синхронизации дел с Google Tasks нажмите кнопку в верхней части Dashboard для получения OAuth токенов Google.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
          
          {/* Side columns list */}
          <div className="md:col-span-1 bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden h-fit">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <h2 className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Списки СМАРТ-Задач</h2>
            </div>
            <div className="divide-y divide-slate-100 p-2 text-xs font-semibold text-slate-700">
              {taskLists.map(list => (
                <button
                  type="button"
                  key={list.id}
                  onClick={() => setSelectedList(list.id)}
                  className={`w-full text-left p-2.5 rounded-lg transition-all cursor-pointer ${selectedList === list.id ? 'bg-blue-50 text-blue-700 font-bold' : 'hover:bg-slate-50'}`}
                >
                  {list.title}
                </button>
              ))}
              {taskLists.length === 0 && !loading && (
                <div className="p-4 text-center text-slate-400">Нет списков</div>
              )}
            </div>
          </div>

          {/* Current tasks layout table */}
          <div className="md:col-span-3 bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden text-xs">
            <div className="p-4 border-b border-slate-150 bg-slate-50">
              <h2 className="text-[10px] font-bold tracking-widest text-slate-400 uppercase text-center w-full">Задачи в Гугл Трекере</h2>
            </div>

            <div className="p-4 border-b border-slate-100">
              <form onSubmit={addTask} className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Новая задача..." 
                  value={newTaskTitle}
                  onChange={e => setNewTaskTitle(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
                <button 
                  type="submit" 
                  disabled={!newTaskTitle.trim() || !selectedList}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white px-3 py-2 rounded-lg font-bold"
                >
                  <Plus size={14} />
                </button>
              </form>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-400">Поиск записей в Вашем Google-аккаунте...</div>
            ) : tasks.length === 0 ? (
              <div className="p-16 flex flex-col items-center justify-center text-center text-slate-400 space-y-2">
                <CheckSquare size={32} className="opacity-35" />
                <p className="text-xs font-semibold">Список пуст</p>
                <p className="text-[10px] max-w-xs">Отдохните от дел или внесите задачу с помощью верхней формы.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {tasks.map(task => (
                  <div key={task.id} className="p-3.5 hover:bg-slate-50/50 transition-colors flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => toggleTaskStatus(task)}
                        className={`cursor-pointer ${task.status === 'completed' ? 'text-blue-600' : 'text-slate-300 hover:text-slate-400'}`}
                      >
                        {task.status === 'completed' ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                      </button>
                      <span className={`font-semibold ${task.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-800'}`}>{task.title}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
