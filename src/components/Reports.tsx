import React, { useState, useEffect } from 'react';
import { FileText, Sparkles, TrendingUp, AlertTriangle, PlayCircle, Download, RefreshCw, FileSpreadsheet, CheckSquare } from 'lucide-react';
import { logAIUsage } from '../lib/hooks';

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
    achievements: 'Завершена пилотная интеграция Google Keep и Google Drive в общую систему.',
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

export default function Reports() {
  const [activeTab, setActiveTab] = useState<'analytics' | 'generator' | 'employee'>('analytics');

  // ═══ Analytics tab state ═══
  const [reportText, setReportText] = useState('');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{
    summaryRu?: string;
    summaryUz?: string;
    risks?: string[];
    nextSteps?: string[];
    proposedDecisions?: string[];
  } | null>(null);

  // ═══ Generator tab state ═══
  const [selectedTemplate, setSelectedTemplate] = useState('rep-t-1');
  const [period, setPeriod] = useState('Май 2026');
  const [format, setFormat] = useState('PDF Standard');
  const [draftText, setDraftText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState('');

  // ═══ Employee reports tab state ═══
  const [subReports, setSubReports] = useState<EmployeeSubReport[]>(() => {
    const saved = localStorage.getItem('tmk_employee_sub_reports');
    return saved ? JSON.parse(saved) : mockSubReports;
  });
  const [newEmployee, setNewEmployee] = useState('');
  const [newDept, setNewDept] = useState('Департамент IT и цифровизации');
  const [newAchieve, setNewAchieve] = useState('');
  const [newBlockers, setNewBlockers] = useState('');

  useEffect(() => {
    localStorage.setItem('tmk_employee_sub_reports', JSON.stringify(subReports));
  }, [subReports]);

  // ═══ Analytics handlers ═══
  const handleAnalyze = async () => {
    if (!reportText.trim()) return;
    setGenerating(true);
    setResult(null);
    try {
      const customKey = JSON.parse(localStorage.getItem('ew_api_keys') || '[]').find((k: any) => k.id === 'gemini')?.key || '';
      const res = await fetch('/api/executive-summary', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-gemini-key': customKey
        },
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

  // ═══ Generator handlers ═══
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

  // ═══ Employee report handlers ═══
  const handleSubmitSubReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmployee.trim() || !newAchieve.trim()) return;
    setSubReports([{
      id: `sub-r-${Date.now()}`,
      employee: newEmployee.trim(),
      department: newDept,
      period: 'Май 2026',
      status: 'pending_review',
      achievements: newAchieve.trim(),
      blockers: newBlockers.trim() || 'Нет',
      submittedAt: new Date().toISOString().split('T')[0]
    }, ...subReports]);
    setNewEmployee('');
    setNewAchieve('');
    setNewBlockers('');
  };

  const handleApprove = (id: string) => {
    setSubReports(subReports.map(sr => sr.id === id ? { ...sr, status: 'approved' as const } : sr));
  };

  const handleExportExcel = () => {
    if (!generatedResult) return;
    const csvContent = "\uFEFF" + generatedResult.split('\n').map(line => {
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
    link.setAttribute("download", `report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportWord = () => {
    if (!generatedResult) return;
    const template = reportTemplates.find(t => t.id === selectedTemplate);
    const title = template?.name || 'Отчет';
    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: 'Arial', sans-serif; line-height: 1.6; }
          h1 { color: #1e293b; border-bottom: 2px solid #cbd5e1; padding-bottom: 8px; font-size: 20pt; }
          h2 { color: #334155; font-size: 14pt; margin-top: 20px; }
          p { font-size: 11pt; color: #334155; }
          pre { font-family: 'Consolas', monospace; font-size: 10pt; background: #f8fafc; padding: 10px; border: 1px solid #e2e8f0; }
          .header { text-align: center; margin-bottom: 30px; }
          .footer { text-align: center; font-size: 9pt; color: #64748b; margin-top: 50px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${title}</h1>
          <p><strong>Период контроля:</strong> ${period}</p>
          <p><strong>Дата создания:</strong> ${new Date().toLocaleDateString('ru-RU')}</p>
        </div>
        <div class="content">
          ${generatedResult.split('\n').map(line => {
            const trimmed = line.trim();
            if (trimmed.startsWith('==') || trimmed.startsWith('--')) {
              return '';
            }
            if (trimmed.match(/^[0-9]+\.\s/)) {
              return `<h2>${trimmed}</h2>`;
            }
            return `<p>${trimmed}</p>`;
          }).join('')}
        </div>
        <div class="footer">
          <p>Документ составлен системой Executive Workspace.</p>
        </div>
      </body>
      </html>
    `;
    const blob = new Blob(['\uFEFF' + htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `report_${Date.now()}.doc`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintPDF = () => {
    if (!generatedResult) return;
    const template = reportTemplates.find(t => t.id === selectedTemplate);
    const title = template?.name || 'Отчет';
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Не удалось открыть окно печати. Пожалуйста, разрешите всплывающие окна.');
      return;
    }
    printWindow.document.write(`
      <html>
      <head>
        <title>${title}</title>
        <style>
          @page {
            size: A4;
            margin: 20mm;
          }
          body {
            font-family: 'Arial', sans-serif;
            color: #1e293b;
            line-height: 1.6;
            background: #fff;
          }
          .container {
            max-width: 800px;
            margin: 0 auto;
          }
          h1 {
            font-size: 24px;
            text-align: center;
            margin-bottom: 5px;
            color: #0f172a;
          }
          .subtitle {
            text-align: center;
            font-size: 14px;
            color: #64748b;
            margin-bottom: 30px;
          }
          .meta-box {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 35px;
            background-color: #f8fafc;
          }
          .meta-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            font-size: 12px;
          }
          .meta-label {
            font-weight: bold;
            color: #475569;
          }
          .content-section {
            margin-bottom: 25px;
          }
          .content-section h2 {
            font-size: 16px;
            border-bottom: 2px solid #cbd5e1;
            padding-bottom: 6px;
            color: #0f172a;
            margin-top: 20px;
            margin-bottom: 10px;
          }
          .content-section p {
            font-size: 13px;
            margin: 8px 0;
          }
          .footer {
            text-align: center;
            font-size: 10px;
            color: #94a3b8;
            margin-top: 60px;
            border-top: 1px solid #e2e8f0;
            padding-top: 15px;
          }
          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>${title.toUpperCase()}</h1>
          <div class="subtitle">Отчет исполнительной дисциплины</div>
          
          <div class="meta-box">
            <div class="meta-grid">
              <div><span class="meta-label">Период:</span> ${period}</div>
              <div><span class="meta-label">Создано:</span> ${new Date().toLocaleDateString('ru-RU')}</div>
              <div><span class="meta-label">Разработчик системы:</span> Executive Workspace</div>
              <div><span class="meta-label">Статус:</span> Утвержден</div>
            </div>
          </div>
          
          <div class="content-section">
            ${generatedResult.split('\n').map(line => {
              const trimmed = line.trim();
              if (trimmed.startsWith('==') || trimmed.startsWith('--')) {
                return '';
              }
              if (trimmed.match(/^[0-9]+\.\s/)) {
                return `<h2>${trimmed}</h2>`;
              }
              return `<p>${trimmed}</p>`;
            }).join('')}
          </div>
          
          <div class="footer">
            Документ сгенерирован автоматически в Personal Executive Control System.
          </div>
        </div>
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

  return (
    <div className="ew-page p-6 lg:p-8 max-w-7xl mx-auto font-sans space-y-6">

      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 font-display">Отчётность</h1>
          <p className="text-slate-500 text-sm mt-0.5">ИИ-аналитика, генератор докладов и отчёты сотрудников</p>
        </div>

        <div className="ew-tabs">
          {[
            { id: 'analytics' as const, label: 'ИИ-Аналитика' },
            { id: 'generator' as const, label: 'Генератор' },
            { id: 'employee' as const, label: `Сотрудники (${subReports.length})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`ew-tab ${activeTab === tab.id ? 'active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* ═══ TAB: Analytics ═══ */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="ew-card p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b pb-2">Текст входящего отчета</h3>
            <textarea
              value={reportText}
              onChange={e => setReportText(e.target.value)}
              placeholder="Вставьте текст отчета со статистикой..."
              className="w-full h-80 p-4 border border-slate-200 rounded-xl text-xs bg-slate-50/40 font-mono focus:outline-none focus:border-blue-400 resize-none"
            />
            <div className="flex justify-end border-t pt-3">
              <button
                onClick={handleAnalyze}
                disabled={generating || !reportText.trim()}
                className="ew-btn ew-btn-primary disabled:opacity-50"
              >
                <Sparkles size={14} className={generating ? 'animate-spin' : ''} />
                ИИ-Аудит и Сжатие
              </button>
            </div>
          </div>

          <div className="ew-card p-6 min-h-[450px] flex flex-col">
            <h3 className="text-xs font-bold text-slate-400 uppercase border-b pb-2 mb-4">Управленческий брифинг</h3>

            {!result && !generating && (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 space-y-3">
                <TrendingUp size={32} className="opacity-30" />
                <p className="text-xs font-semibold">Сводка пуста</p>
                <p className="text-[10px] max-w-xs text-center">Загрузите отчет. ИИ выявит риски и предложит решения.</p>
              </div>
            )}

            {generating && (
              <div className="flex-1 flex flex-col items-center justify-center text-blue-500 space-y-3">
                <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                <span className="text-[10px] font-mono uppercase tracking-wider">Семантический анализ...</span>
              </div>
            )}

            {result && (
              <div className="space-y-5 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Краткое содержание (RU)</span>
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
                        <AlertTriangle size={14} /> Риски
                      </h4>
                      <ul className="list-disc list-inside text-rose-800 space-y-1 text-[11px] font-semibold">
                        {result.risks.map((r, i) => <li key={i}>{r}</li>)}
                      </ul>
                    </div>
                  )}
                  {result.nextSteps && result.nextSteps.length > 0 && (
                    <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl">
                      <h4 className="font-bold text-emerald-900 mb-2 flex items-center gap-1.5 text-xs">
                        <PlayCircle size={14} /> Рекомендации
                      </h4>
                      <ul className="list-disc list-inside text-emerald-800 space-y-1 text-[11px] font-semibold">
                        {result.nextSteps.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                  )}
                </div>

                {result.proposedDecisions && result.proposedDecisions.length > 0 && (
                  <div className="border-t pt-4 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Проекты решений</span>
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

      {/* ═══ TAB: Generator ═══ */}
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
                <label className="text-[10px] font-bold text-slate-400 uppercase">Период</label>
                <input type="text" value={period} onChange={e => setPeriod(e.target.value)} className="w-full text-xs p-2.5 border border-slate-200 rounded-xl" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Формат</label>
                <select value={format} onChange={e => setFormat(e.target.value)} className="w-full text-xs p-2.5 border border-slate-200 rounded-xl">
                  <option value="PDF Standard">ГОСТ PDF</option>
                  <option value="Google Sheet">Google Sheets</option>
                  <option value="Markdown DOC">Markdown</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Комментарии</label>
                <textarea rows={3} value={draftText} onChange={e => setDraftText(e.target.value)} placeholder="Замечания по задержкам..." className="w-full text-xs p-2.5 border border-slate-200 rounded-xl" />
              </div>
              <button type="submit" disabled={isGenerating} className="w-full ew-btn ew-btn-primary justify-center disabled:opacity-50">
                {isGenerating ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                {isGenerating ? 'Генерация...' : 'Сгенерировать'}
              </button>
            </form>
          </div>

          <div className="lg:col-span-2">
            {generatedResult ? (
              <div className="bg-slate-900 text-slate-100 rounded-2xl p-6 font-mono text-xs space-y-4 shadow-lg">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <span className="text-[10px] text-emerald-400 font-bold uppercase">Предпросмотр</span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={handleExportExcel}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors"
                      title="Экспорт в CSV для Excel"
                    >
                      <FileSpreadsheet size={13} /> Excel
                    </button>
                    <button
                      onClick={handleExportWord}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors"
                      title="Экспорт в DOC для Word"
                    >
                      <FileText size={13} /> Word
                    </button>
                    <button
                      onClick={handlePrintPDF}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-rose-400 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors"
                      title="Печать PDF формата"
                    >
                      <Download size={13} /> PDF (Печать)
                    </button>
                    <button
                      onClick={() => { navigator.clipboard.writeText(generatedResult); alert('Скопировано!'); }}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors"
                    >
                      <CheckSquare size={13} /> Скопировать
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

      {/* ═══ TAB: Employee Reports ═══ */}
      {activeTab === 'employee' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="ew-card p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Подать отчёт</h3>
            <form onSubmit={handleSubmitSubReport} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">ФИО</label>
                <input type="text" value={newEmployee} onChange={e => setNewEmployee(e.target.value)} placeholder="Сабиров Шерзод" className="w-full text-xs p-2.5 border border-slate-200 rounded-xl" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Департамент</label>
                <select value={newDept} onChange={e => setNewDept(e.target.value)} className="w-full text-xs p-2.5 border border-slate-200 rounded-xl">
                  <option value="Департамент IT и цифровизации">IT</option>
                  <option value="Финансовый департамент">Финансы</option>
                  <option value="Департамент логистики и закупок">Логистика</option>
                  <option value="Аналитический сектор">Аналитика</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Результаты</label>
                <textarea rows={3} value={newAchieve} onChange={e => setNewAchieve(e.target.value)} placeholder="Выполнены контрольные закупки..." className="w-full text-xs p-2.5 border border-slate-200 rounded-xl" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Задержки</label>
                <textarea rows={2} value={newBlockers} onChange={e => setNewBlockers(e.target.value)} placeholder="Отсутствуют..." className="w-full text-xs p-2.5 border border-slate-200 rounded-xl" />
              </div>
              <button type="submit" className="w-full ew-btn ew-btn-primary justify-center">
                Подать на согласование
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Поступившие отчёты</h3>
            {subReports.map(sr => (
              <div key={sr.id} className="ew-card p-5 space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs">{sr.employee}</h4>
                    <span className="text-[9px] font-mono text-slate-400">{sr.department}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                    sr.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {sr.status === 'approved' ? 'Согласован' : 'На утверждении'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Результаты</span>
                    <p className="text-slate-800 mt-0.5">{sr.achievements}</p>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Задержки</span>
                    <p className="text-slate-600 italic mt-0.5">{sr.blockers}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                  <span>Передан: {sr.submittedAt}</span>
                  {sr.status === 'pending_review' && (
                    <button onClick={() => handleApprove(sr.id)} className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[9px] font-bold uppercase">
                      Утвердить
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
