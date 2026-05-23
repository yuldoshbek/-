import React, { useState, useEffect } from 'react';
import { FormInput, Plus, FileText, ExternalLink, ShieldAlert } from 'lucide-react';
import { getAccessToken, auth } from '../firebase';

export default function Forms() {
  const [forms, setForms] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);

  const fetchForms = async () => {
    setLoading(true);
    setUnauthorized(false);
    try {
      const token = await getAccessToken();
      if (!token) {
        setUnauthorized(true);
        setLoading(false);
        return;
      }
      const res = await fetch(
        'https://www.googleapis.com/drive/v3/files?q=mimeType="application/vnd.google-apps.form" and trashed=false&orderBy=modifiedTime desc&pageSize=10&fields=files(id,name,webViewLink,modifiedTime)',
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      if (res.status === 401 || res.status === 403) {
        setUnauthorized(true);
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (data.files) {
        setForms(data.files);
      }
    } catch {
      setUnauthorized(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForms();
  }, []);

  const createForm = async () => {
    setCreating(true);
    try {
      const token = await getAccessToken();
      if (!token) {
        alert('Требуется авторизация администратора!');
        return;
      }
      
      const res = await fetch('https://forms.googleapis.com/v1/forms', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          info: {
            title: `Executive Check-in Form - ${new Date().toLocaleDateString()}`
          }
        })
      });
      const data = await res.json();
      if (data.formId) {
        await fetchForms();
        // Fallback or explicit instruction
        window.open(`https://docs.google.com/forms/d/${data.formId}/edit`, '_blank');
      }
    } catch (e) {
      console.error('Error creating form', e);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 font-sans">
      
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200/60 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-display">Опросы и Ведомости (Google Forms)</h1>
          <p className="text-slate-500 text-sm mt-0.5">Создание структурированных опросов сотрудников департаментов и сбор обратной связи по регламентам.</p>
        </div>
        <button 
          onClick={createForm}
          disabled={creating || unauthorized}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-350 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-xl font-bold text-xs uppercase cursor-pointer"
        >
          <Plus size={16} />
          <span>{creating ? 'Создание...' : 'Создать Опрос'}</span>
        </button>
      </header>

      {unauthorized ? (
        <div className="bg-amber-50/50 border border-amber-200 p-8 rounded-2xl flex flex-col items-center text-center space-y-4 max-w-2xl mx-auto mt-12 py-16 shadow-xs">
          <ShieldAlert size={48} className="text-amber-600" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">Режим безопасности: Google Workspace заблокирован</h3>
            <p className="text-xs text-slate-500 font-medium max-w-md">Вы авторизовались как Гость или Свободный администратор. Для построения опросов и прямой интеграции с Google Forms нажмите кнопку в верхней части Dashboard для получения OAuth токенов Google.</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <h2 className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Активные гугл-формы в Google Drive</h2>
          </div>
          
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs">Получение списка файлов из Google Drive API...</div>
          ) : forms.length === 0 ? (
            <div className="p-16 flex flex-col items-center justify-center text-center text-slate-400 space-y-3">
              <FormInput size={40} className="opacity-35" />
              <p className="text-xs font-semibold">Опросных листов не найдено</p>
              <p className="text-[10px] max-w-xs">Создайте опрос с помощью кнопки верхнего меню.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {forms.map(form => (
                <div key={form.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                      <FileText size={18} />
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 block">{form.name}</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Изменен: {new Date(form.modifiedTime).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <a 
                    href={form.webViewLink} 
                    target="_blank" 
                    rel="noreferrer"
                    className="p-2 hover:bg-slate-100 text-slate-400 hover:text-blue-600 rounded-lg transition-colors cursor-pointer"
                  >
                    <ExternalLink size={16} />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
