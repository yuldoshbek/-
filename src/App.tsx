import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router';
import { LayoutDashboard, CheckSquare, Calendar, Mail, FileText, LogOut, Presentation, FormInput } from 'lucide-react';
import { initAuth, googleSignIn, logout, auth } from './firebase';
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
  const [needsAuth, setNeedsAuth] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = initAuth(
      (u) => {
        setUser(u);
        setNeedsAuth(false);
      },
      () => {
        setUser(null);
        setNeedsAuth(true);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setNeedsAuth(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const clearAuth = async () => {
    await logout();
  }

  if (needsAuth) {
    return (
      <div className="flex bg-slate-50 min-h-screen items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full text-center">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">Executive Control</h1>
          <p className="text-slate-500 mb-8">Access your workspace</p>
          <button 
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 py-2.5 rounded-lg hover:bg-slate-50 transition-colors font-medium shadow-sm"
          >
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              <path fill="none" d="M0 0h48v48H0z"></path>
            </svg>
            Sign in with Google
          </button>
        </div>
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
    { label: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { label: 'Tasks', path: '/tasks', icon: <CheckSquare size={20} /> },
    { label: 'Google Tasks', path: '/google-tasks', icon: <CheckSquare size={20} /> },
    { label: 'Meetings', path: '/meetings', icon: <Calendar size={20} /> },
    { label: 'Letters', path: '/letters', icon: <Mail size={20} /> },
    { label: 'Reports', path: '/reports', icon: <FileText size={20} /> },
    { label: 'Presentations', path: '/presentations', icon: <Presentation size={20} /> },
    { label: 'Forms', path: '/forms', icon: <FormInput size={20} /> },
  ];

  return (
    <div className="w-64 bg-[#0F172A] text-slate-300 flex flex-col shrink-0 flex-none h-full">
      <div className="p-6 border-b border-slate-700/50">
        <h2 className="text-white font-bold tracking-tight text-lg">TMK Executive OS</h2>
        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-1">Control Center</p>
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
          <div className="truncate text-sm pr-2">
            <div className="text-white font-medium truncate">{user?.displayName}</div>
            <div className="text-slate-500 text-xs truncate">{user?.email}</div>
          </div>
          <button onClick={onLogout} className="p-2 hover:bg-slate-800 rounded-md text-slate-400 hover:text-white transition-colors" title="Sign out">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
