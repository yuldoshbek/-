import React, { useState, useEffect } from 'react';
import { FormInput, Plus, FileText, ExternalLink } from 'lucide-react';
import { getAccessToken } from '../firebase';

export default function Forms() {
  const [forms, setForms] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    setLoading(true);
    try {
      const token = await getAccessToken();
      if (!token) return;
      // Google Drive API to list forms
      const res = await fetch(
        'https://www.googleapis.com/drive/v3/files?q=mimeType="application/vnd.google-apps.form" and trashed=false&orderBy=modifiedTime desc&pageSize=10&fields=files(id,name,webViewLink,modifiedTime)',
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      const data = await res.json();
      if (data.files) {
        setForms(data.files);
      }
    } catch (e) {
      console.error('Error fetching forms', e);
    } finally {
      setLoading(false);
    }
  };

  const createForm = async () => {
    setCreating(true);
    try {
      const token = await getAccessToken();
      if (!token) return;
      
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
        window.open(`https://docs.google.com/forms/d/${data.formId}/edit`, '_blank');
      }
    } catch (e) {
      console.error('Error creating form', e);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <FormInput className="text-blue-600" size={28} />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Опросы (So'rovnomalar)</h1>
            <p className="text-slate-500 mt-1">Manage and generate Google Forms</p>
          </div>
        </div>
        <button 
          onClick={createForm}
          disabled={creating}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg font-medium transition-colors cursor-pointer"
        >
          <Plus size={18} />
          {creating ? 'Создание...' : 'Новый опрос'}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50">
          <h2 className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Последние формы (Recent)</h2>
        </div>
        
        {loading ? (
          <div className="p-12 text-center text-slate-500">Загрузка...</div>
        ) : forms.length === 0 ? (
          <div className="p-12 border-2 border-dashed border-slate-100 m-6 rounded-xl flex flex-col items-center justify-center text-center text-slate-400">
            <FormInput size={48} className="mb-4 opacity-20" />
            <p>Нет доступных опросов. Создайте новый.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {forms.map(form => (
              <div key={form.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-purple-50 text-purple-500 rounded-lg">
                    <FileText size={20} />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900 block">{form.name}</span>
                    <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      Updated: {new Date(form.modifiedTime).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <a 
                  href={form.webViewLink} 
                  target="_blank" 
                  rel="noreferrer"
                  className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Open in Google Forms"
                >
                  <ExternalLink size={18} />
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
