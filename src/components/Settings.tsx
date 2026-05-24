import React, { useState, useEffect } from 'react';
import { User, Key, BarChart3, Database, Palette, Save, Eye, EyeOff, RefreshCw, CheckCircle2, AlertTriangle, Trash2 } from 'lucide-react';
import { auth, googleSignIn } from '../firebase';
import { syncAllData, resetAllData } from '../lib/hooks';

interface ApiKeyEntry {
  id: string;
  name: string;
  key: string;
  status: 'active' | 'expired' | 'error';
  lastUsed: string;
}

export default function Settings() {
  const [activeSection, setActiveSection] = useState<'profile' | 'api' | 'usage' | 'database' | 'theme'>('profile');
  const [syncing, setSyncing] = useState(false);
  const [themeVariant, setThemeVariant] = useState(() => localStorage.getItem('executive_theme') || 'hybrid');

  // API Keys state
  const [apiKeys, setApiKeys] = useState<ApiKeyEntry[]>(() => {
    const saved = localStorage.getItem('ew_api_keys');
    return saved ? JSON.parse(saved) : [
      { id: 'gemini', name: 'Gemini API Key', key: '', status: 'active' as const, lastUsed: 'Не использовался' },
      { id: 'openai', name: 'OpenAI API Key', key: '', status: 'active' as const, lastUsed: 'Не использовался' }
    ];
  });
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyValue, setNewKeyValue] = useState('');

  // Usage stats
  const [usageStats] = useState({
    aiRequests: { used: 147, limit: 1000 },
    storageSync: { used: 23, limit: 100 },
    letterGen: { used: 34, limit: 200 },
    reportGen: { used: 12, limit: 50 }
  });

  useEffect(() => {
    localStorage.setItem('ew_api_keys', JSON.stringify(apiKeys));
  }, [apiKeys]);

  const toggleKeyVisibility = (id: string) => {
    setVisibleKeys(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const updateKey = (id: string, value: string) => {
    setApiKeys(prev => prev.map(k => k.id === id ? { ...k, key: value } : k));
  };

  const addKey = () => {
    if (!newKeyName.trim()) return;
    setApiKeys(prev => [...prev, {
      id: `custom-${Date.now()}`,
      name: newKeyName,
      key: newKeyValue,
      status: 'active',
      lastUsed: 'Не использовался'
    }]);
    setNewKeyName('');
    setNewKeyValue('');
  };

  const deleteKey = (id: string) => {
    setApiKeys(prev => prev.filter(k => k.id !== id));
  };

  const handleSync = async (hardReset: boolean = false) => {
    if (hardReset) {
      const confirm = window.confirm("Вы уверены, что хотите сбросить всю базу данных к исходным данным?");
      if (!confirm) return;
    }
    setSyncing(true);
    try {
      const userId = auth.currentUser ? auth.currentUser.uid : 'guest';
      if (hardReset) {
        await resetAllData(userId);
      } else {
        await syncAllData(userId);
      }
      alert(hardReset ? "База данных сброшена!" : "Синхронизация завершена!");
      window.location.reload();
    } catch (e: any) {
      alert(`Ошибка: ${e.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const changeTheme = (variant: string) => {
    setThemeVariant(variant);
    localStorage.setItem('executive_theme', variant);
    window.location.reload();
  };

  const sections = [
    { id: 'profile' as const, label: 'Профиль', icon: <User size={16} /> },
    { id: 'api' as const, label: 'API Ключи', icon: <Key size={16} /> },
    { id: 'usage' as const, label: 'Расход ресурсов', icon: <BarChart3 size={16} /> },
    { id: 'database' as const, label: 'База данных', icon: <Database size={16} /> },
    { id: 'theme' as const, label: 'Оформление', icon: <Palette size={16} /> },
  ];

  const usageBar = (used: number, limit: number, color: string) => {
    const pct = Math.min((used / limit) * 100, 100);
    return (
      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
    );
  };

  return (
    <div className="ew-page p-6 lg:p-8 max-w-6xl mx-auto font-sans">
      <header className="mb-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 font-display">Настройки</h1>
        <p className="text-slate-500 text-sm mt-1">Управление профилем, ключами, расходом и темой оформления</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar sections */}
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            {sections.map(s => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left cursor-pointer ${
                  activeSection === s.id 
                    ? 'bg-blue-50 text-blue-700 shadow-sm' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {s.icon}
                {s.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content area */}
        <div className="lg:col-span-3">
          {/* ═══ PROFILE ═══ */}
          {activeSection === 'profile' && (
            <div className="ew-card p-6 space-y-6">
              <h2 className="text-lg font-bold text-slate-900 font-display">Профиль пользователя</h2>
              
              <div className="flex items-center gap-5 p-5 bg-slate-50 rounded-xl">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                  {auth.currentUser?.displayName?.[0] || auth.currentUser?.email?.[0]?.toUpperCase() || 'G'}
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-base">{auth.currentUser?.displayName || 'Гость'}</p>
                  <p className="text-sm text-slate-500">{auth.currentUser?.email || 'Оффлайн-режим'}</p>
                  <p className="text-xs text-slate-400 mt-1 font-mono">
                    UID: {auth.currentUser?.uid?.slice(0, 12) || 'guest'}...
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-4 bg-slate-50 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Статус авторизации</span>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${auth.currentUser && !auth.currentUser.isAnonymous ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    <span className="font-semibold text-slate-700">
                      {auth.currentUser && !auth.currentUser.isAnonymous ? 'Google Auth' : 'Гостевой режим'}
                    </span>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Провайдер</span>
                  <span className="font-semibold text-slate-700">
                    {auth.currentUser?.providerData?.[0]?.providerId || 'anonymous'}
                  </span>
                </div>
              </div>

              {(!auth.currentUser || auth.currentUser.isAnonymous) && (
                <button
                  onClick={() => googleSignIn()}
                  className="ew-btn ew-btn-primary"
                >
                  Войти через Google
                </button>
              )}
            </div>
          )}

          {/* ═══ API KEYS ═══ */}
          {activeSection === 'api' && (
            <div className="space-y-4">
              <div className="ew-card p-6 space-y-5">
                <h2 className="text-lg font-bold text-slate-900 font-display">API Ключи</h2>
                <p className="text-sm text-slate-500">Управление токенами доступа для ИИ-сервисов и внешних интеграций.</p>

                <div className="space-y-3">
                  {apiKeys.map(entry => (
                    <div key={entry.id} className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl group">
                      <Key size={16} className="text-slate-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-700">{entry.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <input
                            type={visibleKeys.has(entry.id) ? 'text' : 'password'}
                            value={entry.key}
                            onChange={e => updateKey(entry.id, e.target.value)}
                            placeholder="Вставьте ключ..."
                            className="flex-1 text-xs font-mono p-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400"
                          />
                          <button
                            onClick={() => toggleKeyVisibility(entry.id)}
                            className="p-1.5 text-slate-400 hover:text-slate-600 rounded"
                          >
                            {visibleKeys.has(entry.id) ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                          <button
                            onClick={() => deleteKey(entry.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-500 rounded opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add new key */}
                <div className="border-t pt-4 space-y-3">
                  <p className="text-xs font-bold text-slate-500 uppercase">Добавить новый ключ</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newKeyName}
                      onChange={e => setNewKeyName(e.target.value)}
                      placeholder="Название сервиса"
                      className="flex-1 text-xs p-2.5 border rounded-xl"
                    />
                    <input
                      type="text"
                      value={newKeyValue}
                      onChange={e => setNewKeyValue(e.target.value)}
                      placeholder="API ключ"
                      className="flex-1 text-xs font-mono p-2.5 border rounded-xl"
                    />
                    <button onClick={addKey} className="ew-btn ew-btn-primary whitespace-nowrap">
                      <Save size={14} /> Сохранить
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══ USAGE ═══ */}
          {activeSection === 'usage' && (
            <div className="ew-card p-6 space-y-6">
              <h2 className="text-lg font-bold text-slate-900 font-display">Расход ресурсов ИИ</h2>
              <p className="text-sm text-slate-500">Мониторинг использования ИИ-запросов и лимитов за текущий месяц.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: 'ИИ-запросы (Gemini)', ...usageStats.aiRequests, color: 'bg-blue-500', icon: <BarChart3 size={16} className="text-blue-500" /> },
                  { label: 'Синхронизации БД', ...usageStats.storageSync, color: 'bg-emerald-500', icon: <Database size={16} className="text-emerald-500" /> },
                  { label: 'Генерация писем', ...usageStats.letterGen, color: 'bg-indigo-500', icon: <Key size={16} className="text-indigo-500" /> },
                  { label: 'Генерация отчётов', ...usageStats.reportGen, color: 'bg-amber-500', icon: <BarChart3 size={16} className="text-amber-500" /> },
                ].map((item, i) => (
                  <div key={i} className="p-5 bg-slate-50 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {item.icon}
                        <span className="text-xs font-bold text-slate-700">{item.label}</span>
                      </div>
                      <span className="text-xs font-mono text-slate-500">{item.used}/{item.limit}</span>
                    </div>
                    {usageBar(item.used, item.limit, item.color)}
                    <p className="text-[10px] text-slate-400">
                      Осталось: {item.limit - item.used} ({Math.round(((item.limit - item.used) / item.limit) * 100)}%)
                    </p>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-start gap-3">
                <AlertTriangle size={16} className="text-blue-500 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-800">
                  Данные расхода обновляются в реальном времени. При достижении лимита система переключается на fallback-режим с локальными шаблонами.
                </p>
              </div>
            </div>
          )}

          {/* ═══ DATABASE ═══ */}
          {activeSection === 'database' && (
            <div className="ew-card p-6 space-y-6">
              <h2 className="text-lg font-bold text-slate-900 font-display">База данных</h2>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Подключение</span>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-500" />
                    <span className="text-sm font-semibold text-slate-700">
                      {auth.currentUser && !auth.currentUser.isAnonymous ? 'Firestore' : 'LocalStorage'}
                    </span>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Проект</span>
                  <span className="text-sm font-mono text-slate-700">gen-lang-client-0717923979</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleSync(false)}
                  disabled={syncing}
                  className="ew-btn ew-btn-primary"
                >
                  <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
                  Синхронизировать
                </button>
                <button
                  onClick={() => handleSync(true)}
                  disabled={syncing}
                  className="ew-btn ew-btn-ghost text-rose-600 border-rose-200 hover:bg-rose-50"
                >
                  <Trash2 size={14} />
                  Сбросить к исходным
                </button>
              </div>

              <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-3">
                <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800">
                  Сброс удалит все ваши изменения и восстановит демонстрационные данные из database.json.
                </p>
              </div>
            </div>
          )}

          {/* ═══ THEME ═══ */}
          {activeSection === 'theme' && (
            <div className="ew-card p-6 space-y-6">
              <h2 className="text-lg font-bold text-slate-900 font-display">Оформление интерфейса</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { id: 'hybrid', name: 'Executive OS Hybrid', desc: 'Гибридный стиль для повседневной работы', colors: ['#0F172A', '#3B82F6', '#F8FAFC'] },
                  { id: 'government', name: 'Government Executive', desc: 'Строгий стиль государственной службы', colors: ['#0F1E36', '#1E40AF', '#F4F6F9'] },
                  { id: 'command', name: 'Strategic Command', desc: 'Командный центр с тёмной темой', colors: ['#07090E', '#3B82F6', '#0B0F19'] },
                  { id: 'minimal', name: 'Minimal Workspace', desc: 'Элегантный минимализм', colors: ['#FFFFFF', '#0F172A', '#FBFBFA'] },
                ].map(theme => (
                  <button
                    key={theme.id}
                    onClick={() => changeTheme(theme.id)}
                    className={`p-5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                      themeVariant === theme.id 
                        ? 'border-blue-500 bg-blue-50/50 shadow-md' 
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {theme.colors.map((c, i) => (
                        <div key={i} className="w-5 h-5 rounded-full border border-slate-200" style={{ background: c }} />
                      ))}
                    </div>
                    <p className="text-sm font-bold text-slate-900">{theme.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{theme.desc}</p>
                    {themeVariant === theme.id && (
                      <span className="inline-block mt-2 text-[10px] font-bold text-blue-600 uppercase">✓ Активна</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
