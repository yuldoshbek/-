import React, { useState } from 'react';
import { 
  BookOpen, 
  Search, 
  Plus, 
  Trash2, 
  CheckCircle, 
  FolderOpen, 
  FileText, 
  ExternalLink 
} from 'lucide-react';
import { useGuides } from '../lib/hooks';
import { GuideItem } from '../types';

export default function KnowledgeBase() {
  const { guides, addGuide } = useGuides();
  const [search, setSearch] = useState('');
  const [activeGuideId, setActiveGuideId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  // New states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<GuideItem['category']>('Документооборот');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');

  const activeGuide = guides.find(g => g.id === activeGuideId) || guides[0] || null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    addGuide({
      title: title.trim(),
      category,
      summary: summary.trim() || 'Краткое содержание отсутствует.',
      content: content.trim()
    });

    setTitle('');
    setContent('');
    setSummary('');
    setShowAdd(false);
  };

  const filtered = guides.filter(g => g.title.toLowerCase().includes(search.toLowerCase()) || g.summary.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 font-sans">
      <header className="border-b border-slate-200/60 pb-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs font-bold text-teal-600 uppercase tracking-widest font-display">Корпоративный портал</span>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-display mt-1">База знаний ТМК (Knowledge Base)</h1>
          <p className="text-slate-500 text-sm mt-0.5">Внутренние регламенты, стандарты качества, шаблоны СЭД и регламентированные инструкции для персонала.</p>
        </div>

        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs uppercase"
        >
          <Plus size={15} />
          <span>Добавить статью</span>
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Navigation & search */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
            <input 
              id="kb-search"
              type="text" 
              placeholder="Поиск по статьям регламентов..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full text-xs border bg-white pl-8 pr-4 py-2 rounded-xl"
            />
          </div>

          <div className="space-y-2">
            {filtered.map(g => (
              <button 
                type="button"
                key={g.id}
                onClick={() => {
                  setActiveGuideId(g.id);
                  setShowAdd(false);
                }}
                className={`w-full text-left p-4 rounded-xl border transition-all ${activeGuide?.id === g.id ? 'bg-teal-50/70 border-teal-200 text-teal-950' : 'bg-white border-slate-200'}`}
              >
                <span className="text-[9px] font-mono text-teal-600 font-bold uppercase tracking-wider">{g.category}</span>
                <h4 className="font-bold text-slate-800 text-xs mt-1 truncate">{g.title}</h4>
                <p className="text-slate-500 text-[10px] mt-1 line-clamp-1">{g.summary}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Content presentation */}
        <div className="lg:col-span-2">
          {showAdd ? (
            <form onSubmit={handleAdd} className="bg-white border rounded-2xl p-6 shadow-xs space-y-4 text-xs">
              <h3 className="text-xs font-bold uppercase text-slate-800">Добавление статьи регламента</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Название документа</label>
                  <input 
                    id="kb-title"
                    type="text" 
                    placeholder="Стандарт работы со служебными записками..." 
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full p-2 border rounded-xl"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Раздел базы знаний</label>
                  <select 
                    id="kb-category"
                    value={category}
                    onChange={e => setCategory(e.target.value as any)}
                    className="w-full p-2 border rounded-xl"
                  >
                    <option value="Документооборот">Документооборот</option>
                    <option value="Шаблоны">Шаблоны ТМК</option>
                    <option value="Правила ТМК">Нормы и Правила</option>
                    <option value="Инструкции">Технические инструкции</option>
                  </select>
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Краткая аннотация</label>
                  <input 
                    id="kb-summary"
                    type="text" 
                    placeholder="Описание требований в одном предложении..." 
                    value={summary}
                    onChange={e => setSummary(e.target.value)}
                    className="w-full p-2 border rounded-xl"
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Полный регламентный регламентированный текст</label>
                  <textarea 
                    id="kb-content"
                    rows={8} 
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder="Опишите детальный порядок согласований, дедлайны и штрафные санкции..."
                    className="w-full p-2 border rounded-xl"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 text-xs pt-2">
                <button type="button" onClick={() => setShowAdd(false)} className="px-3 py-1.5 hover:bg-slate-100 rounded-lg">Отмена</button>
                <button type="submit" className="px-3 py-1.5 bg-teal-600 text-white font-bold rounded-lg">Сохранить</button>
              </div>
            </form>
          ) : activeGuide ? (
            <div className="bg-white border rounded-2xl p-6 shadow-xs space-y-4">
              <div className="border-b pb-4 flex justify-between items-start gap-4 flex-wrap">
                <div>
                  <span className="text-[10px] font-mono text-teal-600 font-bold uppercase">{activeGuide.category}</span>
                  <h2 className="text-xl font-extrabold text-slate-950 font-display mt-1">{activeGuide.title}</h2>
                </div>
              </div>

              <div className="bg-teal-50/50 border border-teal-100 p-4 rounded-xl text-xs text-slate-700 leading-relaxed">
                <span className="text-[9px] font-bold text-teal-600 uppercase tracking-widest block mb-1">Краткая аннотация</span>
                {activeGuide.summary}
              </div>

              <div className="space-y-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Оригинальный текст инструкции СЭД</span>
                <p className="text-xs text-slate-800 leading-relaxed font-sans whitespace-pre-wrap">{activeGuide.content}</p>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400">Выберите регламент из реестра слева.</div>
          )}
        </div>
      </div>
    </div>
  );
}
