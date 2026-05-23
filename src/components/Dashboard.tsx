import React, { useEffect, useState } from 'react';
import { useTasks } from '../lib/hooks';
import { auth, initAuth } from '../firebase';
import { LayoutDashboard, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Link } from 'react-router';

export default function Dashboard() {
  const { tasks } = useTasks();
  const [userName, setUserName] = useState('');

  useEffect(() => {
    if (auth.currentUser) {
      setUserName(auth.currentUser.displayName || 'Executive');
    }
  }, []);

  const pendingTasks = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress');
  const urgentTasks = tasks.filter(t => t.priority === 'urgent' && t.status !== 'completed');
  const completedTasks = tasks.filter(t => t.status === 'completed');

  return (
    <div className="max-w-6xl mx-auto p-8">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Xush kelibsiz, {userName}</h1>
        <p className="text-slate-500 mt-2 text-lg">Here is your executive briefing for today.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Active Tasks</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{pendingTasks.length}</h3>
            </div>
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <Clock size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-amber-200 block">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] text-amber-500 uppercase font-bold tracking-widest">Urgent Attention</p>
              <h3 className="text-2xl font-bold text-amber-900 mt-1">{urgentTasks.length}</h3>
            </div>
            <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
              <AlertCircle size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-200">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] text-emerald-500 uppercase font-bold tracking-widest">Completed</p>
              <h3 className="text-2xl font-bold text-emerald-900 mt-1">{completedTasks.length}</h3>
            </div>
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
              <CheckCircle2 size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quick Actions */}
        <section>
          <h2 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <Link to="/meetings" className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group flex flex-col items-start gap-4">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Process Meeting</h3>
                <p className="text-sm text-slate-500">Extract tasks from notes</p>
              </div>
            </Link>
            
            <Link to="/letters" className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group flex flex-col items-start gap-4">
              <div className="p-2 bg-purple-50 text-purple-600 rounded-lg group-hover:bg-purple-100 transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Draft Letter</h3>
                <p className="text-sm text-slate-500">Translate to Uzbek Latin</p>
              </div>
            </Link>
            
            <Link to="/reports" className="col-span-2 bg-[#0F172A] p-5 rounded-xl border border-slate-700 shadow-sm hover:bg-slate-800 transition-colors group flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-slate-800/50 text-emerald-400 rounded-lg border border-slate-700/50">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <div>
                  <h3 className="font-semibold text-white">Generate Executive Summary</h3>
                  <p className="text-sm text-slate-400">Summarize long reports instantly</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </Link>
          </div>
        </section>

        {/* Priority Tasks */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900">Priority Inbox</h2>
            <Link to="/tasks" className="text-xs font-semibold text-blue-600 hover:text-blue-700 uppercase tracking-wider">View all</Link>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
            {urgentTasks.length === 0 && pendingTasks.slice(0, 4).length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">No tasks requiring attention.</div>
            ) : (
              [...urgentTasks, ...pendingTasks].slice(0, 4).map(task => (
                <div key={task.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${task.priority === 'urgent' ? 'bg-red-500' : 'bg-amber-400'}`} />
                    <span className="font-medium text-slate-900 line-clamp-1">{task.title}</span>
                  </div>
                  <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded">{task.status.replace('_', ' ')}</span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
