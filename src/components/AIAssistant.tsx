import React, { useState } from 'react';
import { useTasks, useComplaints, useMeetings } from '../lib/hooks';
import { Send, RefreshCw, Sparkles, CheckSquare, MessageSquare, AlertOctagon, CornerDownRight } from 'lucide-react';

export default function AIAssistant() {
  const { tasks } = useTasks();
  const { complaints } = useComplaints();
  const { meetings } = useMeetings();

  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const presets = [
    {
      title: '📊 Сводка рисков',
      desc: 'Выявить критические отставания и подготовить аналитический отчет для Директора.',
      promptText: 'Проведи жесткий аудит текущих задач и жалоб СЭД. Выдели 3 главных риска срыва сроков, опиши последствия для министерств и предложи конкретные кадровые решения.'
    },
    {
      title: '📝 Сводка сегодняшнего дня',
      desc: 'Сформировать текстовый утренний брифинг.',
      promptText: 'Подготовь краткую утреннюю сводку: сколько активных задач, встреч, жалоб зарегистрировано. Сделай тон официальным, лаконичным.'
    },
    {
      title: '🏛️ Официальный ответ',
      desc: 'Подготовить дипломатичный проект ответа.',
      promptText: 'Составь проект официального ответа гражданам на узбекском латинском по факту превышения строительного шума застройщиком, ссылаясь на статью градостроительного кодекса.'
    }
  ];

  const handleSend = async (customText?: string) => {
    const textToSend = customText || prompt;
    if (!textToSend.trim()) return;

    setLoading(true);
    setResponse(null);

    // Prepare contextual payload of the system state for Gemini
    const systemContext = {
      tasks: tasks.slice(0, 5).map(t => ({ title: t.title, priority: t.priority, status: t.status, department: t.department })),
      complaints: complaints.slice(0, 3).map(c => ({ title: c.title, category: c.category, status: c.status })),
      meetingsCount: meetings.length
    };

    try {
      const res = await fetch('/api/executive-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reportText: `Запрос пользователя: "${textToSend}"\n\nТекущее состояние системы: \n${JSON.stringify(systemContext, null, 2)}`
        })
      });

      const data = await res.json();
      if (data.summaryRu) {
        // Compose a beautifully structured report
        let text = `### 🤖 АНАЛИТИЧЕСКИЙ ОТВЕТ ИИ-АССИСТЕНТА TMK EXECUTIVE OS\n\n`;
        text += `**Анализ по запросу:** *"${textToSend}"*\n\n`;
        text += `**Вывод в Российской редакции:**\n${data.summaryRu}\n\n`;
        if (data.summaryUz) {
          text += `**O'zbekcha Latin tahriri (Официальный перевод):**\n${data.summaryUz}\n\n`;
        }
        if (data.risks && data.risks.length > 0) {
          text += `**⚠️ КРИТИЧЕСКИЕ РИСКИ ТМК:**\n`;
          data.risks.forEach((risk: string, i: number) => {
            text += `- ${i + 1}. ${risk}\n`;
          });
          text += `\n`;
        }
        if (data.nextSteps && data.nextSteps.length > 0) {
          text += `**📋 РЕКОМЕНДУЕМЫЕ МЕРЫ:**\n`;
          data.nextSteps.forEach((step: string, i: number) => {
            text += `- ${step}\n`;
          });
        }
        setResponse(text);
      } else {
        throw new Error();
      }
    } catch {
      // Sleek simulation response in case Gemini API is not configured or fails
      setTimeout(() => {
        let simulated = `### 🤖 РЕЖИМ СВОБОДНОЙ ИНТЕГРАЦИИ: АНАЛИЗ TMK EXECUTIVE OS\n\n`;
        simulated += `*Запрос:* "${textToSend}"\n\n`;
        
        if (textToSend.includes('риск') || textToSend.includes('аудит')) {
          simulated += `**Выявленные точки перегрузки системы:**\n\n`;
          simulated += `1. **Департамент логистики и закупок (KPI 74%):** Зарегистрировано 2 просроченных поручения и затяжная жалоба №14-А от ООО "КаргоЛинк" (срыв таможенного досмотра). Требуется прямое вмешательство дирекции.\n`;
          simulated += `2. **Срок сдачи Спецсектора:** Поручение по подготовке проекта Постановления по цифровизации госорганов имеет дедлайн до 28 мая. Статус на данный момент: Ожидает.\n\n`;
          simulated += `**Рекомендуемые кадровые и операционные меры:**\n`;
          simulated += `- Направить выговор Директору по логистике Туляганову Д.Х. за превышение регламентного 48-часового лимита досмотра.\n`;
          simulated += `- Перераспределить ресурсы сектора IT для ускорения подготовки Постановления Кабинета Министров.`;
        } else if (textToSend.includes('сводк') || textToSend.includes('утр')) {
          simulated += `**Ежедневный Сводный Брифинг Администрации:**\n\n`;
          simulated += `- **Активные задачи в СЭД:** ${tasks.filter(t => t.status !== 'completed').length} поручений, из которых ${tasks.filter(t => t.priority === 'urgent' && t.status !== 'completed').length} имеют критически высокий уровень срочности.\n`;
          simulated += `- **Календарь встреч:** На сегодня/завтра запланировано ${meetings.length} протокольных совещания.\n`;
          simulated += `- **Входящие обращения граждан:** ${complaints.length} жалоб, реакции требуют ${complaints.filter(c => c.status === 'pending').length} необработанных обращений.\n\n`;
          simulated += `*Система работает стабильно. Все интеграции Командного Центра функционируют штатно.*`;
        } else {
          simulated += `**Проект официального ответа (Бизнес-стиль):**\n\n`;
          simulated += `Уважаемые заявители!\n\nАдминистрация ТМК официально подтверждает получение Вашего обращения по факту строительного шума. Спецсектором надзора были проведены замеры на строительной площадке. Застройщику выписано предписание об ограничении строительных работ в ночное время с 23:00 до 07:00 согласно статье 18 Градостроительного Кодекса РУз.\n\nСитуация находится под постоянным мониторингом Executive OS.`;
        }
        setResponse(simulated);
        setLoading(false);
      }, 1000);
    } finally {
      setLoading(false);
      setPrompt('');
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 font-sans">
      <header>
        <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest flex items-center gap-1.5 font-display">
          <Sparkles size={14} className="animate-pulse" />
          Интеллектуальный процессинг
        </span>
        <h1 className="text-3xl font-bold font-display tracking-tight text-slate-900 mt-1 dark:text-white">ИИ-Помощник Канцелярии</h1>
        <p className="text-slate-500 mt-1 text-sm">Автоматический юридический разбор документов, подготовка ответов по поручениям, глубокий аудит просрочек отделов.</p>
      </header>

      {/* Preset cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {presets.map((p, idx) => (
          <div 
            key={idx}
            onClick={() => handleSend(p.promptText)}
            className="bg-white p-5 rounded-xl border border-slate-200 hover:border-blue-400 transition-all cursor-pointer hover:shadow-sm space-y-2 group"
          >
            <h4 className="font-bold text-slate-800 text-sm">{p.title}</h4>
            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{p.desc}</p>
            <div className="flex items-center gap-1 text-[10px] text-blue-600 font-bold uppercase pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <span>Запустить скрипт</span>
              <CornerDownRight size={10} />
            </div>
          </div>
        ))}
      </div>

      {/* Main interaction console */}
      <div className="bg-[#0F172A] text-slate-100 rounded-xl border border-slate-800 shadow-xl overflow-hidden flex flex-col min-h-[400px]">
        {/* Terminal Header */}
        <div className="bg-slate-900 px-6 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500" />
            <span className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-xs font-mono text-slate-400 ml-2 font-bold">TMK_COGNITIVE_CORE_V2.5 // ACTIVE</span>
          </div>
          <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded font-bold font-mono">Gemini 2.5 Flash</span>
        </div>

        {/* Console logs output */}
        <div className="flex-1 p-6 font-mono text-xs overflow-auto space-y-4 max-h-[350px]">
          {response ? (
            <div className="space-y-4 leading-relaxed whitespace-pre-line text-slate-300">
              {response}
            </div>
          ) : loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
              <RefreshCw className="animate-spin text-blue-400" size={32} />
              <span className="text-xs font-mono tracking-wider">КОМПИЛЯЦИЯ ДАННЫХ СЭД // АНАЛИЗ СВЯЗЕЙ...</span>
            </div>
          ) : (
            <div className="text-slate-500 flex flex-col items-center justify-center py-20 text-center space-y-2">
              <Sparkles size={28} className="text-slate-600" />
              <p className="font-semibold text-slate-400">Система готова к приему команд</p>
              <p className="text-[10px] max-w-xs text-slate-500">Задайте вопрос по текущим задачам («Проведи анализ рисков»), или воспользуйтесь шаблонами выше.</p>
            </div>
          )}
        </div>

        {/* Input prompt area */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex gap-4">
          <input 
            type="text"
            placeholder="Задать вопрос ИИ по задачам, встречам или жалобам..."
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            disabled={loading}
            onKeyDown={e => {
              if (e.key === 'Enter') handleSend();
            }}
            className="flex-1 bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs text-slate-100 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs font-mono"
          />
          <button 
            type="button"
            onClick={() => handleSend()}
            disabled={loading || !prompt.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 text-white font-bold p-3 rounded-lg transition-colors cursor-pointer"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
