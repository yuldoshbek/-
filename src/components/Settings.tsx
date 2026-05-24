import React, { useState, useEffect } from 'react';
import { 
  User, 
  Key, 
  BarChart3, 
  Database, 
  Palette, 
  Save, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Trash2, 
  Cpu, 
  Sliders,
  ShieldCheck,
  Google
} from 'lucide-react';
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
  const [activeSection, setActiveSection] = useState<string>('profile_domain');
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

  // API Keys state
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

  const handleTestKey = async (entry: ApiKeyEntry) => {
    if (!entry.key) {
      alert("Пожалуйста, сначала введите API ключ!");
      return;
    }
    setTestingKeyId(entry.id);
    try {
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

  const sidebarSections = [
    { id: 'profile_domain', label: 'Профиль работы', icon: <User size={16} /> },
    { id: 'api_keys', label: 'API-ключи', icon: <Key size={16} /> },
    { id: 'tokens_budget', label: 'Токены / Расходы', icon: <BarChart3 size={16} /> },
    { id: 'google_integration', label: 'Google / СЭД', icon: <Database size={16} /> },
    { id: 'prompt_templates', label: 'Шаблоны и стили', icon: <Sliders size={16} /> },
    { id: 'audit_security', label: 'Аудит и База', icon: <ShieldCheck size={16} /> }
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
      <header className="mb-8 border-b pb-4">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 font-display">Настройки</h1>
        <p className="text-slate-500 text-sm mt-0.5">Конфигурация провайдеров ИИ, профилей работы, Google-интеграции и аудита безопасности</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Sidebar Nav */}
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            {sidebarSections.map(s => (
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

        {/* Content Area */}
        <div className="lg:col-span-3">
          
          {/* ═══ 1. WORKSPACE PROFILE SELECTOR ═══ */}
          {activeSection === 'profile_domain' && (
            <div className="ew-card p-6 space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-900 font-display">Профиль работы и домен</h2>
                <p className="text-xs text-slate-500 mt-1">Переключите доменное пространство — система адаптирует лейблы и доступные инструменты.</p>
              </div>
              
              <div className="flex items-center gap-5 p-5 bg-slate-50 rounded-xl border">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-lg font-bold shadow">
                  {auth.currentUser?.displayName?.[0] || auth.currentUser?.email?.[0]?.toUpperCase() || 'G'}
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">{auth.currentUser?.displayName || 'Учетная запись: Гость'}</p>
                  <p className="text-xs text-slate-500">{auth.currentUser?.email || 'Локальный режим'}</p>
                  <span className="inline-block mt-1 text-[9px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded font-mono">
                    ID: {auth.currentUser?.uid?.slice(0, 10) || 'local_guest'}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700">Доступные рабочие профили</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {ALL_PROFILE_IDS.map(id => {
                    const p = PROFILES[id];
                    return (
                      <button
                        key={id}
                        onClick={() => setDomain(id)}
                        className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                          domain === id
                            ? 'border-blue-500 bg-blue-50/50 shadow-sm'
                            : 'border-slate-200 hover:border-blue-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-base">{p.icon}</span>
                          <p className="font-bold text-xs text-slate-900">{p.name}</p>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-relaxed">{p.description}</p>
                        {domain === id && (
                          <span className="inline-block mt-2 text-[9px] font-bold text-blue-600 uppercase">✓ АКТИВЕН</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ═══ 2. API KEYS ═══ */}
          {activeSection === 'api_keys' && (
            <div className="ew-card p-6 space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-900 font-display">Настройка API Ключей ИИ</h2>
                <p className="text-xs text-slate-500 mt-1">Введите ваши персональные ключи для использования необходимых нейросетей.</p>
              </div>

              {/* Provider Radio Selector */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                {[
                  { id: 'gemini', name: 'Gemini API', icon: '♊' },
                  { id: 'openai', name: 'OpenAI (GPT)', icon: '🧠' },
                  { id: 'anthropic', name: 'Claude API', icon: '🦉' },
                  { id: 'deepseek', name: 'DeepSeek', icon: '🐳' }
                ].map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => changeActiveProvider(p.id)}
                    className={`p-3 rounded-xl border text-xs font-bold text-left flex flex-col justify-between h-20 transition-all cursor-pointer ${
                      activeProvider === p.id
                        ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">{p.icon}</span>
                      <span className="font-bold text-[11px]">{p.name}</span>
                    </div>
                    <span className="text-[9px] text-slate-400 font-normal">
                      {activeProvider === p.id ? '✓ Активен' : 'Выбрать'}
                    </span>
                  </button>
                ))}
              </div>

              {/* Active Provider specific configuration card */}
              <div className="p-4 bg-slate-50 rounded-xl space-y-4 border border-slate-200/50">
                <div className="flex items-center gap-2 border-b pb-2">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Настройка ключа для {activeProvider.toUpperCase()}
                  </span>
                </div>

                {/* Model Selection */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">Языковая модель по умолчанию</label>
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
                  <p className="text-[10px] text-slate-400 italic">
                    {(MODELS_LIST[activeProvider as keyof typeof MODELS_LIST] || []).find(m => m.id === preferredModels[activeProvider])?.desc}
                  </p>
                </div>

                {/* API Key Entry */}
                {apiKeys.find(k => k.id === activeProvider) && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="block text-xs font-bold text-slate-700">Токен / Ключ доступа</label>
                      {apiKeys.find(k => k.id === activeProvider)?.lastUsed !== 'Не использовался' && (
                        <span className="text-[9px] text-slate-400 font-mono">Проверен: {apiKeys.find(k => k.id === activeProvider)?.lastUsed}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type={visibleKeys.has(activeProvider) ? 'text' : 'password'}
                        value={apiKeys.find(k => k.id === activeProvider)?.key || ''}
                        onChange={e => updateKey(activeProvider, e.target.value)}
                        placeholder={`Вставьте ключ API для ${activeProvider}...`}
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
          )}

          {/* ═══ 3. TOKENS & BUDGETS ═══ */}
          {activeSection === 'tokens_budget' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="ew-card p-5 bg-slate-50 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Лимит ИИ расходов (USD)</span>
                      <span className="text-sm font-bold text-slate-800">
                        ${aiTotalCost.toFixed(4)} / ${aiBudgetLimit.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  {usageBar(aiTotalCost, aiBudgetLimit, aiTotalCost >= aiBudgetLimit ? 'bg-rose-500' : 'bg-blue-600')}
                </div>

                <div className="ew-card p-5 bg-slate-50 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                    <BarChart3 size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Сводная Статистика</span>
                    <span className="text-sm font-bold text-slate-800">
                      {aiUsage.usedRequests} вызовов / {aiUsage.errors} сбоев
                    </span>
                    <span className="text-xs text-slate-400 block font-mono">~{aiUsage.usedTokens?.toLocaleString() || 0} токенов</span>
                  </div>
                </div>
              </div>

              {/* Adjust limit inputs */}
              <div className="ew-card p-6 space-y-4">
                <h3 className="text-sm font-bold text-slate-900">Управление бюджетом и лимитами</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      className="w-full py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Trash2 size={13} /> Сбросить расходы и историю
                    </button>
                  </div>
                </div>
              </div>

              {/* Transaction Logs */}
              <div className="ew-card p-6 space-y-4">
                <h3 className="text-sm font-bold text-slate-900">Детализация последних запросов</h3>
                <div className="overflow-x-auto border rounded-xl max-h-60 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 sticky top-0">
                      <tr className="border-b text-[10px] font-bold text-slate-400 uppercase">
                        <th className="p-3">Время</th>
                        <th className="p-3">Эндпоинт</th>
                        <th className="p-3">Модель</th>
                        <th className="p-3">Статус</th>
                        <th className="p-3 text-right">Токены</th>
                        <th className="p-3 text-right">Стоимость USD</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      {aiUsage.history && aiUsage.history.length > 0 ? (
                        aiUsage.history.map((log: any) => (
                          <tr key={log.id} className="hover:bg-slate-50/50">
                            <td className="p-3 text-slate-500">{new Date(log.timestamp).toLocaleTimeString('ru-RU')}</td>
                            <td className="p-3 font-semibold text-slate-700">{log.endpoint}</td>
                            <td className="p-3 text-slate-500 truncate max-w-[120px]">{log.model}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                log.status === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                              }`}>{log.status === 'success' ? 'Успешно' : 'Сбой'}</span>
                            </td>
                            <td className="p-3 text-right">{log.tokens?.toLocaleString() || 0}</td>
                            <td className="p-3 text-right font-bold">${log.cost?.toFixed(5) || '0.00000'}</td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan={6} className="p-6 text-center text-slate-400 font-sans">Журнал запросов пуст.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ═══ 4. GOOGLE & FIREBASE INTEGRATION ═══ */}
          {activeSection === 'google_integration' && (
            <div className="ew-card p-6 space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-900 font-display">Интеграция с Google Workspace</h2>
                <p className="text-xs text-slate-500 mt-1">Настройка Firebase синхронизации, Google диска и Gmail-черновиков.</p>
              </div>

              <div className="p-4 bg-slate-50 border rounded-xl space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Управление доступом Google OAuth</span>
                <div className="flex justify-between items-center text-xs">
                  <span>Статус Google аккаунта:</span>
                  <span className={`px-2 py-0.5 rounded font-bold text-[9px] ${
                    auth.currentUser && !auth.currentUser.isAnonymous ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'
                  }`}>
                    {auth.currentUser && !auth.currentUser.isAnonymous ? 'АВТОРИЗОВАН' : 'ЛОКАЛЬНЫЙ / ГОСТЬ'}
                  </span>
                </div>
                {(!auth.currentUser || auth.currentUser.isAnonymous) ? (
                  <button onClick={() => googleSignIn()} className="ew-btn ew-btn-primary text-xs">
                    Войти через аккаунт Google
                  </button>
                ) : (
                  <button onClick={() => auth.signOut()} className="ew-btn ew-btn-ghost text-xs text-rose-600 border-rose-200">
                    Выйти из аккаунта
                  </button>
                )}
              </div>

              {/* Custom Firebase configuration block */}
              <div className="border-t pt-5 space-y-4">
                <h3 className="text-sm font-bold text-slate-800 font-display">Пользовательский Firebase JSON</h3>
                <p className="text-xs text-slate-500">
                  Если вы запускаете систему на собственном домене, создайте проект в Firebase Console, включите Google Authentication и добавьте конфигурационный JSON ниже:
                </p>
                <textarea
                  rows={6}
                  value={customFirebaseConfig}
                  onChange={e => setCustomFirebaseConfig(e.target.value)}
                  placeholder={`{\n  "projectId": "your-project-id",\n  "appId": "1:...",\n  "apiKey": "AIzaSy...",\n  "authDomain": "your-project-id.firebaseapp.com"\n}`}
                  className="w-full text-xs font-mono p-3 border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-none focus:border-blue-400"
                />
                <div className="flex gap-2">
                  <button onClick={handleSaveCustomFirebaseConfig} className="ew-btn ew-btn-primary">
                    <Save size={14} /> Применить
                  </button>
                  {localStorage.getItem('ew_firebase_config') && (
                    <button onClick={handleResetCustomFirebaseConfig} className="ew-btn ew-btn-ghost text-rose-600 border-rose-200">
                      Сбросить к исходным
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ═══ 5. PROMPT TEMPLATES & INTERFACE STYLE ═══ */}
          {activeSection === 'prompt_templates' && (
            <div className="space-y-6">
              
              {/* System prompts */}
              <div className="ew-card p-6 space-y-4">
                <h3 className="text-base font-bold text-slate-900 font-display">Глобальные Системные Инструкции</h3>
                <p className="text-xs text-slate-500">
                  Добавьте постоянные правила для всех нейросетей (например: "Отвечать только на русском языке").
                </p>
                <textarea
                  rows={4}
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="Пример: Отвечай строго в лаконичном тоне, избегай вводных слов..."
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl bg-slate-50/50 focus:outline-none"
                />
              </div>

              {/* Themes */}
              <div className="ew-card p-6 space-y-4">
                <h3 className="text-base font-bold text-slate-900 font-display">Темы оформления интерфейса</h3>
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
            </div>
          )}

          {/* ═══ 6. AUDIT & DATABASE SYNC ═══ */}
          {activeSection === 'audit_security' && (
            <div className="ew-card p-6 space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-900 font-display">Синхронизация Базы и Аудит</h2>
                <p className="text-xs text-slate-500 mt-1">Сброс или перенос базы данных (Firestore / LocalStorage) и аудит целостности.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Режим Базы Данных</span>
                  <div className="flex items-center gap-2 text-xs">
                    <CheckCircle2 size={14} className="text-emerald-500" />
                    <span className="font-bold text-slate-700">
                      {auth.currentUser && !auth.currentUser.isAnonymous ? 'Firestore Cloud' : 'LocalStorage Sandbox'}
                    </span>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Версия Системы</span>
                  <span className="text-xs font-mono font-bold text-slate-700">v1.2.1-stable</span>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => handleSync(false)}
                  disabled={syncing}
                  className="ew-btn ew-btn-primary flex items-center gap-1"
                >
                  <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
                  Синхронизировать данные
                </button>
                <button
                  onClick={() => handleSync(true)}
                  disabled={syncing}
                  className="ew-btn ew-btn-ghost text-rose-600 border-rose-200 hover:bg-rose-50 flex items-center gap-1"
                >
                  <Trash2 size={14} />
                  Сбросить базу к исходной
                </button>
              </div>

              <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-3">
                <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed">
                  <b>Сброс базы данных:</b> Это действие перезапишет все изменения (задачи, решения, протоколы) дефолтными данными.
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
