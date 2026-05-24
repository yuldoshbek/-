import React, { useState } from 'react';
import { useWorkspace } from '../context/WorkspaceContext';
import { FileText, Search, Download, Folder } from 'lucide-react';

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
  const [searchQuery, setSearchQuery] = useState('');

  const documents = PROFILE_DOCUMENTS[profile.id] || [];
  
  const filteredDocs = documents.filter(doc => 
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="ew-page p-6 lg:p-8 max-w-6xl mx-auto space-y-6 font-sans">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 font-display">
            База знаний
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Шаблоны документов и регламенты для {profile.name}</p>
        </div>
        
        <div className="relative w-full md:w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Поиск по базе..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 w-full"
          />
        </div>
      </header>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredDocs.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Folder size={48} className="mx-auto opacity-20 mb-3" />
            <p>Документы не найдены</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filteredDocs.map((doc, idx) => (
              <li key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{doc.title}</h3>
                    <span className="text-[10px] uppercase font-bold text-slate-400">{doc.category}</span>
                  </div>
                </div>
                <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100" title="Скачать (демо)">
                  <Download size={18} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
