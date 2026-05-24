import React, { useState, useEffect } from 'react';
import { 
  FolderOpen, FileText, FileSpreadsheet, Upload, Plus, Trash2, 
  ExternalLink, Search, RefreshCw, ShieldAlert, Grid, List,
  Folder, File, ChevronRight, Home, FolderPlus
} from 'lucide-react';
import { getAccessToken } from '../firebase';

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  modifiedTime: string;
  size?: string;
}

type DocTab = 'drive' | 'docs' | 'sheets';

export default function Documents() {
  const [activeTab, setActiveTab] = useState<DocTab>('drive');
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Drive navigation
  const [folderStack, setFolderStack] = useState<{ id: string; name: string }[]>([
    { id: 'root', name: 'Главная' }
  ]);
  const currentFolder = folderStack[folderStack.length - 1];

  // Create new
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const getMimeFilter = (): string => {
    switch (activeTab) {
      case 'docs': return 'mimeType="application/vnd.google-apps.document" and ';
      case 'sheets': return 'mimeType="application/vnd.google-apps.spreadsheet" and ';
      default: return '';
    }
  };

  const fetchFiles = async () => {
    setLoading(true);
    setUnauthorized(false);
    try {
      const token = await getAccessToken();
      if (!token) {
        setUnauthorized(true);
        setLoading(false);
        return;
      }

      let query = getMimeFilter();
      if (activeTab === 'drive') {
        query += `'${currentFolder.id}' in parents and `;
      }
      query += 'trashed = false';
      if (searchQuery.trim()) {
        query += ` and name contains '${searchQuery.replace(/'/g, "\\'")}'`;
      }

      const res = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&orderBy=folder,name,modifiedTime desc&pageSize=30&fields=files(id,name,mimeType,webViewLink,modifiedTime,size)`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.status === 401 || res.status === 403) {
        setUnauthorized(true);
        setLoading(false);
        return;
      }

      const data = await res.json();
      setFiles(data.files || []);
    } catch {
      setUnauthorized(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [activeTab, searchQuery, currentFolder.id]);

  const navigateToFolder = (file: DriveFile) => {
    if (file.mimeType === 'application/vnd.google-apps.folder') {
      setFolderStack(prev => [...prev, { id: file.id, name: file.name }]);
    }
  };

  const navigateBack = (index: number) => {
    setFolderStack(prev => prev.slice(0, index + 1));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const token = await getAccessToken();
      if (!token) return;

      const mimeType = activeTab === 'sheets'
        ? 'application/vnd.google-apps.spreadsheet'
        : activeTab === 'docs'
          ? 'application/vnd.google-apps.document'
          : 'application/vnd.google-apps.folder';

      const res = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newTitle,
          mimeType,
          ...(activeTab === 'drive' && currentFolder.id !== 'root' ? { parents: [currentFolder.id] } : {})
        })
      });

      const file = await res.json();
      if (file.id) {
        setNewTitle('');
        setShowCreateForm(false);
        await fetchFiles();
        if (file.webViewLink) {
          window.open(file.webViewLink, '_blank');
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (fileId: string, name: string) => {
    const confirmed = window.confirm(`Переместить "${name}" в корзину?`);
    if (!confirmed) return;
    try {
      const token = await getAccessToken();
      if (!token) return;

      await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ trashed: true })
      });
      fetchFiles();
    } catch (e) {
      console.error(e);
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType === 'application/vnd.google-apps.folder') return <Folder size={18} className="text-blue-500" />;
    if (mimeType.includes('document')) return <FileText size={18} className="text-blue-600" />;
    if (mimeType.includes('spreadsheet')) return <FileSpreadsheet size={18} className="text-emerald-600" />;
    if (mimeType.includes('presentation')) return <FileText size={18} className="text-amber-600" />;
    return <File size={18} className="text-slate-400" />;
  };

  const getCreateLabel = () => {
    if (activeTab === 'docs') return 'Новый документ';
    if (activeTab === 'sheets') return 'Новая таблица';
    return 'Новая папка';
  };

  return (
    <div className="ew-page p-6 lg:p-8 max-w-7xl mx-auto font-sans space-y-6">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 font-display">Документы</h1>
          <p className="text-slate-500 text-sm mt-0.5">Google Workspace — Диск, Документы, Таблицы</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="ew-tabs">
            {[
              { id: 'drive' as DocTab, label: 'Диск', icon: <FolderOpen size={14} /> },
              { id: 'docs' as DocTab, label: 'Документы', icon: <FileText size={14} /> },
              { id: 'sheets' as DocTab, label: 'Таблицы', icon: <FileSpreadsheet size={14} /> },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSearchQuery(''); }}
                className={`ew-tab flex items-center gap-1.5 ${activeTab === tab.id ? 'active' : ''}`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {unauthorized ? (
        <div className="bg-amber-50/50 border border-amber-200 p-12 rounded-2xl flex flex-col items-center text-center space-y-4 max-w-2xl mx-auto shadow-sm">
          <ShieldAlert size={48} className="text-amber-500" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">Требуется авторизация Google</h3>
            <p className="text-xs text-slate-500 font-medium max-w-md">
              Войдите через Google для синхронизации с Google Drive, Docs и Sheets.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Toolbar */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Поиск файлов..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full text-sm pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400"
                />
              </div>

              {/* Breadcrumbs for Drive */}
              {activeTab === 'drive' && folderStack.length > 1 && (
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  {folderStack.map((folder, idx) => (
                    <React.Fragment key={folder.id}>
                      {idx > 0 && <ChevronRight size={12} />}
                      <button
                        onClick={() => navigateBack(idx)}
                        className={`hover:text-blue-600 font-medium cursor-pointer ${idx === folderStack.length - 1 ? 'text-slate-800 font-bold' : ''}`}
                      >
                        {idx === 0 ? <Home size={14} /> : folder.name}
                      </button>
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="ew-btn ew-btn-primary"
              >
                <Plus size={14} /> {getCreateLabel()}
              </button>
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="ew-btn ew-btn-ghost"
              >
                {viewMode === 'grid' ? <List size={14} /> : <Grid size={14} />}
              </button>
              <button onClick={fetchFiles} className="ew-btn ew-btn-ghost">
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* Create form */}
          {showCreateForm && (
            <form onSubmit={handleCreate} className="flex gap-3 items-center p-4 bg-blue-50 rounded-xl border border-blue-100">
              <input
                type="text"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder={`Название ${activeTab === 'docs' ? 'документа' : activeTab === 'sheets' ? 'таблицы' : 'папки'}...`}
                className="flex-1 text-sm px-4 py-2.5 border rounded-xl bg-white focus:outline-none focus:border-blue-400"
                required
                autoFocus
              />
              <button type="submit" disabled={creating} className="ew-btn ew-btn-primary">
                {creating ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
                Создать
              </button>
              <button type="button" onClick={() => setShowCreateForm(false)} className="ew-btn ew-btn-ghost">
                Отмена
              </button>
            </form>
          )}

          {/* Files grid/list */}
          {loading && files.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="ew-shimmer h-36 rounded-xl" />
              ))}
            </div>
          ) : files.length === 0 ? (
            <div className="p-16 flex flex-col items-center justify-center text-center text-slate-400 ew-card space-y-3">
              <FolderOpen size={40} className="opacity-30" />
              <p className="text-sm font-semibold">Файлов не найдено</p>
              <p className="text-xs max-w-xs">Создайте первый файл или перейдите в другую вкладку.</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {files.map(file => (
                <div
                  key={file.id}
                  className="ew-card p-4 flex flex-col justify-between h-36 group cursor-pointer"
                  onClick={() => navigateToFolder(file)}
                >
                  <div className="space-y-2">
                    <div className="p-2 bg-slate-50 rounded-lg w-fit">
                      {getFileIcon(file.mimeType)}
                    </div>
                    <p className="font-semibold text-slate-800 text-xs truncate" title={file.name}>{file.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {new Date(file.modifiedTime).toLocaleDateString('ru-RU')}
                    </p>
                  </div>

                  {file.mimeType !== 'application/vnd.google-apps.folder' && (
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a
                        href={file.webViewLink}
                        target="_blank"
                        rel="noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"
                      >
                        <ExternalLink size={14} />
                      </a>
                      <button
                        onClick={e => { e.stopPropagation(); handleDelete(file.id, file.name); }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="ew-card divide-y divide-slate-100 overflow-hidden">
              {files.map(file => (
                <div
                  key={file.id}
                  className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 cursor-pointer group"
                  onClick={() => navigateToFolder(file)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {getFileIcon(file.mimeType)}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{file.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {new Date(file.modifiedTime).toLocaleDateString('ru-RU')}
                        {file.size && ` • ${(parseInt(file.size) / 1024).toFixed(1)} KB`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                    {file.mimeType !== 'application/vnd.google-apps.folder' && (
                      <>
                        <a
                          href={file.webViewLink}
                          target="_blank"
                          rel="noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg"
                        >
                          <ExternalLink size={14} />
                        </a>
                        <button
                          onClick={e => { e.stopPropagation(); handleDelete(file.id, file.name); }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                    {file.mimeType === 'application/vnd.google-apps.folder' && (
                      <ChevronRight size={16} className="text-slate-300" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
