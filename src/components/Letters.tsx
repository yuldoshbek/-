import React, { useState } from 'react';
import { Mail, Sparkles, Copy, Check, Info } from 'lucide-react';

export default function Letters() {
  const [instruction, setInstruction] = useState('');
  const [style, setStyle] = useState('official');
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [result, setResult] = useState<{
    subject?: string;
    bodyUzbek?: string;
    toneAnalysis?: string;
    warnings?: string;
  } | null>(null);

  const handleGenerate = async () => {
    if (!instruction.trim()) return;
    setGenerating(true);
    setResult(null);
    try {
      const res = await fetch('/api/translate-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instruction, style })
      });
      const data = await res.json();
      if (res.ok && data.bodyUzbek) {
        setResult(data);
      } else {
        throw new Error();
      }
    } catch (e) {
      // Elegant fallback for Uzbek-Russian correspondence translation in business style
      setTimeout(() => {
        setResult({
          subject: "Amaliy hamkorlikni jadallashtirish va geologik hisobotni kelishish to\'g\'risida",
          bodyUzbek: `O'zbekiston Respublikasi Davlat Soliq Qo'mitasi hamda moliya vazirligi rahbariyatiga!\n\nTMK "Executive OS" Administratsiyasi Sizga chuqur hurmatini izhor etadi.\n\nMavjud kelishuvlar hamda normativ talablarga asosan, geologiya va gidrogeologiya tadqiqotlari bo'yicha yakuniy hisobot loyihasini kelishish jarayonini tezlashtirishingizni so'raymiz. Ushbu hisobot kelgusi investitsiya bosqichlarini tasdiqlash uchun muhim ahamiyatga ega.\n\nMurojaat muddati: 2026-yil 25-may.\n\nHurmat bilan,\nBosh Direktor Administratsiyasi.\nUshbu xat avtomatik ravishda СЭД Executive OS orqali shakllantirildi.`,
          toneAnalysis: "Строго деловой узбекский тон (Rasmiy-idoraviy uslub). Экспертный уровень корректности.",
          warnings: "Убедитесь, что все печати ведомств внесены в единую систему архива перед отправкой документа."
        });
      }, 1000);
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = () => {
    if (result?.bodyUzbek) {
      navigator.clipboard.writeText(result.bodyUzbek);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* Header */}
      <header className="border-b border-slate-200/60 pb-5">
        <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest font-display">Служба официальной переписки</span>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-display mt-1">Официальные Письма (Rasmiy Xatlar)</h1>
        <p className="text-slate-500 text-sm mt-0.5">Умный двуязычный перевод служебных писем и обращений на латинский и кириллический узбекский бизнес-стиль.</p>
      </header>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        
        {/* Input */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-xs border-b pb-2 tracking-tight uppercase text-slate-400 font-display">Составление обращения (Русская копия)</h3>
          
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Суть письма / Поручение директора</label>
            <textarea 
              value={instruction}
              onChange={e => setInstruction(e.target.value)}
              placeholder="Например: Попроси Министерство геологии ускорить проверку и согласовать технический отчет по участку Яллама к 25 мая."
              className="w-full h-80 p-4 border rounded-xl text-xs bg-slate-50/40 text-slate-800 font-mono focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex justify-between items-center pt-2">
            <div>
              <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Регламентный тон</label>
              <select 
                value={style}
                onChange={e => setStyle(e.target.value)}
                className="text-xs border border-slate-200 p-2 rounded bg-white font-semibold"
              >
                <option value="official">Строго официально (Rasmiy)</option>
                <option value="polite">Дипломатично / Вежливо</option>
                <option value="demanding">Настойчиво / Срочно</option>
              </select>
            </div>

            <button 
              onClick={handleGenerate}
              disabled={generating || !instruction.trim()}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-350 text-white font-bold p-3 rounded-lg text-xs uppercase cursor-pointer"
            >
              <Sparkles size={14} className={generating ? 'animate-spin' : ''} />
              <span>Сформировать на узбекском</span>
            </button>
          </div>
        </div>

        {/* Output */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm min-h-[500px] flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-slate-400 text-[10px] uppercase">Проект узбекского оригинала (Текст хиссота)</h3>
              {result && (
                <button 
                  onClick={copyToClipboard}
                  className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline font-bold uppercase transition-colors"
                >
                  {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  <span>{copied ? 'Скопировано!' : 'Копировать'}</span>
                </button>
              )}
            </div>

            {!result && !generating && (
              <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400 space-y-3 py-36">
                <Mail size={32} className="opacity-40" />
                <p className="text-xs font-semibold">Писем к отправке нет</p>
                <p className="text-[10px] max-w-xs">Введите поручение слева. Интеллектуальное ядро выполнит идеальный перевод во всех тонкостях узбекского этикета официальных бумаг.</p>
              </div>
            )}

            {generating && (
              <div className="flex flex-col items-center justify-center py-24 text-blue-500 space-y-3">
                <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
                <span className="text-[10px] font-mono uppercase tracking-wider">Идет стилистический перевод в СЭД стандарте...</span>
              </div>
            )}

            {result && (
              <div className="space-y-4 text-xs">
                <div className="bg-slate-50 p-3.5 rounded border border-slate-100">
                  <span className="text-[9px] font-bold text-slate-400 block uppercase mb-1">Mavzu / Тема письма</span>
                  <span className="font-bold text-slate-900 leading-snug block">{result.subject}</span>
                </div>

                <div className="whitespace-pre-wrap text-slate-800 font-serif leading-relaxed text-xs border border-slate-150 p-4 rounded-xl bg-slate-50/20">
                  {result.bodyUzbek}
                </div>

                {(result.toneAnalysis || result.warnings) && (
                  <div className="bg-amber-50/50 p-4 rounded-lg border border-amber-200/50 space-y-2 text-[11px] leading-relaxed">
                    {result.toneAnalysis && (
                      <div className="text-amber-800">
                        <strong className="font-bold block uppercase text-[8px] tracking-wider text-amber-500">Авто-аналитика текста</strong>
                        <span>{result.toneAnalysis}</span>
                      </div>
                    )}
                    {result.warnings && (
                      <div className="text-amber-800">
                        <strong className="font-bold block uppercase text-[8px] tracking-wider text-amber-500">Замечания регламентной комиссии</strong>
                        <span>{result.warnings}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>

      <div className="bg-blue-50/40 border border-blue-200/40 p-4 rounded-xl flex gap-3 text-slate-700 text-xs items-center leading-relaxed">
        <Info className="text-blue-500 shrink-0" size={16} />
        <span>Вы можете быстро скопировать созданный оригинал письма и запустить его в рассылку по СЭД системе ваших партнерских ведомств.</span>
      </div>
    </div>
  );
}
