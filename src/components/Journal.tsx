import React, { useState } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { Complaint, ExecutiveRisk } from '../types';
import { 
  Plus, 
  Search, 
  AlertOctagon, 
  AlertTriangle, 
  ArrowRight, 
  X, 
  CheckCircle2, 
  ShieldAlert, 
  MessageSquare,
  UserCheck
} from 'lucide-react';
import { useTasks, useComplaints, useRisks } from '../lib/hooks';

export default function Journal() {
  const { getLabel } = useWorkspace();
  const { addTask } = useTasks();
  const { complaints, addComplaint, updateComplaintStatus, updateComplaintResponse, loading: loadingComplaints } = useComplaints();
  const { risks, addRisk, mitigationRisk, loading: loadingRisks } = useRisks();

  // Tab State
  const [activeTab, setActiveTab] = useState<'complaints' | 'appeals' | 'risks' | 'feedback'>('complaints');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals Visibility
  const [showAddComplaintModal, setShowAddComplaintModal] = useState(false);
  const [showAddAppealModal, setShowAddAppealModal] = useState(false);
  const [showAddRiskModal, setShowAddRiskModal] = useState(false);
  const [showAddFeedbackModal, setShowAddFeedbackModal] = useState(false);

  // Form States - Complaint
  const [compTitle, setCompTitle] = useState('');
  const [compDesc, setCompDesc] = useState('');
  const [compCategory, setCompCategory] = useState('Задержка ответа');
  const [compDept, setCompDept] = useState('Юридический');
  const [compReporter, setCompReporter] = useState('Сотрудник');
  const [compDeadline, setCompDeadline] = useState('');

  // Form States - Appeal
  const [appTitle, setAppTitle] = useState('');
  const [appDesc, setAppDesc] = useState('');
  const [appCategory, setAppCategory] = useState('Обращение граждан');
  const [appReporter, setAppReporter] = useState('Гражданин');
  const [appDeadline, setAppDeadline] = useState('');

  // Form States - Risk
  const [riskTitle, setRiskTitle] = useState('');
  const [riskCategory, setRiskCategory] = useState<'Финансовый' | 'Информационный' | 'Кадровый' | 'Логистика' | 'Политический'>('Финансовый');
  const [riskLevel, setRiskLevel] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [riskMitigation, setRiskMitigation] = useState('');
  const [riskReporter, setRiskReporter] = useState('Аналитик рисков');

  // Form States - Feedback
  const [feedTitle, setFeedTitle] = useState('');
  const [feedDesc, setFeedDesc] = useState('');
  const [feedDept, setFeedDept] = useState('HR');

  // Filter lists
  const internalComplaints = complaints.filter(c => 
    c.category !== 'Обращение граждан' && c.category !== 'Обратная связь' &&
    (c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
     c.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const citizenAppeals = complaints.filter(c => 
    c.category === 'Обращение граждан' &&
    (c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
     c.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const feedbackSubmissions = complaints.filter(c => 
    c.category === 'Обратная связь' &&
    (c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
     c.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredRisks = risks.filter(r => 
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    r.mitidgationPlan.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Submit Handlers
  const handleAddComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!compTitle.trim() || !compDesc.trim()) return;
    await addComplaint({
      title: compTitle,
      description: compDesc,
      category: compCategory,
      status: 'pending',
      department: compDept,
      reporter: compReporter,
      deadline: compDeadline
    });
    setCompTitle('');
    setCompDesc('');
    setShowAddComplaintModal(false);
    alert('Жалоба успешно зарегистрирована!');
  };

  const handleAddAppeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appTitle.trim() || !appDesc.trim()) return;
    await addComplaint({
      title: appTitle,
      description: appDesc,
      category: 'Обращение граждан',
      status: 'pending',
      department: 'Канцелярия',
      reporter: appReporter,
      deadline: appDeadline
    });
    setAppTitle('');
    setAppDesc('');
    setShowAddAppealModal(false);
    alert('Обращение гражданина успешно зарегистрировано!');
  };

  const handleAddRisk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!riskTitle.trim() || !riskMitigation.trim()) return;
    await addRisk({
      title: riskTitle,
      category: riskCategory,
      level: riskLevel,
      mitidgationPlan: riskMitigation,
      reporter: riskReporter,
      status: 'active'
    });
    setRiskTitle('');
    setRiskMitigation('');
    setShowAddRiskModal(false);
    alert('Операционный риск успешно добавлен в реестр!');
  };

  const handleAddFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedTitle.trim() || !feedDesc.trim()) return;
    await addComplaint({
      title: feedTitle,
      description: feedDesc,
      category: 'Обратная связь',
      status: 'pending',
      department: feedDept,
      reporter: 'Сотрудник (Анонимно)',
      deadline: ''
    });
    setFeedTitle('');
    setFeedDesc('');
    setShowAddFeedbackModal(false);
    alert('Предложение успешно отправлено в HR-отдел!');
  };

  const handleCreateTaskFromRisk = async (risk: ExecutiveRisk) => {
    await addTask({
      title: `[Нивелирование риска] ${risk.title}`.slice(0, 100),
      description: `План минимизации: ${risk.mitidgationPlan}`,
      status: 'pending',
      priority: risk.level === 'critical' ? 'urgent' : risk.level === 'high' ? 'high' : 'medium',
      assignee: risk.reporter,
      department: 'Аналитический сектор',
      deadline: '',
      source: 'Реестр Рисков'
    });
    alert('Задача по нивелированию риска успешно поставлена!');
  };

  const handleCreateTaskFromComplaint = async (c: Complaint) => {
    await addTask({
      title: `[Устранение проблемы] ${c.title}`.slice(0, 100),
      description: `Детали инцидента: ${c.description}`,
      status: 'pending',
      priority: 'high',
      assignee: 'Начальник отдела контроля',
      department: c.department,
      deadline: c.deadline,
      source: `Инцидент: ${c.category}`
    });
    alert('Задача по расследованию инцидента успешно поставлена!');
  };

  return (
    <div className="ew-page p-6 lg:p-8 max-w-7xl mx-auto h-full flex flex-col font-sans">
      
      {/* Page Header */}
      <header className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 shrink-0 border-b pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 font-display">
            {getLabel('issues')}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Контроль операционных рисков, журнал жалоб сотрудников, обращений граждан и сбор предложений
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Поиск по ключевым словам..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 w-full md:w-64 bg-slate-50/50"
            />
          </div>

          {activeTab === 'complaints' && (
            <button onClick={() => setShowAddComplaintModal(true)} className="ew-btn ew-btn-primary whitespace-nowrap cursor-pointer">
              <Plus size={14} /> Новая жалоба
            </button>
          )}
          {activeTab === 'appeals' && (
            <button onClick={() => setShowAddAppealModal(true)} className="ew-btn ew-btn-primary whitespace-nowrap cursor-pointer">
              <Plus size={14} /> Новое обращение
            </button>
          )}
          {activeTab === 'risks' && (
            <button onClick={() => setShowAddRiskModal(true)} className="ew-btn ew-btn-primary whitespace-nowrap cursor-pointer">
              <Plus size={14} /> Зарегистрировать риск
            </button>
          )}
          {activeTab === 'feedback' && (
            <button onClick={() => setShowAddFeedbackModal(true)} className="ew-btn ew-btn-primary whitespace-nowrap cursor-pointer">
              <Plus size={14} /> Подать предложение
            </button>
          )}
        </div>
      </header>

      {/* Sub-tab navigation */}
      <div className="flex gap-6 mb-6 border-b border-slate-200 shrink-0 overflow-x-auto">
        {[
          { id: 'complaints', label: 'Жалобы сотрудников' },
          { id: 'appeals', label: 'Обращения граждан' },
          { id: 'risks', label: 'Реестр Рисков' },
          { id: 'feedback', label: 'Обратная связь' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-3 px-1 text-sm font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === tab.id 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content panel */}
      <div className="flex-1 overflow-y-auto min-h-0 pb-10 space-y-4">
        
        {/* ═══ 1. COMPLAINTS TAB ═══ */}
        {activeTab === 'complaints' && (
          loadingComplaints ? (
            <div className="text-center p-8 text-slate-400">Загрузка...</div>
          ) : internalComplaints.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 border border-dashed rounded-xl text-slate-400">Журнал жалоб пуст.</div>
          ) : (
            internalComplaints.map(c => (
              <div key={c.id} className="ew-card p-5 group flex items-start gap-4 hover:shadow-md transition-shadow animate-fadeIn">
                <div className="p-3 bg-amber-50 rounded-xl text-amber-600 shrink-0">
                  <AlertOctagon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-slate-900 text-sm">{c.title}</h3>
                    <select
                      value={c.status}
                      onChange={(e) => updateComplaintStatus(c.id, e.target.value as any)}
                      className={`text-[9px] font-bold p-1 rounded border uppercase ${
                        c.status === 'resolved' ? 'bg-emerald-50 text-emerald-800' :
                        c.status === 'in_progress' ? 'bg-blue-50 text-blue-800' : 'bg-rose-50 text-rose-800'
                      }`}
                    >
                      <option value="pending">Ожидает</option>
                      <option value="in_progress">В обработке</option>
                      <option value="resolved">Решено</option>
                    </select>
                  </div>

                  <p className="text-slate-500 text-xs mt-1 leading-relaxed">{c.description}</p>
                  
                  <div className="flex flex-wrap gap-4 mt-3 text-[10px] text-slate-400 font-mono font-medium">
                    <span>Департамент: <b>{c.department}</b></span>
                    <span>Отправитель: <b>{c.reporter}</b></span>
                    {c.deadline && <span>Срок: <b>{c.deadline}</b></span>}
                  </div>
                </div>

                <div className="shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleCreateTaskFromComplaint(c)}
                    className="p-2 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 rounded-lg text-slate-400 flex items-center gap-1 text-[10px] font-bold uppercase transition-colors"
                  >
                    Запустить расследование <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            ))
          )
        )}

        {/* ═══ 2. APPEALS TAB ═══ */}
        {activeTab === 'appeals' && (
          loadingComplaints ? (
            <div className="text-center p-8 text-slate-400">Загрузка...</div>
          ) : citizenAppeals.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 border border-dashed rounded-xl text-slate-400">Обращений граждан не зарегистрировано.</div>
          ) : (
            citizenAppeals.map(c => (
              <div key={c.id} className="ew-card p-5 group flex items-start gap-4 hover:shadow-md transition-shadow animate-fadeIn">
                <div className="p-3 bg-blue-50 rounded-xl text-blue-600 shrink-0">
                  <UserCheck size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-slate-900 text-sm">{c.title}</h3>
                    <select
                      value={c.status}
                      onChange={(e) => updateComplaintStatus(c.id, e.target.value as any)}
                      className={`text-[9px] font-bold p-1 rounded border uppercase ${
                        c.status === 'resolved' ? 'bg-emerald-50 text-emerald-800' :
                        c.status === 'in_progress' ? 'bg-blue-50 text-blue-800' : 'bg-rose-50 text-rose-800'
                      }`}
                    >
                      <option value="pending">Новое</option>
                      <option value="in_progress">Рассматривается</option>
                      <option value="resolved">Дан ответ</option>
                    </select>
                  </div>

                  <p className="text-slate-500 text-xs mt-1 leading-relaxed">{c.description}</p>
                  
                  <div className="flex flex-wrap gap-4 mt-3 text-[10px] text-slate-400 font-mono font-medium">
                    <span>Заявитель: <b>{c.reporter}</b></span>
                    {c.deadline && <span>Срок ответа: <b>{c.deadline}</b></span>}
                  </div>
                </div>

                <div className="shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleCreateTaskFromComplaint(c)}
                    className="p-2 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 rounded-lg text-slate-400 flex items-center gap-1 text-[10px] font-bold uppercase transition-colors"
                  >
                    Поставить в СЭД <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            ))
          )
        )}

        {/* ═══ 3. RISKS TAB ═══ */}
        {activeTab === 'risks' && (
          loadingRisks ? (
            <div className="text-center p-8 text-slate-400">Загрузка...</div>
          ) : filteredRisks.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 border border-dashed rounded-xl text-slate-400">Реестр рисков пуст.</div>
          ) : (
            filteredRisks.map(r => (
              <div key={r.id} className="ew-card p-5 group flex items-start gap-4 hover:shadow-md transition-shadow animate-fadeIn">
                <div className={`p-3 rounded-xl shrink-0 ${
                  r.status === 'mitigated' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                }`}>
                  {r.status === 'mitigated' ? <CheckCircle2 size={20} /> : <ShieldAlert size={20} />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-sm">{r.title}</h3>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                        r.level === 'critical' ? 'bg-rose-100 text-rose-800' :
                        r.level === 'high' ? 'bg-amber-100 text-amber-800' : 'bg-blue-50 text-blue-800'
                      }`}>{r.level}</span>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                      r.status === 'mitigated' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-850 border-rose-250 animate-pulse'
                    }`}>
                      {r.status === 'mitigated' ? 'Нивелирован' : 'Угроза'}
                    </span>
                  </div>

                  <p className="text-slate-500 text-xs mt-1.5 leading-relaxed">
                    <b>План нивелирования:</b> {r.mitidgationPlan}
                  </p>
                  
                  <div className="flex flex-wrap gap-4 mt-3 text-[10px] text-slate-400 font-mono font-medium">
                    <span>Категория: <b>{r.category}</b></span>
                    <span>Аналитик: <b>{r.reporter}</b></span>
                  </div>
                </div>

                <div className="shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1.5">
                  {r.status === 'active' && (
                    <>
                      <button 
                        onClick={() => mitigationRisk(r.id)}
                        className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[9px] font-bold uppercase w-full text-center"
                      >
                        Решить риск
                      </button>
                      <button 
                        onClick={() => handleCreateTaskFromRisk(r)}
                        className="p-1.5 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 rounded-lg text-slate-400 text-[9px] font-bold uppercase w-full text-center"
                      >
                        Создать задачу
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )
        )}

        {/* ═══ 4. FEEDBACK TAB ═══ */}
        {activeTab === 'feedback' && (
          loadingComplaints ? (
            <div className="text-center p-8 text-slate-400">Загрузка...</div>
          ) : feedbackSubmissions.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 border border-dashed rounded-xl text-slate-400">Предложений от сотрудников не зафиксировано.</div>
          ) : (
            feedbackSubmissions.map(f => (
              <div key={f.id} className="ew-card p-5 group flex items-start gap-4 hover:shadow-md transition-shadow animate-fadeIn">
                <div className="p-3 bg-blue-50 rounded-xl text-blue-600 shrink-0">
                  <MessageSquare size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-slate-900 text-sm">{f.title}</h3>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-bold uppercase">Предложение</span>
                  </div>

                  <p className="text-slate-500 text-xs mt-1 leading-relaxed">{f.description}</p>
                  
                  <div className="flex flex-wrap gap-4 mt-3 text-[10px] text-slate-400 font-mono font-medium">
                    <span>Направлено в: <b>{f.department}</b></span>
                    <span>Репортер: <b>{f.reporter}</b></span>
                  </div>
                </div>
              </div>
            ))
          )
        )}

      </div>

      {/* ═══ MODALS ═══ */}
      {/* 1. Add Complaint Modal */}
      {showAddComplaintModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <form onSubmit={handleAddComplaint} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xl max-w-md w-full space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base font-display">Зарегистрировать внутреннюю жалобу</h3>
              <button type="button" onClick={() => setShowAddComplaintModal(false)} className="text-slate-400 hover:text-slate-600 text-sm">Закрыть</button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Краткая формулировка проблемы</label>
                <input
                  type="text" required
                  placeholder="Пример: Задержка согласования юридического договора..."
                  value={compTitle}
                  onChange={e => setCompTitle(e.target.value)}
                  className="w-full text-xs border border-slate-200 p-2.5 rounded-lg bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Детальное описание / Инцидент</label>
                <textarea
                  required rows={4}
                  placeholder="Опишите все подробности, укажите конкретные отделы и сроки задержки..."
                  value={compDesc}
                  onChange={e => setCompDesc(e.target.value)}
                  className="w-full text-xs border border-slate-200 p-2.5 rounded-lg bg-slate-50/50 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Категория</label>
                  <select
                    value={compCategory}
                    onChange={e => setCompCategory(e.target.value)}
                    className="w-full text-xs border border-slate-200 p-2.5 rounded-lg bg-white"
                  >
                    <option value="Задержка ответа">Задержка ответа</option>
                    <option value="Инфраструктурная">Инфраструктурный срыв</option>
                    <option value="Кадровый конфликт">Кадровый конфликт</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Отдел-ответчик</label>
                  <select
                    value={compDept}
                    onChange={e => setCompDept(e.target.value)}
                    className="w-full text-xs border border-slate-200 p-2.5 rounded-lg bg-white"
                  >
                    <option value="Юридический">Юридический</option>
                    <option value="Финансы">Финансы</option>
                    <option value="Геология">Геология</option>
                    <option value="Логистика">Логистика</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button type="button" onClick={() => setShowAddComplaintModal(false)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-lg text-xs">ОТМЕНА</button>
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg text-xs">РЕГИСТРАЦИЯ</button>
            </div>
          </form>
        </div>
      )}

      {/* 2. Add Appeal Modal */}
      {showAddAppealModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <form onSubmit={handleAddAppeal} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xl max-w-md w-full space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base font-display">Новое обращение гражданина</h3>
              <button type="button" onClick={() => setShowAddAppealModal(false)} className="text-slate-400 hover:text-slate-600 text-sm">Закрыть</button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Тема обращения</label>
                <input
                  type="text" required
                  placeholder="Обращение по лицензированию участка..."
                  value={appTitle}
                  onChange={e => setAppTitle(e.target.value)}
                  className="w-full text-xs border border-slate-200 p-2.5 rounded-lg bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Суть обращения / Заявление</label>
                <textarea
                  required rows={4}
                  placeholder="Полный текст заявления гражданина..."
                  value={appDesc}
                  onChange={e => setAppDesc(e.target.value)}
                  className="w-full text-xs border border-slate-200 p-2.5 rounded-lg bg-slate-50/50 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">ФИО гражданина</label>
                  <input
                    type="text" required
                    placeholder="Усманов С."
                    value={appReporter}
                    onChange={e => setAppReporter(e.target.value)}
                    className="w-full text-xs border border-slate-200 p-2.5 rounded-lg bg-slate-50/50"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Дедлайн рассмотрения</label>
                  <input
                    type="date"
                    value={appDeadline}
                    onChange={e => setAppDeadline(e.target.value)}
                    className="w-full text-xs border border-slate-200 p-2.5 rounded-lg bg-slate-50/50"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button type="button" onClick={() => setShowAddAppealModal(false)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-lg text-xs">ОТМЕНА</button>
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg text-xs">ДОБАВИТЬ В СЭД</button>
            </div>
          </form>
        </div>
      )}

      {/* 3. Add Risk Modal */}
      {showAddRiskModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <form onSubmit={handleAddRisk} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xl max-w-md w-full space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base font-display">Зарегистрировать риск</h3>
              <button type="button" onClick={() => setShowAddRiskModal(false)} className="text-slate-400 hover:text-slate-600 text-sm">Закрыть</button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Описание потенциальной угрозы</label>
                <input
                  type="text" required
                  placeholder="Срыв сроков поставки труб поставщиком..."
                  value={riskTitle}
                  onChange={e => setRiskTitle(e.target.value)}
                  className="w-full text-xs border border-slate-200 p-2.5 rounded-lg bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">План нивелирования (устранения угрозы)</label>
                <textarea
                  required rows={3}
                  placeholder="Найти резервного поставщика, перенаправить материалы..."
                  value={riskMitigation}
                  onChange={e => setRiskMitigation(e.target.value)}
                  className="w-full text-xs border border-slate-200 p-2.5 rounded-lg bg-slate-50/50 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Категория риска</label>
                  <select
                    value={riskCategory}
                    onChange={e => setRiskCategory(e.target.value as any)}
                    className="w-full text-xs border border-slate-200 p-2.5 rounded-lg bg-white"
                  >
                    <option value="Финансовый">Финансовый</option>
                    <option value="Информационный">Информационный</option>
                    <option value="Кадровый">Кадровый</option>
                    <option value="Логистика">Логистика</option>
                    <option value="Политический">Политический</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Уровень критичности</label>
                  <select
                    value={riskLevel}
                    onChange={e => setRiskLevel(e.target.value as any)}
                    className="w-full text-xs border border-slate-200 p-2.5 rounded-lg bg-white font-bold"
                  >
                    <option value="low">Низкий</option>
                    <option value="medium">Средний</option>
                    <option value="high">Высокий</option>
                    <option value="critical">Критический</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button type="button" onClick={() => setShowAddRiskModal(false)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-lg text-xs">ОТМЕНА</button>
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg text-xs">СОХРАНИТЬ</button>
            </div>
          </form>
        </div>
      )}

      {/* 4. Add Feedback Modal */}
      {showAddFeedbackModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <form onSubmit={handleAddFeedback} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xl max-w-md w-full space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base font-display">Подать предложение по улучшению</h3>
              <button type="button" onClick={() => setShowAddFeedbackModal(false)} className="text-slate-400 hover:text-slate-600 text-sm">Закрыть</button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Тема предложения</label>
                <input
                  type="text" required
                  placeholder="Внедрить гибкие часы работы или организовать столовую..."
                  value={feedTitle}
                  onChange={e => setFeedTitle(e.target.value)}
                  className="w-full text-xs border border-slate-200 p-2.5 rounded-lg bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Детали предложения</label>
                <textarea
                  required rows={4}
                  placeholder="Опишите ваши идеи, выгоду для коллектива и шаги по реализации..."
                  value={feedDesc}
                  onChange={e => setFeedDesc(e.target.value)}
                  className="w-full text-xs border border-slate-200 p-2.5 rounded-lg bg-slate-50/50 resize-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Целевой отдел для проработки</label>
                <select
                  value={feedDept}
                  onChange={e => setFeedDept(e.target.value)}
                  className="w-full text-xs border border-slate-200 p-2.5 rounded-lg bg-white"
                >
                  <option value="HR">HR / Офис</option>
                  <option value="Канцелярия">Канцелярия / Процессы</option>
                  <option value="IT">IT / Технологии</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button type="button" onClick={() => setShowAddFeedbackModal(false)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-lg text-xs">ОТМЕНА</button>
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg text-xs">ОТПРАВИТЬ</button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
