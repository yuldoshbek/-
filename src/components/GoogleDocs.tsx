import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  ExternalLink, 
  Trash2, 
  Search, 
  ShieldAlert, 
  Sparkles,
  RefreshCw 
} from 'lucide-react';
import { getAccessToken } from '../firebase';

interface DocFile {
  id: string;
  name: string;
  webViewLink: string;
  modifiedTime: string;
}

export default function GoogleDocs() {
  const [docs, setDocs] = useState<DocFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const fetchDocs = async () => {
    setLoading(true);
    setUnauthorized(false);
    try {
      const token = await getAccessToken();
      if (!token) {
        setUnauthorized(true);
        setLoading(false);
        return;
      }

      // Query only Documents
      let query = `mimeType="application/vnd.google-apps.document" and trashed = false`;
      if (searchQuery.trim()) {
        query += ` and name contains '${searchQuery.replace(/'/g, "\\'")}'`;
      }

      const res = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&orderBy=modifiedTime desc&pageSize=15&fields=files(id,name,webViewLink,modifiedTime)`,
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
        setDocs(data.files);
      } else {
        setDocs([]);
      }
    } catch {
      setUnauthorized(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [searchQuery]);

  const handleCreateDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setCreating(true);
    try {
      const token = await getAccessToken();
      if (!token) {
        alert('Требуется авторизация администратора!');
        return;
      }

      const res = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newTitle,
          mimeType: 'application/vnd.google-apps.document'
        })
      });

      const file = await res.json();
      if (file.id) {
        setNewTitle('');
        await fetchDocs();
        window.open(`https://docs.google.com/documents/d/${file.id}/edit`, '_blank');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (fileId: string, name: string) => {
    const confirmed = window.confirm(`Перенести документ "${name}" в корзину Google Диска?`);
    if (!confirmed) return;

    setLoading(true);
    try {
      const token = await getAccessToken();
      if (!token) return;

      const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok || res.status === 204) {
        alert('Документ успешно удален!');
        fetchDocs();
      } else {
        // Fallback PATCH to trash
        await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ trashed: true })
        });
        alert('Документом успешно пожертвовали в архив.');
        fetchDocs();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* Header section */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200/60 pb-5">
        <div>
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest font-display">Текстовые регламенты</span>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-display mt-1">Гугл Документы (Google Docs)</h1>
          <p className="text-slate-500 text-sm mt-0.5">Раздел разработки писем, регламентов, справок и ведомственных распоряжений в режиме совместного доступа.</p>
        </div>

        <form onSubmit={handleCreateDoc} className="flex gap-2 w-full md:w-auto">
          <input 
            id="new-doc-title-input"
            type="text" 
            placeholder="Название нового регламента..." 
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            disabled={unauthorized}
            className="px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs flex-1 md:w-64"
            required
          />
          <button 
            id="create-doc-btn"
            type="submit"
            disabled={creating || unauthorized}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl font-bold text-xs uppercase cursor-pointer"
          >
            <Plus size={16} />
            <span>{creating ? 'Слайд...' : 'Документ'}</span>
          </button>
        </form>
      </header>

      {unauthorized ? (
        <div className="bg-amber-50/50 border border-amber-200 p-8 rounded-2xl flex flex-col items-center text-center space-y-4 max-w-2xl mx-auto mt-12 py-16 shadow-xs">
          <ShieldAlert size={48} className="text-amber-600" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">Режим безопасности: Google Workspace заблокирован</h3>
            <p className="text-xs text-slate-500 font-medium max-w-md">Вы авторизовались как Гость или Свободный администратор. Для двухсторонней синхронизации дел с Google Документами нажмите кнопку авторизации на Dashboard.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* Filtering bar */}
          <div className="flex justify-between items-center text-xs text-slate-500">
            <div className="relative w-80">
              <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
              <input 
                id="docs-search-input"
                type="text" 
                placeholder="Поиск по регламентам и бумагам..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full text-xs border border-slate-200 bg-slate-50/50 pl-8 pr-4 py-2 rounded-xl text-slate-800 focus:outline-none"
              />
            </div>

            <button 
              onClick={fetchDocs}
              className="p-2 border rounded-xl bg-white hover:bg-slate-50 transition-colors flex items-center gap-1.5 font-bold"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              <span>Обновить</span>
            </button>
          </div>

          {/* Docs dynamic grid */}
          {loading && docs.length === 0 ? (
            <div className="p-24 text-center text-slate-400 text-xs">Получение структуры документов из Google Docs API...</div>
          ) : docs.length === 0 ? (
            <div className="p-16 flex flex-col items-center justify-center text-center text-slate-400 bg-white border rounded-xl space-y-3 shadow-xs">
              <FileText size={36} className="opacity-30" />
              <p className="text-xs font-semibold">Документы регламентов отсутствуют</p>
              <p className="text-[10px] max-w-xs">Создайте первый документ с планом регламента в верхнем поле ввода.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {docs.map(doc => (
                <div 
                  key={doc.id} 
                  className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-xs hover:shadow-md transition-shadow relative flex flex-col justify-between h-44 group"
                >
                  <div className="space-y-2">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg w-fit">
                      <FileText size={18} />
                    </div>
                    <span className="font-bold text-slate-800 block text-xs truncate" title={doc.name}>{doc.name}</span>
                    <span className="text-[9px] text-slate-400 block font-mono">
                      Изменен: {new Date(doc.modifiedTime).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex justify-end items-center gap-2 pt-3 border-t border-slate-50">
                    <a 
                      href={doc.webViewLink} 
                      target="_blank" 
                      rel="noreferrer"
                      className="p-2 hover:bg-slate-50 text-slate-400 hover:text-blue-600 rounded-xl transition-colors shrink-0"
                      title="Открыть совместный доступ"
                    >
                      <ExternalLink size={14} />
                    </a>
                    <button 
                      onClick={() => handleDelete(doc.id, doc.name)}
                      className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition-colors shrink-0"
                      title="Удалить"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      )}
    </div>
  );
}
