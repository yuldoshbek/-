import React, { useState, useEffect } from 'react';
import { User, Key, BarChart3, Database, Palette, Save, Eye, EyeOff, RefreshCw, CheckCircle2, AlertTriangle, Trash2, Cpu, Sliders } from 'lucide-react';
import { auth, googleSignIn } from '../firebase';
import { syncAllData, resetAllData } from '../lib/hooks';
import { useWorkspace } from '../context/WorkspaceContext';
import { Domain } from '../types';
import { PROFILES, ALL_PROFILE_IDS } from '../lib/profiles';

interface ApiKeyEntry {
  id: string;
  name: string;
  key: string;
  status: 'active' | 'expired' | 'error';
  lastUsed: string;
}

const MODELS_LIST = {
  gemini: [
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', desc: 'Сверхбыстрая и экономичная модель для базовых задач' },
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', desc: 'Интеллектуальная модель для сложного анализа и логики' }
  ],
  openai: [
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', desc: 'Оптимизированная по скорости и цене модель от OpenAI' },
    { id: 'gpt-4o', name: 'GPT-4o Full', desc: 'Универсальная флагманская модель для любых задач' }
  ],
  anthropic: [
    { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', desc: 'Быстрая и точная модель с лаконичными ответами' },
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', desc: 'Флагман от Anthropic для глубокого кодинга и анализа' }
  ],
  deepseek: [
    { id: 'deepseek-chat', name: 'DeepSeek Chat (V3)', desc: 'Производительная и экономичная модель общего назначения' },
    { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner (R1)', desc: 'Рассуждающая модель для сложных логических вычислений' }
  ]
};

export default function Settings() {
  const [activeSection, setActiveSection] = useState<string>('profile');
  const [syncing, setSyncing] = useState(false);
  const [themeVariant, setThemeVariant] = useState(() => localStorage.getItem('executive_theme') || 'hybrid');
  const [testingKeyId, setTestingKeyId] = useState<string | null>(null);
  
  const { domain, setDomain } = useWorkspace();

  const [preferredModels, setPreferredModels] = useState<{ [key: string]: string }>(() => {
    const saved = localStorage.getItem('ew_preferred_models');
    return saved ? JSON.parse(saved) : {
      gemini: 'gemini-2.5-flash',
      openai: 'gpt-4o-mini',
      anthropic: 'claude-3-5-haiku-20241022',
      deepseek: 'deepseek-chat'
    };
  });

  const [aiTemperature, setAiTemperature] = useState<number>(() => {
    return parseFloat(localStorage.getItem('ew_ai_temperature') || '0.4');
  });

  const [aiBudgetLimit, setAiBudgetLimit] = useState<number>(() => {
    return parseFloat(localStorage.getItem('ew_ai_budget_limit') || '10.0');
  });

  const [aiTotalCost, setAiTotalCost] = useState<number>(() => {
    return parseFloat(localStorage.getItem('ew_ai_total_cost') || '0.0');
  });

  const [customInstructions, setCustomInstructions] = useState<string>(() => {
    return localStorage.getItem('ew_ai_custom_instructions') || '';
  });

  useEffect(() => {
    localStorage.setItem('ew_preferred_models', JSON.stringify(preferredModels));
  }, [preferredModels]);

  useEffect(() => {
    localStorage.setItem('ew_ai_temperature', aiTemperature.toString());
  }, [aiTemperature]);

  useEffect(() => {
    localStorage.setItem('ew_ai_budget_limit', aiBudgetLimit.toString());
  }, [aiBudgetLimit]);

  useEffect(() => {
    localStorage.setItem('ew_ai_total_cost', aiTotalCost.toString());
  }, [aiTotalCost]);

  useEffect(() => {
    localStorage.setItem('ew_ai_custom_instructions', customInstructions);
  }, [customInstructions]);

  const handleResetUsage = () => {
    if (window.confirm("Вы действительно хотите обнулить счетчики использования и очистить журнал запросов?")) {
      const emptyUsage = { usedRequests: 0, usedTokens: 0, errors: 0, history: [] };
      localStorage.setItem('ew_ai_usage', JSON.stringify(emptyUsage));
      localStorage.setItem('ew_ai_total_cost', '0.0');
      setAiUsage(emptyUsage);
      setAiTotalCost(0.0);
    }
  };

  // API Keys state with fallback/merge support for Anthropic and DeepSeek
  const [apiKeys, setApiKeys] = useState<ApiKeyEntry[]>(() => {
    const saved = localStorage.getItem('ew_api_keys');
    const parsed = saved ? JSON.parse(saved) : [];
    const defaults = [
      { id: 'gemini', name: 'Gemini API Key', key: '', status: 'active' as const, lastUsed: 'Не использовался' },
      { id: 'openai', name: 'OpenAI (ChatGPT) API Key', key: '', status: 'active' as const, lastUsed: 'Не использовался' },
      { id: 'anthropic', name: 'Claude (Anthropic) API Key', key: '', status: 'active' as const, lastUsed: 'Не использовался' },
      { id: 'deepseek', name: 'DeepSeek API Key', key: '', status: 'active' as const, lastUsed: 'Не использовался' }
    ];
    const merged = [...parsed];
    defaults.forEach(d => {
      if (!merged.find(k => k.id === d.id)) {
        merged.push(d);
      }
    });
    return merged;
  });
  const [activeProvider, setActiveProvider] = useState(() => {
    return localStorage.getItem('ew_active_ai_provider') || 'gemini';
  });
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyValue, setNewKeyValue] = useState('');

  const changeActiveProvider = (provider: string) => {
    setActiveProvider(provider);
    localStorage.setItem('ew_active_ai_provider', provider);
  };

  // Usage stats from localStorage
  const [aiUsage, setAiUsage] = useState(() => {
    const saved = localStorage.getItem('ew_ai_usage');
    return saved ? JSON.parse(saved) : { usedRequests: 147, usedTokens: 588000, errors: 2, history: [] };
  });

  const [customFirebaseConfig, setCustomFirebaseConfig] = useState(() => {
    return localStorage.getItem('ew_firebase_config') || '';
  });

  const handleSaveCustomFirebaseConfig = () => {
    if (!customFirebaseConfig.trim()) {
      alert("Конфигурация не может быть пустой!");
      return;
    }
    try {
      JSON.parse(customFirebaseConfig);
      localStorage.setItem('ew_firebase_config', customFirebaseConfig);
      alert("Конфигурация Firebase успешно сохранена! Страница будет перезагружена.");
      window.location.reload();
    } catch (e: any) {
      alert(`Ошибка валидации JSON: ${e.message}`);
    }
  };

  const handleResetCustomFirebaseConfig = () => {
    localStorage.removeItem('ew_firebase_config');
    setCustomFirebaseConfig('');
    alert("Конфигурация Firebase сброшена к исходной! Страница будет перезагружена.");
    window.location.reload();
  };

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
      // Build test headers dynamically based on tested provider
      const testHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-active-provider': entry.id,
      };
      testHeaders[`x-${entry.id}-key`] = entry.key;

      const res = await fetch('/api/translate-letter', {
        method: 'POST',
        headers: testHeaders,
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
    { id: 'profile', label: 'Профиль', icon: <User size={16} /> },
    { id: 'ai_control', label: 'Центр управления ИИ', icon: <Cpu size={16} /> },
    { id: 'database', label: 'База данных', icon: <Database size={16} /> },
    { id: 'theme', label: 'Оформление', icon: <Palette size={16} /> },
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

              {/* Profile Selector */}
              <div className="pt-4 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 mb-1">Профиль системы</h3>
                <p className="text-xs text-slate-500 mb-3">Выберите формат работы — система подстроит интерфейс, модули и ИИ.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {ALL_PROFILE_IDS.map(id => {
                    const p = PROFILES[id];
                    return (
                      <button
                        key={id}
                        onClick={() => setDomain(id)}
                        className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                          domain === id
                            ? 'border-blue-500 bg-blue-50/50 shadow-sm'
                            : 'border-slate-200 hover:border-blue-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{p.icon}</span>
                          <p className="font-bold text-sm text-slate-900">{p.name}</p>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-relaxed">{p.description}</p>
                        {domain === id && (
                          <span className="inline-block mt-2 text-[9px] font-bold text-blue-600 uppercase">✓ Активен</span>
                        )}
                      </button>
                    );
                  })}
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

          {/* ═══ AI CONTROL CENTER ═══ */}
          {activeSection === 'ai_control' && (
            <div className="space-y-6">
              {/* 1. KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="ew-card p-5 bg-slate-50 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                    <Cpu size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Активный ИИ</span>
                    <span className="text-sm font-bold text-slate-800 truncate block">
                      {activeProvider === 'gemini' && 'Google Gemini'}
                      {activeProvider === 'openai' && 'OpenAI (ChatGPT)'}
                      {activeProvider === 'anthropic' && 'Claude (Anthropic)'}
                      {activeProvider === 'deepseek' && 'DeepSeek'}
                    </span>
                    <span className="text-xs text-slate-500 block font-mono mt-0.5 truncate">
                      {preferredModels[activeProvider] || 'default'}
                    </span>
                  </div>
                </div>

                <div className="ew-card p-5 bg-slate-50 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Лимит бюджета (USD)</span>
                      <span className="text-sm font-bold text-slate-800">
                        ${aiTotalCost.toFixed(4)} / ${aiBudgetLimit.toFixed(2)}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-slate-500 font-mono">
                      {Math.min(100, Math.round((aiTotalCost / aiBudgetLimit) * 100))}%
                    </span>
                  </div>
                  {usageBar(aiTotalCost, aiBudgetLimit, aiTotalCost >= aiBudgetLimit ? 'bg-rose-500' : 'bg-blue-600')}
                </div>

                <div className="ew-card p-5 bg-slate-50 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                    <BarChart3 size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Использование</span>
                    <span className="text-sm font-bold text-slate-800">
                      {aiUsage.usedRequests} запр. / {aiUsage.errors} ош.
                    </span>
                    <span className="text-xs text-slate-500 block font-mono mt-0.5">
                      ~{(aiUsage.usedTokens || 0).toLocaleString()} токенов
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Main Grid: Model Tuning + Limits Control */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Left Card: Models & Providers */}
                <div className="ew-card p-6 space-y-6">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 font-display">Настройки Провайдеров и Моделей</h3>
                    <p className="text-xs text-slate-500 mt-1">Выберите активного провайдера, настройте модель и введите ключ доступа.</p>
                  </div>

                  {/* Provider Radio Selector */}
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'gemini', name: 'Google Gemini', icon: '♊' },
                      { id: 'openai', name: 'OpenAI (ChatGPT)', icon: '🧠' },
                      { id: 'anthropic', name: 'Claude (Anthropic)', icon: '🦉' },
                      { id: 'deepseek', name: 'DeepSeek', icon: '🐳' }
                    ].map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => changeActiveProvider(p.id)}
                        className={`p-3 rounded-xl border text-xs font-bold text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                          activeProvider === p.id
                            ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm shadow-blue-500/5'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <span className="text-base">{p.icon}</span>
                        <div>
                          <p className="font-bold">{p.name}</p>
                          <span className="text-[9px] text-slate-400 font-normal block">
                            {activeProvider === p.id ? '✓ Активен' : 'Клик для активации'}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Active Provider specific configuration card */}
                  <div className="p-4 bg-slate-50 rounded-xl space-y-4 border border-slate-100">
                    <div className="flex items-center gap-2 border-b border-slate-200/60 pb-3">
                      <span className="text-lg">
                        {activeProvider === 'gemini' && '♊'}
                        {activeProvider === 'openai' && '🧠'}
                        {activeProvider === 'anthropic' && '🦉'}
                        {activeProvider === 'deepseek' && '🐳'}
                      </span>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                        Конфигурация {activeProvider.toUpperCase()}
                      </h4>
                    </div>

                    {/* Model Select */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">Выбор языковой модели</label>
                      <select
                        value={preferredModels[activeProvider] || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPreferredModels(prev => ({ ...prev, [activeProvider]: val }));
                        }}
                        className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400 font-mono"
                      >
                        {(MODELS_LIST[activeProvider as keyof typeof MODELS_LIST] || []).map(m => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                      <p className="text-[10px] text-slate-400 leading-normal italic mt-1">
                        {(MODELS_LIST[activeProvider as keyof typeof MODELS_LIST] || []).find(m => m.id === preferredModels[activeProvider])?.desc}
                      </p>
                    </div>

                    {/* API Key Input */}
                    {apiKeys.find(k => k.id === activeProvider) && (
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <label className="block text-xs font-bold text-slate-700">API Ключ</label>
                          {apiKeys.find(k => k.id === activeProvider)?.lastUsed && apiKeys.find(k => k.id === activeProvider)?.lastUsed !== 'Не использовался' && (
                            <span className="text-[9px] text-slate-400 font-mono">Проверен: {apiKeys.find(k => k.id === activeProvider)?.lastUsed}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type={visibleKeys.has(activeProvider) ? 'text' : 'password'}
                            value={apiKeys.find(k => k.id === activeProvider)?.key || ''}
                            onChange={e => updateKey(activeProvider, e.target.value)}
                            placeholder={`Введите API Ключ для ${activeProvider}...`}
                            className="flex-1 text-xs font-mono p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400"
                          />
                          <button
                            type="button"
                            onClick={() => toggleKeyVisibility(activeProvider)}
                            className="p-2 text-slate-400 hover:text-slate-600 rounded bg-white border border-slate-200"
                          >
                            {visibleKeys.has(activeProvider) ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTestKey(apiKeys.find(k => k.id === activeProvider)!)}
                            disabled={testingKeyId !== null}
                            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 text-[10px] font-bold rounded-lg transition-colors flex items-center gap-1.5 shrink-0 shadow-sm"
                          >
                            {testingKeyId === activeProvider ? <RefreshCw size={11} className="animate-spin" /> : <RefreshCw size={11} />}
                            Тест
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Card: Fine Tuning & Limits */}
                <div className="ew-card p-6 space-y-6">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 font-display">Тонкая настройка ИИ и Лимиты</h3>
                    <p className="text-xs text-slate-500 mt-1">Регулируйте креативность модели, задавайте глобальные промпты и контролируйте расходы.</p>
                  </div>

                  {/* Temperature slider */}
                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                        <Sliders size={14} className="text-slate-400" />
                        Температура ИИ (Креативность)
                      </label>
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-mono font-bold text-xs rounded">
                        {aiTemperature.toFixed(1)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.0"
                      max="1.0"
                      step="0.1"
                      value={aiTemperature}
                      onChange={(e) => setAiTemperature(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="text-[10px] text-slate-500 italic leading-normal">
                      {aiTemperature <= 0.2 && "✓ Строгий режим (рекомендуется для анализа данных, протоколов и сложных таблиц)"}
                      {aiTemperature > 0.2 && aiTemperature <= 0.6 && "✓ Сбалансированный режим (подходит для писем, писем-ответов и делового стиля)"}
                      {aiTemperature > 0.6 && "✓ Креативный режим (полезно для генерации идей, креативных резюме и писем)"}
                    </div>
                  </div>

                  {/* Custom system prompt overriding */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">Глобальные системные инструкции</label>
                    <textarea
                      rows={3}
                      value={customInstructions}
                      onChange={(e) => setCustomInstructions(e.target.value)}
                      placeholder="Например: 'Всегда отвечай только на русском языке', 'Общайся в подчеркнуто вежливом деловом тоне', 'Будь максимально кратким, избегай лишних предисловий'."
                      className="w-full text-xs p-3 border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-none focus:border-blue-400 placeholder:text-slate-400"
                    />
                    <p className="text-[9px] text-slate-400 leading-normal">
                      Эти инструкции будут внедрены в системный промпт ИИ и применены ко всем вызовам во всех модулях.
                    </p>
                  </div>

                  {/* Budget Limit Setup */}
                  <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">Лимит бюджета в USD</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-xs text-slate-400 font-bold">$</span>
                        <input
                          type="number"
                          min="0.1"
                          step="0.5"
                          value={aiBudgetLimit}
                          onChange={(e) => setAiBudgetLimit(Math.max(0.1, parseFloat(e.target.value) || 10.0))}
                          className="w-full text-xs p-1.5 pl-6 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400 font-bold font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col justify-end">
                      <button
                        type="button"
                        onClick={handleResetUsage}
                        className="w-full py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <Trash2 size={13} />
                        Сбросить счетчики
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Transaction Log Table */}
              <div className="ew-card p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 font-display">Журнал запросов и транзакций ИИ</h3>
                    <p className="text-xs text-slate-500 mt-1">Детализация последних 50 вызовов API с расчетом стоимости в реальном времени.</p>
                  </div>
                  <span className="px-2.5 py-1 bg-slate-100 rounded-lg text-slate-500 font-mono text-[10px] font-bold uppercase">
                    Последние 50
                  </span>
                </div>

                <div className="overflow-x-auto border border-slate-100 rounded-xl max-h-80 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase sticky top-0">
                        <th className="p-3 bg-slate-50">Время</th>
                        <th className="p-3 bg-slate-50">Эндпоинт</th>
                        <th className="p-3 bg-slate-50">Модель</th>
                        <th className="p-3 bg-slate-50">Статус</th>
                        <th className="p-3 bg-slate-50 text-right">Токены</th>
                        <th className="p-3 bg-slate-50 text-right">Стоимость USD</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      {aiUsage.history && aiUsage.history.length > 0 ? (
                        aiUsage.history.map((log: any) => (
                          <tr key={log.id} className="hover:bg-slate-50/50">
                            <td className="p-3 text-slate-500">
                              {new Date(log.timestamp).toLocaleTimeString('ru-RU')}
                            </td>
                            <td className="p-3 font-semibold text-slate-700">
                              {log.endpoint}
                            </td>
                            <td className="p-3 text-slate-600 text-[10px] max-w-[130px] truncate">
                              {log.model || 'Unknown'}
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                log.status === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                              }`}>
                                {log.status === 'success' ? 'Успешно' : 'Ошибка'}
                              </span>
                            </td>
                            <td className="p-3 text-right text-slate-600">
                              {log.tokens ? log.tokens.toLocaleString() : 0}
                            </td>
                            <td className="p-3 text-right font-bold text-slate-800">
                              {log.cost ? `$${log.cost.toFixed(5)}` : '$0.00000'}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-slate-400 font-sans">
                            Журнал запросов пуст.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-start gap-3">
                  <AlertTriangle size={16} className="text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-800">
                    При превышении лимита бюджета ИИ бэкенд блокирует запросы с кодом 403. Сбросьте счетчики или увеличьте лимит, чтобы восстановить полный доступ к функциям ИИ.
                  </p>
                </div>
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

              {/* Custom Firebase configuration block */}
              <div className="border-t pt-5 space-y-4">
                <h3 className="text-sm font-bold text-slate-800 font-display">
                  Пользовательский Firebase (для обхода ошибки auth/unauthorized-domain)
                </h3>
                <p className="text-xs text-slate-500">
                  Если вы запускаете систему на собственном домене, создайте проект в Firebase Console, включите Google Authentication, добавьте ваш домен в список разрешенных (Authorized Domains) и вставьте конфигурационную строку JSON ниже:
                </p>
                <textarea
                  rows={6}
                  value={customFirebaseConfig}
                  onChange={e => setCustomFirebaseConfig(e.target.value)}
                  placeholder={`{\n  "projectId": "your-project-id",\n  "appId": "1:...",\n  "apiKey": "AIzaSy...",\n  "authDomain": "your-project-id.firebaseapp.com",\n  "storageBucket": "your-project-id.firebasestorage.app",\n  "messagingSenderId": "..."\n}`}
                  className="w-full text-xs font-mono p-3 border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-none focus:border-blue-400"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveCustomFirebaseConfig}
                    className="ew-btn ew-btn-primary"
                  >
                    <Save size={14} /> Применить конфигурацию
                  </button>
                  {localStorage.getItem('ew_firebase_config') && (
                    <button
                      onClick={handleResetCustomFirebaseConfig}
                      className="ew-btn ew-btn-ghost text-rose-600 border-rose-200 hover:bg-rose-50"
                    >
                      Сбросить к проекту по умолчанию
                    </button>
                  )}
                </div>
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
