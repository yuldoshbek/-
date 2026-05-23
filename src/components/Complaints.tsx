import React, { useState } from 'react';
import { useComplaints, useDepartments } from '../lib/hooks';
import { ShieldAlert, CheckCircle2, AlertTriangle, Send, RefreshCw, FileText, Search, Plus, Trash } from 'lucide-react';

export default function Complaints() {
  const { complaints, addComplaint, updateComplaintStatus, updateComplaintResponse } = useComplaints();
  const { departments } = useDepartments();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [activeComplaintId, setActiveComplaintId] = useState<string | null>(null);
  const [generatingResponse, setGeneratingResponse] = useState(false);
  
  // New complaint form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState('Логистика');
  const [newReporter, setNewReporter] = useState('');
  const [newDept, setNewDept] = useState('Департамент логистики и закупок');
  const [newDeadline, setNewDeadline] = useState('2026-05-30');

  const categories = ['All', 'Логистика и Таможня', 'Нарушение регламента', 'Инфраструктура', 'Кадры'];

  const filtered = complaints.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.reporter.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || c.category === selectedCategory;
    const matchesStatus = selectedStatus === 'All' || c.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDesc) return;
    addComplaint({
      title: newTitle,
      description: newDesc,
      category: newCategory,
      status: 'pending',
      department: newDept,
      reporter: newReporter || 'Анонимное обращение',
      deadline: newDeadline
    });
    setNewTitle('');
    setNewDesc('');
    setNewReporter('');
    setShowAddForm(false);
  };

  const generateAIResponse = async (id: string) => {
    const comp = complaints.find(c => c.id === id);
    if (!comp) return;
    setGeneratingResponse(true);
    try {
      const res = await fetch('/api/translate-letter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          instruction: `Подготовь официальный ответ на жалобу от ${comp.reporter}. Тема жалобы: "${comp.title}". Содержание: "${comp.description}". Ответ должен быть вежливым, подтверждающим рассмотрение ситуации, и содержать указание Департамента: ${comp.department} на исправление ситуации. Категория обращения: ${comp.category}.`,
          style: 'official'
        })
      });
      const data = await res.json();
      if (data.bodyUzbek) {
        updateComplaintResponse(id, data.bodyUzbek);
      } else {
        // Fallback response translation
        const fallback = `O\'zbekiston Respublikasining Amaldagi qonunchiligiga binoan, kompaniyamiz "${comp.department}" rahbariyati Sizning "${comp.title}" bo\'yicha murojaatingizni ko\'rib chiqdi. Ma\'lum qilamizki, ko\'rsatilgan muammolarni bartaraf etish yuzasidan tezkor choralar ko\'rildi. Hurmat bilan, TMK Administratsiyasi.`;
        updateComplaintResponse(id, fallback);
      }
    } catch {
      const fallback = `O\'zbekiston Respublikasining Amaldagi qonunchiligiga binoan, kompaniyamiz "${comp.department}" rahbariyati Sizning "${comp.title}" bo\'yicha murojaatingizni ko\'rib chiqdi. Ma\'lum qilamizki, ko\'rsatilgan muammolarni bartaraf etish yuzasidan tezkor choralar ko\'rildi. Hurmat bilan, TMK Administratsiyasi.`;
      updateComplaintResponse(id, fallback);
    } finally {
      setGeneratingResponse(false);
    }
  };

  const activeComplaint = complaints.find(c => c.id === activeComplaintId);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 font-sans">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight text-slate-900 dark:text-white">Контроль обращений и жалоб</h1>
          <p className="text-slate-500 mt-1">Официальные обращения граждан, подрядчиков и ведомств в Сектор исполнительского контроля Республики.</p>
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2.5 rounded-lg transition-colors cursor-pointer shadow-sm text-sm"
        >
          <Plus size={16} />
          <span>Зарегистрировать обращение</span>
        </button>
      </header>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Всего обращений</span>
            <h3 className="text-3xl font-bold text-slate-800 mt-1">{complaints.length}</h3>
          </div>
          <div className="bg-blue-50 text-blue-600 p-3 rounded-xl border border-blue-100">
            <FileText size={20} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-amber-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-amber-500 uppercase tracking-widest">В обработке (Реакция)</span>
            <h3 className="text-3xl font-bold text-amber-700 mt-1">
              {complaints.filter(c => c.status === 'in_progress').length}
            </h3>
          </div>
          <div className="bg-amber-50 text-amber-600 p-3 rounded-xl border border-amber-100">
            <RefreshCw size={20} className="animate-spin-slow" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-rose-200/80 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-rose-500 uppercase tracking-widest">Ожидают решения</span>
            <h3 className="text-3xl font-bold text-rose-700 mt-1">
              {complaints.filter(c => c.status === 'pending').length}
            </h3>
          </div>
          <div className="bg-rose-50 text-rose-600 p-3 rounded-xl border border-rose-100">
            <ShieldAlert size={20} />
          </div>
        </div>
      </div>

      {/* Register Complaint Modal Inline Form */}
      {showAddForm && (
        <form onSubmit={handleAdd} className="bg-white p-6 rounded-xl border border-slate-200 shadow-md space-y-4 max-w-2xl">
          <div className="flex justify-between items-center border-b pb-3">
            <h3 className="font-bold text-base text-slate-900">Регистрация входящего обращения</h3>
            <button type="button" onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-slate-600 text-sm">Отмена</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Заявитель / Инициатор</label>
              <input 
                type="text" 
                required
                placeholder="ООО, Ведомство или ФИО"
                value={newReporter}
                onChange={e => setNewReporter(e.target.value)}
                className="w-full text-sm border p-2 rounded bg-slate-50/50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Категория</label>
              <select 
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
                className="w-full text-sm border p-2 rounded bg-slate-50/50"
              >
                <option value="Логистика и Таможня">Логистика и Таможня</option>
                <option value="Нарушение регламента">Нарушение регламента</option>
                <option value="Инфраструктура">Инфраструктура</option>
                <option value="Кадры">Кадры</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Предмет жалобы (Краткий заголовок)</label>
              <input 
                type="text" 
                required
                placeholder="Что произошло"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                className="w-full text-sm border p-2 rounded bg-slate-50/50"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Подробное описание инцидента</label>
              <textarea 
                required
                rows={3}
                placeholder="Полный текст со всеми деталями"
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                className="w-full text-sm border p-2 rounded bg-slate-50/50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Ответственное подразделение</label>
              <select 
                value={newDept}
                onChange={e => setNewDept(e.target.value)}
                className="w-full text-sm border p-2 rounded bg-slate-50/50"
              >
                {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Крайний срок ответа по регламенту</label>
              <input 
                type="date" 
                value={newDeadline}
                onChange={e => setNewDeadline(e.target.value)}
                className="w-full text-sm border p-2 rounded bg-slate-50/50"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="submit" className="bg-slate-900 text-white px-4 py-2 rounded text-xs font-bold hover:bg-slate-800 cursor-pointer">Внести в СЭД</button>
          </div>
        </form>
      )}

      {/* Grid Layout: Complaints List and Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sidebar Filter and list */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Поиск по обращениям..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full text-sm border border-slate-200 bg-slate-50/50 pl-9 pr-4 py-1.5 rounded-lg focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <select 
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="text-xs border border-slate-200 p-2 rounded-lg bg-white font-medium"
              >
                {categories.map(cat => <option key={cat} value={cat}>{cat === 'All' ? 'Все категории' : cat}</option>)}
              </select>
              <select 
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className="text-xs border border-slate-200 p-2 rounded-lg bg-white font-medium"
              >
                <option value="All">Все статусы</option>
                <option value="pending">Ожидают</option>
                <option value="in_progress">Реагиров.</option>
                <option value="resolved">Решено</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <div className="p-12 text-center text-slate-400">Обращений по заданным критериям не найдено.</div>
            ) : (
              filtered.map(comp => (
                <div 
                  key={comp.id}
                  onClick={() => setActiveComplaintId(comp.id)}
                  className={`p-5 transition-all cursor-pointer flex justify-between items-start gap-4 ${activeComplaintId === comp.id ? 'bg-slate-50 border-l-4 border-blue-600' : 'hover:bg-slate-50/50'}`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-100 px-2 py-0.5 rounded">{comp.category}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${comp.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' : comp.status === 'in_progress' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'}`}>
                        {comp.status === 'resolved' ? 'Решено' : comp.status === 'in_progress' ? 'В обработке' : 'Ожидает'}
                      </span>
                    </div>
                    <h4 className="font-semibold text-slate-900 group-hover:text-blue-600 text-sm leading-snug">{comp.title}</h4>
                    <p className="text-xs text-slate-500 line-clamp-1">Заявитель: <span className="font-medium text-slate-700">{comp.reporter}</span></p>
                    <p className="text-xs text-rose-500 font-medium">Срок ответа: {comp.deadline}</p>
                  </div>
                  <ChevronRightIcon />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Selected Complaint Details Panel */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 space-y-6 min-h-[400px]">
          {activeComplaint ? (
            <div className="space-y-6">
              <div className="flex justify-between items-start border-b pb-4">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase">{activeComplaint.category}</span>
                  <h3 className="text-base font-bold text-slate-900 mt-1">{activeComplaint.title}</h3>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => updateComplaintStatus(activeComplaint.id, 'resolved')}
                    className="p-1 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded hover:bg-emerald-100"
                    title="Пометить как Решено"
                  >
                    <CheckCircle2 size={16} />
                  </button>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Описание обращения</h4>
                <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-700 leading-relaxed border border-slate-100">
                  {activeComplaint.description}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block font-semibold">ЗАЯВИТЕЛЬ</span>
                  <span className="font-bold text-slate-700 mt-0.5 block">{activeComplaint.reporter}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">ОТВЕТСТВЕННЫЙ</span>
                  <span className="font-bold text-slate-700 mt-0.5 block text-xs">{activeComplaint.department}</span>
                </div>
              </div>

              {/* Response Section */}
              <div className="border-t pt-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Шаблон официального ответа (ИИ)</h4>
                  <button 
                    onClick={() => generateAIResponse(activeComplaint.id)}
                    disabled={generatingResponse}
                    className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-bold uppercase transition-colors"
                  >
                    {generatingResponse ? (
                      <>
                        <RefreshCw size={12} className="animate-spin" />
                        <span>Генерация...</span>
                      </>
                    ) : (
                      <>
                        <Send size={12} />
                        <span>Подготовить ответ ИИ</span>
                      </>
                    )}
                  </button>
                </div>

                {activeComplaint.responseTemplate ? (
                  <div className="space-y-3">
                    <div className="bg-blue-50/50 p-4 rounded-lg text-xs font-mono text-slate-800 leading-relaxed border border-blue-100/50 whitespace-pre-line">
                      {activeComplaint.responseTemplate}
                    </div>
                    <div className="flex justify-between items-center bg-slate-100 p-2.5 rounded-lg text-slate-600 text-xs text-[10px]">
                      <span>Ответ готов к копированию или отправке по СЭД.</span>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(activeComplaint.responseTemplate || '');
                          alert('Ответ скопирован в буфер обмена!');
                        }}
                        className="text-blue-600 hover:underline font-bold"
                      >
                        КОПИРОВАТЬ
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 bg-slate-50 rounded-lg border border-dashed border-slate-200 text-center p-4">
                    <AlertTriangle size={24} className="text-slate-400 mb-2" />
                    <span className="text-xs text-slate-500 max-w-xs">Нет подготовленного решения. Нажмите кнопку выше для интеллектуального формирования проекта ответа в узбекском и русском бизнес-стиле.</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-12 text-slate-400 space-y-2">
              <FileText size={32} />
              <p className="text-sm font-medium">Выберите обращение для детального анализа</p>
              <p className="text-xs max-w-xs">Вы сможете увидеть описание, регламентный дедлайн, назначить сектор либо сгенерировать ИИ-протоколы.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ChevronRightIcon() {
  return (
    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}
