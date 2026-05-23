import React, { useState } from 'react';
import { 
  FileText, 
  Sparkles, 
  Send, 
  Layers, 
  CheckCircle, 
  Download 
} from 'lucide-react';

interface InquiryTemplate {
  id: string;
  name: string;
  defaultText: string;
}

const templates: InquiryTemplate[] = [
  { id: 'inq-1', name: 'Запрос на предоставление отчета о расходах за квартал', defaultText: 'Прошу в срок до [Срок] предоставить в Администрацию детальный отчет о кассовых расходах по статье [Статья]. в противном случае ведомству будет снижен КПЭ.' },
  { id: 'inq-2', name: 'Уведомление об отставании и задержке дедлайнов', defaultText: 'В ходе утреннего аудита СЭД выявлено критическое отставание по задаче [Задача]. Требуется развернуть антикризисный план до [Срок].' }
];

export default function RequestGenerator() {
  const [selectedTemplate, setSelectedTemplate] = useState('inq-1');
  const [variableTerm, setVariableTerm] = useState('28 Ноября 2026');
  const [variableSubject, setVariableSubject] = useState('Аренда и капстроительство');
  const [variableTask, setVariableTask] = useState('Монтаж трубной эстакады Яллама');
  
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    const active = templates.find(t => t.id === selectedTemplate);
    if (!active) return;

    let text = active.defaultText;
    text = text.replace('[Срок]', variableTerm);
    text = text.replace('[Статья]', variableSubject);
    text = text.replace('[Задача]', variableTask);

    const wrap = `
=============================================
ИСХОДЯЩИЙ ЗАПРОС АДМИНИСТРАЦИИ ТМК
Регистрационный №: ЗД-${Date.now().toString().substr(-6)}
---------------------------------------------
Получатель: Соответствующие ведомства ТМК

ТЕКСТ ЗАПРОСА:
${text}

---------------------------------------------
Запрос сформирован СЭД Администрации ТМК автоматически.
=============================================
    `;

    setResult(wrap);
    setCopied(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6 font-sans">
      <header className="border-b border-slate-200/60 pb-5">
        <span className="text-xs font-bold text-slate-600 uppercase tracking-widest font-display">Ведомственные запросы</span>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-display mt-1">Генератор запросов в отделы (Request Generator)</h1>
        <p className="text-slate-500 text-sm mt-0.5">Унифицированное автоматическое составление запросов данных, требований отчетов и официальных писем.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <form onSubmit={handleGenerate} className="bg-white border rounded-2xl p-5 shadow-xs space-y-4 text-xs">
          <h3 className="text-xs font-bold uppercase text-slate-700 tracking-wider">Параметры шаблона</h3>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Шаблон требования</label>
            <select 
              id="req-template"
              value={selectedTemplate}
              onChange={e => setSelectedTemplate(e.target.value)}
              className="w-full text-xs p-2.5 border rounded-xl"
            >
              {templates.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2 pt-2 border-t text-xs">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Переменные подстановки</label>
            <div className="space-y-3">
              <div className="space-y-1">
                <span className="text-[9px] text-slate-500 font-bold block">Срок исполнения ([Срок])</span>
                <input id="req-term" type="text" value={variableTerm} onChange={e => setVariableTerm(e.target.value)} className="w-full p-2 border rounded-xl" />
              </div>
              <div className="space-y-1">
                <span className="text-[9px] text-slate-500 font-bold block">Статья / Раздел ([Статья])</span>
                <input id="req-subject" type="text" value={variableSubject} onChange={e => setVariableSubject(e.target.value)} className="w-full p-2 border rounded-xl" />
              </div>
              <div className="space-y-1">
                <span className="text-[9px] text-slate-500 font-bold block">Задача / Цель ([Задача])</span>
                <input id="req-task" type="text" value={variableTask} onChange={e => setVariableTask(e.target.value)} className="w-full p-2 border rounded-xl" />
              </div>
            </div>
          </div>

          <button 
            type="submit"
            className="w-full flex items-center justify-center gap-2 bg-[#0F2942] hover:bg-[#1E3F66] text-white font-bold py-2.5 rounded-xl uppercase tracking-wider"
          >
            <Sparkles size={14} />
            <span>Составить требование</span>
          </button>
        </form>

        <div className="space-y-4">
          {result ? (
            <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl p-6 font-mono text-[11px] leading-relaxed space-y-4 relative">
              <pre className="whitespace-pre-wrap overflow-x-auto text-slate-300">{result}</pre>
              <div className="border-t border-slate-800 pt-3 flex justify-between items-center">
                <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider">Сводной КОРРЕКТНЫЙ шаблон</span>
                <button 
                  onClick={handleCopy}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[9px] font-bold uppercase cursor-pointer"
                >
                  {copied ? 'Успешно скопировано!' : 'Скопировать'}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border rounded-2xl p-12 text-center text-slate-400 flex flex-col items-center justify-center space-y-3 h-full">
              <FileText size={35} />
              <p className="text-xs">Результат компиляции официального запроса будет выведен здесь.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
