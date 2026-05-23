import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Sparkles, 
  Plus, 
  Trash2, 
  Download, 
  Share2, 
  ExternalLink, 
  TrendingUp, 
  AlertCircle, 
  CheckSquare 
} from 'lucide-react';
import { getAccessToken } from '../firebase';

interface MomProtocol {
  id: string;
  title: string;
  date: string;
  chairman: string;
  secretary: string;
  agenda: string;
  attendees: string;
  discussion: string[];
  resolutions: { text: string; assignee: string; deadline: string }[];
}

const mockProtocols: MomProtocol[] = [
  {
    id: 'mom-1',
    title: 'Оперативное планирование модернизации Ташкентского узла ТМК',
    date: '2026-05-20',
    chairman: 'Юсупов А.Т. (Вице-президент)',
    secretary: 'Умарова Д.Б.',
    agenda: 'Устранение задержек на таможенных путях фитинговых платформ ведомства.',
    attendees: 'Ахмедов У.М., Каримова Н.М., Сабиров А.Р.',
    discussion: [
      'Ахмедов У.М. доложил о завершении тестирования сетевой интеграции.',
      'Каримова Н.М. указала на риск дефицита оборотных средств при задержке поставок свыше 5 дней.'
    ],
    resolutions: [
      { text: 'Подготовить аналитический отчет по таможенным пошлинам', assignee: 'Сабиров А.Р.', deadline: '2026-05-24' },
      { text: 'Оформить заявки на финансирование таможенного залога', assignee: 'Каримова Н.М.', deadline: '2026-05-26' }
    ]
  }
];

export default function MomGenerator() {
  const [protocols, setProtocols] = useState<MomProtocol[]>(() => {
    const saved = localStorage.getItem('tmk_mom_protocols');
    return saved ? JSON.parse(saved) : mockProtocols;
  });

  const [activeTab, setActiveTab] = useState<'create' | 'registry'>('create');
  
  // Create states
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [chairman, setChairman] = useState('');
  const [secretary, setSecretary] = useState('');
  const [agenda, setAgenda] = useState('');
  const [attendees, setAttendees] = useState('');
  
  const [discussionInput, setDiscussionInput] = useState('');
  const [discussion, setDiscussion] = useState<string[]>([]);

  const [resText, setResText] = useState('');
  const [resAssignee, setResAssignee] = useState('');
  const [resDeadline, setResDeadline] = useState('');
  const [resolutions, setResolutions] = useState<{ text: string; assignee: string; deadline: string }[]>([]);

  const [saving, setSaving] = useState(false);
  const [selectedProtocol, setSelectedProtocol] = useState<MomProtocol | null>(mockProtocols[0]);

  useEffect(() => {
    localStorage.setItem('tmk_mom_protocols', JSON.stringify(protocols));
  }, [protocols]);

  const addDiscussionPoint = () => {
    if (!discussionInput.trim()) return;
    setDiscussion([...discussion, discussionInput.trim()]);
    setDiscussionInput('');
  };

  const addResolutionPoint = () => {
    if (!resText.trim() || !resAssignee.trim() || !resDeadline) return;
    setResolutions([...resolutions, { text: resText.trim(), assignee: resAssignee.trim(), deadline: resDeadline }]);
    setResText('');
    setResAssignee('');
    setResDeadline('');
  };

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !agenda.trim()) return;

    const newProtocol: MomProtocol = {
      id: `mom-${Date.now()}`,
      title: title.trim(),
      date,
      chairman: chairman.trim() || 'Не указан',
      secretary: secretary.trim() || 'Не указан',
      agenda: agenda.trim(),
      attendees: attendees.trim(),
      discussion: discussion.length ? discussion : ['Обсуждение проведено согласно регламенту.'],
      resolutions: resolutions.length ? resolutions : [{ text: 'Проконтролировать исполнение общего графика.', assignee: 'Департамент контроля', deadline: date }]
    };

    setProtocols([newProtocol, ...protocols]);
    setSelectedProtocol(newProtocol);
    setActiveTab('registry');

    // Reset fields
    setTitle('');
    setChairman('');
    setSecretary('');
    setAgenda('');
    setAttendees('');
    setDiscussion([]);
    setResolutions([]);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Вы действительно хотите удалить этот протокол?')) {
      const updated = protocols.filter(p => p.id !== id);
      setProtocols(updated);
      if (selectedProtocol?.id === id) {
        setSelectedProtocol(updated[0] || null);
      }
    }
  };

  const handleExportToGoogleDocs = async (p: MomProtocol) => {
    setSaving(true);
    try {
      const token = await getAccessToken();
      if (!token) {
        alert('Пожалуйста, авторизуйте Google Workspace на главном дашборде!');
        return;
      }

      // Format clean Russian document report markup
      const contentText = `
ПРОТОКОЛ СОВЕЩАНИЯ АДМИНИСТРАЦИИ ТМК
Тема: ${p.title}
Дата проведения: ${p.date}

Председатель: ${p.chairman}
Секретарь: ${p.secretary}
Присутствовали: ${p.attendees}

ПОВЕСТКА ДНЯ:
${p.agenda}

ХОД СОВЕЩАНИЯ И ОБСУЖДЕНИЕ:
${p.discussion.map((d, i) => `${i + 1}. ${d}`).join('\n')}

ПРИНЯТЫЕ РЕШЕНИЯ И ПОРУЧЕНИЯ:
${p.resolutions.map((r, i) => `${i + 1}. Решение: ${r.text} | Ответственный: ${r.assignee} | Срок: ${r.deadline}`).join('\n')}

--------------------------------------------
Протокол сгенерирован СЭД Администрации ТМК автоматизированным способом.
`;

      const res = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: `ПРОТОКОЛ: ${p.title} (${p.date})`,
          mimeType: 'application/vnd.google-apps.document'
        })
      });

      const file = await res.json();
      if (file.id) {
        await fetch(`https://docs.google.com/v1/documents/${file.id}:batchUpdate`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            requests: [
              {
                insertText: {
                  location: { index: 1 },
                  text: contentText
                }
              }
            ]
          })
        });

        alert('Протокол успешно экспортирован в облачные Google Документы!');
        window.open(`https://docs.google.com/documents/d/${file.id}/edit`, '_blank');
      }
    } catch (e) {
      console.error(e);
      alert('Ошибка при экспорте протокола.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 font-sans">
      <header className="border-b border-slate-200/60 pb-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest font-display">Транскрипты и регламенты</span>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-display mt-1">Интеллектуальный генератор протоколов</h1>
          <p className="text-slate-500 text-sm mt-0.5">Составление протоколов совещаний (Minutes of Meetings), формулирование поручений и синхронизация в Google Docs.</p>
        </div>

        <div className="flex border p-1 rounded-xl bg-slate-100">
          <button 
            type="button"
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all whitespace-nowrap ${activeTab === 'create' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600'}`}
          >
            Создать протокол
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('registry')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all whitespace-nowrap ${activeTab === 'registry' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600'}`}
          >
            Реестр протоколов ({protocols.length})
          </button>
        </div>
      </header>

      {activeTab === 'create' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create Form */}
          <form onSubmit={handleGenerate} className="lg:col-span-2 bg-white border rounded-2xl p-6 shadow-xs space-y-5">
            <h3 className="text-xs font-bold uppercase text-slate-700 tracking-wider">Основная информация совещания</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-bold uppercase text-slate-400">Название / Тема совещания</label>
                <input 
                  id="mom-title"
                  type="text" 
                  placeholder="Заседание совета директоров по бюджетированию департаментов..." 
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full text-xs p-2.5 border rounded-xl"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-slate-400">Дата совещания</label>
                <input 
                  id="mom-date"
                  type="date" 
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full text-xs p-2.5 border rounded-xl"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-slate-400">Присутствовали</label>
                <input 
                  id="mom-attendees"
                  type="text" 
                  placeholder="Ахмедов У.М., Каримова Н.М." 
                  value={attendees}
                  onChange={e => setAttendees(e.target.value)}
                  className="w-full text-xs p-2.5 border rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-slate-400">Председатель</label>
                <input 
                  id="mom-chairman"
                  type="text" 
                  placeholder="Юсупов А.Т." 
                  value={chairman}
                  onChange={e => setChairman(e.target.value)}
                  className="w-full text-xs p-2.5 border rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-slate-400">Секретарь</label>
                <input 
                  id="mom-secretary"
                  type="text" 
                  placeholder="Умарова Д.Б." 
                  value={secretary}
                  onChange={e => setSecretary(e.target.value)}
                  className="w-full text-xs p-2.5 border rounded-xl"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-bold uppercase text-slate-400">Повестка дня / Резюме встречи</label>
                <textarea 
                  id="mom-agenda"
                  rows={2}
                  placeholder="Обсуждение сквозных метрик СЭД и подготовка ведомственного отчета..." 
                  value={agenda}
                  onChange={e => setAgenda(e.target.value)}
                  className="w-full text-xs p-2.5 border rounded-xl"
                  required
                />
              </div>
            </div>

            {/* Dynamic Discussion Point fields */}
            <div className="border-t pt-4 space-y-3">
              <label className="text-[10px] font-bold uppercase text-slate-400 block">Ход совещания (Реплики / Тезисы)</label>
              
              <div className="flex gap-2">
                <input 
                  id="mom-disc-input"
                  type="text" 
                  placeholder="Араббоев К.М. доложил о ходе реализации..." 
                  value={discussionInput}
                  onChange={e => setDiscussionInput(e.target.value)}
                  className="w-full text-xs p-2 border rounded-xl"
                />
                <button 
                  type="button" 
                  onClick={addDiscussionPoint}
                  className="px-3 bg-slate-900 text-white rounded-xl text-xs font-bold whitespace-nowrap"
                >
                  Добавить
                </button>
              </div>

              {discussion.length > 0 && (
                <ul className="space-y-1.5 bg-slate-50 p-3 rounded-2xl text-xs text-slate-600 list-decimal list-inside">
                  {discussion.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              )}
            </div>

            {/* Formulations of resolution */}
            <div className="border-t pt-4 space-y-3">
              <label className="text-[10px] font-bold uppercase text-slate-400 block">Принятые решения / Поручения</label>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <input 
                  id="mom-res-text"
                  type="text" 
                  placeholder="Выполнить сверку бюджетов..." 
                  value={resText}
                  onChange={e => setResText(e.target.value)}
                  className="md:col-span-2 w-full text-xs p-2 border rounded-xl"
                />
                <input 
                  id="mom-res-assignee"
                  type="text" 
                  placeholder="Каримова Н.М." 
                  value={resAssignee}
                  onChange={e => setResAssignee(e.target.value)}
                  className="w-full text-xs p-2 border rounded-xl"
                />
                <input 
                  id="mom-res-deadline"
                  type="date" 
                  value={resDeadline}
                  onChange={e => setResDeadline(e.target.value)}
                  className="w-full text-xs p-2 border rounded-xl"
                />
                <button 
                  type="button" 
                  onClick={addResolutionPoint}
                  className="md:col-span-3 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
                >
                  + Зафиксировать поручение
                </button>
              </div>

              {resolutions.length > 0 && (
                <div className="bg-slate-50 p-3 rounded-2xl text-xs space-y-2">
                  {resolutions.map((r, i) => (
                    <div key={i} className="flex justify-between items-center text-slate-700 border-b border-slate-200/50 pb-1.5 font-sans">
                      <span className="font-semibold">{i + 1}. {r.text}</span>
                      <span className="text-[10px] bg-indigo-50 text-indigo-700 font-mono px-2 py-0.5 rounded uppercase font-extrabold text-right">
                        {r.assignee} (до {r.deadline})
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit btn */}
            <div className="pt-2 border-t flex justify-end">
              <button 
                id="mom-submit-btn"
                type="submit"
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 hover:shadow text-white font-bold px-6 py-3 rounded-xl text-xs uppercase cursor-pointer"
              >
                <Sparkles size={16} />
                <span>Сформировать протокол в СЭД</span>
              </button>
            </div>
          </form>

          {/* Tips card */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 border border-slate-800 text-indigo-100 rounded-3xl p-6 shadow-sm">
              <h3 className="text-sm font-extrabold tracking-tight text-white mb-2">Автоматический импорт</h3>
              <p className="text-xs text-indigo-200 leading-relaxed mb-4">Наш модуль позволяет увязать принятые в ходе коллегии распоряжения с исполняющими департаментами Комитета Машиностроения.</p>
              <div className="flex flex-col gap-2.5 text-xs">
                <div className="flex gap-2 items-start">
                  <span className="p-1 bg-indigo-800 rounded text-indigo-300 font-mono font-bold text-[9px]">1</span>
                  <span>Быстрый экспорт отчетов в ведомства</span>
                </div>
                <div className="flex gap-2 items-start">
                  <span className="p-1 bg-indigo-800 rounded text-indigo-300 font-mono font-bold text-[9px]">2</span>
                  <span>Привязка дедлайнов к календарю Google Calendar</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Registry template */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Scroll List of Protocols */}
          <div className="space-y-4">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Реестр совещаний Администрации</h3>
            <div className="space-y-3">
              {protocols.map(p => (
                <button 
                  type="button"
                  key={p.id}
                  onClick={() => setSelectedProtocol(p)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all ${selectedProtocol?.id === p.id ? 'bg-indigo-50/70 border-indigo-200 text-indigo-950' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                >
                  <span className="text-[10px] font-mono text-slate-400 block">{p.date}</span>
                  <h4 className="font-bold text-slate-800 text-xs leading-snug mt-1 truncate">{p.title}</h4>
                  <p className="text-slate-500 text-[10px] mt-1 line-clamp-1">{p.agenda}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Active protocol presentation panel */}
          <div className="md:col-span-2">
            {selectedProtocol ? (
              <div className="bg-white border rounded-2xl p-6 shadow-xs space-y-5">
                <div className="flex justify-between items-start border-b pb-4 gap-4 flex-wrap">
                  <div>
                    <span className="text-[10px] font-mono text-indigo-600 font-bold uppercase block">ПРОТОКОЛ СОВЕЩАНИЯ // №ЕД-{selectedProtocol.id.split('-').pop()}</span>
                    <h2 className="text-lg font-extrabold text-slate-900 leading-snug font-display mt-0.5">{selectedProtocol.title}</h2>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleExportToGoogleDocs(selectedProtocol)}
                      disabled={saving}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[10px] uppercase rounded-xl flex items-center gap-1 leading-none"
                    >
                      <Download size={13} />
                      <span>{saving ? 'Экспорт...' : 'Google Docs'}</span>
                    </button>
                    <button 
                      onClick={() => handleDelete(selectedProtocol.id)}
                      className="p-1 px-2 hover:bg-rose-50 border border-slate-200 text-slate-400 hover:text-rose-600 rounded-xl transition-colors"
                      title="Удалить протокол"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-sans text-slate-600">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Дата</span>
                    <span className="font-semibold text-slate-800">{selectedProtocol.date}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Присутствовали</span>
                    <span className="font-semibold text-slate-800 truncate block" title={selectedProtocol.attendees}>{selectedProtocol.attendees}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Председатель</span>
                    <span className="font-semibold text-slate-800">{selectedProtocol.chairman}</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Секретарь</span>
                    <span className="font-semibold text-slate-800">{selectedProtocol.secretary}</span>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Повестка дня</h4>
                  <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border">{selectedProtocol.agenda}</p>
                </div>

                <div className="space-y-2.5">
                  <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Ход обсуждения</h4>
                  <ul className="space-y-1.5">
                    {selectedProtocol.discussion.map((d, idx) => (
                      <li key={idx} className="text-xs text-slate-600 pl-4 border-l-2 border-indigo-400 leading-relaxed">{d}</li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2.5 pt-2 border-t">
                  <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Решения и поручения для исполнения</h4>
                  <div className="space-y-2.5">
                    {selectedProtocol.resolutions.map((r, idx) => (
                      <div key={idx} className="flex justify-between items-start md:items-center bg-indigo-50/40 p-3.5 rounded-2xl border border-indigo-100 gap-4 flex-col md:flex-row">
                        <div className="space-y-0.5">
                          <span className="font-semibold text-xs text-slate-800 leading-snug block">{r.text}</span>
                        </div>
                        <div className="text-right text-[10px] font-mono shrink-0 uppercase tracking-wide">
                          <span className="font-bold text-slate-500">Министерство / Исполнитель: </span>
                          <span className="font-extrabold text-indigo-700">{r.assignee} (до {r.deadline})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-16 text-center text-slate-400">Выберите или сгенерируйте первый протокол совещания.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
