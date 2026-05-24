import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Calendar, 
  Mail, 
  FileText, 
  LogOut, 
  UserCircle,
  Sparkles,
  FolderOpen,
  Settings as SettingsIcon,
  BookOpen,
  Users,
  AlertTriangle,
} from 'lucide-react';
import { initAuth, logout, auth } from './firebase';
import { User } from 'firebase/auth';

import Dashboard from './components/Dashboard';
import Tasks from './components/Tasks';
import Meetings from './components/Meetings';
import Letters from './components/Letters';
import Reports from './components/Reports';
import Documents from './components/Documents';
import AIAssistant from './components/AIAssistant';
import Settings from './components/Settings';
import Team from './components/Team';
import Journal from './components/Journal';
import Onboarding from './components/Onboarding';
import { WorkspaceProvider, useWorkspace } from './context/WorkspaceContext';

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
        setUser(null);
        setLoadingContext(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const clearAuth = async () => {
    await logout();
  };

  if (loadingContext) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFBFC]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-[3px] border-blue-500 border-t-transparent animate-spin" />
          <span className="text-sm font-semibold text-slate-500">Загрузка Assistant OS...</span>
        </div>
      </div>
    );
  }

  return (
    <WorkspaceProvider>
      <AppContent user={user} onLogout={clearAuth} />
    </WorkspaceProvider>
  );
}

function AppContent({ user, onLogout }: { user: User | null; onLogout: () => void }) {
  const { isProfileSelected } = useWorkspace();

  if (!isProfileSelected) {
    return <Onboarding />;
  }

  return (
    <BrowserRouter>
      <div className="flex h-screen overflow-hidden bg-[var(--ew-bg)]">
        <Sidebar onLogout={onLogout} user={user} />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Topbar user={user} />
          <div className="flex-1 overflow-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/meetings" element={<Meetings />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/letters" element={<Letters />} />
              <Route path="/documents" element={<Documents />} />
              <Route path="/team" element={<Team />} />
              <Route path="/journal" element={<Journal />} />
              <Route path="/ai-assistant" element={<AIAssistant />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </div>
        </div>
      </div>
    </BrowserRouter>
  );
}

function Topbar({ user }: { user: User | null }) {
  const [sysTime, setSysTime] = useState('');
  const { profile } = useWorkspace();

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setSysTime(d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-14 px-6 flex items-center justify-between border-b border-slate-200/80 bg-white/80 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <span className="ew-pulse" />
        <span className="text-xs font-semibold text-slate-500">Assistant OS</span>
        <span className="text-[10px] text-slate-400 font-medium bg-slate-100 px-2 py-0.5 rounded-md">
          {profile.icon} {profile.name}
        </span>
      </div>

      <div className="flex items-center gap-4 text-xs">
        <span className="font-mono text-slate-400">{sysTime}</span>
        {user && !user.isAnonymous && (
          <div className="flex items-center gap-2 text-slate-600 font-medium">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold">
              {user.displayName?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <span className="hidden md:inline">{user.displayName || user.email}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function Sidebar({ onLogout, user }: { onLogout: () => void; user: User | null }) {
  const location = useLocation();
  const { getLabel, profile, isModuleVisible } = useWorkspace();

  const allNavItems = [
    { moduleId: 'dashboard', label: getLabel('dashboard'), path: '/', icon: <LayoutDashboard size={18} /> },
    { moduleId: 'tasks', label: getLabel('tasks'), path: '/tasks', icon: <CheckSquare size={18} /> },
    { moduleId: 'meetings', label: getLabel('meetings'), path: '/meetings', icon: <Calendar size={18} /> },
    { moduleId: 'reports', label: getLabel('reports'), path: '/reports', icon: <FileText size={18} /> },
    { moduleId: 'letters', label: getLabel('letters'), path: '/letters', icon: <Mail size={18} /> },
    { moduleId: 'documents', label: getLabel('documents'), path: '/documents', icon: <FolderOpen size={18} /> },
    { moduleId: 'team', label: getLabel('team'), path: '/team', icon: <Users size={18} /> },
    { moduleId: 'journal', label: getLabel('journal'), path: '/journal', icon: <BookOpen size={18} /> },
    { moduleId: 'ai', label: getLabel('ai'), path: '/ai-assistant', icon: <Sparkles size={18} /> },
    { moduleId: 'settings', label: getLabel('settings'), path: '/settings', icon: <SettingsIcon size={18} /> },
  ];

  const visibleNavItems = allNavItems.filter(item => isModuleVisible(item.moduleId));

  return (
    <div className="w-64 flex flex-col shrink-0 flex-none h-full overflow-hidden bg-[#0F172A] text-slate-300">
      
      {/* Brand */}
      <div className="p-5 border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
            <span className="text-white text-xs font-bold">A</span>
          </div>
          <div>
            <h2 className="font-bold text-white text-sm tracking-tight">Assistant OS</h2>
            <p className="text-[10px] text-slate-500 font-medium">{profile.icon} {profile.name}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {visibleNavItems.map(item => {
          const isActive = item.path === '/' 
            ? location.pathname === '/' 
            : location.pathname.startsWith(item.path);
          return (
            <Link 
              key={item.path} 
              to={item.path}
              className={`ew-nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="ew-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <div className="truncate text-xs pr-2 flex items-center gap-2.5">
            {!user || user.isAnonymous ? (
              <>
                <UserCircle size={22} className="text-slate-500 shrink-0" />
                <div className="truncate">
                  <div className="font-semibold text-slate-300">Гость</div>
                  <div className="text-[10px] text-slate-500">Оффлайн</div>
                </div>
              </>
            ) : (
              <div className="truncate">
                <div className="font-semibold text-slate-200 truncate">{user.displayName || 'Администратор'}</div>
                <div className="text-[9px] text-slate-500 truncate">{user.email}</div>
              </div>
            )}
          </div>
          <button 
            type="button"
            onClick={onLogout} 
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-rose-400 transition-colors cursor-pointer" 
            title="Выйти"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
