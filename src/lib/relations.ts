import { EntityLink } from '../types';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, query, onSnapshot, deleteDoc, doc, getDocs } from 'firebase/firestore';

const LOCAL_KEY = 'assistant_os_links';

function getLocalLinks(): EntityLink[] {
  const raw = localStorage.getItem(LOCAL_KEY);
  return raw ? JSON.parse(raw) : [];
}

function setLocalLinks(links: EntityLink[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(links));
}

/**
 * Create a link between two entities.
 */
export async function addLink(
  sourceType: string,
  sourceId: string,
  targetType: string,
  targetId: string,
  label?: string
): Promise<EntityLink> {
  const userId = auth.currentUser?.uid || 'guest';
  const link: EntityLink = {
    id: 'link-' + Math.random().toString(36).substr(2, 9),
    sourceType,
    sourceId,
    targetType,
    targetId,
    label,
    userId,
    createdAt: Date.now(),
  };

  if (!auth.currentUser || auth.currentUser.isAnonymous) {
    const links = getLocalLinks();
    links.push(link);
    setLocalLinks(links);
    return link;
  }

  try {
    const docRef = await addDoc(
      collection(db, 'users', userId, 'entity_links'),
      { ...link, id: undefined }
    );
    return { ...link, id: docRef.id };
  } catch (e) {
    handleFirestoreError(e, OperationType.CREATE, 'entity_links');
    // Fallback to local
    const links = getLocalLinks();
    links.push(link);
    setLocalLinks(links);
    return link;
  }
}

/**
 * Get all links for a specific entity.
 */
export function getLinksForEntity(entityType: string, entityId: string): EntityLink[] {
  const links = getLocalLinks();
  return links.filter(
    l =>
      (l.sourceType === entityType && l.sourceId === entityId) ||
      (l.targetType === entityType && l.targetId === entityId)
  );
}

/**
 * Remove a link by ID.
 */
export async function removeLink(linkId: string): Promise<void> {
  if (!auth.currentUser || auth.currentUser.isAnonymous) {
    const links = getLocalLinks();
    setLocalLinks(links.filter(l => l.id !== linkId));
    return;
  }

  try {
    await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'entity_links', linkId));
  } catch (e) {
    handleFirestoreError(e, OperationType.DELETE, `entity_links/${linkId}`);
  }
}

/**
 * Get a human-readable label for an entity type.
 */
export function getEntityTypeLabel(type: string): string {
  const map: Record<string, string> = {
    task: 'Задача',
    meeting: 'Встреча',
    letter: 'Письмо',
    report: 'Отчёт',
    journal: 'Запись журнала',
    employee: 'Сотрудник',
    department: 'Отдел',
    document: 'Документ',
  };
  return map[type] || type;
}
