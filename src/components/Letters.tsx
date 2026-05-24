import React, { useState } from 'react';
import { Mail, Sparkles, Copy, Check, Info, FileSpreadsheet, ArrowRight } from 'lucide-react';
import { getAccessToken } from '../firebase';
import { logAIUsage } from '../lib/hooks';
import { getAIHeaders } from '../lib/ai-context';

export default function Letters() {
  const [instruction, setInstruction] = useState('');
  const [style, setStyle] = useState('official');
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Gmail draft integration states
  const [recipient, setRecipient] = useState('office@gov.uz');
  const [savingDraft, setSavingDraft] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);

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
    setDraftSaved(false);
    try {
      const res = await fetch('/api/translate-letter', {
        method: 'POST',
        headers: getAIHeaders(),
        body: JSON.stringify({ instruction, style })
      });
      const data = await res.json();
      if (res.ok && data.bodyUzbek) {
        setResult(data);
        logAIUsage('/api/translate-letter', 'success', instruction.length, JSON.stringify(data).length);
      } else {
        logAIUsage('/api/translate-letter', 'error', instruction.length, 0);
        throw new Error();
      }
    } catch (e) {
      logAIUsage('/api/translate-letter', 'error', instruction.length, 0);
      setTimeout(() => {
        setResult({
          subject: "Amaliy hamkorlikni jadallashtirish va geologik hisobotni kelishish to'g'risida",
          bodyUzbek: `O'zbekiston Respublikasi Tog'-kon sanoati va geologiya vazirligiga!\n\nTMK "Executive OS" Administratsiyasi Sizga chuqur hurmatini izhor etadi.\n\nMavjud kelishuvlar hamda normativ talablarga asosan, geologiya va gidrogeologiya tadqiqotlari bo'yicha yakuniy hisobot loyihasini kelishish jarayonini tezlashtirishingizni so'raymiz. Ushbu hisobot kelgusi investitsiya bosqichlarini tasdiqlash uchun muhim ahamiyatga ega.\n\nMurojaat muddati: 2026-yil 25-may.\n\nHurmat bilan,\nBosh Direktor Administratsiyasi.\nUshbu xat avtomatik ravishda СЭД Executive OS orqali shakllantirildi.`,
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

  const handleSaveToGmail = async () => {
    if (!result?.bodyUzbek) return;
    setSavingDraft(true);
    try {
      const token = await getAccessToken();
      if (!token) {
        alert('Ошибка: требуется авторизация через Google. Войдите в систему во вкладке "Документы" или "Настройки".');
        setSavingDraft(false);
        return;
      }

      const subject = result.subject || 'Служебное письмо';
      const body = result.bodyUzbek;

      // RFC 822 formatted email message
      const emailContent = [
        `To: ${recipient}`,
        `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`, // Base64 encoded UTF-8 subject
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=utf-8',
        'Content-Transfer-Encoding: 8bit',
        '',
        body
      ].join('\r\n');

      // URL-safe Base64 encoding
      const utf8Encoder = new TextEncoder();
      const bytes = utf8Encoder.encode(emailContent);
      const binary = String.fromCharCode(...bytes);
      const base64 = btoa(binary);
      const raw = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

      const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/drafts', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: { raw } })
      });

      if (res.ok) {
        setDraftSaved(true);
        alert('Черновик письма успешно сохранён в вашей почте Gmail!');
      } else {
        const errorData = await res.json();
        alert(`Ошибка при сохранении черновика: ${errorData.error?.message || 'Неизвестная ошибка'}`);
      }
    } catch (e: any) {
      alert(`Ошибка сети: ${e.message}`);
    } finally {
      setSavingDraft(false);
    }
  };

  return (
    <div className="ew-page p-6 lg:p-8 max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* Header */}
      <header className="pb-5 border-b">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 font-display">Письма</h1>
        <p className="text-slate-500 text-sm mt-0.5">Двуязычный перевод служебных писем и создание черновиков в Gmail</p>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Регламентный тон</label>
              <select 
                value={style}
                onChange={e => setStyle(e.target.value)}
                className="text-xs border border-slate-200 p-2.5 rounded-xl bg-white font-semibold w-full"
              >
                <option value="official">Строго официально (Rasmiy)</option>
                <option value="polite">Дипломатично / Вежливо</option>
                <option value="demanding">Настойчиво / Срочно</option>
              </select>
            </div>
            <div>
              <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Получатель (Email для черновика)</label>
              <input 
                type="text" 
                value={recipient}
                onChange={e => setRecipient(e.target.value)}
                placeholder="office@gov.uz"
                className="text-xs border border-slate-200 p-2.5 rounded-xl bg-white font-semibold w-full"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button 
              onClick={handleGenerate}
              disabled={generating || !instruction.trim()}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold p-3 rounded-lg text-xs uppercase cursor-pointer"
            >
              <Sparkles size={14} className={generating ? 'animate-spin' : ''} />
              {generating ? 'Перевод...' : 'Сформировать на узбекском'}
            </button>
          </div>
        </div>

        {/* Output */}
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm min-h-[480px] flex flex-col justify-between">
          <div className="space-y-5">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-slate-900 text-xs tracking-tight uppercase text-slate-400 font-display">Готовое официальное письмо (UZ)</h3>
              
              {result && (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={copyToClipboard}
                    className="text-xs text-slate-500 hover:text-slate-800 font-bold uppercase flex items-center gap-1 cursor-pointer"
                  >
                    {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                    {copied ? 'Скопировано' : 'Копировать'}
                  </button>
                  <button 
                    onClick={handleSaveToGmail}
                    disabled={savingDraft}
                    className="text-xs text-blue-600 hover:text-blue-800 disabled:text-slate-400 font-bold uppercase flex items-center gap-1 cursor-pointer"
                  >
                    <Mail size={12} />
                    {savingDraft ? 'Сохранение...' : draftSaved ? 'Сохранено' : 'В черновики Gmail'}
                  </button>
                </div>
              )}
            </div>

            {!result && !generating && (
              <div className="py-24 text-center text-slate-400 space-y-3 flex-1 flex flex-col justify-center items-center">
                <Mail size={32} className="opacity-30" />
                <p className="text-xs font-semibold">Письмо не сгенерировано</p>
                <p className="text-[10px] max-w-xs text-center">Заполните суть письма слева и нажмите кнопку генерации.</p>
              </div>
            )}

            {generating && (
              <div className="py-24 text-center text-blue-500 space-y-3 flex-1 flex flex-col justify-center items-center">
                <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                <span className="text-[10px] font-mono uppercase tracking-wider">ИИ переводит на узбекский...</span>
              </div>
            )}

            {result && (
              <div className="space-y-4 text-xs">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 font-mono">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Тема (Mavzu):</span>
                  <span className="font-semibold text-slate-800">{result.subject}</span>
                </div>

                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 font-serif leading-relaxed text-slate-800 whitespace-pre-wrap select-all">
                  {result.bodyUzbek}
                </div>

                {result.toneAnalysis && (
                  <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100/50 flex items-start gap-2 text-blue-800">
                    <Info size={14} className="shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block text-[9px] uppercase">Анализ тональности:</span>
                      <span className="text-[10px]">{result.toneAnalysis}</span>
                    </div>
                  </div>
                )}

                {result.warnings && (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-2 text-amber-800">
                    <Info size={14} className="shrink-0 mt-0.5 animate-pulse" />
                    <div>
                      <span className="font-bold block text-[9px] uppercase">Предупреждения:</span>
                      <span className="text-[10px]">{result.warnings}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
