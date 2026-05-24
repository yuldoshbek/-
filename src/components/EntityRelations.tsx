import React, { useEffect, useState } from 'react';
import { EntityLink } from '../types';
import { getLinksForEntity, removeLink, getEntityTypeLabel } from '../lib/relations';
import { Link2, X, Plus } from 'lucide-react';
import { useWorkspace } from '../context/WorkspaceContext';

interface EntityRelationsProps {
  entityType: string;
  entityId: string;
  compact?: boolean;
}

export default function EntityRelations({ entityType, entityId, compact = false }: EntityRelationsProps) {
  const [links, setLinks] = useState<EntityLink[]>([]);
  const { getLabel } = useWorkspace();

  const loadLinks = () => {
    const data = getLinksForEntity(entityType, entityId);
    setLinks(data);
  };

  useEffect(() => {
    loadLinks();
    // In a real app we'd subscribe to Firebase, but for now we poll or reload on mount
    const interval = setInterval(loadLinks, 2000);
    return () => clearInterval(interval);
  }, [entityType, entityId]);

  const handleRemove = async (linkId: string) => {
    await removeLink(linkId);
    loadLinks();
  };

  if (links.length === 0) return null;

  return (
    <div className={`${compact ? 'mt-1' : 'mt-4 pt-4 border-t border-slate-100'}`}>
      {!compact && (
        <div className="flex items-center gap-2 mb-2">
          <Link2 size={14} className="text-slate-400" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Связи</span>
        </div>
      )}
      <div className="flex flex-wrap gap-1.5">
        {links.map(link => {
          const isSource = link.sourceId === entityId && link.sourceType === entityType;
          const targetType = isSource ? link.targetType : link.sourceType;
          const targetLabel = getLabel(targetType + 's'); // e.g. tasks -> Поручения
          
          return (
            <div key={link.id} className="inline-flex items-center gap-1 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-[10px] group transition-colors hover:border-blue-300">
              <Link2 size={10} className="text-slate-400" />
              <span className="font-semibold text-slate-600">{getEntityTypeLabel(targetType)}:</span>
              <span className="text-slate-800 truncate max-w-[120px]">{link.label || 'Связь'}</span>
              <button 
                type="button"
                onClick={(e) => { e.preventDefault(); handleRemove(link.id); }}
                className="ml-0.5 text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={10} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
