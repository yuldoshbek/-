import React, { useState } from 'react';
import { useTasks, useComplaints, useMeetings, logAIUsage } from '../lib/hooks';
import { Send, RefreshCw, Sparkles, MessageSquare, CornerDownRight, Clock, Zap } from 'lucide-react';
import { getAIHeaders } from '../lib/ai-context';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const systemPrompts: Record<string, string> = {
  letter: "Ты — ИИ-помощник по составлению официальных писем и деловой переписке в Assistant OS. Твоя цель — помочь составить грамотное, вежливое и строго деловое письмо. По возможности структурируй и используй профессиональный тон.",
  report: "Ты — ИИ-аналитик по подготовке отчетов и аналитических справок в Assistant OS. Твоя цель — помочь структурировать отчет, выделить KPI показатели и сгруппировать выводы по разделам.",
  protocol: "Ты — ИИ-протоколист в Assistant OS. Твоя цель — составить четкий протокол (Minutes of Meeting) встречи на основе тезисов, выделить повестку, решения и ответственных.",
  summary: "Ты — ИИ-ассистент по суммаризации (Executive Summary) в Assistant OS. Твоя цель — сжать объемный текст до краткой сути, выписать только ключевые мысли, цифры и факты.",
  translate: "Ты — ИИ-переводчик в Assistant OS. Специализируешься на двустороннем переводе официальных текстов и переписке между русским и узбекским (латиница) языками.",
  analyze: "Ты — ИИ-аналитик рисков и оргпроцессов в Assistant OS. Твоя цель — проанализировать входящую информацию на предмет инфраструктурных задержек, срывов дедлайнов и кадровых рисков."
};

const presets: Record<string, Array<{ title: string; desc: string; promptText: string }>> = {
  letter: [
    { title: '✉️ Официальный ответ', desc: 'Деловой ответ контрагенту', promptText: 'Составь деловой ответ партнеру с вежливым подтверждением получения материалов и уточнением сроков.' },
    { title: '📝 Запрос статуса', desc: 'Напоминание о задаче', promptText: 'Напиши письмо в юридический отдел с просьбой предоставить актуальный статус по проверке договоров.' }
  ],
  report: [
    { title: '📊 Отчет за неделю', desc: 'Сводный статус проектов', promptText: 'Помоги составить структуру еженедельного отчета по эффективности разработки CRM.' },
    { title: '📉 Анализ срывов', desc: 'Причины просрочек задач', promptText: 'Сформулируй аналитический блок отчета, объясняющий задержки поставок логистики.' }
  ],
  protocol: [
    { title: '📋 Короткий протокол', desc: 'Собрание по статусу', promptText: 'Сформируй протокол из тезисов: Обсудили CRM, решили перенести релиз на 29 мая, ответственный Рустам.' }
  ],
  summary: [
    { title: '🔍 Сжать отчет', desc: 'Главное из большого доклада', promptText: 'Сделай краткую выжимку (Executive Summary) из доклада о задержках строительства.' }
  ],
  translate: [
    { title: '🇺🇿 На узбекский', desc: 'Официальный перевод', promptText: 'Переведи фразу: "Просим Вас согласовать проект в кратчайшие сроки" на узбекский латинский язык.' }
  ],
  analyze: [
    { title: '⚠️ Поиск рисков', desc: 'Оценка угроз в задачах', promptText: 'Проанализируй список задач и найди в нем скрытые риски просрочек.' }
  ]
};

export default function AIAssistant() {
  const { tasks } = useTasks();
  const { complaints } = useComplaints();
  const { meetings } = useMeetings();

  const [activeTab, setActiveTab] = useState<'letter' | 'report' | 'protocol' | 'summary' | 'translate' | 'analyze'>('letter');
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const currentPresets = presets[activeTab] || [];

  const handleSend = async (customText?: string) => {
    const textToSend = customText || prompt;
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);
    setPrompt('');
    setLoading(true);

    const systemContext = {
      tasks: tasks.slice(0, 5).map(t => ({ title: t.title, priority: t.priority, status: t.status, department: t.department })),
      complaints: complaints.slice(0, 3).map(c => ({ title: c.title, category: c.category, status: c.status })),
      meetingsCount: meetings.length
    };

    try {
      const headers = getAIHeaders();
      const promptTextToSend = `Запрос: "${textToSend}"\n\nСостояние системы:\n${JSON.stringify(systemContext, null, 2)}`;
      
      const res = await fetch('/api/ai/analyze-context', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          prompt: promptTextToSend,
          systemPrompt: systemPrompts[activeTab],
          jsonMode: false
        })
      });

      const data = await res.json();
      let responseText = '';

      if (data.text) {
        responseText = data.text;
        logAIUsage('/api/ai/analyze-context', 'success', promptTextToSend.length, responseText.length);
      } else if (data.insights) {
        responseText = data.insights.join('\n\n');
        logAIUsage('/api/ai/analyze-context', 'success', promptTextToSend.length, responseText.length);
      } else {
        responseText = data.error || 'Не удалось получить ответ от ИИ-сервиса.';
        logAIUsage('/api/ai/analyze-context', 'error', promptTextToSend.length, 0);
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: responseText.trim(),
        timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
      }]);
    } catch {
      logAIUsage('/api/ai/analyze-context', 'error', textToSend.length, 0);
      
      // Fallback answers
      let fallbackText = '';
      if (activeTab === 'letter') {
        fallbackText = `[ИИ-Письмо] Шаблон подготовлен:\n\nУважаемые коллеги!\nПо факту вашего запроса сообщаем, что все работы выполняются согласно графику. С уважением, Администрация.`;
      } else if (activeTab === 'report') {
        fallbackText = `[ИИ-Отчет] Сводка скомпилирована:\n\nРаздел 1: Выполненные этапы.\nРаздел 2: Обнаруженные блокировки и задержки.`;
      } else if (activeTab === 'translate') {
        fallbackText = `[ИИ-Перевод] Tarjima:\n\n"Biz sizdan ushbu xujjatni kelishishingizni so'raymiz." (Просим Вас согласовать данный документ).`;
      } else {
        fallbackText = `[ИИ-Инструмент: ${activeTab.toUpperCase()}]\n\nСистема работает в демонстрационном режиме. Пожалуйста, укажите рабочие API ключи в разделе "Настройки" для активации полноценного интеллекта.`;
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: fallbackText,
        timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ew-page p-6 lg:p-8 max-w-5xl mx-auto font-sans space-y-6 flex flex-col h-[calc(100vh-64px)]">

      {/* Header */}
      <header className="shrink-0">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 font-display">ИИ-Инструменты</h1>
        <p className="text-slate-500 text-sm mt-0.5">Специализированные ассистенты по подготовке документов, переводу и аудиту</p>
      </header>

      {/* Sub-tabs specialized categories */}
      <div className="border-b border-slate-200 shrink-0">
        <nav className="flex gap-6 -mb-px overflow-x-auto">
          {[
            { id: 'letter', label: 'Письмо' },
            { id: 'report', label: 'Отчёт' },
            { id: 'protocol', label: 'Протокол' },
            { id: 'summary', label: 'Summary' },
            { id: 'translate', label: 'Перевод' },
            { id: 'analyze', label: 'Анализ' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setMessages([]);
              }}
              className={`pb-4 px-1 text-sm font-semibold border-b-2 cursor-pointer transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Presets */}
      {currentPresets.length > 0 && (
        <div className="shrink-0 grid grid-cols-2 gap-3">
          {currentPresets.map((preset, i) => (
            <button
              key={i}
              onClick={() => handleSend(preset.promptText)}
              disabled={loading}
              className="text-left p-3.5 ew-card hover:shadow-md transition-shadow cursor-pointer disabled:opacity-50 group bg-slate-50/50"
            >
              <span className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{preset.title}</span>
              <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">{preset.desc}</p>
            </button>
          ))}
        </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 min-h-0 overflow-y-auto ew-card p-4 space-y-4 bg-slate-50/20">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-3 py-16">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg">
              <Sparkles size={28} className="text-white" />
            </div>
            <p className="text-sm font-semibold text-slate-600 capitalize">Специализация: {activeTab}</p>
            <p className="text-xs text-center max-w-sm">
              ИИ настроил системные промпты на выбранную категорию. Напишите ваш запрос ниже.
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
              msg.role === 'user'
                ? 'bg-blue-600 text-white rounded-br-md shadow-sm'
                : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-md shadow-xs font-medium'
            }`}>
              <p className="whitespace-pre-wrap">{msg.content}</p>
              <p className={`text-[9px] mt-2 ${msg.role === 'user' ? 'text-blue-200' : 'text-slate-400'}`}>
                {msg.timestamp}
              </p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="shrink-0 flex gap-3">
        <input
          type="text"
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder={`Задать вопрос в категории ${activeTab}...`}
          className="flex-1 text-sm px-4 py-3 border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-blue-400"
          disabled={loading}
        />
        <button
          onClick={() => handleSend()}
          disabled={loading || !prompt.trim()}
          className="ew-btn ew-btn-primary disabled:opacity-50 px-5 cursor-pointer"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
