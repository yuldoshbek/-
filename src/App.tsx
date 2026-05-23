import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router';
import { LayoutDashboard, CheckSquare, Calendar, Mail, FileText, LogOut, Presentation, FormInput, UserCircle } from 'lucide-react';
import { initAuth, googleSignIn, guestSignIn, logout, auth } from './firebase';
import { User } from 'firebase/auth';

import Dashboard from './components/Dashboard';
import Tasks from './components/Tasks';
import Meetings from './components/Meetings';
import Letters from './components/Letters';
import Reports from './components/Reports';
import Presentations from './components/Presentations';
import GoogleTasks from './components/GoogleTasks';
import Forms from './components/Forms';

export default function App() {
  const [loadingContext, setLoadingContext] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = initAuth(
      (u) => {
        setUser(u);
        setLoadingContext(false);
      },
      () => {
        // If not authenticated, try guest login
        guestSignIn()
          .catch((err) => {
             console.error("Guest login failed:", err);
          })
          .finally(() => {
             setUser(null);
             setLoadingContext(false);
          });
      }
    );
    return () => unsubscribe();
  }, []);

  const clearAuth = async () => {
    await logout();
  }

  if (loadingContext) {
    return (
      <div className="flex bg-slate-50 min-h-screen items-center justify-center p-4">
        <div className="text-slate-400">Загрузка ОС...</div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="flex h-screen bg-slate-50 text-slate-900 font-sans">
        <Sidebar onLogout={clearAuth} user={user} />
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/meetings" element={<Meetings />} />
            <Route path="/letters" element={<Letters />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/presentations" element={<Presentations />} />
            <Route path="/google-tasks" element={<GoogleTasks />} />
            <Route path="/forms" element={<Forms />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

function Sidebar({ onLogout, user }: { onLogout: () => void, user: User | null }) {
  const location = useLocation();
  const navItems = [
    { label: 'Панель (Dashboard)', path: '/', icon: <LayoutDashboard size={20} /> },
    { label: 'Задачи', path: '/tasks', icon: <CheckSquare size={20} /> },
    { label: 'Google Tasks', path: '/google-tasks', icon: <CheckSquare size={20} /> },
    { label: 'Встречи', path: '/meetings', icon: <Calendar size={20} /> },
    { label: 'Письма', path: '/letters', icon: <Mail size={20} /> },
    { label: 'Отчеты', path: '/reports', icon: <FileText size={20} /> },
    { label: 'Презентации', path: '/presentations', icon: <Presentation size={20} /> },
    { label: 'Опросы', path: '/forms', icon: <FormInput size={20} /> },
  ];

  return (
    <div className="w-64 bg-[#0F172A] text-slate-300 flex flex-col shrink-0 flex-none h-full">
      <div className="p-6 border-b border-slate-700/50">
        <h2 className="text-white font-bold tracking-tight text-lg">TMK Executive OS</h2>
        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-1">Центр управления</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(item => (
          <Link 
            key={item.path} 
            to={item.path}
            className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${location.pathname === item.path ? 'bg-blue-600 text-white font-medium' : 'hover:bg-slate-800 hover:text-white'}`}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <div className="truncate text-sm pr-2 flex items-center gap-2">
            {!user || user.isAnonymous ? (
              <>
                <UserCircle size={24} className="text-slate-500" />
                <div className="text-white font-medium truncate">Гость</div>
              </>
            ) : (
              <div>
                <div className="text-white font-medium truncate">{user.displayName || 'Пользователь'}</div>
                <div className="text-slate-500 text-xs truncate">{user.email}</div>
              </div>
            )}
          </div>
          <button onClick={onLogout} className="p-2 hover:bg-slate-800 rounded-md text-slate-400 hover:text-white transition-colors cursor-pointer" title="Выход">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
