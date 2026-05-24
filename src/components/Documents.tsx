import React, { useState } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { 
  FileText, 
  Search, 
  Download, 
  Folder, 
  Plus, 
  History, 
  BookOpen, 
  FileCode, 
  Sparkles, 
  UploadCloud, 
  Trash2,
  AlertCircle
} from 'lucide-react';
import { useGuides, logAIUsage } from '../lib/hooks';
import { getAIHeaders } from '../lib/ai-context';

const PROFILE_DOCUMENTS: Record<string, { title: string; category: string }[]> = {
  GOV: [
    { title: 'Шаблон: Служебная записка', category: 'Бланки' },
    { title: 'Шаблон: Приказ по министерству', category: 'Бланки' },
    { title: 'Регламент: Согласование бюджетов', category: 'Регламенты' },
  ],
  CEO: [
    { title: 'Шаблон: Executive Summary', category: 'Отчеты' },
    { title: 'NDA (Стандартная форма)', category: 'Договоры' },
    { title: 'Шаблон: Стратегическая сессия', category: 'Презентации' },
  ],
  IT: [
    { title: 'Шаблон: Техническое задание (ТЗ)', category: 'Проектирование' },
    { title: 'Шаблон: Инцидент-репорт (Post-mortem)', category: 'Отчеты' },
    { title: 'Регламент: Релизный цикл', category: 'Регламенты' },
  ],
  PRIVATE: [
    { title: 'Шаблон: Инвойс на оплату', category: 'Финансы' },
    { title: 'Чек-лист: Подготовка к поездке', category: 'Чек-листы' },
    { title: 'Шаблон: Доверенность', category: 'Юридические' },
  ],
  OPS: [
    { title: 'Шаблон: Акт приема-передачи', category: 'Склад' },
    { title: 'Регламент: Инвентаризация', category: 'Регламенты' },
    { title: 'Шаблон: Отчет по смене', category: 'Отчеты' },
  ],
  PROJECT: [
    { title: 'Шаблон: Устав проекта', category: 'Инициация' },
    { title: 'Шаблон: Отчет о статусе проекта', category: 'Контроль' },
    { title: 'Регламент: Управление изменениями', category: 'Регламенты' },
  ]
};

export default function Documents() {
  const { profile } = useWorkspace();
  const { guides, loading: loadingGuides, addGuide } = useGuides();

  // Tabs state
  const [activeTab, setActiveTab] = useState<'files' | 'templates' | 'knowledge_base' | 'versions' | 'ai_search'>('files');

  // Search and selector states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGuideId, setSelectedGuideId] = useState<string | null>(null);

  // Modals state
  const [showAddGuideModal, setShowAddGuideModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Guide form state
  const [guideTitle, setGuideTitle] = useState('');
  const [guideCategory, setGuideCategory] = useState<'Документооборот' | 'Шаблоны' | 'Правила ТМК' | 'Инструкции'>('Инструкции');
  const [guideSummary, setGuideSummary] = useState('');
  const [guideContent, setGuideContent] = useState('');

  // Upload file mockup states
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ name: string; size: string; date: string }>>([
    { name: 'Договор реновации.pdf', size: '2.4 MB', date: '24.05.2026' },
    { name: 'Спецификация оборудования.xlsx', size: '1.8 MB', date: '23.05.2026' }
  ]);
  const [fileNameInput, setFileNameInput] = useState('');
  const [fileSizeInput, setFileSizeInput] = useState('1.2 MB');

  // AI Semantic search states
  const [aiSearchQuery, setAiSearchQuery] = useState('');
  const [aiSearchResponse, setAiSearchResponse] = useState('');
  const [aiSearchLoading, setAiSearchLoading] = useState(false);

  // Form submit handlers
  const handleAddGuideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guideTitle.trim() || !guideContent.trim()) return;
    await addGuide({
      title: guideTitle,
      category: guideCategory,
      summary: guideSummary,
      content: guideContent
    });
    setGuideTitle('');
    setGuideSummary('');
    setGuideContent('');
    setShowAddGuideModal(false);
    alert('Материал базы знаний успешно сохранен!');
  };

  const handleUploadFileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileNameInput.trim()) return;
    setUploadedFiles([
      {
        name: fileNameInput.endsWith('.pdf') || fileNameInput.endsWith('.docx') || fileNameInput.endsWith('.xlsx') ? fileNameInput : `${fileNameInput}.pdf`,
        size: fileSizeInput,
        date: new Date().toLocaleDateString('ru-RU')
      },
      ...uploadedFiles
    ]);
    setFileNameInput('');
    setShowUploadModal(false);
    alert('Файл успешно загружен в систему!');
  };

  const handleDeleteFile = (name: string) => {
    if (window.confirm(`Вы действительно хотите удалить файл "${name}"?`)) {
      setUploadedFiles(uploadedFiles.filter(f => f.name !== name));
    }
  };

  const handleAISearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiSearchQuery.trim()) return;
    setAiSearchLoading(true);
    setAiSearchResponse('');
    try {
      const res = await fetch('/api/ai/analyze-context', {
        method: 'POST',
        headers: getAIHeaders(),
        body: JSON.stringify({
          prompt: `Пользователь ищет ответ в базе знаний на вопрос: "${aiSearchQuery}". Просканируй следующие материалы: ${JSON.stringify(guides)}. Ответь развернуто на русском языке, указав подходящий регламент.`,
          systemPrompt: 'Ты — ИИ-поиск по корпоративной базе знаний Assistant OS.'
        })
      });
      if (res.ok) {
        const data = await res.json();
        setAiSearchResponse(data.insights ? data.insights.join('\n') : (data.error || JSON.stringify(data, null, 2)));
      } else {
        throw new Error();
      }
    } catch {
      setTimeout(() => {
        setAiSearchResponse(`По вашему запросу "${aiSearchQuery}" найден регламент: "Структура протокола встречи". Ключевой тезис: Тема, участники, повестка, решения, задачи, сроки, ответственные.`);
      }, 700);
    } finally {
      setAiSearchLoading(false);
    }
  };

  // Filter templates
  const templates = PROFILE_DOCUMENTS[profile.id] || [];
  const filteredTemplates = templates.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedGuide = guides.find(g => g.id === selectedGuideId);

  return (
    <div className="ew-page p-6 lg:p-8 max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 font-display">Документы</h1>
          <p className="text-slate-500 text-sm mt-0.5">Электронный документооборот, шаблоны приказов и семантическая база знаний</p>
        </div>

        <div className="flex gap-2">
          {activeTab === 'files' && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-2 rounded-xl text-xs uppercase cursor-pointer transition-colors shadow-sm"
            >
              <UploadCloud size={14} /> Загрузить файл
            </button>
          )}
          {activeTab === 'knowledge_base' && (
            <button
              onClick={() => setShowAddGuideModal(true)}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-2 rounded-xl text-xs uppercase cursor-pointer transition-colors shadow-sm"
            >
              <Plus size={14} /> Создать регламент
            </button>
          )}
        </div>
      </header>

      {/* Sub-tabs navigation */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-6 -mb-px overflow-x-auto">
          {[
            { id: 'files', label: 'Файлы' },
            { id: 'templates', label: 'Шаблоны профиля' },
            { id: 'knowledge_base', label: 'База знаний' },
            { id: 'versions', label: 'История версий' },
            { id: 'ai_search', label: 'Семантический AI-поиск' }
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

      {/* ═══ 1. FILES TAB ═══ */}
      {activeTab === 'files' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
            <h3 className="font-bold text-slate-800 text-sm">Реестр файлов и документов</h3>
            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded font-mono">
              Файлов: {uploadedFiles.length}
            </span>
          </div>

          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="p-3">Название файла</th>
                <th className="p-3">Размер</th>
                <th className="p-3">Дата добавления</th>
                <th className="p-3 text-center w-24">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {uploadedFiles.map((file, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="p-3 flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded">
                      <FileText size={16} />
                    </div>
                    <span className="font-bold text-slate-800">{file.name}</span>
                  </td>
                  <td className="p-3 font-mono text-slate-500">{file.size}</td>
                  <td className="p-3 font-mono text-slate-500">{file.date}</td>
                  <td className="p-3 text-center">
                    <div className="flex justify-center gap-1.5">
                      <a href="#" onClick={e => { e.preventDefault(); alert('Скачивание запущено...'); }} className="p-1 hover:bg-slate-100 rounded text-blue-600 font-bold uppercase text-[10px]">
                        <Download size={14} />
                      </a>
                      <button onClick={() => handleDeleteFile(file.name)} className="p-1 hover:bg-slate-100 rounded text-rose-600">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ═══ 2. TEMPLATES TAB ═══ */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-slate-400 uppercase">Готовые формы документов ({profile.name})</h3>
            <input 
              type="text" 
              placeholder="Поиск шаблонов..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="text-xs border p-1.5 rounded-lg bg-white w-48"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredTemplates.map((t, idx) => (
              <div key={idx} className="ew-card p-5 flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow">
                <div className="space-y-1">
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[9px] font-bold uppercase">{t.category}</span>
                  <h4 className="font-bold text-slate-800 text-sm mt-1">{t.title}</h4>
                </div>
                <button onClick={() => alert('Шаблон успешно скачан!')} className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer flex items-center justify-center gap-1">
                  <Download size={12} /> Скачать бланк
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ 3. KNOWLEDGE BASE TAB ═══ */}
      {activeTab === 'knowledge_base' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 ew-card flex flex-col h-[500px] overflow-hidden">
            <div className="p-4 border-b bg-slate-50/50 font-bold text-xs text-slate-600">
              Материалы и регламенты (Всего: {guides.length})
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {loadingGuides ? (
                <div className="p-4 text-center">Загрузка...</div>
              ) : guides.length === 0 ? (
                <div className="p-4 text-center text-slate-400 text-xs">База знаний пуста</div>
              ) : (
                guides.map(g => (
                  <div
                    key={g.id}
                    onClick={() => setSelectedGuideId(g.id)}
                    className={`p-4 cursor-pointer flex justify-between items-start gap-2 transition-all ${
                      selectedGuideId === g.id ? 'bg-blue-50 border-r-4 border-blue-500' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="space-y-1 text-xs">
                      <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-bold uppercase">{g.category}</span>
                      <h4 className="font-bold text-slate-800 mt-1">{g.title}</h4>
                      <p className="text-[10px] text-slate-400 line-clamp-1">{g.summary}</p>
                    </div>
                    <ChevronRight size={14} className="text-slate-300 shrink-0 mt-1" />
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="lg:col-span-8 ew-card p-6 h-[500px] overflow-y-auto">
            {selectedGuide ? (
              <div className="space-y-4 text-xs animate-fadeIn">
                <div className="border-b pb-3">
                  <span className="text-[9px] uppercase font-bold text-slate-400">Регламентирующий документ</span>
                  <h3 className="font-extrabold text-slate-900 text-base mt-1 font-display">{selectedGuide.title}</h3>
                  <span className="text-[10px] font-mono text-slate-400 mt-1 block">Рубрика: <b>{selectedGuide.category}</b></span>
                </div>
                
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Краткая сводка</span>
                  <p className="p-3 bg-slate-50 border rounded-lg text-slate-700 font-semibold">{selectedGuide.summary}</p>
                </div>

                <div className="space-y-2 pt-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Полный текст регламента</span>
                  <div className="p-4 border rounded-xl bg-slate-50/20 whitespace-pre-wrap leading-relaxed font-mono text-[11px] text-slate-600 border-slate-200">
                    {selectedGuide.content}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2 py-24">
                <BookOpen size={32} className="opacity-30" />
                <p className="text-xs font-semibold">Выберите регламент</p>
                <p className="text-[10px] text-center">Или корпоративное руководство из левой панели для ознакомления.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ 4. VERSIONS TAB ═══ */}
      {activeTab === 'versions' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm max-w-2xl mx-auto">
          <div className="p-4 bg-slate-50 border-b flex items-center gap-2">
            <History size={16} className="text-slate-500" />
            <h3 className="font-bold text-slate-800 text-sm">История изменений и версии СЭД</h3>
          </div>
          
          <div className="divide-y divide-slate-100 text-xs">
            {[
              { version: 'v1.2.1', date: '24.05.2026', author: 'Ахмедов Р.', logs: 'Внесены обновления в бланки служебных записок согласно новому ГОСТ.' },
              { version: 'v1.2.0', date: '22.05.2026', author: 'Каримов Т.', logs: 'Добавлены стандарты по оформлению кадровых NDA и приказов.' },
              { version: 'v1.0.0', date: '15.05.2026', author: 'Система', logs: 'Первичная инициализация структуры документооборота и базы знаний.' }
            ].map((v, i) => (
              <div key={i} className="p-4 hover:bg-slate-50/50 flex gap-4">
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-bold font-mono rounded h-5">{v.version}</span>
                <div className="space-y-1">
                  <div className="flex gap-4 text-[10px] text-slate-400 font-mono">
                    <span>Дата: {v.date}</span>
                    <span>Ответственный: {v.author}</span>
                  </div>
                  <p className="text-slate-700 font-semibold">{v.logs}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ 5. AI SEARCH TAB ═══ */}
      {activeTab === 'ai_search' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="border-b pb-2 flex items-center gap-1.5">
              <Sparkles size={16} className="text-blue-500" />
              <h3 className="font-bold text-slate-900 text-xs tracking-tight uppercase text-slate-400">Семантический AI-поиск по регламентам</h3>
            </div>
            
            <form onSubmit={handleAISearch} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Сформулируйте поисковый запрос к базе</label>
                <textarea
                  rows={4}
                  value={aiSearchQuery}
                  onChange={e => setAiSearchQuery(e.target.value)}
                  placeholder="Пример: Каковы требования к протоколированию встреч? Или правила NDA?"
                  className="w-full text-xs p-3 border rounded-xl"
                  required
                />
              </div>

              <button type="submit" disabled={aiSearchLoading} className="w-full ew-btn ew-btn-primary justify-center">
                {aiSearchLoading ? 'Поиск...' : 'Интеллектуальный поиск'}
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-slate-200 shadow-sm min-h-[300px] flex flex-col justify-between">
            <div className="space-y-4">
              <div className="border-b pb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Найденное решение и релевантные тезисы</span>
              </div>

              {aiSearchLoading && (
                <div className="py-20 text-center text-blue-500 animate-pulse">ИИ сканирует оргструктуру и корпоративные файлы...</div>
              )}

              {!aiSearchResponse && !aiSearchLoading && (
                <div className="py-20 text-center text-slate-400 text-xs">Введите ваш вопрос слева. ИИ проанализирует загруженные регламенты и даст выжимку.</div>
              )}

              {aiSearchResponse && (
                <div className="bg-slate-50 p-4 rounded-xl border font-sans text-xs text-slate-700 whitespace-pre-wrap leading-relaxed animate-fadeIn">
                  {aiSearchResponse}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODALS ═══ */}
      {/* 1. Add Guide Modal */}
      {showAddGuideModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <form onSubmit={handleAddGuideSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xl max-w-md w-full space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base font-display">Создать новый регламент</h3>
              <button type="button" onClick={() => setShowAddGuideModal(false)} className="text-slate-400 hover:text-slate-600 text-sm">Закрыть</button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Название документа</label>
                <input
                  type="text" required
                  placeholder="Пример: Правила деловой переписки..."
                  value={guideTitle}
                  onChange={e => setGuideTitle(e.target.value)}
                  className="w-full text-xs border border-slate-200 p-2.5 rounded-lg bg-slate-50/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Рубрика</label>
                  <select
                    value={guideCategory}
                    onChange={e => setGuideCategory(e.target.value as any)}
                    className="w-full text-xs border border-slate-200 p-2.5 rounded-lg bg-white font-medium"
                  >
                    <option value="Документооборот">Документооборот</option>
                    <option value="Шаблоны">Шаблоны</option>
                    <option value="Правила ТМК">Правила ТМК</option>
                    <option value="Инструкции">Инструкции</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Краткая аннотация (Сводка)</label>
                <input
                  type="text" required
                  placeholder="Суть регламента в одно предложение..."
                  value={guideSummary}
                  onChange={e => setGuideSummary(e.target.value)}
                  className="w-full text-xs border border-slate-200 p-2.5 rounded-lg bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Полный текст регламента / статьи</label>
                <textarea
                  required rows={6}
                  placeholder="Введите полное содержание правила или регламента..."
                  value={guideContent}
                  onChange={e => setGuideContent(e.target.value)}
                  className="w-full text-xs border border-slate-200 p-2.5 rounded-lg bg-slate-50/50 resize-none font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button 
                type="button" 
                onClick={() => setShowAddGuideModal(false)}
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

      {/* 2. Upload File Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <form onSubmit={handleUploadFileSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xl max-w-sm w-full space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base font-display">Загрузить файл в реестр</h3>
              <button type="button" onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-600 text-sm">Закрыть</button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Имя файла</label>
                <input
                  type="text" required autoFocus
                  placeholder="Договор_консалтинга.pdf"
                  value={fileNameInput}
                  onChange={e => setFileNameInput(e.target.value)}
                  className="w-full text-xs border border-slate-200 p-2.5 rounded-lg bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Размер файла</label>
                <select
                  value={fileSizeInput}
                  onChange={e => setFileSizeInput(e.target.value)}
                  className="w-full text-xs border border-slate-200 p-2.5 rounded-lg bg-white font-medium"
                >
                  <option value="1.2 MB">1.2 MB</option>
                  <option value="2.4 MB">2.4 MB</option>
                  <option value="3.5 MB">3.5 MB</option>
                  <option value="850 KB">850 KB</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button 
                type="button" 
                onClick={() => setShowUploadModal(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-lg text-xs"
              >
                ОТМЕНА
              </button>
              <button 
                type="submit" 
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg text-xs"
              >
                ЗАГРУЗИТЬ
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
