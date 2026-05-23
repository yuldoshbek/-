import React, { useState, useEffect } from 'react';
import { Presentation as PresentationIcon, Plus, FileText, ExternalLink, ShieldAlert } from 'lucide-react';
import { getAccessToken } from '../firebase';

export default function Presentations() {
  const [slides, setSlides] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);

  const fetchPresentations = async () => {
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
        'https://www.googleapis.com/drive/v3/files?q=mimeType="application/vnd.google-apps.presentation" and trashed=false&orderBy=modifiedTime desc&pageSize=10&fields=files(id,name,webViewLink,modifiedTime)',
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
        setSlides(data.files);
      }
    } catch {
      setUnauthorized(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPresentations();
  }, []);

  const createPresentation = async () => {
    setCreating(true);
    try {
      const token = await getAccessToken();
      if (!token) {
        alert('Пожалуйста, авторизуйте Google Workspace для создания слайдов!');
        return;
      }
      
      const res = await fetch('https://slides.googleapis.com/v1/presentations', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: `Executive Briefing - ${new Date().toLocaleDateString()}`
        })
      });
      const data = await res.json();
      if (data.presentationId) {
        await fetchPresentations();
        window.open(`https://docs.google.com/presentation/d/${data.presentationId}/edit`, '_blank');
      }
    } catch (e) {
      console.error('Error creating presentation', e);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 font-sans">
      
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200/60 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-display">Доклады и Слайды (Google Slides)</h1>
          <p className="text-slate-500 text-sm mt-0.5">Создание интерактивных презентаций для защиты бюджетов перед Кабинетом Министров.</p>
        </div>
        <button 
          onClick={createPresentation}
          disabled={creating || unauthorized}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-350 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-xl font-bold text-xs uppercase cursor-pointer"
        >
          <Plus size={16} />
          <span>{creating ? 'Создание...' : 'Создать Презентацию'}</span>
        </button>
      </header>

      {unauthorized ? (
        <div className="bg-amber-50/50 border border-amber-200 p-8 rounded-2xl flex flex-col items-center text-center space-y-4 max-w-2xl mx-auto mt-12 py-16 shadow-xs">
          <ShieldAlert size={48} className="text-amber-600" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">Режим безопасности: Google Workspace заблокирован</h3>
            <p className="text-xs text-slate-500 font-medium max-w-md">Вы авторизовались как Гость или Свободный администратор. Для прямого создания и редактирования слайдов Google Slides нажмите на авторизацию в Dashboard для связи с Google Drive API.</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden text-xs">
          <div className="p-4 border-b border-slate-100 bg-slate-50">
            <h2 className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Последние презентации в Google Диск</h2>
          </div>
          
          {loading ? (
            <div className="p-12 text-center text-slate-400">Загрузка структуры файлов презентаций...</div>
          ) : slides.length === 0 ? (
            <div className="p-16 flex flex-col items-center justify-center text-center text-slate-400 space-y-3">
              <PresentationIcon size={32} className="opacity-35" />
              <p className="text-xs font-semibold font-display">Докладов не создано</p>
              <p className="text-[10px] max-w-xs">Создайте презентацию с помощью верхней кнопки и оформите ее.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {slides.map(slide => (
                <div key={slide.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-orange-50 text-orange-600 rounded-lg">
                      <FileText size={18} />
                    </div>
                    <div>
                      <span className="font-bold text-slate-800 block text-xs">{slide.name}</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Обновлено: {new Date(slide.modifiedTime).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <a 
                    href={slide.webViewLink} 
                    target="_blank" 
                    rel="noreferrer"
                    className="p-2 text-slate-450 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
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
