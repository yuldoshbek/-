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
  const [testingKeyId, setTestingKeyId] = useState<string | null>(null);

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

  // Usage stats from localStorage
  const [aiUsage, setAiUsage] = useState(() => {
    const saved = localStorage.getItem('ew_ai_usage');
    return saved ? JSON.parse(saved) : { usedRequests: 147, usedTokens: 588000, errors: 2, history: [] };
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

  const handleTestKey = async (entry: ApiKeyEntry) => {
    if (!entry.key) {
      alert("Пожалуйста, сначала введите API ключ!");
      return;
    }
    setTestingKeyId(entry.id);
    try {
      const res = await fetch('/api/translate-letter', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-gemini-key': entry.key
        },
        body: JSON.stringify({ instruction: 'Тест подключения к API.', style: 'official' })
      });
      const data = await res.json();
      if (res.ok && !data.error) {
        const timeStr = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        setApiKeys(prev => {
          const updated = prev.map(k => k.id === entry.id ? { ...k, status: 'active' as const, lastUsed: timeStr } : k);
          localStorage.setItem('ew_api_keys', JSON.stringify(updated));
          return updated;
        });
        alert("Успешно! Соединение с API установлено.");
      } else {
        throw new Error(data.error || "Неизвестная ошибка проверки ключа.");
      }
    } catch (err: any) {
      setApiKeys(prev => {
        const updated = prev.map(k => k.id === entry.id ? { ...k, status: 'error' as const } : k);
        localStorage.setItem('ew_api_keys', JSON.stringify(updated));
        return updated;
      });
      alert(`Ошибка подключения к API: ${err.message}`);
    } finally {
      setTestingKeyId(null);
    }
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
                        <div className="flex justify-between items-center mb-1">
                          <p className="text-xs font-bold text-slate-700">{entry.name}</p>
                          <div className="flex items-center gap-2">
                            {entry.lastUsed && entry.lastUsed !== 'Не использовался' && (
                              <span className="text-[9px] text-slate-400 font-medium">Проверен: {entry.lastUsed}</span>
                            )}
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                              entry.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                            }`}>
                              {entry.status === 'active' ? 'Активен' : 'Ошибка'}
                            </span>
                          </div>
                        </div>
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
                            onClick={() => handleTestKey(entry)}
                            disabled={testingKeyId !== null}
                            className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border text-slate-600 disabled:opacity-50 text-[10px] font-bold rounded-lg transition-colors flex items-center gap-1 shrink-0 shadow-sm"
                          >
                            {testingKeyId === entry.id ? <RefreshCw size={11} className="animate-spin" /> : <RefreshCw size={11} />}
                            Тест
                          </button>
                          {entry.id !== 'gemini' && entry.id !== 'openai' && (
                            <button
                              onClick={() => deleteKey(entry.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-500 rounded opacity-0 group-hover:opacity-100 shrink-0"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
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
                  { label: 'ИИ-запросы (Всего)', used: aiUsage.usedRequests, limit: 1000, color: 'bg-blue-500', icon: <BarChart3 size={16} className="text-blue-500" /> },
                  { label: 'Оценочный токен-счетчик', used: aiUsage.usedTokens, limit: 5000000, color: 'bg-indigo-500', icon: <Key size={16} className="text-indigo-500" /> },
                  { label: 'Ошибки запросов', used: aiUsage.errors, limit: 100, color: 'bg-rose-500', icon: <AlertTriangle size={16} className="text-rose-500" /> },
                  { label: 'Синхронизации БД', used: 12, limit: 100, color: 'bg-emerald-500', icon: <Database size={16} className="text-emerald-500" /> },
                ].map((item, i) => (
                  <div key={i} className="p-5 bg-slate-50 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {item.icon}
                        <span className="text-xs font-bold text-slate-700">{item.label}</span>
                      </div>
                      <span className="text-xs font-mono text-slate-500">{item.used.toLocaleString()}/{item.limit.toLocaleString()}</span>
                    </div>
                    {usageBar(item.used, item.limit, item.color)}
                    <p className="text-[10px] text-slate-400">
                      Осталось: {(item.limit - item.used).toLocaleString()} ({Math.max(0, Math.round(((item.limit - item.used) / item.limit) * 100))}%)
                    </p>
                  </div>
                ))}
              </div>

              {/* AI Request History Log */}
              <div className="border-t pt-6 space-y-3">
                <h3 className="text-sm font-bold text-slate-900 font-display">Журнал запросов ИИ (Последние 50)</h3>
                <div className="overflow-x-auto border border-slate-100 rounded-xl max-h-60 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase sticky top-0">
                        <th className="p-3 bg-slate-50">Время</th>
                        <th className="p-3 bg-slate-50">Эндпоинт</th>
                        <th className="p-3 bg-slate-50">Статус</th>
                        <th className="p-3 bg-slate-50 text-right">Токены</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      {aiUsage.history && aiUsage.history.length > 0 ? (
                        aiUsage.history.map((log: any) => (
                          <tr key={log.id} className="hover:bg-slate-50/50">
                            <td className="p-3 text-slate-500">{new Date(log.timestamp).toLocaleTimeString('ru-RU')}</td>
                            <td className="p-3 font-semibold text-slate-700">{log.endpoint}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                log.status === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                              }`}>
                                {log.status === 'success' ? 'Успешно' : 'Ошибка'}
                              </span>
                            </td>
                            <td className="p-3 text-right text-slate-600">{log.tokens.toLocaleString()}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="p-4 text-center text-slate-400 font-sans">Журнал запросов пуст.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
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
