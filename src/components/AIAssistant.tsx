import React, { useState } from 'react';
import { useTasks, useComplaints, useMeetings, logAIUsage } from '../lib/hooks';
import { Send, RefreshCw, Sparkles, MessageSquare, CornerDownRight, Clock, Zap } from 'lucide-react';
import { getAIHeaders } from '../lib/ai-context';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export default function AIAssistant() {
  const { tasks } = useTasks();
  const { complaints } = useComplaints();
  const { meetings } = useMeetings();

  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const presets = [
    {
      title: '☀️ Утренний брифинг',
      desc: 'Полная утренняя сводка по всем модулям',
      promptText: 'Подготовь утренний брифинг: сводку по активным задачам, встречам на сегодня, непрочитанным жалобам и ключевым рискам. Тон — лаконичный и чёткий.'
    },
    {
      title: '📊 Сводка рисков',
      desc: 'Критические отставания и предложения',
      promptText: 'Проведи аудит текущих задач. Выдели 3 главных риска срыва сроков, опиши последствия и предложи решения.'
    },
    {
      title: '📝 Сводка дня',
      desc: 'Краткий текстовый итог',
      promptText: 'Подготовь краткую сводку: сколько активных задач, встреч, жалоб. Тон — официальный, лаконичный.'
    },
    {
      title: '🏛️ Ответ гражданам',
      desc: 'Проект официального ответа',
      promptText: 'Составь проект официального ответа гражданам на узбекском латинском по факту обращения, ссылаясь на соответствующие нормы.'
    }
  ];

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
      const promptTextToSend = `Запрос: "${textToSend}"\n\nСостояние системы:\n${JSON.stringify(systemContext, null, 2)}`;
      const res = await fetch('/api/executive-summary', {
        method: 'POST',
        headers: getAIHeaders(),
        body: JSON.stringify({
          reportText: promptTextToSend
        })
      });

      const data = await res.json();
      let responseText = '';

      if (data.summaryRu) {
        responseText += `${data.summaryRu}\n\n`;
        if (data.summaryUz) responseText += `O'zbekcha: ${data.summaryUz}\n\n`;
        if (data.risks?.length) responseText += `⚠️ Риски:\n${data.risks.map((r: string, i: number) => `${i + 1}. ${r}`).join('\n')}\n\n`;
        if (data.nextSteps?.length) responseText += `📋 Рекомендации:\n${data.nextSteps.map((s: string) => `• ${s}`).join('\n')}`;
        logAIUsage('/api/executive-summary', 'success', promptTextToSend.length, responseText.length);
      } else {
        responseText = 'Не удалось получить ответ от ИИ-сервиса.';
        logAIUsage('/api/executive-summary', 'error', promptTextToSend.length, 0);
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: responseText.trim(),
        timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
      }]);
    } catch {
      logAIUsage('/api/executive-summary', 'error', textToSend.length, 0);
      // Fallback response
      const pendingCount = tasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length;
      const overdueCount = tasks.filter(t => t.status === 'overdue').length;

      const fallbackText = `Аналитическая сводка Executive Workspace:

📊 Активных задач: ${pendingCount}
⚠️ Просроченных: ${overdueCount}
📅 Встреч в системе: ${meetings.length}
📨 Обращений: ${complaints.length}

Система работает в штатном режиме. Для подробного анализа подключите Gemini API Key в разделе «Настройки → API Ключи».`;

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
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 font-display">ИИ-Ассистент</h1>
        <p className="text-slate-500 text-sm mt-0.5">Аналитика, брифинги, переводы и рекомендации на основе контекста системы</p>
      </header>

      {/* Presets */}
      <div className="shrink-0 grid grid-cols-2 lg:grid-cols-4 gap-3">
        {presets.map((preset, i) => (
          <button
            key={i}
            onClick={() => handleSend(preset.promptText)}
            disabled={loading}
            className="text-left p-4 ew-card hover:shadow-md transition-shadow cursor-pointer disabled:opacity-50 group"
          >
            <span className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{preset.title}</span>
            <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{preset.desc}</p>
          </button>
        ))}
      </div>

      {/* Chat Area */}
      <div className="flex-1 min-h-0 overflow-y-auto ew-card p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-3 py-16">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg">
              <Sparkles size={28} className="text-white" />
            </div>
            <p className="text-sm font-semibold text-slate-600">Executive AI Assistant</p>
            <p className="text-xs text-center max-w-sm">
              Выберите готовый пресет выше или напишите запрос. Ассистент использует контекст всех модулей системы.
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
              msg.role === 'user'
                ? 'bg-blue-600 text-white rounded-br-md'
                : 'bg-slate-50 text-slate-800 border border-slate-100 rounded-bl-md'
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
            <div className="bg-slate-50 border border-slate-100 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2">
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
          placeholder="Введите запрос ИИ-ассистенту..."
          className="flex-1 text-sm px-4 py-3 border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-blue-400"
          disabled={loading}
        />
        <button
          onClick={() => handleSend()}
          disabled={loading || !prompt.trim()}
          className="ew-btn ew-btn-primary disabled:opacity-50 px-5"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
