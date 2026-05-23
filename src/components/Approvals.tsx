import React, { useState } from 'react';
import { 
  FileCheck2, 
  Search, 
  Plus, 
  Trash2, 
  User, 
  Activity, 
  Check, 
  X, 
  Download 
} from 'lucide-react';
import { useApprovals } from '../lib/hooks';
import { ApprovalRequest } from '../types';

export default function Approvals() {
  const { approvals, addApproval, signApprovalStep } = useApprovals();

  const [showAdd, setShowAdd] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState<ApprovalRequest['documentType']>('Письмо');
  const [applicant, setApplicant] = useState('');
  const [urgency, setUrgency] = useState<ApprovalRequest['urgency']>('routine');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim() || !applicant.trim()) return;

    addApproval({
      documentTitle: docTitle.trim(),
      documentType: docType,
      applicant: applicant.trim(),
      status: 'pending',
      urgency,
      appointedSigners: ['Каримова Н.М.', 'Юсупов А.Т.'],
      currentSignerIndex: 0
    });

    setDocTitle('');
    setApplicant('');
    setShowAdd(false);
  };

  const handleSignAction = (id: string, action: 'approve' | 'reject') => {
    signApprovalStep(id, action);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6 font-sans">
      <header className="border-b border-slate-200/60 pb-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest font-display">Контроль качества данных</span>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-display mt-1">Центр согласований писем и отчетов (Approvals)</h1>
          <p className="text-slate-500 text-sm mt-0.5">Маршрутизация договоров, служебных писем и отчетов по ведомственным инстанциям ТМК.</p>
        </div>

        <button 
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-750 text-white font-bold px-4 py-2.5 rounded-xl text-xs uppercase cursor-pointer"
        >
          <Plus size={15} />
          <span>Запустить согласование</span>
        </button>
      </header>

      {showAdd && (
        <form onSubmit={handleSubmit} className="bg-white border rounded-2xl p-5 shadow-xs max-w-lg mx-auto space-y-4 text-xs">
          <h3 className="text-xs font-bold uppercase text-slate-800">Регистрация документа к визированию</h3>
          
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Наименование документа / Предмет соглашения</label>
            <input 
              id="app-title"
              type="text" 
              placeholder="Проект регламента транспортного сектора..." 
              value={docTitle}
              onChange={e => setDocTitle(e.target.value)}
              className="w-full p-2 border rounded-xl font-medium"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Категория документа</label>
              <select 
                id="app-type"
                value={docType}
                onChange={e => setDocType(e.target.value as any)}
                className="w-full p-2 border rounded-xl"
              >
                <option value="Письмо">Служебное письмо</option>
                <option value="Отчет">Отчет КПЭ</option>
                <option value="Протокол">Протокол совещания</option>
                <option value="Распоряжение">Распоряжение</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Срочность регламента</label>
              <select 
                id="app-urgency"
                value={urgency}
                onChange={e => setUrgency(e.target.value as any)}
                className="w-full p-2 border rounded-xl"
              >
                <option value="routine">Повседневный</option>
                <option value="urgent">Срочно</option>
                <option value="critical">Критически важно</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Инициатор запроса / ФИО</label>
            <input 
              id="app-applicant"
              type="text" 
              placeholder="Ахмедов У.М. (Директор IT)" 
              value={applicant}
              onChange={e => setApplicant(e.target.value)}
              className="w-full p-2 border rounded-xl"
              required
            />
          </div>

          <div className="flex justify-end gap-2 text-xs pt-1">
            <button type="button" onClick={() => setShowAdd(false)} className="px-3 py-1.5 hover:bg-slate-100 rounded-lg">Отмена</button>
            <button type="submit" className="px-3 py-1.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700">Запустить процесс</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {approvals.map(app => {
          const finishedSigners = app.appointedSigners.slice(0, app.currentSignerIndex);
          const activeSigner = app.appointedSigners[app.currentSignerIndex] || 'Все подписи собраны';
          
          return (
            <div key={app.id} className="bg-white border rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 hover:shadow transition-shadow">
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-slate-50 p-2 border rounded-xl">
                  <span className="text-[10px] font-mono font-extrabold text-[#1E3A8A]">{app.documentType} // Русла СЭД</span>
                  <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase font-mono ${
                    app.status === 'approved' ? 'bg-emerald-50 text-emerald-700' :
                    app.status === 'rejected' ? 'bg-rose-50 text-rose-700' :
                    'bg-amber-50 text-amber-700 animate-pulse'
                  }`}>
                    {app.status === 'approved' ? 'Согласован' : app.status === 'rejected' ? ' Rejected' : 'В обработке'}
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="font-bold text-slate-800 text-xs">{app.documentTitle}</h3>
                  <span className="text-[10px] text-slate-400 block font-medium">Подал: {app.applicant}</span>
                </div>

                {/* Routing timeline card */}
                <div className="p-3 bg-slate-50 rounded-xl space-y-2 border">
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">Лист визирования</span>
                  
                  <div className="space-y-1 text-[11px]">
                    <div className="text-slate-500">Уже визировали: {finishedSigners.length > 0 ? finishedSigners.join(', ') : 'Никто'}</div>
                    <div className="text-slate-800 font-extrabold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
                      <span>Текущий шаг визирования: {activeSigner}</span>
                    </div>
                  </div>
                </div>
              </div>

              {app.status === 'pending' && (
                <div className="flex gap-2 justify-end pt-2 border-t text-[10px] font-bold">
                  <button 
                    onClick={() => handleSignAction(app.id, 'reject')}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg flex items-center gap-0.5 border border-rose-200"
                  >
                    <X size={12} />
                    <span>Отклонить</span>
                  </button>
                  <button 
                    onClick={() => handleSignAction(app.id, 'approve')}
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg flex items-center gap-0.5 border border-emerald-200"
                  >
                    <Check size={12} />
                    <span>Подписать & Направить дальше</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
