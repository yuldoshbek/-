import React, { useState } from 'react';
import { 
  History, 
  Search, 
  ShieldAlert, 
  Database, 
  Eye, 
  Lock, 
  ExternalLink 
} from 'lucide-react';

interface AuditLog {
  id: string;
  timestamp: string;
  executor: string;
  operation: string;
  component: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
  details: string;
}

const initialAuditLogs: AuditLog[] = [
  {
    id: 'aud-1',
    timestamp: '2026-05-23 18:42:15',
    executor: 'yuldoshbekkhasanov@gmail.com',
    operation: 'EXPORT_TO_GOOGLE_DOCS',
    component: 'Генератор протоколов',
    status: 'SUCCESS',
    details: 'Успешная сборка и пилотная заливка протокола №ЕД-41 на Google Drive.'
  },
  {
    id: 'aud-2',
    timestamp: '2026-05-23 17:15:02',
    executor: 'yuldoshbekkhasanov@gmail.com',
    operation: 'RECLASSIFY_RISK',
    component: 'Реестр рисков',
    status: 'WARNING',
    details: 'Перераспределена степень тяжести задержки грузов на Яллама на уровень high.'
  },
  {
    id: 'aud-3',
    timestamp: '2026-05-23 15:30:11',
    executor: 'System Sandbox',
    operation: 'EXECUTIVE_SECURE_AUTH',
    component: 'Вход в СЭД',
    status: 'SUCCESS',
    details: 'Зарегистрирован вход пользователя в гостевом (Offline) режиме СЭД ТМК.'
  }
];

export default function Audit() {
  const [logs] = useState<AuditLog[]>(initialAuditLogs);
  const [search, setSearch] = useState('');

  const filtered = logs.filter(l => 
    l.executor.toLowerCase().includes(search.toLowerCase()) || 
    l.operation.toLowerCase().includes(search.toLowerCase()) ||
    l.details.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6 font-sans">
      <header className="border-b border-slate-200/60 pb-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs font-bold text-slate-600 uppercase tracking-widest font-display">Безопасность и Логи СЭД</span>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-display mt-1">Реестр аудита безопасности (Audit Hub)</h1>
          <p className="text-slate-500 text-sm mt-0.5">Логирование транзакций обмена данными с Google Drive, контроль за доступом к КПЭ отделов и служебным письмам.</p>
        </div>
      </header>

      <div className="bg-white border rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl flex-wrap gap-4">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
            <input 
              id="aud-search"
              type="text" 
              placeholder="Фильтр по операциям, исполнителю или деталям..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full text-xs border bg-white pl-8 pr-4 py-2 rounded-xl"
            />
          </div>

          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
            СЭД СКВОЗНОЙ ЛОГ АКТИВЕН // ИНТЕГРИРОВАНО С FIREBASE
          </span>
        </div>

        <div className="space-y-3.5">
          {filtered.map(log => (
            <div key={log.id} className="border p-4 rounded-2xl bg-white shadow-xs space-y-3">
              <div className="flex justify-between items-start md:items-center flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Database size={15} className="text-slate-500" />
                  <span className="text-xs font-mono font-extrabold text-indigo-600">{log.operation}</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase font-mono ${
                  log.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-700' :
                  log.status === 'WARNING' ? 'bg-amber-50 text-amber-700' :
                  'bg-rose-50 text-rose-700'
                }`}>
                  {log.status}
                </span>
              </div>

              <p className="text-xs text-slate-800 leading-snug">{log.details}</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[10px] text-slate-400 font-mono border-t pt-2">
                <span>Время: {log.timestamp}</span>
                <span>Инициатор: {log.executor}</span>
                <span>Модуль СЭД: {log.component}</span>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <p className="text-center text-slate-400 text-xs py-8">История операций пуста.</p>
          )}
        </div>
      </div>
    </div>
  );
}
