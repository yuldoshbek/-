import React, { useState, useEffect } from 'react';
import { 
  Pin, 
  Plus, 
  Search, 
  Trash2, 
  Sparkles, 
  ShieldAlert, 
  Check, 
  CheckSquare, 
  Palette, 
  Tag, 
  ExternalLink,
  Save, 
  FileText 
} from 'lucide-react';
import { getAccessToken } from '../firebase';
import { useKeepNotes } from '../lib/hooks';
import { KeepNote } from '../types';

const colorsList = [
  { name: 'default', bg: 'bg-white border-slate-200' },
  { name: 'yellow', bg: 'bg-amber-50/95 border-amber-200 text-amber-950' },
  { name: 'blue', bg: 'bg-blue-50/95 border-blue-200 text-blue-950' },
  { name: 'green', bg: 'bg-emerald-50/95 border-emerald-200 text-emerald-950' },
  { name: 'red', bg: 'bg-rose-50/95 border-rose-200 text-rose-950' },
  { name: 'purple', bg: 'bg-purple-50/95 border-purple-200 text-purple-950' },
  { name: 'orange', bg: 'bg-orange-50/95 border-orange-200 text-orange-950' }
];

const tagsList = ['Все', 'Поручения', 'Личные бумаги', 'Идеи', 'Архив', 'Решения', 'Проекты'];

export default function GoogleKeep() {
  const { notes, addNote: addNoteHook, updateNote: updateNoteHook, deleteNote: deleteNoteHook } = useKeepNotes();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('Все');
  const [unauthorized, setUnauthorized] = useState(false);
  
  // Note creation inputs
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newColor, setNewColor] = useState('default');
  const [newTag, setNewTag] = useState('Поручения');
  const [exportingNoteId, setExportingNoteId] = useState<string | null>(null);

  // Sync token check on mount
  useEffect(() => {
    const checkToken = async () => {
      const token = await getAccessToken();
      if (!token) {
        setUnauthorized(true);
      } else {
        setUnauthorized(false);
      }
    };
    checkToken();
  }, []);

  const addNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() && !newContent.trim()) return;

    addNoteHook({
      title: newTitle.trim() || 'Без заголовка',
      content: newContent.trim(),
      color: newColor,
      tag: newTag,
      isPinned: false
    });

    setNewTitle('');
    setNewContent('');
    setNewColor('default');
  };

  const deleteNote = (id: string) => {
    const confirmed = window.confirm('Вы уверены, что хотите удалить эту заметку?');
    if (confirmed) {
      deleteNoteHook(id);
    }
  };

  const togglePin = (id: string) => {
    const note = notes.find(n => n.id === id);
    if (note) {
      updateNoteHook(id, { isPinned: !note.isPinned });
    }
  };

  const updateColor = (id: string, color: string) => {
    updateNoteHook(id, { color });
  };

  // Direct export to Google Docs in Google Drive
  const exportToGoogleDocs = async (note: KeepNote) => {
    setExportingNoteId(note.id);
    try {
      const token = await getAccessToken();
      if (!token) {
        alert('Пожалуйста, пройдите авторизацию Google Workspace на Главной панели (Dashboard) для синхронизации с облачным Google Docs!');
        setUnauthorized(true);
        return;
      }

      // Create a Google Doc under Drive with note summary
      const res = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: `Keep-Заметка: ${note.title}`,
          mimeType: 'application/vnd.google-apps.document'
        })
      });

      const driveFile = await res.json();
      if (driveFile.id) {
        // Now, we can optionally populate the created document using Docs API
        await fetch(`https://docs.google.com/v1/documents/${driveFile.id}:batchUpdate`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            requests: [
              {
                insertText: {
                  location: { index: 1 },
                  text: `${note.title.toUpperCase()}\n\nКатегория заметки: ${note.tag}\nДата изменения: ${note.updatedAt}\n\n${note.content}\n\n-----------------\nЭкспортировано автоматически из Executive OS.`
                }
              }
            ]
          })
        });

        alert(`Заметка "${note.title}" успешно экспортирована в новый Google-документ!`);
        window.open(`https://docs.google.com/documents/d/${driveFile.id}/edit`, '_blank');
      } else {
        throw new Error('No file ID returned');
      }
    } catch (e) {
      console.error('Exporting note error:', e);
      alert('Ошибка при экспорте в Google Drive. Проверьте права доступа Workspace.');
    } finally {
      setExportingNoteId(null);
    }
  };

  // Filter criteria
  const filteredNotes = notes.filter(n => {
    const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          n.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTag = selectedTag === 'Все' || n.tag === selectedTag;
    return matchesSearch && matchesTag;
  });

  const pinnedNotes = filteredNotes.filter(n => n.isPinned);
  const otherNotes = filteredNotes.filter(n => !n.isPinned);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 font-sans">
      
      {/* Header block */}
      <header className="border-b border-slate-200/60 pb-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs font-bold text-amber-600 uppercase tracking-widest font-display">Мульти-системная интеграция</span>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-display mt-1">Интеграция Google Keep Notes</h1>
          <p className="text-slate-500 text-sm mt-0.5">Оперативные стикеры-памятки, быстрый анализ задач, маркировка приоритетов и легкий экспорт в Google Docs.</p>
        </div>
        
        {unauthorized && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 p-2 rounded-xl text-[10px] font-bold text-amber-800 uppercase tracking-wide">
            <ShieldAlert size={14} className="text-amber-600 shrink-0" />
            <span>Офлайн-режим. Для экспорта свяжите Workspace!</span>
          </div>
        )}
      </header>

      {/* Note Creation Card Form */}
      <div className="max-w-xl mx-auto bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden p-4 space-y-3">
        <form onSubmit={addNote} className="space-y-3">
          <input 
            id="keep-note-title"
            type="text"
            placeholder="Заголовок заметки..."
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            className="w-full text-xs font-bold text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none"
          />
          <textarea 
            id="keep-note-content"
            placeholder="Заметка..."
            value={newContent}
            onChange={e => setNewContent(e.target.value)}
            rows={2}
            className="w-full text-xs text-slate-600 placeholder-slate-400 bg-transparent focus:outline-none resize-none"
          />

          <div className="flex flex-wrap justify-between items-center pt-2 border-t border-slate-100 gap-2">
            <div className="flex items-center gap-2">
              {/* Color selectors */}
              <div className="flex items-center gap-1">
                {colorsList.map(c => (
                  <button 
                    type="button"
                    key={c.name}
                    onClick={() => setNewColor(c.name)}
                    className={`w-4 h-4 rounded-full border transition-all ${c.name === 'default' ? 'bg-white' : c.name === 'yellow' ? 'bg-amber-100' : c.name === 'blue' ? 'bg-blue-100' : c.name === 'green' ? 'bg-emerald-100' : c.name === 'red' ? 'bg-rose-100' : c.name === 'purple' ? 'bg-purple-100' : 'bg-orange-100'} ${newColor === c.name ? 'ring-2 ring-blue-500 border-transparent shadow-xs scale-110' : 'border-slate-300'}`}
                  />
                ))}
              </div>

              {/* Tag selector */}
              <select 
                id="keep-note-tag-select"
                value={newTag}
                onChange={e => setNewTag(e.target.value)}
                className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold p-1 rounded border-none focus:outline-none"
              >
                {tagsList.filter(t => t !== 'Все').map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <button 
              id="keep-note-submit-btn"
              type="submit"
              disabled={!newTitle.trim() && !newContent.trim()}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold px-3 py-1.5 rounded-lg text-xs"
            >
              <Plus size={14} />
              <span>Создать</span>
            </button>
          </div>
        </form>
      </div>

      {/* Filter and Search Bar Row */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between border-y border-slate-200/60 py-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
          <input 
            id="keep-search-bar"
            type="text"
            placeholder="Семантический поиск заметок..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full text-xs border border-slate-200 bg-slate-50/50 pl-8 pr-4 py-2 rounded-lg text-slate-800"
          />
        </div>

        {/* Tags horizontal scroll bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {tagsList.map(tag => (
            <button 
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase whitespace-nowrap cursor-pointer transition-all ${selectedTag === tag ? 'bg-amber-600 text-white' : 'bg-slate-150 hover:bg-slate-200 text-slate-600'}`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* NOTES CANVAS GRID */}
      <div className="space-y-8">
        {/* Pinned notes */}
        {pinnedNotes.length > 0 && (
          <div className="space-y-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Закрепленные</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {pinnedNotes.map(n => (
                <KeepNoteCard 
                  key={n.id}
                  note={n}
                  onTogglePin={togglePin}
                  onDelete={deleteNote}
                  onExport={exportToGoogleDocs}
                  isExporting={exportingNoteId === n.id}
                  onColorChange={updateColor}
                />
              ))}
            </div>
          </div>
        )}

        {/* Other notes list */}
        <div className="space-y-3">
          {pinnedNotes.length > 0 && <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Остальные</span>}
          
          {filteredNotes.length === 0 ? (
            <div className="p-16 text-center text-slate-400 space-y-2 flex flex-col items-center">
              <CheckSquare size={36} className="opacity-30" />
              <p className="text-xs font-semibold">Заметок не найдено</p>
              <p className="text-[10px] max-w-xs">Создайте первую заметку на панели выше с индивидуальным тегом и цветовой меткой.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {otherNotes.map(n => (
                <KeepNoteCard 
                  key={n.id}
                  note={n}
                  onTogglePin={togglePin}
                  onDelete={deleteNote}
                  onExport={exportToGoogleDocs}
                  isExporting={exportingNoteId === n.id}
                  onColorChange={updateColor}
                />
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

function KeepNoteCard({ 
  note, 
  onTogglePin, 
  onDelete, 
  onExport, 
  isExporting,
  onColorChange 
}: { 
  key?: string;
  note: KeepNote; 
  onTogglePin: (id: string) => void;
  onDelete: (id: string) => void;
  onExport: (n: KeepNote) => void;
  isExporting: boolean;
  onColorChange: (id: string, color: string) => void;
}) {
  const [showColorPalette, setShowColorPalette] = useState(false);

  const activeColorObject = colorsList.find(c => c.name === note.color) || colorsList[0];

  return (
    <div 
      className={`p-5 rounded-2xl border shadow-sm transition-all hover:shadow-md flex flex-col justify-between space-y-4 group relative ${activeColorObject.bg}`}
    >
      <button 
        type="button"
        onClick={() => onTogglePin(note.id)}
        className={`absolute top-4 right-4 p-1 rounded-md transition-colors ${note.isPinned ? 'text-amber-500 hover:text-amber-600' : 'text-slate-300 hover:text-slate-500 md:opacity-0 group-hover:opacity-100'}`}
        title={note.isPinned ? 'Открепить' : 'Закрепить'}
      >
        <Pin size={14} className={note.isPinned ? 'fill-current' : ''} />
      </button>

      <div className="space-y-2 pr-4">
        <span className="inline-block px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase bg-slate-900/10 tracking-wider">
          {note.tag}
        </span>
        <h3 className="font-bold text-slate-800 text-xs leading-snug">{note.title}</h3>
        <p className="text-slate-600 leading-relaxed text-xs whitespace-pre-wrap">{note.content}</p>
      </div>

      <div className="flex justify-between items-center pt-3 border-t border-slate-950/5 mt-auto">
        <span className="text-[9px] text-slate-400 font-mono">Обновлен: {note.updatedAt}</span>
        
        <div className="flex items-center gap-1.5 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity relative">
          {/* Colors quick toggle */}
          <button 
            type="button"
            onClick={() => setShowColorPalette(!showColorPalette)}
            className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
            title="Изменить цвет"
          >
            <Palette size={13} />
          </button>

          {showColorPalette && (
            <div className="absolute bottom-7 right-0 bg-white border rounded-lg p-1.5 shadow-lg flex gap-1 z-20">
              {colorsList.map(c => (
                <button 
                  type="button"
                  key={c.name}
                  onClick={() => {
                    onColorChange(note.id, c.name);
                    setShowColorPalette(false);
                  }}
                  className={`w-3.5 h-3.5 rounded-full border border-slate-300 ${c.name === 'default' ? 'bg-white' : c.name === 'yellow' ? 'bg-amber-100' : c.name === 'blue' ? 'bg-blue-100' : c.name === 'green' ? 'bg-emerald-100' : c.name === 'red' ? 'bg-rose-100' : c.name === 'purple' ? 'bg-purple-100' : 'bg-orange-100'}`}
                />
              ))}
            </div>
          )}

          {/* Export to google doc */}
          <button 
            type="button"
            onClick={() => onExport(note)}
            disabled={isExporting}
            className="p-1 text-blue-600 hover:text-blue-700 disabled:text-slate-400 rounded transition-colors flex items-center gap-1 text-[10px] font-bold"
            title="Экспортировать в Google Документ"
          >
            {isExporting ? <Sparkles size={13} className="animate-spin" /> : <FileText size={13} />}
          </button>

          {/* Delete note */}
          <button 
            type="button"
            onClick={() => onDelete(note.id)}
            className="p-1 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
            title="Удалить"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}
