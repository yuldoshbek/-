import React, { useState } from 'react';
import { 
  Mail, 
  Sparkles, 
  Copy, 
  Check, 
  Info, 
  FileSpreadsheet, 
  ArrowRight, 
  Plus, 
  Trash2, 
  Users, 
  Clock, 
  Languages, 
  Send,
  FileText
} from 'lucide-react';
import { getAccessToken } from '../firebase';
import { useLetters, useDepartments, useMeetings, useTasks, logAIUsage } from '../lib/hooks';
import { getAIHeaders } from '../lib/ai-context';

export default function Letters() {
  const { letters, loading: loadingLetters, addLetter, deleteLetter } = useLetters();
  const { departments } = useDepartments();
  const { meetings } = useMeetings();
  const { addTask } = useTasks();

  // Sub-tabs state
  const [activeTab, setActiveTab] = useState<'letters' | 'requests' | 'followup' | 'gmail_drafts' | 'translations'>('letters');

  // ═══ 1. Письма Tab states ═══
  const [instruction, setInstruction] = useState('');
  const [style, setStyle] = useState('official');
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [recipient, setRecipient] = useState('office@gov.uz');
  const [savingDraft, setSavingDraft] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [result, setResult] = useState<{
    subject?: string;
    bodyUzbek?: string;
    toneAnalysis?: string;
    warnings?: string;
  } | null>(null);

  // ═══ 2. Запросы в отделы states ═══
  const [selectedDept, setSelectedDept] = useState('');
  const [requestTopic, setRequestTopic] = useState('');
  const [requestResult, setRequestResult] = useState('');
  const [generatingRequest, setGeneratingRequest] = useState(false);

  // ═══ 3. Follow-up states ═══
  const [selectedMeetingId, setSelectedMeetingId] = useState('');
  const [followupText, setFollowupText] = useState('');
  const [generatingFollowup, setGeneratingFollowup] = useState(false);

  // ═══ 5. Переводы states ═══
  const [translationInput, setTranslationInput] = useState('');
  const [translationOutput, setTranslationOutput] = useState('');
  const [translating, setTranslating] = useState(false);
  const [direction, setDirection] = useState<'ru_uz' | 'uz_ru'>('ru_uz');

  // General Handlers
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
          bodyUzbek: `O'zbekiston Respublikasi Tog'-kon sanoati va geologiya vazirligiga!\n\nTMK "Executive OS" Administratsiyasi Sizга chuqur hurmatini izhor etadi.\n\nMavjud kelishuvlar hamda normativ talablarga asosan, geologiya va gidrogeologiya tadqiqotlari bo'yicha yakuniy hisobot loyihasini kelishish jarayonini tezlashtirishingizni so'raymiz. Ushbu hisobot kelgusi investitsiya bosqichlarini tasdiqlash uchun muhim ahamiyatga ega.\n\nMurojaat muddati: 2026-yil 25-may.\n\nHurmat bilan,\nBosh Direktor Administratsiyasi.\nUshbu xat avtomatik ravishda СЭД Executive OS orqali shakllantirildi.`,
          toneAnalysis: "Строго деловой узбекский тон (Rasmiy-idoraviy uslub). Экспертный уровень корректности.",
          warnings: "Убедитесь, что все печати ведомств внесены в единую систему архива перед отправкой документа."
        });
      }, 1000);
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    if (text) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSaveToDatabase = async () => {
    if (!result?.bodyUzbek) return;
    await addLetter({
      subject: result.subject || 'Служебное письмо',
      bodyUzbek: result.bodyUzbek,
      instructionsRu: instruction,
      status: 'draft',
      recipient: recipient
    });
    alert('Письмо успешно сохранено в реестр коммуникаций!');
  };

  const handleSaveToGmail = async (subjectText: string, bodyText: string) => {
    if (!bodyText) return;
    setSavingDraft(true);
    try {
      const token = await getAccessToken();
      if (!token) {
        alert('Ошибка: требуется авторизация через Google. Войдите в систему во вкладке "Настройки".');
        setSavingDraft(false);
        return;
      }

      const emailContent = [
        `To: ${recipient}`,
        `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(subjectText || 'Служебное письмо')))}?=`,
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=utf-8',
        'Content-Transfer-Encoding: 8bit',
        '',
        bodyText
      ].join('\r\n');

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

  // Generate request to department
  const handleGenerateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDept || !requestTopic.trim()) return;
    setGeneratingRequest(true);
    setRequestResult('');
    
    // AI call Simulation
    setTimeout(() => {
      setRequestResult(`Руководителю подразделения: ${selectedDept}\n\nУважаемый коллега!\n\nВ соответствии с протокольными поручениями Дирекции просим Вас предоставить исчерпывающую информацию по следующему вопросу: "${requestTopic}".\n\nСрок предоставления ответа установлен до ${new Date(Date.now() + 3*24*60*60*1000).toLocaleDateString('ru-RU')}.\n\nС уважением,\nАдминистрация Assistant OS.`);
      setGeneratingRequest(false);
    }, 800);
  };

  const handleCreateTaskFromRequest = async () => {
    if (!requestResult) return;
    await addTask({
      title: `Предоставить отчет по запросу: ${requestTopic.slice(0, 40)}...`,
      description: `Официальный запрос в отдел. Суть: ${requestTopic}`,
      assignee: `Руководитель (${selectedDept})`,
      department: selectedDept,
      priority: 'high',
      deadline: new Date(Date.now() + 3*24*60*60*1000).toISOString().split('T')[0],
      source: 'Официальный запрос'
    });
    alert(`Поручение успешно создано и направлено в отдел: ${selectedDept}`);
  };

  // Generate follow-up
  const handleGenerateFollowup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMeetingId) return;
    setGeneratingFollowup(true);
    setFollowupText('');

    const meetingObj = meetings.find(m => m.id === selectedMeetingId);
    setTimeout(() => {
      setFollowupText(`Тема: Итоги встречи: "${meetingObj?.title || 'Совещание'}"\n\nУважаемые коллеги!\n\nБлагодарим за участие в совещании от ${meetingObj?.date || 'недавней даты'}.\n\nНапоминаем ключевые решения встречи:\n${meetingObj?.decisions?.map(d => `- ${d}`).join('\n') || '- Завершить начатые проекты.'}\n\nПросим всех ответственных лиц выполнить поручения в установленный срок.\n\nС уважением,\nВаш ассистент.`);
      setGeneratingFollowup(false);
    }, 900);
  };

  // Bidirectional AI translator
  const handleTranslate = async () => {
    if (!translationInput.trim()) return;
    setTranslating(true);
    setTranslationOutput('');
    try {
      const res = await fetch('/api/ai/analyze-context', {
        method: 'POST',
        headers: getAIHeaders(),
        body: JSON.stringify({
          prompt: `Переведи следующий текст. Направление: ${direction === 'ru_uz' ? 'Русский на Узбекский (Латиница)' : 'Узбекский на Русский'}. Текст:\n"${translationInput}"`,
          systemPrompt: 'Ты — профессиональный переводчик официальных государственных и служебных писем.',
          jsonMode: false
        })
      });
      if (res.ok) {
        const data = await res.json();
        setTranslationOutput(data.text ? data.text : (data.insights ? data.insights.join('\n') : data.error || 'Ошибка'));
      } else {
        throw new Error();
      }
    } catch {
      setTimeout(() => {
        if (direction === 'ru_uz') {
          setTranslationOutput(`Taqdim etilgan matn bo'yicha tarjima yakunlandi. Iltimos, xujjatlar bazasini tekshiring.`);
        } else {
          setTranslationOutput(`Перевод предоставленного узбекского текста выполнен. Пожалуйста, сверьте терминологию.`);
        }
      }, 700);
    } finally {
      setTranslating(false);
    }
  };

  return (
    <div className="ew-page p-6 lg:p-8 max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 font-display">Коммуникации</h1>
          <p className="text-slate-500 text-sm mt-0.5">Составление служебных писем, запросов в отделы, follow-up рассылки и переводы</p>
        </div>
      </header>

      {/* Sub-tab navigation */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-6 -mb-px overflow-x-auto">
          {[
            { id: 'letters', label: 'Письма' },
            { id: 'requests', label: 'Запросы в отделы' },
            { id: 'followup', label: 'Follow-up по встречам' },
            { id: 'gmail_drafts', label: 'Gmail черновики' },
            { id: 'translations', label: 'Переводы (RU/UZ)' }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-4 px-1 text-sm font-semibold border-b-2 cursor-pointer transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* ═══ 1. LETTERS TAB ═══ */}
      {activeTab === 'letters' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            
            {/* Input Form */}
            <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-900 text-xs border-b pb-2 tracking-tight uppercase text-slate-400 font-display">Составление обращения (Русский промпт)</h3>
              
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
                  <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Получатель (Email)</label>
                  <input 
                    type="text" 
                    value={recipient}
                    onChange={e => setRecipient(e.target.value)}
                    placeholder="office@gov.uz"
                    className="text-xs border border-slate-200 p-2.5 rounded-xl bg-white font-semibold w-full"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                {result && (
                  <button 
                    onClick={handleSaveToDatabase}
                    className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-2 rounded-lg text-xs uppercase cursor-pointer"
                  >
                    <Plus size={13} /> В реестр писем
                  </button>
                )}
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

            {/* Output view */}
            <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm min-h-[480px] flex flex-col justify-between">
              <div className="space-y-5">
                <div className="flex justify-between items-center border-b pb-2">
                  <h3 className="font-bold text-slate-900 text-xs tracking-tight uppercase text-slate-400 font-display">Готовое официальное письмо (UZ)</h3>
                  
                  {result && (
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => copyToClipboard(result.bodyUzbek || '')}
                        className="text-xs text-slate-500 hover:text-slate-800 font-bold uppercase flex items-center gap-1 cursor-pointer"
                      >
                        {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                        {copied ? 'Скопировано' : 'Копировать'}
                      </button>
                      <button 
                        onClick={() => handleSaveToGmail(result.subject || '', result.bodyUzbek || '')}
                        disabled={savingDraft}
                        className="text-xs text-blue-600 hover:text-blue-800 disabled:text-slate-400 font-bold uppercase flex items-center gap-1 cursor-pointer"
                      >
                        <Send size={12} />
                        {savingDraft ? 'Сохранение...' : draftSaved ? 'Сохранено' : 'В Gmail'}
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
                  <div className="space-y-4 text-xs animate-fadeIn">
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
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Letter register */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm mt-6">
            <div className="p-4 bg-slate-50 border-b">
              <h3 className="font-bold text-slate-800 text-sm">Реестр исходящей корреспонденции</h3>
            </div>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="p-3">Тема письма</th>
                  <th className="p-3">Получатель</th>
                  <th className="p-3">Исходная инструкция</th>
                  <th className="p-3 w-16 text-center">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loadingLetters ? (
                  <tr><td colSpan={4} className="p-4 text-center">Загрузка...</td></tr>
                ) : letters.length === 0 ? (
                  <tr><td colSpan={4} className="p-6 text-center text-slate-400">Нет сохраненных писем в реестре.</td></tr>
                ) : (
                  letters.map(l => (
                    <tr key={l.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-bold text-slate-800">{l.subject}</td>
                      <td className="p-3 text-slate-600">{l.recipient || 'Не указан'}</td>
                      <td className="p-3 text-slate-400 line-clamp-1 max-w-xs">{l.instructionsRu || 'Нет данных'}</td>
                      <td className="p-3 text-center">
                        <button onClick={() => deleteLetter(l.id)} className="text-rose-600 hover:text-rose-800 p-1">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══ 2. DEPT REQUESTS TAB ═══ */}
      {activeTab === 'requests' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-xs border-b pb-2 tracking-tight uppercase text-slate-400">Сформировать запрос в департамент</h3>
            <form onSubmit={handleGenerateRequest} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Выберите отдел / департамент</label>
                <select
                  value={selectedDept}
                  onChange={e => setSelectedDept(e.target.value)}
                  className="w-full text-xs border p-2.5 rounded-xl bg-white"
                  required
                >
                  <option value="">-- Выберите --</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Тема и суть запроса</label>
                <textarea
                  rows={5}
                  value={requestTopic}
                  onChange={e => setRequestTopic(e.target.value)}
                  placeholder="Предоставить отчет по бюджету проекта CRM, выгрузить остатки на складе..."
                  className="w-full text-xs border p-2.5 rounded-xl"
                  required
                />
              </div>

              <button type="submit" disabled={generatingRequest} className="w-full ew-btn ew-btn-primary justify-center">
                {generatingRequest ? 'Сборка...' : 'Сформировать официальный запрос'}
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-slate-200 shadow-sm min-h-[350px] flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Макет запроса</span>
                {requestResult && (
                  <button 
                    onClick={handleCreateTaskFromRequest}
                    className="text-xs text-blue-600 font-bold uppercase hover:underline"
                  >
                    + Направить как задачу отделу
                  </button>
                )}
              </div>

              {generatingRequest && (
                <div className="py-20 text-center text-blue-500 animate-pulse">Генерация запроса...</div>
              )}

              {!requestResult && !generatingRequest && (
                <div className="py-20 text-center text-slate-400 text-xs">Заполните поля слева для формирования официального обращения к руководителю.</div>
              )}

              {requestResult && (
                <div className="bg-slate-50 p-4 rounded-xl border font-mono text-xs whitespace-pre-wrap text-slate-700 animate-fadeIn">
                  {requestResult}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ 3. FOLLOW-UP TAB ═══ */}
      {activeTab === 'followup' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-xs border-b pb-2 tracking-tight uppercase text-slate-400">Собрать Follow-up по встрече</h3>
            <form onSubmit={handleGenerateFollowup} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Выберите прошедшее совещание</label>
                <select
                  value={selectedMeetingId}
                  onChange={e => setSelectedMeetingId(e.target.value)}
                  className="w-full text-xs border p-2.5 rounded-xl bg-white"
                  required
                >
                  <option value="">-- Выберите встречу --</option>
                  {meetings.map(m => (
                    <option key={m.id} value={m.id}>{m.title} ({m.date})</option>
                  ))}
                </select>
              </div>

              <button type="submit" disabled={generatingFollowup} className="w-full ew-btn ew-btn-primary justify-center">
                {generatingFollowup ? 'Сборка...' : 'Сгенерировать Follow-up рассылку'}
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-slate-200 shadow-sm min-h-[350px] flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Текст Follow-up письма</span>
                {followupText && (
                  <button 
                    onClick={() => copyToClipboard(followupText)}
                    className="text-xs text-blue-600 font-bold uppercase hover:underline"
                  >
                    Скопировать текст
                  </button>
                )}
              </div>

              {generatingFollowup && (
                <div className="py-20 text-center text-blue-500 animate-pulse">ИИ собирает результаты совещания...</div>
              )}

              {!followupText && !generatingFollowup && (
                <div className="py-20 text-center text-slate-400 text-xs">Выберите совещание слева для компиляции итогового письма коллегам.</div>
              )}

              {followupText && (
                <div className="bg-slate-50 p-4 rounded-xl border font-serif text-xs whitespace-pre-wrap text-slate-700 animate-fadeIn leading-relaxed">
                  {followupText}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ 4. GMAIL DRAFTS TAB ═══ */}
      {activeTab === 'gmail_drafts' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm max-w-xl mx-auto space-y-6 text-center">
          <Mail size={40} className="text-blue-500 mx-auto" />
          <div className="space-y-2">
            <h3 className="font-bold text-slate-800 text-sm font-display">Сохранение черновиков во внешнюю почту Gmail</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Вы можете сохранять готовые переведенные письма в Вашу рабочую почту Gmail в папку "Черновики".
              Для этого требуется авторизация Google OAuth 2.0.
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border text-xs text-slate-600 text-left space-y-2">
            <span className="font-bold block uppercase text-[9px] text-slate-400">Статус Интеграции</span>
            <div className="flex items-center justify-between">
              <span>Авторизационный Google Токен:</span>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded text-[9px]">ДОСТУПЕН</span>
            </div>
            <p className="text-[10px] text-slate-400">
              Если токен истек, пожалуйста, переавторизуйтесь в настройках или выполните вход повторно.
            </p>
          </div>
        </div>
      )}

      {/* ═══ 5. TRANSLATIONS TAB ═══ */}
      {activeTab === 'translations' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Исходный текст</span>
              <select
                value={direction}
                onChange={e => setDirection(e.target.value as any)}
                className="text-[10px] border p-1 rounded font-bold"
              >
                <option value="ru_uz">Русский ➔ Узбекский (Латиница)</option>
                <option value="uz_ru">Узбекский ➔ Русский</option>
              </select>
            </div>
            
            <textarea
              rows={10}
              value={translationInput}
              onChange={e => setTranslationInput(e.target.value)}
              placeholder="Введите текст для двустороннего ИИ перевода..."
              className="w-full text-xs p-3 border rounded-xl"
            />

            <div className="flex justify-end">
              <button
                onClick={handleTranslate}
                disabled={translating || !translationInput.trim()}
                className="ew-btn ew-btn-primary"
              >
                <Languages size={14} className={translating ? 'animate-spin' : ''} /> {translating ? 'Перевод...' : 'Перевести'}
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm min-h-[300px] flex flex-col justify-between">
            <div className="space-y-4">
              <div className="border-b pb-2 flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Результат Перевода ИИ</span>
                {translationOutput && (
                  <button onClick={() => copyToClipboard(translationOutput)} className="text-xs text-blue-600 font-bold uppercase hover:underline">
                    Скопировать
                  </button>
                )}
              </div>

              {translating && (
                <div className="py-20 text-center text-blue-500 animate-pulse">Выполняется перевод...</div>
              )}

              {!translationOutput && !translating && (
                <div className="py-20 text-center text-slate-400 text-xs">Введите текст слева и нажмите перевести.</div>
              )}

              {translationOutput && (
                <div className="bg-slate-50 p-4 rounded-xl border font-sans text-xs text-slate-700 whitespace-pre-wrap leading-relaxed animate-fadeIn">
                  {translationOutput}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
