import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Calendar, 
  Mail, 
  FileText, 
  LogOut, 
  Presentation as PresIcon, 
  FormInput, 
  UserCircle,
  ShieldCheck,
  TrendingUp,
  Building2,
  Sparkles,
  HelpCircle,
  StickyNote,
  FolderOpen,
  FileSpreadsheet,
  Bell,
  History,
  BookOpen,
  Award,
  AlertTriangle,
  Users
} from 'lucide-react';
import { initAuth, logout, auth } from './firebase';
import { User } from 'firebase/auth';

import Dashboard from './components/Dashboard';
import Tasks from './components/Tasks';
import Meetings from './components/Meetings';
import Letters from './components/Letters';
import Reports from './components/Reports';
import Presentations from './components/Presentations';
import GoogleTasks from './components/GoogleTasks';
import Forms from './components/Forms';
import Complaints from './components/Complaints';
import Departments from './components/Departments';
import AIAssistant from './components/AIAssistant';
import GoogleKeep from './components/GoogleKeep';
import GoogleDocs from './components/GoogleDocs';
import GoogleSheets from './components/GoogleSheets';
import GoogleDrive from './components/GoogleDrive';

// Newly developed modules
import EmployeeTasks from './components/EmployeeTasks';
import MomGenerator from './components/MomGenerator';
import ReportsGenerator from './components/ReportsGenerator';
import Decisions from './components/Decisions';
import Risks from './components/Risks';
import Reminders from './components/Reminders';
import KnowledgeBase from './components/KnowledgeBase';
import Audit from './components/Audit';
import Approvals from './components/Approvals';
import DailyBriefing from './components/DailyBriefing';
import ResponsibilityMap from './components/ResponsibilityMap';
import RequestGenerator from './components/RequestGenerator';
import DelayAnalysis from './components/DelayAnalysis';
import MeetingPrep from './components/MeetingPrep';

export default function App() {
  const [loadingContext, setLoadingContext] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [themeVariant, setThemeVariant] = useState<string>(() => {
    return localStorage.getItem('executive_theme') || 'hybrid';
  });

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

  const changeTheme = (variant: string) => {
    setThemeVariant(variant);
    localStorage.setItem('executive_theme', variant);
  };

  const clearAuth = async () => {
    await logout();
  };

  if (loadingContext) {
    return (
      <div className="flex bg-[#0A0E1A] min-h-screen items-center justify-center p-4 font-mono text-xs text-blue-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
          <span>ЗАГРУЗКА ИНТЕЛЛЕКТУАЛЬНОГО ЯДРА EXECUTIVE OS...</span>
        </div>
      </div>
    );
  }

  // Choose content background colors depending on active theme variant
  const getPageBg = () => {
    if (themeVariant === 'government') return 'bg-[#F4F6F9]';
    if (themeVariant === 'command') return 'bg-[#090D16] text-slate-100';
    if (themeVariant === 'minimal') return 'bg-[#FBFBFA]';
    return 'bg-slate-50/70'; // Hybrid
  };

  return (
    <BrowserRouter>
      <div className={`flex h-screen overflow-hidden ${themeVariant === 'command' ? 'dark' : ''}`}>
        
        {/* Sidebar */}
        <Sidebar onLogout={clearAuth} user={user} themeVariant={themeVariant} />
        
        {/* Main Panel Content & Topbar */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          
          <Topbar 
            themeVariant={themeVariant} 
            onChangeTheme={changeTheme} 
            user={user} 
          />
          
          {/* Active View Port */}
          <div className={`flex-1 overflow-auto transition-colors duration-150 ${getPageBg()}`}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/meetings" element={<Meetings />} />
              <Route path="/letters" element={<Letters />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/presentations" element={<Presentations />} />
              <Route path="/google-tasks" element={<GoogleTasks />} />
              <Route path="/forms" element={<Forms />} />
              <Route path="/complaints" element={<Complaints />} />
              <Route path="/departments" element={<Departments />} />
              <Route path="/ai-assistant" element={<AIAssistant />} />
              <Route path="/google-keep" element={<GoogleKeep />} />
              <Route path="/google-drive" element={<GoogleDrive />} />
              <Route path="/google-docs" element={<GoogleDocs />} />
              <Route path="/google-sheets" element={<GoogleSheets />} />
              
              {/* Newly assigned path links */}
              <Route path="/employee-tasks" element={<EmployeeTasks />} />
              <Route path="/mom-generator" element={<MomGenerator />} />
              <Route path="/reports-generator" element={<ReportsGenerator />} />
              <Route path="/decisions" element={<Decisions />} />
              <Route path="/risks" element={<Risks />} />
              <Route path="/reminders" element={<Reminders />} />
              <Route path="/knowledge-base" element={<KnowledgeBase />} />
              <Route path="/audit" element={<Audit />} />
              <Route path="/approvals" element={<Approvals />} />
              <Route path="/daily-briefing" element={<DailyBriefing />} />
              <Route path="/responsibility-map" element={<ResponsibilityMap />} />
              <Route path="/request-generator" element={<RequestGenerator />} />
              <Route path="/delay-analysis" element={<DelayAnalysis />} />
              <Route path="/meeting-prep" element={<MeetingPrep />} />
            </Routes>
          </div>
        </div>

      </div>
    </BrowserRouter>
  );
}

function Topbar({ 
  themeVariant, 
  onChangeTheme, 
  user 
}: { 
  themeVariant: string; 
  onChangeTheme: (v: string) => void;
  user: User | null;
}) {
  const [sysTime, setSysTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setSysTime(d.toLocaleTimeString('ru-RU') + ' // UTC' + (d.getTimezoneOffset() / -60 > 0 ? '+' : '') + (d.getTimezoneOffset() / -60));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`h-16 px-8 flex items-center justify-between border-b ${themeVariant === 'command' ? 'bg-[#0B0F19] border-slate-800 text-slate-300' : themeVariant === 'government' ? 'bg-[#0F1E36] border-b border-[#1E2E4A] text-white' : themeVariant === 'minimal' ? 'bg-white border-slate-200 text-slate-900' : 'bg-white border-slate-200/80 text-slate-800'}`}>
      <div className="flex items-center gap-4">
        <span className="text-[10px] font-mono font-bold uppercase tracking-widest flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          СЭД АКТИВНА
        </span>
        <span className="text-slate-400 text-xs hidden md:inline font-mono">| {sysTime}</span>
      </div>

      <div className="flex items-center gap-4 text-xs font-semibold">
        {/* Style selection center */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400 font-bold uppercase hidden lg:inline">Стиль интерфейса:</span>
          <select 
            value={themeVariant}
            onChange={(e) => onChangeTheme(e.target.value)}
            className={`text-xs p-1.5 rounded-lg border font-bold ${themeVariant === 'command' ? 'bg-[#151D30] border-slate-700 text-white' : themeVariant === 'government' ? 'bg-[#1B2B4A] border-blue-900 text-white' : 'bg-slate-100 border-slate-200 text-slate-800'}`}
          >
            <option value="government">Government Executive (Госслужба)</option>
            <option value="command">Strategic Command (Командный центр)</option>
            <option value="minimal">Minimal Workspace (Элегантный бизнес)</option>
            <option value="hybrid">Executive OS Hybrid (Гибридный)</option>
          </select>
        </div>
      </div>
    </div>
  );
}

function Sidebar({ 
  onLogout, 
  user,
  themeVariant
}: { 
  onLogout: () => void; 
  user: User | null;
  themeVariant: string;
}) {
  const location = useLocation();

  const navGroups = [
    {
      name: 'Управление и задачи',
      items: [
        { label: 'Главная панель управления', path: '/', icon: <LayoutDashboard size={15} /> },
        { label: 'Модуль поручений', path: '/tasks', icon: <CheckSquare size={15} /> },
        { label: 'Модуль задач сотрудников', path: '/employee-tasks', icon: <Users size={15} /> },
        { label: 'Модуль встреч (Совещания)', path: '/meetings', icon: <Calendar size={15} /> },
        { label: 'Генератор протоколов встреч', path: '/mom-generator', icon: <FileText size={15} /> },
        { label: 'Центр подготовки совещаний', path: '/meeting-prep', icon: <Calendar size={15} /> },
      ]
    },
    {
      name: 'Шаблоны и аналитика отчетов',
      items: [
        { label: 'Служебные письма', path: '/letters', icon: <Mail size={15} /> },
        { label: 'Модуль отчётов (Аналитика)', path: '/reports', icon: <FileText size={15} /> },
        { label: 'Генератор и отчеты сотрудников', path: '/reports-generator', icon: <FileSpreadsheet size={15} /> },
        { label: 'Модуль согласований', path: '/approvals', icon: <Award size={15} /> },
        { label: 'Генератор запросов в отделы', path: '/request-generator', icon: <FileText size={15} /> },
        { label: 'Анализ задержек и просрочек', path: '/delay-analysis', icon: <AlertTriangle size={15} /> },
        { label: 'Жалобы и обратная связь', path: '/complaints', icon: <Building2 size={15} /> },
        { label: 'Модуль контроля отделов', path: '/departments', icon: <TrendingUp size={15} /> },
      ]
    },
    {
      name: 'Google Workspace интеграция',
      items: [
        { label: 'Заметки (Google Keep)', path: '/google-keep', icon: <StickyNote size={15} /> },
        { label: 'Гугл Диск (Google Drive)', path: '/google-drive', icon: <FolderOpen size={15} /> },
        { label: 'Гугл Документы (Google Docs)', path: '/google-docs', icon: <FileText size={15} /> },
        { label: 'Гугл Таблицы (Google Sheets)', path: '/google-sheets', icon: <FileSpreadsheet size={15} /> },
        { label: 'Google Tasks (Задачи)', path: '/google-tasks', icon: <CheckSquare size={15} /> },
        { label: 'Опросные гугл-формы', path: '/forms', icon: <FormInput size={15} /> },
        { label: 'Доклады и презентации', path: '/presentations', icon: <PresIcon size={15} /> },
      ]
    },
    {
      name: 'Безопасность и интеллект',
      items: [
        { label: 'AI-ассистент канцелярии', path: '/ai-assistant', icon: <Sparkles size={15} /> },
        { label: 'Центр ежедневного брифинга', path: '/daily-briefing', icon: <Sparkles size={15} /> },
        { label: 'Карта ответственности', path: '/responsibility-map', icon: <Users size={15} /> },
        { label: 'Реестр решений дирекции', path: '/decisions', icon: <Award size={15} /> },
        { label: 'Карта операционных рисков', path: '/risks', icon: <AlertTriangle size={15} /> },
        { label: 'Модуль напоминаний СЭД', path: '/reminders', icon: <Bell size={15} /> },
        { label: 'База знаний ТМК', path: '/knowledge-base', icon: <BookOpen size={15} /> },
        { label: 'Модуль аудита (Логи)', path: '/audit', icon: <History size={15} /> },
      ]
    }
  ];

  // Choose Sidebar themes depending on selected Style variant
  const getSidebarBg = () => {
    if (themeVariant === 'command') return 'bg-[#07090E] border-r border-[#152033] text-slate-300';
    if (themeVariant === 'government') return 'bg-[#091122] border-r border-[#15253A] text-slate-200';
    if (themeVariant === 'minimal') return 'bg-white border-r border-slate-200 text-slate-600';
    return 'bg-[#0F172A] border-r border-slate-800 text-slate-200'; // Hybrid/Default
  };

  const getActiveItemStyle = () => {
    if (themeVariant === 'minimal') return 'bg-slate-100 text-slate-900 font-bold';
    return 'bg-blue-600 text-white font-bold';
  };

  return (
    <div className={`w-72 flex flex-col shrink-0 flex-none h-full overflow-hidden ${getSidebarBg()}`}>
      
      {/* Sidebar Header Brand block */}
      <div className={`p-5 border-b shrink-0 ${themeVariant === 'minimal' ? 'border-slate-200' : 'border-slate-800/60'}`}>
        <span className="text-blue-500 font-bold font-mono text-[10px] tracking-widest uppercase">TMK EXECUTIVE // V3.0</span>
        <h2 className="font-extrabold tracking-tight text-base mt-0.5 font-display flex items-center gap-2">
          {themeVariant === 'minimal' ? 'TMK Executive' : 'Администрация ТМК'}
        </h2>
        <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mt-0.5">Единый портал контроля</p>
      </div>

      {/* Navigation list */}
      <nav className="flex-1 p-3 space-y-4 overflow-y-auto custom-scrollbar text-xs">
        {navGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            <span className="px-3 text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              {group.name}
            </span>
            <div className="space-y-0.5">
              {group.items.map(item => {
                const isActive = location.pathname === item.path;
                return (
                  <Link 
                    key={item.path} 
                    to={item.path}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all ${isActive ? getActiveItemStyle() + ' shadow-xs' : 'hover:bg-slate-800/10 hover:text-blue-500 dark:hover:bg-slate-800/30'}`}
                  >
                    {item.icon}
                    <span className="font-semibold text-[11px] truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Sidebar Footer Account Status */}
      <div className={`p-4 border-t shrink-0 ${themeVariant === 'minimal' ? 'border-slate-200' : 'border-slate-800'}`}>
        <div className="flex items-center justify-between">
          <div className="truncate text-xs pr-2 flex items-center gap-2.5">
            {!user || user.isAnonymous ? (
              <>
                <UserCircle size={22} className="text-slate-500 shrink-0" />
                <div className="truncate">
                  <div className="font-bold text-slate-700 dark:text-slate-300">Свободный гость</div>
                  <div className="text-[10px] text-slate-400">Offline-СЭД</div>
                </div>
              </>
            ) : (
              <div className="truncate">
                <div className="font-bold text-slate-700 dark:text-indigo-300 truncate">{user.displayName || 'Администратор'}</div>
                <div className="text-[9px] text-slate-500 truncate">{user.email}</div>
              </div>
            )}
          </div>
          <button 
            type="button"
            onClick={onLogout} 
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 hover:text-rose-600 transition-colors cursor-pointer" 
            title="Выйти"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

    </div>
  );
}
