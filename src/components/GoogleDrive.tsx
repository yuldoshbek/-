import React, { useState, useEffect } from 'react';
import { 
  Folder, 
  File, 
  FileText, 
  Grid, 
  List, 
  Upload, 
  Plus, 
  Trash2, 
  ExternalLink, 
  Search, 
  ChevronRight, 
  Home, 
  ShieldAlert, 
  Sparkles,
  RefreshCw,
  FolderPlus
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

export default function GoogleDrive() {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Navigation stack
  const [folderStack, setFolderStack] = useState<{ id: string; name: string }[]>([
    { id: 'root', name: 'Главная (Root)' }
  ]);
  const currentFolder = folderStack[folderStack.length - 1];

  // Visual options
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [uploading, setUploading] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

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

      // Build search query based on current folder and search query
      let query = `'${currentFolder.id}' in parents and trashed = false`;
      if (searchQuery.trim()) {
        query += ` and name contains '${searchQuery.replace(/'/g, "\\'")}'`;
      }

      const res = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&orderBy=folder,name,modifiedTime desc&pageSize=30&fields=files(id,name,mimeType,webViewLink,modifiedTime,size)`,
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
        setFiles(data.files);
      } else {
        setFiles([]);
      }
    } catch (e) {
      console.error(e);
      setUnauthorized(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [currentFolder, searchQuery]);

  const navigateToFolder = (id: string, name: string) => {
    setFolderStack([...folderStack, { id, name }]);
  };

  const navigateBackTo = (index: number) => {
    setFolderStack(folderStack.slice(0, index + 1));
  };

  // Upload file support
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    const file = fileList[0];

    setUploading(true);
    try {
      const token = await getAccessToken();
      if (!token) {
        alert('Требуется авторизация учетной записи Google!');
        return;
      }

      const metadata = {
        name: file.name,
        parents: [currentFolder.id]
      };

      const formData = new FormData();
      formData.append(
        'metadata',
        new Blob([JSON.stringify(metadata)], { type: 'application/json' })
      );
      formData.append('file', file);

      const res = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,modifiedTime',
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        }
      );

      const uploadedFile = await res.json();
      if (uploadedFile.id) {
        alert(`Файл "${file.name}" подготовлен и успешно закачан в Google Диск!`);
        fetchFiles();
      } else {
        throw new Error('Upload output is empty');
      }
    } catch (e) {
      console.error(e);
      alert('Ошибка при загрузке файла. Пожалуйста, убедитесь в сетевом доступе к Google Drive API.');
    } finally {
      setUploading(false);
    }
  };

  // Create folder inside current folder
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    setLoading(true);
    try {
      const token = await getAccessToken();
      if (!token) return;

      const res = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newFolderName,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [currentFolder.id]
        })
      });

      if (res.ok) {
        setNewFolderName('');
        setCreatingFolder(false);
        fetchFiles();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Delete File / Folder with explicit safety warning dialog
  const handleDeleteFile = async (fileId: string, fileName: string) => {
    const confirmed = window.confirm(
      `Вы действительно хотите удалить файл/папку "${fileName}" из Google Диска? Это действие перенесет его в корзину.`
    );
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
        alert('Объект успешно удален!');
        fetchFiles();
      } else {
        // Fallback: update metadata to trash=true
        const patchRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ trashed: true })
        });
        if (patchRes.ok) {
          alert('Объект успешно перемещен в корзину!');
          fetchFiles();
        } else {
          alert('Ошибка при выполнении операции удаления.');
        }
      }
    } catch (e) {
      console.error(e);
      alert('Ошибка при выполнении запроса к корзине.');
    } finally {
      setLoading(false);
    }
  };

  // Get matching icon depending on Google Mime Types
  const getFileIcon = (mimeType: string) => {
    if (mimeType === 'application/vnd.google-apps.folder') {
      return <Folder className="text-blue-500 fill-blue-500/20" size={24} />;
    }
    if (mimeType.includes('document') || mimeType === 'application/vnd.google-apps.document') {
      return <FileText className="text-indigo-500" size={24} />;
    }
    if (mimeType.includes('spreadsheet') || mimeType === 'application/vnd.google-apps.spreadsheet') {
      return <FileText className="text-emerald-500" size={24} />;
    }
    if (mimeType.includes('presentation') || mimeType === 'application/vnd.google-apps.presentation') {
      return <FileText className="text-orange-500" size={24} />;
    }
    if (mimeType.includes('form') || mimeType === 'application/vnd.google-apps.form') {
      return <FileText className="text-purple-500" size={24} />;
    }
    return <File className="text-slate-400" size={24} />;
  };

  const getFormatSize = (bytes?: string) => {
    if (!bytes) return 'N/A';
    const num = parseInt(bytes, 10);
    if (isNaN(num)) return 'N/A';
    if (num < 1024) return `${num} B`;
    if (num < 1048576) return `${(num / 1024).toFixed(1)} KB`;
    return `${(num / 1048576).toFixed(1)} MB`;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* Header section */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200/60 pb-5">
        <div>
          <span className="text-xs font-bold text-blue-600 uppercase tracking-widest font-display">Единое облако документов</span>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-display mt-1">Оптимизированный Google Диск</h1>
          <p className="text-slate-500 text-sm mt-0.5">Файловый менеджер СЭД. Полный обзор директорий, загрузка регламентов ведомств, создание папок и контроль версий документов.</p>
        </div>

        <div className="flex gap-2">
          {/* Create folder trigger */}
          <button 
            id="drive-create-folder-btn"
            onClick={() => setCreatingFolder(true)}
            disabled={unauthorized}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-800 font-bold px-4 py-2.5 rounded-xl text-xs uppercase cursor-pointer"
          >
            <FolderPlus size={15} />
            <span>Папка</span>
          </button>

          {/* Upload file trigger */}
          <label className={`flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs uppercase cursor-pointer transition-colors shadow-sm ${unauthorized ? 'opacity-50 pointer-events-none' : ''}`}>
            <Upload size={15} />
            <span>Загрузить</span>
            <input 
              id="drive-file-upload-input"
              type="file" 
              onChange={handleFileUpload} 
              className="hidden" 
              disabled={uploading || unauthorized} 
            />
          </label>
        </div>
      </header>

      {unauthorized ? (
        <div className="bg-amber-50/50 border border-amber-200 p-8 rounded-2xl flex flex-col items-center text-center space-y-4 max-w-2xl mx-auto mt-12 py-16 shadow-xs">
          <ShieldAlert size={48} className="text-amber-600" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">Режим безопасности: Google Workspace заблокирован</h3>
            <p className="text-xs text-slate-500 font-medium max-w-md">Вы авторизовались как Гость или Свободный администратор. Для двухсторонней синхронизации дел с Google Диском нажмите кнопку авторизации в верхней части Dashboard для получения OAuth токенов Google.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* Create folder modal header popup */}
          {creatingFolder && (
            <div className="bg-white border p-4 rounded-xl shadow-xs border-blue-200 max-w-sm flex flex-col gap-3">
              <h4 className="text-xs font-bold text-slate-800">Создание новой папки</h4>
              <form onSubmit={handleCreateFolder} className="flex gap-2">
                <input 
                  id="new-folder-name-input"
                  type="text" 
                  placeholder="Имя папки..." 
                  value={newFolderName}
                  onChange={e => setNewFolderName(e.target.value)}
                  className="px-3 py-1.5 border rounded-lg text-xs flex-1"
                  required
                />
                <button type="submit" className="bg-blue-600 text-white font-bold px-3 rounded-lg text-xs">Создать</button>
                <button type="button" onClick={() => setCreatingFolder(false)} className="bg-slate-100 text-slate-600 font-bold px-3 rounded-lg text-xs">Отмена</button>
              </form>
            </div>
          )}

          {/* Breadcrumbs Row & Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50 border border-slate-200/80 p-3.5 rounded-xl gap-4">
            {/* Breadcrumb path navigation */}
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 flex-wrap">
              <Home size={14} className="text-slate-400 shrink-0" />
              {folderStack.map((f, i) => (
                <React.Fragment key={f.id}>
                  {i > 0 && <ChevronRight size={12} className="text-slate-300" />}
                  <button 
                    onClick={() => navigateBackTo(i)}
                    className={`hover:text-blue-600 transition-colors ${i === folderStack.length - 1 ? 'text-slate-900 font-extrabold cursor-default' : ''}`}
                  >
                    {f.name}
                  </button>
                </React.Fragment>
              ))}
            </div>

            {/* Display filters */}
            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
              {/* Searching index */}
              <div className="relative w-full sm:w-48">
                <Search size={14} className="absolute left-2.5 top-2 text-slate-400" />
                <input 
                  id="drive-search-input"
                  type="text" 
                  placeholder="Поиск файлов..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full text-[11px] border bg-white pl-7 pr-3 py-1.5 rounded-lg text-slate-800"
                />
              </div>

              {/* View options grid/list */}
              <div className="flex border border-slate-200 p-0.5 rounded-lg bg-white shrink-0">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-1 rounded ${viewMode === 'grid' ? 'bg-slate-100 text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <Grid size={13} />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={`p-1 rounded ${viewMode === 'list' ? 'bg-slate-100 text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <List size={13} />
                </button>
              </div>

              {/* Reload Button */}
              <button 
                onClick={fetchFiles}
                className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-slate-700 shrink-0"
                title="Обновить"
              >
                <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* Loader or file table rendering */}
          {loading && files.length === 0 ? (
            <div className="p-24 text-center text-slate-400 text-xs flex flex-col items-center gap-3">
              <div className="w-6 h-6 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
              <span>Семантическое чтение каталогов Google Drive API...</span>
            </div>
          ) : files.length === 0 ? (
            <div className="p-16 flex flex-col items-center justify-center text-center text-slate-400 bg-white border border-slate-200/80 rounded-xl space-y-3">
              <Folder size={36} className="opacity-30" />
              <p className="text-xs font-semibold">Каталог пуст</p>
              <p className="text-[10px] max-w-xs text-slate-400">В этой папке нет доступных файлов или папок. Загрузите файлы или создайте структуру.</p>
            </div>
          ) : viewMode === 'grid' ? (
            /* Grid directory presentation */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {files.map(file => {
                const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
                return (
                  <div 
                    key={file.id} 
                    className="p-4 bg-white border border-slate-200/80 rounded-xl shadow-xs hover:shadow transition-shadow flex flex-col justify-between space-y-3 relative group"
                  >
                    <div className="flex gap-3 items-start">
                      <div className="shrink-0">{getFileIcon(file.mimeType)}</div>
                      <div className="space-y-0.5 pr-6 truncate">
                        {isFolder ? (
                          <button 
                            onClick={() => navigateToFolder(file.id, file.name)}
                            className="font-bold text-slate-800 hover:text-blue-600 block text-xs underline decoration-dotted truncate"
                          >
                            {file.name}
                          </button>
                        ) : (
                          <span className="font-bold text-slate-800 block text-xs truncate" title={file.name}>{file.name}</span>
                        )}
                        <span className="text-[9px] text-slate-400 block">
                          {new Date(file.modifiedTime).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-slate-50 text-[10px]">
                      <span className="text-slate-400 font-mono">{isFolder ? 'Папка' : getFormatSize(file.size)}</span>
                      
                      <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        <a 
                          href={file.webViewLink} 
                          target="_blank" 
                          rel="noreferrer"
                          className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors"
                          title="Открыть в Google"
                        >
                          <ExternalLink size={13} />
                        </a>
                        <button 
                          onClick={() => handleDeleteFile(file.id, file.name)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                          title="Удалить"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* List rendering */
            <div className="bg-white rounded-xl border border-slate-200/85 overflow-hidden text-xs">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-150 text-[10px] uppercase text-slate-400 font-bold tracking-wider">
                    <th className="p-3 px-4">Имя файла</th>
                    <th className="p-3">Тип</th>
                    <th className="p-3">Размер</th>
                    <th className="p-3">Изменен</th>
                    <th className="p-3 text-right">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {files.map(file => {
                    const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
                    return (
                      <tr key={file.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-3 px-4 flex items-center gap-3 font-semibold text-slate-800">
                          {getFileIcon(file.mimeType)}
                          {isFolder ? (
                            <button 
                              onClick={() => navigateToFolder(file.id, file.name)}
                              className="text-blue-600 hover:underline cursor-pointer"
                            >
                              {file.name}
                            </button>
                          ) : (
                            <span className="truncate max-w-sm">{file.name}</span>
                          )}
                        </td>
                        <td className="p-3 text-slate-500 font-mono text-[10px]">{isFolder ? 'Папка' : file.mimeType.split('/').pop()}</td>
                        <td className="p-3 text-slate-500 font-mono">{isFolder ? '—' : getFormatSize(file.size)}</td>
                        <td className="p-3 text-slate-400 font-mono">{new Date(file.modifiedTime).toLocaleDateString()}</td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-2.5">
                            <a 
                              href={file.webViewLink} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-slate-400 hover:text-blue-600 transition-colors"
                            >
                              <ExternalLink size={14} />
                            </a>
                            <button 
                              onClick={() => handleDeleteFile(file.id, file.name)}
                              className="text-slate-400 hover:text-rose-600 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
