import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Sparkles, 
  Layers, 
  Download, 
  ExternalLink, 
  FileText, 
  Briefcase, 
  CheckSquare, 
  HelpCircle, 
  RefreshCw 
} from 'lucide-react';

interface ReportTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
}

const reportTemplates: ReportTemplate[] = [
  { id: 'rep-t-1', name: 'Еженедельный срез исполнительской дисциплины', category: 'Контроль', description: 'Сводная аналитика по просроченным и активным задачам департаментов.' },
  { id: 'rep-t-2', name: 'Отчет по КПЭ сотрудников за отчетный период', category: 'Кадры', description: 'Рейтинг эффективности специалистов с учетом задержек и закрытых дедлайнов.' },
  { id: 'rep-t-3', name: 'Оценка операционных рисков и инцидентов СЭД', category: 'Безопасность', description: 'Реестр потенциальных угроз, жалоб граждан и мер по их нивелированию.' }
];

interface EmployeeSubReport {
  id: string;
  employee: string;
  department: string;
  period: string;
  status: 'draft' | 'pending_review' | 'approved';
  achievements: string;
  blockers: string;
  submittedAt: string;
}

const mockSubReports: EmployeeSubReport[] = [
  {
    id: 'sub-r-1',
    employee: 'Ахмедов Рустам',
    department: 'Департамент IT и цифровизации',
    period: 'Май 2026',
    status: 'pending_review',
    achievements: 'Завершена пилотная интеграция Google Keep и Google Drive в общую СЭД.',
    blockers: 'Задержка получения токена API из центрального узла.',
    submittedAt: '2026-05-22'
  },
  {
    id: 'sub-r-2',
    employee: 'Кадырова Малика',
    department: 'Финансовый департамент',
    period: 'Май 2026',
    status: 'approved',
    achievements: 'Предоставлен полный акт сверки по бюджету капитальных затрат.',
    blockers: 'Нет',
    submittedAt: '2026-05-19'
  }
];

export default function ReportsGenerator() {
  const [subReports, setSubReports] = useState<EmployeeSubReport[]>(() => {
    const saved = localStorage.getItem('tmk_employee_sub_reports');
    return saved ? JSON.parse(saved) : mockSubReports;
  });

  const [activeTab, setActiveTab] = useState<'generate' | 'employee_reports'>('generate');
  
  // States of report options
  const [selectedTemplate, setSelectedTemplate] = useState<string>('rep-t-1');
  const [period, setPeriod] = useState('Май 2026');
  const [format, setFormat] = useState('PDF Standard');
  const [draftText, setDraftText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<string>('');

  // Submit report states
  const [newEmployee, setNewEmployee] = useState('');
  const [newDept, setNewDept] = useState('Департамент IT и цифровизации');
  const [newAchieve, setNewAchieve] = useState('');
  const [newBlockers, setNewBlockers] = useState('');

  useEffect(() => {
    localStorage.setItem('tmk_employee_sub_reports', JSON.stringify(subReports));
  }, [subReports]);

  const handleGenerateReport = (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setGeneratedResult('');

    setTimeout(() => {
      const template = reportTemplates.find(t => t.id === selectedTemplate);
      const output = `
===================================================
АНАЛИТИЧЕСКИЙ ОТЧЕТ АДМИНИСТРАЦИИ ТМК
Тип документа: ${template?.name}
Период контроля: ${period}
Форматирование: ${format}
---------------------------------------------------

1. СВОДНЫЙ СТАТУС ВЕДОМСТВЕННОЙ СЭД:
Поручений назначено: 77 предметов контроля.
Из них успешно закрыто: 54 задачи.
Выявлено просрочек: 6 инцидентов.
Индекс исполнительской дисциплины: 92.4%

2. КЛЮЧЕВЫЕ ВЫВОДЫ И НАПРАВЛЕНИЯ:
${draftText || 'Обозначена необходимость доукомплектования подразделений цифровыми сервисами. Критические задержки вынесены на уровень Директора.'}

3. ДОПОЛНИТЕЛЬНЫЕ ПРИМЕЧАНИЯ:
Документ составлен системой контроля СЭД ТМК.
      `;
      setGeneratedResult(output);
      setIsGenerating(false);
    }, 1500);
  };

  const handleSubmitSubReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmployee.trim() || !newAchieve.trim()) return;

    const fresh: EmployeeSubReport = {
      id: `sub-r-${Date.now()}`,
      employee: newEmployee.trim(),
      department: newDept,
      period: 'Май 2026',
      status: 'pending_review',
      achievements: newAchieve.trim(),
      blockers: newBlockers.trim() || 'Нет',
      submittedAt: new Date().toISOString().split('T')[0]
    };

    setSubReports([fresh, ...subReports]);
    setNewEmployee('');
    setNewAchieve('');
    setNewBlockers('');
  };

  const handleApproveStatus = (id: string) => {
    setSubReports(subReports.map(sr => sr.id === id ? { ...sr, status: 'approved' } : sr));
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 font-sans">
      <header className="border-b border-slate-200/60 pb-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest font-display">Аналитический сектор</span>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-display mt-1">Отчетность (Reports Generator)</h1>
          <p className="text-slate-500 text-sm mt-0.5">Умный генератор ведомственных докладов и консолидация еженедельных отчетов сотрудников ТМК.</p>
        </div>

        <div className="flex border p-1 rounded-xl bg-slate-100">
          <button 
            type="button"
            onClick={() => setActiveTab('generate')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all whitespace-nowrap ${activeTab === 'generate' ? 'bg-white text-emerald-600 shadow-xs' : 'text-slate-600'}`}
          >
            Генератор отчетов
          </button>
          <button 
            type="button"
            onClick={() => setActiveTab('employee_reports')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all whitespace-nowrap ${activeTab === 'employee_reports' ? 'bg-white text-emerald-600 shadow-xs' : 'text-slate-600'}`}
          >
            Отчеты сотрудников ({subReports.length})
          </button>
        </div>
      </header>

      {activeTab === 'generate' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Controls */}
          <div className="lg:col-span-1 bg-white border rounded-2xl p-5 shadow-xs space-y-5">
            <h3 className="text-xs font-bold uppercase text-slate-700 tracking-wider">Параметры генерации</h3>

            <form onSubmit={handleGenerateReport} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Шаблон документа</label>
                <select 
                  id="rep-template"
                  value={selectedTemplate}
                  onChange={e => setSelectedTemplate(e.target.value)}
                  className="w-full text-xs p-2.5 border rounded-xl"
                >
                  {reportTemplates.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Отчетный период</label>
                <input 
                  id="rep-period"
                  type="text" 
                  value={period}
                  onChange={e => setPeriod(e.target.value)}
                  className="w-full text-xs p-2.5 border rounded-xl"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Формат экспорта</label>
                <select 
                  id="rep-format"
                  value={format}
                  onChange={e => setFormat(e.target.value)}
                  className="w-full text-xs p-2.5 border rounded-xl"
                >
                  <option value="PDF Standard">ГОСТ PDF (Стандарт)</option>
                  <option value="Google Sheet">Google Sheets (Таблица)</option>
                  <option value="Markdown DOC">Печатный Markdown</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Пояснения к КПЭ ведомства</label>
                <textarea 
                  id="rep-explanatory"
                  rows={3} 
                  placeholder="Вставить личные замечания по поводу задержек во 2-м секторе..."
                  value={draftText}
                  onChange={e => setDraftText(e.target.value)}
                  className="w-full text-xs p-2.5 border rounded-xl"
                />
              </div>

              <button 
                type="submit"
                disabled={isGenerating}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 hover:shadow text-white font-bold py-2.5 rounded-xl text-xs uppercase cursor-pointer"
              >
                {isGenerating ? <RefreshCw className="animate-spin" size={14} /> : <Sparkles size={14} />}
                <span>{isGenerating ? 'В процессе...' : 'Сгенерировать доклад'}</span>
              </button>
            </form>
          </div>

          {/* Doc View preview panel */}
          <div className="lg:col-span-2">
            {generatedResult ? (
              <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl p-6 font-mono text-xs space-y-4 shadow-sm">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3 flex-wrap gap-2">
                  <span className="text-[10px] text-emerald-400 font-bold uppercase">Предварительный просмотр печатной формы ТМК</span>
                  <button 
                    onClick={() => {
                      alert('Макет отчета скопирован в буфер обмена!');
                      navigator.clipboard.writeText(generatedResult);
                    }}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-705 text-emerald-400 rounded-lg text-[10px] font-bold flex items-center gap-1"
                  >
                    <Download size={13} />
                    <span>Скопировать</span>
                  </button>
                </div>
                <pre className="whitespace-pre-wrap overflow-x-auto text-[11px] leading-relaxed text-slate-300">{generatedResult}</pre>
              </div>
            ) : (
              <div className="bg-white border rounded-2xl p-12 text-center text-slate-400 flex flex-col items-center justify-center space-y-3">
                <FileSpreadsheet size={40} className="text-slate-300" />
                <p className="text-xs">Настройте параметры в левой колонке для сборки комплексного отчета исполнительской дисциплины ТМК.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Employee reports panel check */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Submit form new Employee */}
          <div className="bg-white border rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase text-slate-700 tracking-wider">Подать отчет специалиста</h3>
            <form onSubmit={handleSubmitSubReport} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Специалист (ФИО)</label>
                <input 
                  id="sub-emp-name"
                  type="text" 
                  placeholder="Сабиров Шерзод"
                  value={newEmployee}
                  onChange={e => setNewEmployee(e.target.value)}
                  className="w-full text-xs p-2.5 border rounded-xl"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Ведомство / Департамент</label>
                <select 
                  id="sub-emp-dept"
                  value={newDept}
                  onChange={e => setNewDept(e.target.value)}
                  className="w-full text-xs p-2.5 border rounded-xl"
                >
                  <option value="Департамент IT и цифровизации">Департамент IT</option>
                  <option value="Финансовый департамент">Финансовый департамент</option>
                  <option value="Департамент логистики и закупок">Департамент логистики</option>
                  <option value="Аналитический сектор">Аналитический сектор</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Результаты и выполнение (За отчетный месяц)</label>
                <textarea 
                  id="sub-emp-achieve"
                  rows={3}
                  value={newAchieve}
                  onChange={e => setNewAchieve(e.target.value)}
                  placeholder="Выполнены все контрольные закупки по списку..."
                  className="w-full text-xs p-2.5 border rounded-xl"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Существующие барьеры / Задержки</label>
                <textarea 
                  id="sub-emp-blockers"
                  rows={2}
                  value={newBlockers}
                  onChange={e => setNewBlockers(e.target.value)}
                  placeholder="Отсутствуют..."
                  className="w-full text-xs p-2.5 border rounded-xl"
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 hover:shadow text-white font-bold py-2 rounded-xl text-xs uppercase"
              >
                Подать на согласование
              </button>
            </form>
          </div>

          {/* List of sub reports */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Поступившие отчеты ведомств</h3>
            <div className="space-y-4">
              {subReports.map(sr => (
                <div key={sr.id} className="bg-white border rounded-2xl p-5 shadow-xs space-y-3">
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs">{sr.employee}</h4>
                      <span className="text-[9px] font-mono text-slate-400 block">{sr.department}</span>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase font-mono ${sr.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700 animate-pulse'}`}>
                      {sr.status === 'approved' ? 'Согласован' : 'На утверждении'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans text-slate-600 bg-slate-50 p-4 rounded-xl border">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Исполненные задачи</span>
                      <p className="text-slate-800 leading-relaxed mt-0.5">{sr.achievements}</p>
                    </div>

                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Задержки и риски</span>
                      <p className="text-slate-600 italic mt-0.5">{sr.blockers}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                    <span>Передан: {sr.submittedAt}</span>
                    {sr.status === 'pending_review' && (
                      <button 
                        onClick={() => handleApproveStatus(sr.id)}
                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[9px] font-extrabold uppercase"
                      >
                        Утвердить отчет
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
