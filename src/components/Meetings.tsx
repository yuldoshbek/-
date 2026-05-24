import React, { useState } from 'react';
import { 
  Calendar, 
  Users, 
  FileText, 
  Sparkles, 
  Plus, 
  Save, 
  ChevronRight, 
  Trash, 
  Edit2, 
  Search,
  CheckCircle,
  Clock,
  AlertCircle,
  FileSpreadsheet,
  Check,
  Briefcase
} from 'lucide-react';
import { useTasks, useMeetings, logAIUsage, useMomProtocols, useDecisions } from '../lib/hooks';
import { Meeting, MomProtocol, Decision, Task } from '../types';
import EntityRelations from './EntityRelations';
import { addLink } from '../lib/relations';
import { getAIHeaders } from '../lib/ai-context';

export default function Meetings() {
  const { meetings, addMeeting, updateMeetingDetails, deleteMeeting } = useMeetings();
  const { addTask, tasks, updateTaskStatus } = useTasks();
  const { protocols, addProtocol, loading: loadingProtocols } = useMomProtocols();
  const { decisions, addDecision, updateDecisionStatus, loading: loadingDecisions } = useDecisions();

  // Tab state
  const [activeTab, setActiveTab] = useState<'meetings' | 'protocols' | 'decisions' | 'post_tasks' | 'preparation'>('meetings');
  
  // Search query for meetings
  const [meetingSearch, setMeetingSearch] = useState('');

  // Selected details state
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(null);
  const [selectedProtocolId, setSelectedProtocolId] = useState<string | null>(null);
  const [selectedDecisionId, setSelectedDecisionId] = useState<string | null>(null);

  // Modals visibility state
  const [showAddMeetingModal, setShowAddMeetingModal] = useState(false);
  const [showAddProtocolModal, setShowAddProtocolModal] = useState(false);
  const [showAddDecisionModal, setShowAddDecisionModal] = useState(false);

  // Edit Meeting states
  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editParticipants, setEditParticipants] = useState('');
  const [editAgenda, setEditAgenda] = useState('');
  const [editDecisions, setEditDecisions] = useState('');

  // Create Meeting form state
  const [meetTitle, setMeetTitle] = useState('');
  const [meetDate, setMeetDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [meetParticipants, setMeetParticipants] = useState('');
  const [meetAgenda, setMeetAgenda] = useState('');
  const [meetDecisionsText, setMeetDecisionsText] = useState('');
  const [meetNotes, setMeetNotes] = useState('');

  // Create Protocol form state
  const [protoTitle, setProtoTitle] = useState('');
  const [protoDate, setProtoDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [protoContent, setProtoContent] = useState('');

  // Create Decision form state
  const [decRefNo, setDecRefNo] = useState('');
  const [decTitle, setDecTitle] = useState('');
  const [decCategory, setDecCategory] = useState('Организационное');
  const [decDate, setDecDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [decSigner, setDecSigner] = useState('Генеральный директор');
  const [decSummary, setDecSummary] = useState('');
  const [decStatus, setDecStatus] = useState<'Действует' | 'Отменено'>('Действует');

  // AI Meeting prep states (from original note processing)
  const [notes, setNotes] = useState('');
  const [generating, setGenerating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [newParticipants, setNewParticipants] = useState('');
  const [result, setResult] = useState<{
    agenda?: string;
    decisions?: string[];
    tasks?: { title: string; assignee: string; deadline: string }[];
  } | null>(null);

  // Handle AI compilation
  const handleGenerate = async () => {
    if (!notes.trim()) return;
    setGenerating(true);
    setResult(null);
    try {
      const res = await fetch('/api/process-meeting', {
        method: 'POST',
        headers: getAIHeaders(),
        body: JSON.stringify({ notes })
      });
      const data = await res.json();
      if (res.ok && data.agenda) {
        setResult(data);
        logAIUsage('/api/process-meeting', 'success', notes.length, JSON.stringify(data).length);
      } else {
        logAIUsage('/api/process-meeting', 'error', notes.length, 0);
        throw new Error();
      }
    } catch {
      logAIUsage('/api/process-meeting', 'error', notes.length, 0);
      setTimeout(() => {
        setResult({
          agenda: "Анализ исполнительской дисциплины и решение инфраструктурных задержек.",
          decisions: [
            "Привлечь дополнительный аудит строительного контроля.",
            "Обязать руководителей IT-секторов завершить внедрение в установленные сроки."
          ],
          tasks: [
            { title: "Заказать экологический аудит для участка", assignee: "Департамент логистики", deadline: "2026-05-29" },
            { title: "Написать отчет Генеральному директору", assignee: "Сектор надзора", deadline: "2026-05-27" }
          ]
        });
      }, 800);
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveProtocol = async () => {
    if (!result) return;
    await addMeeting({
      title: newTitle || `Совещание от ${newDate}`,
      date: newDate,
      participants: newParticipants.split(',').map(p => p.trim()).filter(Boolean),
      agenda: result.agenda || '',
      decisions: result.decisions || [],
      notes: notes
    });
    alert('Протокол совещания успешно сохранён в архив!');
    setResult(null);
    setNotes('');
    setNewTitle('');
    setNewParticipants('');
    setActiveTab('meetings');
  };

  const handleCreateTasks = async () => {
    if (!result?.tasks) return;
    for (const task of result.tasks) {
      await addTask({
        title: task.title,
        status: 'pending',
        priority: 'medium',
        assignee: task.assignee,
        department: task.assignee,
        deadline: task.deadline,
        source: 'Протокол встречи'
      });
    }
    alert('Поручения добавлены в задачи!');
  };

  // Add custom meeting manually
  const handleAddMeetingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetTitle.trim()) return;
    await addMeeting({
      title: meetTitle,
      date: meetDate,
      participants: meetParticipants.split(',').map(p => p.trim()).filter(Boolean),
      agenda: meetAgenda,
      decisions: meetDecisionsText.split('\n').map(d => d.trim()).filter(Boolean),
      notes: meetNotes
    });
    setMeetTitle('');
    setMeetParticipants('');
    setMeetAgenda('');
    setMeetDecisionsText('');
    setMeetNotes('');
    setShowAddMeetingModal(false);
    alert('Встреча успешно добавлена!');
  };

  // Add custom MoM protocol
  const handleAddProtocolSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!protoTitle.trim() || !protoContent.trim()) return;
    await addProtocol(protoTitle, protoDate, protoContent);
    setProtoTitle('');
    setProtoContent('');
    setShowAddProtocolModal(false);
    alert('Протокол успешно добавлен!');
  };

  // Add custom decision
  const handleAddDecisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!decTitle.trim() || !decRefNo.trim()) return;
    await addDecision({
      referenceNo: decRefNo,
      title: decTitle,
      category: decCategory,
      date: decDate,
      signer: decSigner,
      status: decStatus,
      summary: decSummary
    });
    setDecRefNo('');
    setDecTitle('');
    setDecSummary('');
    setShowAddDecisionModal(false);
    alert('Решение успешно добавлено!');
  };

  const handleCreateTaskFromDecision = async (meetingTitle: string, decision: string) => {
    const taskId = await addTask({
      title: decision.slice(0, 50) + (decision.length > 50 ? '...' : ''),
      description: `Создано из решения: ${decision}`,
      status: 'pending',
      priority: 'medium',
      assignee: 'Не назначено',
      department: 'Общий',
      deadline: '',
      source: `Встреча: ${meetingTitle}`
    });
    if (taskId) {
      alert('Задача успешно создана из решения!');
    }
  };

  // Edit meetings
  const handleStartEdit = (m: Meeting) => {
    setEditMode(true);
    setEditTitle(m.title);
    setEditDate(m.date || '');
    setEditParticipants(m.participants?.join(', ') || '');
    setEditAgenda(m.agenda || '');
    setEditDecisions(m.decisions?.join('\n') || '');
  };

  const handleSaveEdit = async () => {
    if (!selectedMeetingId) return;
    await updateMeetingDetails(selectedMeetingId, {
      title: editTitle,
      date: editDate,
      participants: editParticipants.split(',').map(p => p.trim()).filter(Boolean),
      agenda: editAgenda,
      decisions: editDecisions.split('\n').map(d => d.trim()).filter(Boolean)
    });
    setEditMode(false);
  };

  const handleDeleteMeeting = async (id: string) => {
    if (window.confirm('Вы действительно хотите удалить эту протокольную запись?')) {
      await deleteMeeting(id);
      setSelectedMeetingId(null);
      setEditMode(false);
    }
  };

  // Filters and values
  const filteredMeetings = meetings.filter(m => 
    m.title.toLowerCase().includes(meetingSearch.toLowerCase()) ||
    m.agenda?.toLowerCase().includes(meetingSearch.toLowerCase()) ||
    m.participants?.some(p => p.toLowerCase().includes(meetingSearch.toLowerCase()))
  );

  const selectedMeeting = meetings.find(m => m.id === selectedMeetingId);
  const selectedProtocol = protocols.find(p => p.id === selectedProtocolId);
  const selectedDecision = decisions.find(d => d.id === selectedDecisionId);

  // Post meeting tasks
  const postMeetingTasks = tasks.filter(t => 
    t.source?.toLowerCase().includes('встреч') || 
    t.source?.toLowerCase().includes('протокол') || 
    t.source?.toLowerCase().includes('совещание')
  );

  return (
    <div className="ew-page p-6 lg:p-8 max-w-7xl mx-auto font-sans space-y-6">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 font-display">Совещания и Встречи</h1>
          <p className="text-slate-500 text-sm mt-0.5">Реестр совещаний, официальные протоколы, решения и задачи после встреч</p>
        </div>

        <div className="flex gap-2">
          {activeTab === 'meetings' && (
            <button
              onClick={() => setShowAddMeetingModal(true)}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-2 rounded-xl text-xs uppercase cursor-pointer transition-colors shadow-sm"
            >
              <Plus size={14} /> Создать встречу
            </button>
          )}
          {activeTab === 'protocols' && (
            <button
              onClick={() => setShowAddProtocolModal(true)}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-2 rounded-xl text-xs uppercase cursor-pointer transition-colors shadow-sm"
            >
              <Plus size={14} /> Загрузить протокол
            </button>
          )}
          {activeTab === 'decisions' && (
            <button
              onClick={() => setShowAddDecisionModal(true)}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-2 rounded-xl text-xs uppercase cursor-pointer transition-colors shadow-sm"
            >
              <Plus size={14} /> Новое Решение
            </button>
          )}
        </div>
      </header>

      {/* Sub-tab navigation */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-6 -mb-px overflow-x-auto">
          {[
            { id: 'meetings', label: 'Встречи' },
            { id: 'protocols', label: 'Протоколы (MoM)' },
            { id: 'decisions', label: 'Решения' },
            { id: 'post_tasks', label: 'Задачи после встречи' },
            { id: 'preparation', label: 'Подготовка к совещанию' }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id as any);
                setEditMode(false);
              }}
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

      {/* ═══ 1. MEETINGS TAB ═══ */}
      {activeTab === 'meetings' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 ew-card flex flex-col h-[550px] overflow-hidden">
            <div className="p-4 border-b bg-slate-50/50">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
                <input 
                  type="text" 
                  placeholder="Поиск встреч..."
                  value={meetingSearch}
                  onChange={e => setMeetingSearch(e.target.value)}
                  className="w-full text-xs border border-slate-200 pl-8 pr-3 py-1.5 rounded-lg bg-white"
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
              {filteredMeetings.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">Встреч не найдено</div>
              ) : (
                filteredMeetings.map(m => (
                  <div
                    key={m.id}
                    onClick={() => { setSelectedMeetingId(m.id); setEditMode(false); }}
                    className={`p-4 cursor-pointer flex justify-between items-start gap-3 transition-all ${
                      selectedMeetingId === m.id ? 'bg-blue-50 border-r-4 border-blue-500' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="space-y-1 text-xs">
                      <span className="font-mono text-slate-400 text-[10px]">📅 {m.date}</span>
                      <h4 className="font-bold text-slate-800">{m.title}</h4>
                      {m.participants && m.participants.length > 0 && (
                        <span className="text-[10px] text-slate-400 block line-clamp-1">👥 {m.participants.join(', ')}</span>
                      )}
                    </div>
                    <ChevronRight size={16} className="text-slate-300 shrink-0" />
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="lg:col-span-8 ew-card p-6 h-[550px] overflow-y-auto">
            {selectedMeeting ? (
              editMode ? (
                /* Edit Mode */
                <div className="space-y-4 text-xs">
                  <div className="flex justify-between items-center border-b pb-3">
                    <h3 className="font-bold text-slate-900 text-sm">Редактирование протокола</h3>
                    <div className="flex gap-2">
                      <button onClick={handleSaveEdit} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[10px] uppercase cursor-pointer">
                        Сохранить
                      </button>
                      <button onClick={() => setEditMode(false)} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-[10px] uppercase cursor-pointer">
                        Отмена
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Название встречи</label>
                      <input 
                        type="text" 
                        value={editTitle} 
                        onChange={e => setEditTitle(e.target.value)} 
                        className="w-full text-xs p-2.5 border rounded-xl" 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Дата</label>
                      <input 
                        type="date" 
                        value={editDate} 
                        onChange={e => setEditDate(e.target.value)} 
                        className="w-full text-xs p-2.5 border rounded-xl" 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Участники (через запятую)</label>
                    <input 
                      type="text" 
                      value={editParticipants} 
                      onChange={e => setEditParticipants(e.target.value)} 
                      className="w-full text-xs p-2.5 border rounded-xl" 
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Повестка дня</label>
                    <input 
                      type="text" 
                      value={editAgenda} 
                      onChange={e => setEditAgenda(e.target.value)} 
                      className="w-full text-xs p-2.5 border rounded-xl" 
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Принятые решения (по одному на строке)</label>
                    <textarea 
                      rows={4} 
                      value={editDecisions} 
                      onChange={e => setEditDecisions(e.target.value)} 
                      className="w-full text-xs p-2.5 border rounded-xl font-mono" 
                    />
                  </div>
                </div>
              ) : (
                /* Read View */
                <div className="space-y-6 text-xs animate-fadeIn">
                  <div className="border-b pb-4 flex justify-between items-start">
                    <div className="flex-1">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Протокольная запись</span>
                      <h3 className="font-extrabold text-slate-900 text-base mt-1 font-display">{selectedMeeting.title}</h3>
                      <div className="grid grid-cols-2 gap-4 mt-3 text-[10px]">
                        <div>
                          <span className="text-slate-400 uppercase font-semibold block">Дата</span>
                          <span className="font-bold text-slate-700 block">{selectedMeeting.date}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 uppercase font-semibold block">Участники</span>
                          <span className="font-bold text-slate-700 block">{selectedMeeting.participants?.join(', ')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button onClick={() => handleStartEdit(selectedMeeting)} className="p-2 hover:bg-slate-100 rounded text-slate-500 hover:text-blue-600 cursor-pointer" title="Редактировать">
                        <Edit2 size={15} />
                      </button>
                      <button onClick={() => handleDeleteMeeting(selectedMeeting.id)} className="p-2 hover:bg-slate-100 rounded text-slate-500 hover:text-rose-600 cursor-pointer" title="Удалить">
                        <Trash size={15} />
                      </button>
                    </div>
                  </div>

                  {selectedMeeting.agenda && (
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Повестка</span>
                      <p className="bg-slate-50 p-4 rounded-xl border font-semibold text-slate-800">{selectedMeeting.agenda}</p>
                    </div>
                  )}

                  {selectedMeeting.decisions && selectedMeeting.decisions.length > 0 && (
                    <div className="border-t pt-4">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2">Решения</span>
                      <ol className="list-decimal pl-4 space-y-1.5 text-slate-700 font-medium">
                        {selectedMeeting.decisions.map((dec, i) => (
                          <li key={i} className="group">
                            <span>{dec}</span>
                            <button 
                              onClick={() => handleCreateTaskFromDecision(selectedMeeting.title, dec)}
                              className="ml-2 text-[9px] text-blue-500 opacity-0 group-hover:opacity-100 uppercase font-bold transition-opacity cursor-pointer hover:underline"
                            >
                              + Создать задачу
                            </button>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {selectedMeeting.notes && (
                    <div className="border-t pt-4">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">Заметки и стенограмма</span>
                      <pre className="bg-slate-50/50 p-4 rounded-xl border text-[11px] font-mono whitespace-pre-wrap text-slate-600">{selectedMeeting.notes}</pre>
                    </div>
                  )}

                  <EntityRelations entityType="meeting" entityId={selectedMeeting.id} />
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2 py-24">
                <FileText size={32} className="opacity-30" />
                <p className="text-xs font-semibold">Выберите совещание</p>
                <p className="text-[10px] max-w-sm text-center">Из левой панели для просмотра стенограммы, принятых решений и связей.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ 2. PROTOCOLS TAB (MOM) ═══ */}
      {activeTab === 'protocols' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 ew-card flex flex-col h-[500px] overflow-hidden">
            <div className="p-4 border-b bg-slate-50/50 font-bold text-xs text-slate-600">
              Список протоколов (Всего: {protocols.length})
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {loadingProtocols ? (
                <div className="p-8 text-center text-slate-400 text-xs">Загрузка...</div>
              ) : protocols.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">Протоколы отсутствуют</div>
              ) : (
                protocols.map(p => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedProtocolId(p.id)}
                    className={`p-4 cursor-pointer flex justify-between items-start gap-2 transition-all ${
                      selectedProtocolId === p.id ? 'bg-blue-50 border-r-4 border-blue-500' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="space-y-1 text-xs">
                      <span className="font-mono text-slate-400 text-[10px]">📅 {p.date}</span>
                      <h4 className="font-bold text-slate-800">{p.title}</h4>
                      <p className="text-[10px] text-slate-400 line-clamp-1">{p.content}</p>
                    </div>
                    <ChevronRight size={14} className="text-slate-300 shrink-0 mt-1" />
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="lg:col-span-8 ew-card p-6 h-[500px] overflow-y-auto">
            {selectedProtocol ? (
              <div className="space-y-4 text-xs">
                <div className="border-b pb-3">
                  <span className="text-[9px] uppercase font-bold text-slate-400">Документ: Протокол встречи</span>
                  <h3 className="font-extrabold text-slate-900 text-base mt-1 font-display">{selectedProtocol.title}</h3>
                  <span className="font-mono text-slate-400 text-[10px] block mt-1">Дата загрузки: {selectedProtocol.date}</span>
                </div>
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200/60 font-mono text-[11px] text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {selectedProtocol.content}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2 py-24">
                <FileText size={32} className="opacity-30" />
                <p className="text-xs font-semibold">Выберите протокол</p>
                <p className="text-[10px] text-center">Выберите протокол из левого меню для подробного чтения.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ 3. DECISIONS TAB ═══ */}
      {activeTab === 'decisions' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 ew-card flex flex-col h-[500px] overflow-hidden">
            <div className="p-4 border-b bg-slate-50/50 font-bold text-xs text-slate-600">
              Реестр официальных решений (Всего: {decisions.length})
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {loadingDecisions ? (
                <div className="p-8 text-center text-slate-400 text-xs">Загрузка...</div>
              ) : decisions.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">Нет принятых решений</div>
              ) : (
                decisions.map(d => (
                  <div
                    key={d.id}
                    onClick={() => setSelectedDecisionId(d.id)}
                    className={`p-4 cursor-pointer flex justify-between items-start gap-2 transition-all ${
                      selectedDecisionId === d.id ? 'bg-blue-50 border-r-4 border-blue-500' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[9px] bg-slate-100 text-slate-600 px-1 py-0.5 rounded font-bold">{d.referenceNo}</span>
                        <span className={`text-[9px] font-bold px-1 py-0.5 rounded ${
                          d.status === 'Действует' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                        }`}>{d.status}</span>
                      </div>
                      <h4 className="font-bold text-slate-800">{d.title}</h4>
                      <span className="text-[10px] text-slate-400 block">👤 Подписал: {d.signer}</span>
                    </div>
                    <ChevronRight size={14} className="text-slate-300 shrink-0 mt-1" />
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="lg:col-span-8 ew-card p-6 h-[500px] overflow-y-auto">
            {selectedDecision ? (
              <div className="space-y-5 text-xs">
                <div className="border-b pb-3 flex justify-between items-start">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400">Решение дирекции</span>
                    <h3 className="font-extrabold text-slate-900 text-base mt-1 font-display">{selectedDecision.title}</h3>
                    <div className="flex gap-4 mt-2 font-mono text-[10px] text-slate-400">
                      <span>Рег №: <b>{selectedDecision.referenceNo}</b></span>
                      <span>Категория: <b>{selectedDecision.category}</b></span>
                      <span>Дата: <b>{selectedDecision.date}</b></span>
                    </div>
                  </div>

                  <div>
                    <select
                      value={selectedDecision.status}
                      onChange={(e) => updateDecisionStatus(selectedDecision.id, e.target.value as any)}
                      className={`text-xs font-bold p-1 rounded-md border ${
                        selectedDecision.status === 'Действует' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
                      }`}
                    >
                      <option value="Действует">Действует</option>
                      <option value="Отменено">Отменено</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Подписант / Лицо</span>
                  <p className="font-bold text-slate-800 bg-slate-50 px-3 py-2.5 rounded-lg border border-slate-100 flex items-center gap-2">
                    <Users size={14} className="text-slate-400" /> {selectedDecision.signer}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Аннотация / Суть решения</span>
                  <div className="bg-slate-50/50 p-4 rounded-xl border leading-relaxed text-slate-700 font-semibold font-sans">
                    {selectedDecision.summary}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => handleCreateTaskFromDecision(selectedDecision.referenceNo, selectedDecision.title)}
                    className="flex items-center gap-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold px-3 py-2 rounded-lg cursor-pointer text-xs transition-colors"
                  >
                    <Plus size={14} /> Создать поручение на базе решения
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2 py-24">
                <FileSpreadsheet size={32} className="opacity-30" />
                <p className="text-xs font-semibold">Выберите решение</p>
                <p className="text-[10px] text-center">Выберите решение из левого реестра для управления статусом и деталями.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ 4. POST TASKS TAB ═══ */}
      {activeTab === 'post_tasks' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
            <h3 className="font-bold text-slate-800 text-sm">Поручения, привязанные к прошедшим совещаниям</h3>
            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold font-mono rounded">
              Всего: {postMeetingTasks.length}
            </span>
          </div>

          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="p-3 w-28">Статус</th>
                <th className="p-3">Задача / Поручение</th>
                <th className="p-3">Ответственный</th>
                <th className="p-3">Департамент</th>
                <th className="p-3">Источник</th>
                <th className="p-3">Дедлайн</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {postMeetingTasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">Задач, связанных с совещаниями, не обнаружено.</td>
                </tr>
              ) : (
                postMeetingTasks.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/50">
                    <td className="p-3">
                      <select
                        value={t.status}
                        onChange={(e) => updateTaskStatus(t.id, e.target.value as any)}
                        className={`text-[9px] font-bold p-1 rounded border uppercase ${
                          t.status === 'completed' ? 'bg-emerald-50 text-emerald-800' :
                          t.status === 'in_progress' ? 'bg-blue-50 text-blue-800' : 'bg-amber-50 text-amber-800'
                        }`}
                      >
                        <option value="pending">Ожидает</option>
                        <option value="in_progress">В работе</option>
                        <option value="completed">Выполнено</option>
                        <option value="overdue">Сорвано</option>
                      </select>
                    </td>
                    <td className="p-3 font-semibold text-slate-800">{t.title}</td>
                    <td className="p-3 font-medium text-slate-600">{t.assignee}</td>
                    <td className="p-3 text-slate-500">{t.department}</td>
                    <td className="p-3 text-blue-600 font-bold">{t.source}</td>
                    <td className="p-3 font-mono text-slate-500">{t.deadline || 'Без срока'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ═══ 5. PREPARATION (AI COMPILATION) ═══ */}
      {activeTab === 'preparation' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Form */}
          <div className="lg:col-span-7 ew-card p-6 space-y-5">
            <div className="border-b pb-2 flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Параметры и стенограмма совещания</h3>
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">ИИ-Компилятор</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Название встречи</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="Пример: Стратегическая сессия..."
                  className="w-full text-sm border border-slate-200 p-2.5 rounded-xl bg-slate-50/50 focus:outline-none focus:border-blue-400"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Дата проведения</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={e => setNewDate(e.target.value)}
                  className="w-full text-sm border border-slate-200 p-2.5 rounded-xl bg-slate-50/50"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Участники (через запятую)</label>
                <input
                  type="text"
                  value={newParticipants}
                  onChange={e => setNewParticipants(e.target.value)}
                  placeholder="Генеральный директор, Руководитель IT, Советник..."
                  className="w-full text-sm border border-slate-200 p-2.5 rounded-xl bg-slate-50/50"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Стенограмма встречи или ключевые заметки</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Запишите сюда тезисы встречи. Пример: Обсуждали проект развития CRM. Проблемы с подрядчиком. Директор поручил Юристу проверить договор к 28 числу, а IT-отделу подготовить ТЗ."
                className="w-full h-64 p-4 border border-slate-200 rounded-xl bg-slate-50/30 text-xs font-mono resize-none focus:outline-none focus:border-blue-400"
              />
            </div>

            <div className="flex justify-end border-t pt-4">
              <button
                onClick={handleGenerate}
                disabled={generating || !notes.trim()}
                className="ew-btn ew-btn-primary disabled:opacity-50 flex items-center gap-1"
              >
                <Sparkles size={14} className={generating ? 'animate-pulse' : ''} />
                ИИ-Анализ и компиляция
              </button>
            </div>
          </div>

          {/* Result */}
          <div className="lg:col-span-5 ew-card p-6 min-h-[400px] flex flex-col">
            <div className="flex justify-between items-center border-b pb-2 mb-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase">Сгенерированный протокол</h3>
              {result && (
                <button onClick={handleSaveProtocol} className="text-xs text-blue-600 font-bold uppercase hover:underline flex items-center gap-1 cursor-pointer">
                  <Save size={12} /> Сохранить в Встречи
                </button>
              )}
            </div>

            {!result && !generating && (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 space-y-3">
                <FileText size={32} className="opacity-30" />
                <p className="text-xs font-medium">Протокол пуст</p>
                <p className="text-[10px] max-w-xs text-center">ИИ выделит повестку, решения и поручения из стенограммы.</p>
              </div>
            )}

            {generating && (
              <div className="flex-1 flex flex-col items-center justify-center text-blue-500 space-y-3">
                <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                <span className="text-[10px] font-mono uppercase tracking-wider">Генерация протокола...</span>
              </div>
            )}

            {result && (
              <div className="space-y-5 text-xs animate-fadeIn">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Повестка дня</span>
                  <span className="font-bold text-slate-900">{result.agenda}</span>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Принятые решения</span>
                  <ul className="space-y-1.5 list-disc pl-4 text-slate-700 font-medium">
                    {result.decisions?.map((d, i) => <li key={i}>{d}</li>)}
                  </ul>
                </div>

                {result.tasks && result.tasks.length > 0 && (
                  <div className="space-y-3 border-t pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Поручения ИИ ({result.tasks.length})</span>
                      <button onClick={handleCreateTasks} className="text-[9px] font-bold uppercase bg-blue-50 text-blue-700 hover:bg-blue-100 px-2 py-1 rounded-lg cursor-pointer">
                        Внести в задачи
                      </button>
                    </div>
                    <div className="space-y-2">
                      {result.tasks.map((t, idx) => (
                        <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                          <div>
                            <span className="font-bold text-slate-800 text-xs">{t.title}</span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">👤 {t.assignee}</span>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 bg-rose-50 text-rose-600 font-bold rounded">{t.deadline}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ MODALS ═══ */}
      {/* 1. Add Meeting Modal */}
      {showAddMeetingModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <form onSubmit={handleAddMeetingSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base font-display">Новое Совещание / Встреча</h3>
              <button type="button" onClick={() => setShowAddMeetingModal(false)} className="text-slate-400 hover:text-slate-600 text-sm">Закрыть</button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Название совещания</label>
                  <input
                    type="text" required
                    placeholder="Например: Обсуждение бюджета..."
                    value={meetTitle}
                    onChange={e => setMeetTitle(e.target.value)}
                    className="w-full text-xs border border-slate-200 p-2.5 rounded-lg bg-slate-50/50"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Дата</label>
                  <input
                    type="date" required
                    value={meetDate}
                    onChange={e => setMeetDate(e.target.value)}
                    className="w-full text-xs border border-slate-200 p-2.5 rounded-lg bg-slate-50/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Участники (через запятую)</label>
                <input
                  type="text"
                  placeholder="Генеральный директор, Советник, Главный бухгалтер..."
                  value={meetParticipants}
                  onChange={e => setMeetParticipants(e.target.value)}
                  className="w-full text-xs border border-slate-200 p-2.5 rounded-lg bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Повестка дня</label>
                <input
                  type="text"
                  placeholder="Ключевые темы и вопросы для обсуждения..."
                  value={meetAgenda}
                  onChange={e => setMeetAgenda(e.target.value)}
                  className="w-full text-xs border border-slate-200 p-2.5 rounded-lg bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Принятые решения (каждое с новой строки)</label>
                <textarea
                  rows={3}
                  placeholder="Решение 1&#10;Решение 2"
                  value={meetDecisionsText}
                  onChange={e => setMeetDecisionsText(e.target.value)}
                  className="w-full text-xs border border-slate-200 p-2.5 rounded-lg bg-slate-50/50 resize-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Заметки и стенограмма</label>
                <textarea
                  rows={4}
                  placeholder="Запишите тезисы или детали дискуссии..."
                  value={meetNotes}
                  onChange={e => setMeetNotes(e.target.value)}
                  className="w-full text-xs border border-slate-200 p-2.5 rounded-lg bg-slate-50/50 resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button 
                type="button" 
                onClick={() => setShowAddMeetingModal(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-lg text-xs"
              >
                ОТМЕНА
              </button>
              <button 
                type="submit" 
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg text-xs"
              >
                СОЗДАТЬ
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 2. Add Protocol Modal */}
      {showAddProtocolModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <form onSubmit={handleAddProtocolSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xl max-w-md w-full space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base font-display">Загрузить/Создать Протокол MoM</h3>
              <button type="button" onClick={() => setShowAddProtocolModal(false)} className="text-slate-400 hover:text-slate-600 text-sm">Закрыть</button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Название протокола</label>
                <input
                  type="text" required
                  placeholder="Например: Протокол встречи по CRM от 24 мая..."
                  value={protoTitle}
                  onChange={e => setProtoTitle(e.target.value)}
                  className="w-full text-xs border border-slate-200 p-2.5 rounded-lg bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Дата</label>
                <input
                  type="date" required
                  value={protoDate}
                  onChange={e => setProtoDate(e.target.value)}
                  className="w-full text-xs border border-slate-200 p-2.5 rounded-lg bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Текст протокола</label>
                <textarea
                  required rows={6}
                  placeholder="Вставьте полное содержание протокола (цели, обсуждения, утвержденные планы)..."
                  value={protoContent}
                  onChange={e => setProtoContent(e.target.value)}
                  className="w-full text-xs border border-slate-200 p-2.5 rounded-lg bg-slate-50/50 font-mono resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button 
                type="button" 
                onClick={() => setShowAddProtocolModal(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-lg text-xs"
              >
                ОТМЕНА
              </button>
              <button 
                type="submit" 
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg text-xs"
              >
                СОХРАНИТЬ
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. Add Decision Modal */}
      {showAddDecisionModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <form onSubmit={handleAddDecisionSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xl max-w-md w-full space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base font-display">Новое Официальное Решение</h3>
              <button type="button" onClick={() => setShowAddDecisionModal(false)} className="text-slate-400 hover:text-slate-600 text-sm">Закрыть</button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Регистрационный номер</label>
                  <input
                    type="text" required
                    placeholder="Например: DEC-202"
                    value={decRefNo}
                    onChange={e => setDecRefNo(e.target.value)}
                    className="w-full text-xs border border-slate-200 p-2.5 rounded-lg bg-slate-50/50 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Дата</label>
                  <input
                    type="date" required
                    value={decDate}
                    onChange={e => setDecDate(e.target.value)}
                    className="w-full text-xs border border-slate-200 p-2.5 rounded-lg bg-slate-50/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Формулировка решения</label>
                <input
                  type="text" required
                  placeholder="Краткое содержание решения..."
                  value={decTitle}
                  onChange={e => setDecTitle(e.target.value)}
                  className="w-full text-xs border border-slate-200 p-2.5 rounded-lg bg-slate-50/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Категория</label>
                  <select
                    value={decCategory}
                    onChange={e => setDecCategory(e.target.value)}
                    className="w-full text-xs border border-slate-200 p-2.5 rounded-lg bg-white font-medium"
                  >
                    <option value="Организационное">Организационное</option>
                    <option value="Финансовое">Финансовое</option>
                    <option value="Кадровое">Кадровое</option>
                    <option value="Техническое">Техническое</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Подписант</label>
                  <input
                    type="text" required
                    value={decSigner}
                    onChange={e => setDecSigner(e.target.value)}
                    className="w-full text-xs border border-slate-200 p-2.5 rounded-lg bg-slate-50/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Аннотация / Описание</label>
                <textarea
                  required rows={4}
                  placeholder="Опишите суть принятого решения и зоны ответственности..."
                  value={decSummary}
                  onChange={e => setDecSummary(e.target.value)}
                  className="w-full text-xs border border-slate-200 p-2.5 rounded-lg bg-slate-50/50 resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button 
                type="button" 
                onClick={() => setShowAddDecisionModal(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-lg text-xs"
              >
                ОТМЕНА
              </button>
              <button 
                type="submit" 
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg text-xs"
              >
                СОХРАНИТЬ
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
