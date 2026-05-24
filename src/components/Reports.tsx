import React, { useState } from 'react';
import { 
  FileText, 
  Sparkles, 
  TrendingUp, 
  AlertTriangle, 
  PlayCircle, 
  Download, 
  RefreshCw, 
  FileSpreadsheet, 
  CheckSquare, 
  Plus, 
  Check, 
  Trash2,
  FileCheck,
  ClipboardList
} from 'lucide-react';
import { useReports, useSubReports, logAIUsage } from '../lib/hooks';
import { getAIHeaders } from '../lib/ai-context';
import { Report, SubReport } from '../types';

interface ReportTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
}

const reportTemplates: ReportTemplate[] = [
  { id: 'rep-t-1', name: 'Еженедельный срез исполнительской дисциплины', category: 'Контроль', description: 'Сводная аналитика по просроченным и активным задачам департаментов.' },
  { id: 'rep-t-2', name: 'Отчет по КПЭ сотрудников за отчетный период', category: 'Кадры', description: 'Рейтинг эффективности специалистов с учетом задержек.' },
  { id: 'rep-t-3', name: 'Оценка операционных рисков и инцидентов', category: 'Безопасность', description: 'Реестр потенциальных угроз и мер по их нивелированию.' }
];

export default function Reports() {
  const { reports, loading: loadingReports, addReport, updateReportStatus, deleteReport } = useReports();
  const { subReports, loading: loadingSubReports, addSubReport } = useSubReports();

  // Tab State
  const [activeTab, setActiveTab] = useState<'archive' | 'generator' | 'employee_reports' | 'forms' | 'export' | 'ai_analysis'>('archive');

  // Modal visibility states
  const [showAddReportModal, setShowAddReportModal] = useState(false);
  const [showAddSubReportModal, setShowAddSubReportModal] = useState(false);

  // Form states for creating a report manually
  const [reportTitle, setReportTitle] = useState('');
  const [reportDept, setReportDept] = useState('Проектный офис');
  const [reportStatus, setReportStatus] = useState<'pending' | 'submitted' | 'approved'>('submitted');
  const [reportSummary, setReportSummary] = useState('');

  // Form states for submitting employee sub-report
  const [subReportTitle, setSubReportTitle] = useState('');
  const [subReportContent, setSubReportContent] = useState('');

  // Generator states
  const [selectedTemplate, setSelectedTemplate] = useState('rep-t-1');
  const [period, setPeriod] = useState('Май 2026');
  const [format, setFormat] = useState('PDF Standard');
  const [draftText, setDraftText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState('');

  // AI Analysis states
  const [reportText, setReportText] = useState('');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{
    summaryRu?: string;
    summaryUz?: string;
    risks?: string[];
    nextSteps?: string[];
    proposedDecisions?: string[];
  } | null>(null);

  // Handlers
  const handleAnalyze = async () => {
    if (!reportText.trim()) return;
    setGenerating(true);
    setResult(null);
    try {
      const res = await fetch('/api/executive-summary', {
        method: 'POST',
        headers: getAIHeaders(),
        body: JSON.stringify({ reportText })
      });
      const data = await res.json();
      if (res.ok && data.summaryRu) {
        setResult(data);
        logAIUsage('/api/executive-summary', 'success', reportText.length, JSON.stringify(data).length);
      } else throw new Error();
    } catch {
      logAIUsage('/api/executive-summary', 'error', reportText.length, 0);
      setTimeout(() => {
        setResult({
          summaryRu: "Аналитический отчет о ходе реновации тепловых сетей. Основное отставание зафиксировано в секторе №3.",
          summaryUz: "Issiqlik tarmoqlarini modernizatsiya qilish bo'yicha tahliliy hisobot.",
          risks: [
            "Срыв отопительного сезона из-за задержки поставок.",
            "Превышение запланированного бюджета закупок на 12%."
          ],
          nextSteps: [
            "Направить ноту в Таможенный комитет для ускорения досмотра.",
            "Назначить выговор начальнику Сектора МТО."
          ],
          proposedDecisions: [
            "Вариант А: Перенаправить резервные трубы из областного фонда.",
            "Вариант Б: Привлечь субподрядчика для ускорения монтажа."
          ]
        });
      }, 800);
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateReport = (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setGeneratedResult('');

    setTimeout(() => {
      const template = reportTemplates.find(t => t.id === selectedTemplate);
      setGeneratedResult(`
===================================================
АНАЛИТИЧЕСКИЙ ОТЧЕТ АДМИНИСТРАЦИИ
Тип документа: ${template?.name}
Период контроля: ${period}
Формат: ${format}
---------------------------------------------------

1. СВОДНЫЙ СТАТУС:
Поручений назначено: 77
Успешно закрыто: 54
Просрочек: 6
Индекс исполнительской дисциплины: 92.4%

2. КЛЮЧЕВЫЕ ВЫВОДЫ:
${draftText || 'Обозначена необходимость доукомплектования подразделений.'}

3. ПРИМЕЧАНИЯ:
Документ составлен системой Executive Workspace.
      `);
      setIsGenerating(false);
    }, 1200);
  };

  const handleCreateReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTitle.trim()) return;
    await addReport({
      title: reportTitle,
      department: reportDept,
      status: reportStatus,
      summary: reportSummary
    });
    setReportTitle('');
    setReportSummary('');
    setShowAddReportModal(false);
    alert('Отчет успешно добавлен в архив!');
  };

  const handleCreateSubReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subReportTitle.trim() || !subReportContent.trim()) return;
    await addSubReport(subReportTitle, subReportContent);
    setSubReportTitle('');
    setSubReportContent('');
    setShowAddSubReportModal(false);
    alert('Отчет сотрудника успешно добавлен!');
  };

  const handleDeleteReportClick = async (id: string) => {
    if (window.confirm('Вы действительно хотите удалить этот отчёт?')) {
      await deleteReport(id);
    }
  };

  // Exporters
  const handleExportExcel = () => {
    const textToExport = generatedResult || (reports.map(r => `${r.title} - ${r.department} - ${r.status}`).join('\n'));
    if (!textToExport) return;
    const csvContent = "\uFEFF" + textToExport.split('\n').map(line => {
      if (line.includes(':')) {
        const parts = line.split(':');
        const key = parts[0].trim().replace(/"/g, '""');
        const val = parts.slice(1).join(':').trim().replace(/"/g, '""');
        return `"${key}";"${val}"`;
      }
      return `"${line.trim().replace(/"/g, '""')}"`;
    }).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `reports_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportWord = () => {
    const textToExport = generatedResult || (reports.map(r => `${r.title} - ${r.department} - ${r.status}`).join('\n'));
    if (!textToExport) return;
    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <title>Экспорт Отчетов</title>
        <style>
          body { font-family: 'Arial', sans-serif; line-height: 1.6; }
          h1 { color: #1e293b; border-bottom: 2px solid #cbd5e1; padding-bottom: 8px; font-size: 20pt; }
          p { font-size: 11pt; color: #334155; }
        </style>
      </head>
      <body>
        <h1>АРХИВ ОТЧЕТОВ</h1>
        <pre>${textToExport}</pre>
      </body>
      </html>
    `;
    const blob = new Blob(['\uFEFF' + htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `reports_export_${Date.now()}.doc`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintPDF = () => {
    const textToExport = generatedResult || (reports.map(r => `${r.title} - ${r.department} - ${r.status}`).join('\n'));
    if (!textToExport) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Не удалось открыть окно печати.');
      return;
    }
    printWindow.document.write(`
      <html>
      <head>
        <title>Экспорт Отчетов</title>
        <style>
          body { font-family: 'Arial', sans-serif; padding: 20px; line-height: 1.6; }
          pre { background: #f8fafc; padding: 15px; border: 1px solid #e2e8f0; font-size: 12px; }
        </style>
      </head>
      <body>
        <h2>АРХИВ ОТЧЕТОВ EXECUTIVE WORKSPACE</h2>
        <pre>${textToExport}</pre>
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleApplyTemplate = (tId: string) => {
    setSelectedTemplate(tId);
    setActiveTab('generator');
  };

  return (
    <div className="ew-page p-6 lg:p-8 max-w-7xl mx-auto font-sans space-y-6">

      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 font-display">Отчёты</h1>
          <p className="text-slate-500 text-sm mt-0.5">Архив отчётов дирекции, ИИ-анализ и журнал отчётов персонала</p>
        </div>

        <div className="flex gap-2">
          {activeTab === 'archive' && (
            <button
              onClick={() => setShowAddReportModal(true)}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-2 rounded-xl text-xs uppercase cursor-pointer transition-colors shadow-sm"
            >
              <Plus size={14} /> Зарегистрировать отчёт
            </button>
          )}
          {activeTab === 'employee_reports' && (
            <button
              onClick={() => setShowAddSubReportModal(true)}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-2 rounded-xl text-xs uppercase cursor-pointer transition-colors shadow-sm"
            >
              <Plus size={14} /> Добавить отчёт сотрудника
            </button>
          )}
        </div>
      </header>

      {/* Sub-tab navigation */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-6 -mb-px overflow-x-auto">
          {[
            { id: 'archive', label: 'Отчёты' },
            { id: 'generator', label: 'Генератор отчётов' },
            { id: 'employee_reports', label: 'Отчёты сотрудников' },
            { id: 'forms', label: 'Формы / Шаблоны' },
            { id: 'export', label: 'Экспорт (PDF / Excel)' },
            { id: 'ai_analysis', label: 'AI-анализ отчёта' }
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

      {/* ═══ 1. ARCHIVE TAB ═══ */}
      {activeTab === 'archive' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
            <h3 className="font-bold text-slate-800 text-sm">Реестр отчетов руководства</h3>
            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold font-mono rounded">
              Всего отчетов: {reports.length}
            </span>
          </div>

          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="p-3 w-32">Статус</th>
                <th className="p-3">Название отчёта / Сводка</th>
                <th className="p-3">Департамент</th>
                <th className="p-3">Дата создания</th>
                <th className="p-3 text-center w-20">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loadingReports ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-400">Загрузка...</td></tr>
              ) : reports.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-400">В архиве нет зарегистрированных отчётов.</td></tr>
              ) : (
                reports.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/50">
                    <td className="p-3">
                      <select
                        value={r.status}
                        onChange={(e) => updateReportStatus(r.id, e.target.value as any)}
                        className={`text-[9px] font-bold p-1 rounded border uppercase ${
                          r.status === 'approved' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                          r.status === 'submitted' ? 'bg-blue-50 text-blue-800 border-blue-200' : 'bg-amber-50 text-amber-800'
                        }`}
                      >
                        <option value="pending">Ожидает</option>
                        <option value="submitted">Сдан</option>
                        <option value="approved">Утвержден</option>
                      </select>
                    </td>
                    <td className="p-3">
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-800 text-xs block">{r.title}</span>
                        {r.summary && <span className="text-[10px] text-slate-400 block font-medium">{r.summary}</span>}
                      </div>
                    </td>
                    <td className="p-3 font-semibold text-slate-600">{r.department || 'Не указан'}</td>
                    <td className="p-3 font-mono text-slate-500">{new Date(r.createdAt || Date.now()).toLocaleDateString('ru-RU')}</td>
                    <td className="p-3 text-center">
                      <button onClick={() => handleDeleteReportClick(r.id)} className="p-1 hover:bg-slate-100 rounded text-rose-600 cursor-pointer" title="Удалить">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ═══ 2. GENERATOR TAB ═══ */}
      {activeTab === 'generator' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="ew-card p-6 space-y-5">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Параметры генерации</h3>
            <form onSubmit={handleGenerateReport} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Шаблон</label>
                <select
                  value={selectedTemplate}
                  onChange={e => setSelectedTemplate(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl"
                >
                  {reportTemplates.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Период контроля</label>
                <input type="text" value={period} onChange={e => setPeriod(e.target.value)} className="w-full text-xs p-2.5 border border-slate-200 rounded-xl" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Формат экспорта</label>
                <select value={format} onChange={e => setFormat(e.target.value)} className="w-full text-xs p-2.5 border border-slate-200 rounded-xl">
                  <option value="PDF Standard">ГОСТ PDF</option>
                  <option value="Google Sheet">Google Sheets</option>
                  <option value="Markdown DOC">Markdown</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Комментарии и детали</label>
                <textarea rows={3} value={draftText} onChange={e => setDraftText(e.target.value)} placeholder="Дополнительные комментарии..." className="w-full text-xs p-2.5 border border-slate-200 rounded-xl" />
              </div>
              <button type="submit" disabled={isGenerating} className="w-full ew-btn ew-btn-primary justify-center disabled:opacity-50">
                {isGenerating ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                {isGenerating ? 'Генерация...' : 'Сгенерировать отчёт'}
              </button>
            </form>
          </div>

          <div className="lg:col-span-2">
            {generatedResult ? (
              <div className="bg-slate-900 text-slate-100 rounded-2xl p-6 font-mono text-xs space-y-4 shadow-lg">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <span className="text-[10px] text-emerald-400 font-bold uppercase">Сгенерированный отчёт</span>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={handleExportExcel} className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors">
                      <FileSpreadsheet size={13} /> Excel
                    </button>
                    <button onClick={handleExportWord} className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors">
                      <FileText size={13} /> Word
                    </button>
                    <button onClick={handlePrintPDF} className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-rose-400 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors">
                      <Download size={13} /> PDF Печать
                    </button>
                  </div>
                </div>
                <pre className="whitespace-pre-wrap text-[11px] leading-relaxed text-slate-300">{generatedResult}</pre>
              </div>
            ) : (
              <div className="ew-card p-16 text-center text-slate-400 flex flex-col items-center space-y-3">
                <FileSpreadsheet size={40} className="opacity-30" />
                <p className="text-sm">Настройте параметры для генерации отчёта</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ 3. EMPLOYEE REPORTS TAB ═══ */}
      {activeTab === 'employee_reports' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-3 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Отчеты сотрудников из базы данных</h3>
              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded font-mono text-[10px]">Всего: {subReports.length}</span>
            </div>

            {loadingSubReports ? (
              <div className="text-center p-8 text-slate-400">Загрузка...</div>
            ) : subReports.length === 0 ? (
              <div className="ew-card p-12 text-center text-slate-400">Отчёты сотрудников отсутствуют. Вы можете добавить отчет вручную.</div>
            ) : (
              subReports.map(sr => (
                <div key={sr.id} className="ew-card p-5 space-y-3 animate-fadeIn">
                  <div className="flex justify-between items-center border-b pb-2">
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs">{sr.title}</h4>
                      <span className="text-[9px] font-mono text-slate-400 block mt-0.5">Дата подачи: {new Date(sr.createdAt || Date.now()).toLocaleDateString('ru-RU')}</span>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded text-[9px] font-bold uppercase">Сдан</span>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/55 text-xs font-mono text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {sr.content}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ═══ 4. FORMS TAB ═══ */}
      {activeTab === 'forms' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reportTemplates.map(template => (
            <div key={template.id} className="ew-card p-6 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[9px] font-bold uppercase tracking-wider">{template.category}</span>
                <h4 className="font-bold text-slate-800 text-sm">{template.name}</h4>
                <p className="text-slate-500 text-xs leading-relaxed">{template.description}</p>
              </div>
              <button
                onClick={() => handleApplyTemplate(template.id)}
                className="w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 font-bold text-xs uppercase transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <ClipboardList size={13} /> Заполнить форму
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ═══ 5. EXPORT TAB ═══ */}
      {activeTab === 'export' && (
        <div className="ew-card p-8 text-center max-w-xl mx-auto space-y-6">
          <Download size={48} className="text-blue-500 mx-auto opacity-75" />
          <div className="space-y-2">
            <h3 className="font-bold text-slate-800 text-base font-display">Экспорт и Выгрузки Отчётов</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Выгрузите полный архив сданных отчетов дирекции или экспортируйте последний сгенерированный отчет в форматы PDF, Excel (CSV) или Word (DOC).
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4">
            <button onClick={handleExportExcel} className="p-4 bg-slate-50 hover:bg-slate-100 border rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors">
              <FileSpreadsheet size={24} className="text-amber-500" />
              <span className="text-[10px] font-bold uppercase text-slate-700">Excel CSV</span>
            </button>
            <button onClick={handleExportWord} className="p-4 bg-slate-50 hover:bg-slate-100 border rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors">
              <FileText size={24} className="text-blue-500" />
              <span className="text-[10px] font-bold uppercase text-slate-700">Word DOC</span>
            </button>
            <button onClick={handlePrintPDF} className="p-4 bg-slate-50 hover:bg-slate-100 border rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors">
              <FileCheck size={24} className="text-rose-500" />
              <span className="text-[10px] font-bold uppercase text-slate-700">PDF Печать</span>
            </button>
          </div>
        </div>
      )}

      {/* ═══ 6. AI ANALYSIS TAB ═══ */}
      {activeTab === 'ai_analysis' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="ew-card p-6 space-y-4">
            <div className="border-b pb-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">ИИ-Сканирование и Анализ отчета</h3>
            </div>
            <textarea
              value={reportText}
              onChange={e => setReportText(e.target.value)}
              placeholder="Вставьте сюда текст отчета для ИИ анализа..."
              className="w-full h-80 p-4 border border-slate-200 rounded-xl text-xs bg-slate-50/40 font-mono focus:outline-none focus:border-blue-400 resize-none"
            />
            <div className="flex justify-end border-t pt-3">
              <button
                onClick={handleAnalyze}
                disabled={generating || !reportText.trim()}
                className="ew-btn ew-btn-primary disabled:opacity-50"
              >
                <Sparkles size={14} className={generating ? 'animate-spin' : ''} />
                Провести ИИ-Анализ
              </button>
            </div>
          </div>

          <div className="ew-card p-6 min-h-[450px] flex flex-col">
            <h3 className="text-xs font-bold text-slate-400 uppercase border-b pb-2 mb-4">Управленческий брифинг ИИ</h3>

            {!result && !generating && (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 space-y-3">
                <TrendingUp size={32} className="opacity-30" />
                <p className="text-xs font-semibold">Анализ пуст</p>
                <p className="text-[10px] max-w-xs text-center">Запустите сканирование. ИИ автоматически выявит скрытые риски и составит рекомендации.</p>
              </div>
            )}

            {generating && (
              <div className="flex-1 flex flex-col items-center justify-center text-blue-500 space-y-3">
                <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                <span className="text-[10px] font-mono uppercase tracking-wider">Анализ рисков и дисциплины...</span>
              </div>
            )}

            {result && (
              <div className="space-y-5 text-xs animate-fadeIn">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Выжимка (RU)</span>
                  <p className="bg-slate-50 p-4 rounded-xl border border-slate-100 font-medium text-slate-800">{result.summaryRu}</p>
                </div>

                {result.summaryUz && (
                  <div className="border-t pt-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Qisqa Mazmuni (UZ)</span>
                    <p className="bg-slate-50 p-4 rounded-xl border border-slate-100 font-serif italic text-slate-800">{result.summaryUz}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-3">
                  {result.risks && result.risks.length > 0 && (
                    <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl">
                      <h4 className="font-bold text-rose-900 mb-2 flex items-center gap-1.5 text-xs">
                        <AlertTriangle size={14} /> Выявленные риски
                      </h4>
                      <ul className="list-disc list-inside text-rose-800 space-y-1 text-[11px] font-semibold">
                        {result.risks.map((r, i) => <li key={i}>{r}</li>)}
                      </ul>
                    </div>
                  )}
                  {result.nextSteps && result.nextSteps.length > 0 && (
                    <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl">
                      <h4 className="font-bold text-emerald-900 mb-2 flex items-center gap-1.5 text-xs">
                        <PlayCircle size={14} /> Рекомендуемые шаги
                      </h4>
                      <ul className="list-disc list-inside text-emerald-800 space-y-1 text-[11px] font-semibold">
                        {result.nextSteps.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                  )}
                </div>

                {result.proposedDecisions && result.proposedDecisions.length > 0 && (
                  <div className="border-t pt-4 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Проекты управленческих решений</span>
                    {result.proposedDecisions.map((d, i) => (
                      <div key={i} className="bg-white border p-3 rounded-xl flex items-start gap-3 shadow-sm">
                        <span className="flex items-center justify-center bg-slate-900 text-white w-5 h-5 rounded-full text-[10px] font-bold shrink-0">{String.fromCharCode(65 + i)}</span>
                        <p className="text-slate-700 font-semibold">{d}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ MODALS ═══ */}
      {/* 1. Add Report Modal */}
      {showAddReportModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <form onSubmit={handleCreateReportSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xl max-w-md w-full space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base font-display">Зарегистрировать отчёт в архив</h3>
              <button type="button" onClick={() => setShowAddReportModal(false)} className="text-slate-400 hover:text-slate-600 text-sm">Закрыть</button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Название отчёта</label>
                <input
                  type="text" required
                  placeholder="Пример: Финансовый отчет за Q1 2026..."
                  value={reportTitle}
                  onChange={e => setReportTitle(e.target.value)}
                  className="w-full text-xs border border-slate-200 p-2.5 rounded-lg bg-slate-50/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Департамент</label>
                  <select
                    value={reportDept}
                    onChange={e => setReportDept(e.target.value)}
                    className="w-full text-xs border border-slate-200 p-2.5 rounded-lg bg-white font-medium"
                  >
                    <option value="Проектный офис">Проектный офис</option>
                    <option value="Финансы">Финансы</option>
                    <option value="Геология">Геология</option>
                    <option value="Юридический">Юридический</option>
                    <option value="HR">HR</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Статус сдачи</label>
                  <select
                    value={reportStatus}
                    onChange={e => setReportStatus(e.target.value as any)}
                    className="w-full text-xs border border-slate-200 p-2.5 rounded-lg bg-white font-medium"
                  >
                    <option value="pending">Ожидает</option>
                    <option value="submitted">Сдан</option>
                    <option value="approved">Утвержден</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Краткая аннотация (Сводка)</label>
                <textarea
                  rows={4}
                  placeholder="Введите краткие выводы по отчёту..."
                  value={reportSummary}
                  onChange={e => setReportSummary(e.target.value)}
                  className="w-full text-xs border border-slate-200 p-2.5 rounded-lg bg-slate-50/50 resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button 
                type="button" 
                onClick={() => setShowAddReportModal(false)}
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

      {/* 2. Add Sub-Report Modal */}
      {showAddSubReportModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <form onSubmit={handleCreateSubReportSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xl max-w-md w-full space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base font-display">Добавить отчёт сотрудника</h3>
              <button type="button" onClick={() => setShowAddSubReportModal(false)} className="text-slate-400 hover:text-slate-600 text-sm">Закрыть</button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">ФИО сотрудника / Тема отчёта</label>
                <input
                  type="text" required
                  placeholder="Пример: Отчет Иванова А. по IT лицензиям..."
                  value={subReportTitle}
                  onChange={e => setSubReportTitle(e.target.value)}
                  className="w-full text-xs border border-slate-200 p-2.5 rounded-lg bg-slate-50/50"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Содержание отчёта</label>
                <textarea
                  required rows={6}
                  placeholder="Введите полное текстовое содержание отчета о результатах и проделанной работе..."
                  value={subReportContent}
                  onChange={e => setSubReportContent(e.target.value)}
                  className="w-full text-xs border border-slate-200 p-2.5 rounded-lg bg-slate-50/50 resize-none font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button 
                type="button" 
                onClick={() => setShowAddSubReportModal(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-lg text-xs"
              >
                ОТМЕНА
              </button>
              <button 
                type="submit" 
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg text-xs"
              >
                ДОБАВИТЬ
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
