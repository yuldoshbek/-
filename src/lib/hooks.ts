import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, updateDoc, doc, deleteDoc, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, auth } from '../firebase';
import { 
  Task, 
  Meeting, 
  Letter, 
  Report, 
  Complaint, 
  Department,
  EmployeeTask,
  KeepNote,
  Decision,
  ExecutiveRisk,
  RemindItem,
  ApprovalRequest,
  GuideItem,
  MomProtocol,
  SubReport
} from '../types';

// Default Demo Data to populate local sandbox right away
const defaultTasks: Task[] = [
  {
    "id": "a-001",
    "title": "Подготовить данные по критическому сырью",
    "description": "Передать актуальные геологические данные для итогового отчёта.",
    "priority": "high",
    "status": "in_progress",
    "department": "Геология",
    "assignee": "Ответственный по геологии",
    "deadline": "2026-05-25",
    "source": "Встреча",
    "userId": "guest",
    "createdAt": 1779520428641,
    "updatedAt": 1779606828641
  },
  {
    "id": "a-002",
    "title": "Рассчитать бюджет по направлению",
    "description": "Подготовить бюджетную оценку и указать допущения.",
    "priority": "high",
    "status": "pending",
    "department": "Финансы",
    "assignee": "Ответственный по бюджету",
    "deadline": "2026-05-23",
    "source": "Поручение директора",
    "userId": "guest",
    "createdAt": 1779520428641,
    "updatedAt": 1779606828641
  },
  {
    "id": "a-003",
    "title": "Проверить регуляторные риски",
    "description": "Выявить ограничения, разрешения и согласования.",
    "priority": "high",
    "status": "in_progress",
    "department": "Юридический",
    "assignee": "Ответственный юрист",
    "deadline": "2026-05-22",
    "source": "Протокол встречи",
    "userId": "guest",
    "createdAt": 1779520428641,
    "updatedAt": 1779606828641
  }
];

const defaultMeetings: Meeting[] = [
  {
    "id": "m-001",
    "title": "Подготовка отчёта по критическому сырью",
    "date": "2026-05-23",
    "participants": [
      "Геология",
      "Финансы",
      "Юридический"
    ],
    "agenda": "Данные геологии, Бюджет, Регуляторные риски",
    "notes": "Сегодня была встреча с геологическим отделом, финансовым отделом и юридическим отделом. Обсудили подготовку отчёта по критическому сырью. Геология должна дать данные до 25 мая. Финансы должны рассчитать бюджет. Юристы должны проверить регуляторные риски.",
    "decisions": [
      "Продолжить подготовку отчёта по критическому сырью с отдельной проверкой юридических рисков."
    ],
    "userId": "guest",
    "createdAt": 1779563628641,
    "updatedAt": 1779606828641
  }
];

const defaultLetters: Letter[] = [
  {
    "id": "l-001",
    "subject": "Kritik xomashyo yo‘nalishi bo‘yicha hisobotni kelishish yuzasidan",
    "instructionsRu": "Подготовь письмо в Министерство, что нам нужно согласовать отчёт по направлению критического сырья.",
    "bodyUzbek": "Hurmatli Tog‘-kon sanoati va geologiya vazirligi vakillari!\n\nSizga shuni ma’lum qilamizki, tashkilotimiz tomonidan kritik xomashyo yo‘nalishi bo‘yicha hisobotni tayyorlash va kelishish masalasi bo‘yicha ishlar olib borilmoqda.\n\nIltimos, uchrashuv uchun Sizga qulay bo‘lgan sana va vaqt haqida ma’lumot berishingizni so‘raymiz.\n\nHurmat bilan,\nBosh direktor yordamchisi",
    "status": "draft",
    "recipient": "Министерство горнодобывающей промышленности и геологии",
    "userId": "guest",
    "createdAt": 1779556905628,
    "updatedAt": 1779606828641
  }
];

const defaultReports: Report[] = [
  {
    "id": "r-001",
    "title": "Отчёт по критическому сырью",
    "summary": "Отсутствует: юридические риски",
    "status": "submitted",
    "department": "Проектный офис",
    "userId": "guest",
    "createdAt": 1779585228641,
    "updatedAt": 1779606828641
  },
  {
    "id": "r-002",
    "title": "Бюджет направления",
    "summary": "Отсутствует: обоснование допущений",
    "status": "submitted",
    "department": "Финансы",
    "userId": "guest",
    "createdAt": 1779585228641,
    "updatedAt": 1779606828641
  },
  {
    "id": "r-003",
    "title": "Еженедельный статус поручений",
    "summary": "Все разделы заполнены.",
    "status": "approved",
    "department": "Руководство",
    "userId": "guest",
    "createdAt": 1779585228641,
    "updatedAt": 1779606828641
  }
];

const defaultComplaints: Complaint[] = [
  {
    "id": "c-001",
    "title": "Задержка ответа по документу",
    "description": "Нет ответа по юридическому заключению.",
    "category": "Задержка ответа",
    "status": "in_progress",
    "department": "Юридический",
    "reporter": "Сотрудник",
    "deadline": "2026-05-24",
    "createdAt": 1779534828641,
    "updatedAt": 1779606828641,
    "userId": "guest"
  }
];

const defaultDepartments: Department[] = [
  {
    "id": "d-000",
    "name": "Руководство",
    "head": "Генеральный директор",
    "tasksCount": 3,
    "overdueCount": 0,
    "kpi": 100
  },
  {
    "id": "d-001",
    "name": "Геология",
    "head": "Руководитель геологического отдела",
    "tasksCount": 7,
    "overdueCount": 0,
    "kpi": 86
  },
  {
    "id": "d-002",
    "name": "Финансы",
    "head": "Руководитель финансового отдела",
    "tasksCount": 9,
    "overdueCount": 0,
    "kpi": 78
  },
  {
    "id": "d-003",
    "name": "Юридический",
    "head": "Руководитель юридического отдела",
    "tasksCount": 8,
    "overdueCount": 0,
    "kpi": 64
  },
  {
    "id": "d-004",
    "name": "Канцелярия",
    "head": "Руководитель канцелярии",
    "tasksCount": 5,
    "overdueCount": 0,
    "kpi": 91
  },
  {
    "id": "d-005",
    "name": "Проектный офис",
    "head": "Руководитель проектного офиса",
    "tasksCount": 6,
    "overdueCount": 0,
    "kpi": 82
  },
  {
    "id": "d-006",
    "name": "HR",
    "head": "Руководитель HR",
    "tasksCount": 4,
    "overdueCount": 0,
    "kpi": 74
  }
];

const defaultEmployeeTasks: EmployeeTask[] = [
  {
    "id": "et-001",
    "employeeName": "Ответственный по геологии",
    "role": "Специалист",
    "department": "Геология",
    "taskTitle": "Обновить таблицу запасов",
    "status": "active",
    "priority": "high",
    "deadline": "2026-05-24",
    "kpiImpact": 10,
    "comments": [],
    "userId": "guest",
    "createdAt": 1779606828641,
    "updatedAt": 1779606828641
  },
  {
    "id": "et-002",
    "employeeName": "Ответственный по бюджету",
    "role": "Финансовый аналитик",
    "department": "Финансы",
    "taskTitle": "Подготовить финансовые допущения",
    "status": "active",
    "priority": "medium",
    "deadline": "2026-05-23",
    "kpiImpact": 10,
    "comments": [],
    "userId": "guest",
    "createdAt": 1779606828641,
    "updatedAt": 1779606828641
  },
  {
    "id": "et-003",
    "employeeName": "Ответственный юрист",
    "role": "Юрист",
    "department": "Юридический",
    "taskTitle": "Дать заключение по лицензиям",
    "status": "overdue",
    "priority": "high",
    "deadline": "2026-05-22",
    "kpiImpact": 10,
    "comments": [],
    "userId": "guest",
    "createdAt": 1779606828641,
    "updatedAt": 1779606828641
  }
];

const defaultKeepNotes: KeepNote[] = [
  {
    "id": "note-1",
    "title": "Официальное обращение в министерство",
    "content": "Hurmatli ... Sizga shuni ma’lum qilamizki ...",
    "color": "bg-amber-50 border-amber-200",
    "tag": "Шаблоны писем",
    "isPinned": true,
    "userId": "guest",
    "createdAt": 1779606828641,
    "updatedAt": "24.05.2026"
  },
  {
    "id": "note-2",
    "title": "Структура протокола встречи",
    "content": "Тема, участники, повестка, решения, задачи, сроки, ответственные.",
    "color": "bg-amber-50 border-amber-200",
    "tag": "Регламенты",
    "isPinned": true,
    "userId": "guest",
    "createdAt": 1779606828662,
    "updatedAt": "24.05.2026"
  }
];

const defaultDecisions: Decision[] = [
  {
    "id": "dec-001",
    "referenceNo": "DEC-001",
    "title": "Продолжить подготовку отчёта по критическому сырью с отдельной проверкой юридических рисков.",
    "category": "Организационное",
    "date": "2026-05-23",
    "signer": "Генеральный директор",
    "status": "Действует",
    "summary": "Продолжить подготовку отчёта по критическому сырью с отдельной проверкой юридических рисков.",
    "userId": "guest",
    "createdAt": 1779606828662,
    "updatedAt": 1779606828662
  }
];

const defaultRisks: ExecutiveRisk[] = [
  {
    "id": "k-001",
    "title": "Регуляторные ограничения не подтверждены",
    "category": "Финансовый",
    "level": "high",
    "mitidgationPlan": "Получить юридическое заключение до отправки отчёта.",
    "reporter": "Ответственный юрист",
    "status": "active",
    "userId": "guest",
    "createdAt": 1779606828663,
    "updatedAt": 1779606828663
  },
  {
    "id": "k-002",
    "title": "Бюджетные допущения неполные",
    "category": "Финансовый",
    "level": "medium",
    "mitidgationPlan": "Добавить пояснения и сценарии.",
    "reporter": "Ответственный по бюджету",
    "status": "active",
    "userId": "guest",
    "createdAt": 1779606828663,
    "updatedAt": 1779606828663
  }
];

const defaultReminders: RemindItem[] = [
  {
    "id": "rem-001",
    "text": "Напомнить юридическому отделу",
    "datetime": "2026-05-23T16:00",
    "method": "Telegram",
    "status": "pending",
    "userId": "guest",
    "createdAt": 1779606828663,
    "updatedAt": 1779606828663
  },
  {
    "id": "rem-002",
    "text": "Собрать ежедневные отчёты",
    "datetime": "2026-05-23T17:30",
    "method": "Telegram",
    "status": "pending",
    "userId": "guest",
    "createdAt": 1779606828663,
    "updatedAt": 1779606828663
  }
];

const defaultApprovals: ApprovalRequest[] = [
  {
    "id": "apr-001",
    "documentTitle": "Согласование: Письмо #L-001",
    "documentType": "Письмо",
    "applicant": "Координатор проекта",
    "status": "pending",
    "urgency": "routine",
    "appointedSigners": [
      "Генеральный директор"
    ],
    "currentSignerIndex": 0,
    "userId": "guest",
    "createdAt": 1779606828663,
    "updatedAt": 1779606828663
  },
  {
    "id": "apr-002",
    "documentTitle": "Согласование: Отчет #R-001",
    "documentType": "Отчет",
    "applicant": "Координатор проекта",
    "status": "pending",
    "urgency": "routine",
    "appointedSigners": [
      "Генеральный директор"
    ],
    "currentSignerIndex": 0,
    "userId": "guest",
    "createdAt": 1779606828663,
    "updatedAt": 1779606828663
  }
];

const defaultGuides: GuideItem[] = [
  {
    "id": "kb-001",
    "title": "Официальное обращение в министерство",
    "category": "Шаблоны",
    "summary": "Официальное обращение в министерство",
    "content": "Hurmatli ... Sizga shuni ma’lum qilamizki ...",
    "userId": "guest",
    "createdAt": 1779606828663,
    "updatedAt": 1779606828663
  },
  {
    "id": "kb-002",
    "title": "Структура протокола встречи",
    "category": "Правила ТМК",
    "summary": "Структура протокола встречи",
    "content": "Тема, участники, повестка, решения, задачи, сроки, ответственные.",
    "userId": "guest",
    "createdAt": 1779606828663,
    "updatedAt": 1779606828663
  }
];

const defaultMomProtocols: MomProtocol[] = [];
const defaultSubReports: SubReport[] = [];

// Helper to load or initialize standard state
function getLocalItem<T>(key: string, defaultValue: T): T {
  const fileData = localStorage.getItem(key);
  if (!fileData) {
    localStorage.setItem(key, JSON.stringify(defaultValue));
    return defaultValue;
  }
  return JSON.parse(fileData);
}

function setLocalItem<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

// 1. Tasks state hook
export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser || auth.currentUser.isAnonymous) {
      const items = getLocalItem<Task[]>('t_tasks', defaultTasks);
      setTasks(items);
      setLoading(false);
      return;
    }

    const uid = auth.currentUser.uid;
    const q = query(collection(db, 'users', uid, 'tasks'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loaded = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
      const bootstrapFlag = `bootstrapped_tasks_${uid}`;
      if (loaded.length === 0 && !localStorage.getItem(bootstrapFlag)) {
        localStorage.setItem(bootstrapFlag, 'true');
        defaultTasks.forEach(async (t) => {
          const { id, ...clean } = t;
          try {
            await addDoc(collection(db, 'users', uid, 'tasks'), { ...clean, userId: uid });
          } catch (e) {
            console.error("Bootstrap tasks error:", e);
          }
        });
      }
      setTasks(loaded.length > 0 ? loaded : defaultTasks);
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'tasks'));
    return () => unsubscribe();
  }, [auth.currentUser]);

  const addTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    const fresh: Omit<Task, 'id'> = {
      ...taskData,
      userId: auth.currentUser?.uid || 'guest',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    if (!auth.currentUser || auth.currentUser.isAnonymous) {
      const items = getLocalItem<Task[]>('t_tasks', defaultTasks);
      const newTask: Task = { ...fresh, id: 't-' + Math.random().toString(36).substr(2, 9) };
      const updated = [newTask, ...items];
      setLocalItem('t_tasks', updated);
      setTasks(updated);
      return;
    }

    try {
      await addDoc(collection(db, 'users', auth.currentUser.uid, 'tasks'), fresh);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'tasks');
    }
  };

  const updateTaskStatus = async (id: string, status: Task['status']) => {
    if (!auth.currentUser || auth.currentUser.isAnonymous) {
      const items = getLocalItem<Task[]>('t_tasks', defaultTasks);
      const updated = items.map(t => t.id === id ? { ...t, status, updatedAt: Date.now() } : t);
      setLocalItem('t_tasks', updated);
      setTasks(updated);
      return;
    }

    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid, 'tasks', id), {
        status,
        updatedAt: Date.now()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `tasks/${id}`);
    }
  };

  const updateTaskDetails = async (id: string, updates: Partial<Task>) => {
    if (!auth.currentUser || auth.currentUser.isAnonymous) {
      const items = getLocalItem<Task[]>('t_tasks', defaultTasks);
      const updated = items.map(t => t.id === id ? { ...t, ...updates, updatedAt: Date.now() } : t);
      setLocalItem('t_tasks', updated);
      setTasks(updated);
      return;
    }
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid, 'tasks', id), {
        ...updates,
        updatedAt: Date.now()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `tasks/${id}`);
    }
  };

  return { tasks, loading, addTask, updateTaskStatus, updateTaskDetails };
}

// 2. Meetings state hook
export function useMeetings() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser || auth.currentUser.isAnonymous) {
      const items = getLocalItem<Meeting[]>('t_meetings', defaultMeetings);
      setMeetings(items);
      setLoading(false);
      return;
    }

    const uid = auth.currentUser.uid;
    const q = query(collection(db, 'users', uid, 'meetings'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loaded = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Meeting));
      const bootstrapFlag = `bootstrapped_meetings_${uid}`;
      if (loaded.length === 0 && !localStorage.getItem(bootstrapFlag)) {
        localStorage.setItem(bootstrapFlag, 'true');
        defaultMeetings.forEach(async (m) => {
          const { id, ...clean } = m;
          try {
            await addDoc(collection(db, 'users', uid, 'meetings'), { ...clean, userId: uid });
          } catch (e) {
            console.error("Bootstrap meetings error:", e);
          }
        });
      }
      setMeetings(loaded.length > 0 ? loaded : defaultMeetings);
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'meetings'));
    return () => unsubscribe();
  }, [auth.currentUser]);

  const addMeeting = async (meetingData: Omit<Meeting, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    const fresh: Omit<Meeting, 'id'> = {
      ...meetingData,
      userId: auth.currentUser?.uid || 'guest',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    if (!auth.currentUser || auth.currentUser.isAnonymous) {
      const items = getLocalItem<Meeting[]>('t_meetings', defaultMeetings);
      const newM: Meeting = { ...fresh, id: 'm-' + Math.random().toString(36).substr(2, 9) };
      const updated = [newM, ...items];
      setLocalItem('t_meetings', updated);
      setMeetings(updated);
      return;
    }

    try {
      await addDoc(collection(db, 'users', auth.currentUser.uid, 'meetings'), fresh);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'meetings');
    }
  };

  return { meetings, loading, addMeeting };
}

// 3. Letters/Correspondence state hook
export function useLetters() {
  const [letters, setLetters] = useState<Letter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser || auth.currentUser.isAnonymous) {
      const items = getLocalItem<Letter[]>('t_letters', defaultLetters);
      setLetters(items);
      setLoading(false);
      return;
    }

    const uid = auth.currentUser.uid;
    const q = query(collection(db, 'users', uid, 'letters'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loaded = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Letter));
      const bootstrapFlag = `bootstrapped_letters_${uid}`;
      if (loaded.length === 0 && !localStorage.getItem(bootstrapFlag)) {
        localStorage.setItem(bootstrapFlag, 'true');
        defaultLetters.forEach(async (l) => {
          const { id, ...clean } = l;
          try {
            await addDoc(collection(db, 'users', uid, 'letters'), { ...clean, userId: uid });
          } catch (e) {
            console.error("Bootstrap letters error:", e);
          }
        });
      }
      setLetters(loaded.length > 0 ? loaded : defaultLetters);
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'letters'));
    return () => unsubscribe();
  }, [auth.currentUser]);

  const addLetter = async (letterData: Omit<Letter, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    const fresh: Omit<Letter, 'id'> = {
      ...letterData,
      userId: auth.currentUser?.uid || 'guest',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    if (!auth.currentUser || auth.currentUser.isAnonymous) {
      const items = getLocalItem<Letter[]>('t_letters', defaultLetters);
      const newL: Letter = { ...fresh, id: 'l-' + Math.random().toString(36).substr(2, 9) };
      const updated = [newL, ...items];
      setLocalItem('t_letters', updated);
      setLetters(updated);
      return;
    }

    try {
      await addDoc(collection(db, 'users', auth.currentUser.uid, 'letters'), fresh);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'letters');
    }
  };

  return { letters, loading, addLetter };
}

// 4. Reports state hook
export function useReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser || auth.currentUser.isAnonymous) {
      const items = getLocalItem<Report[]>('t_reports', defaultReports);
      setReports(items);
      setLoading(false);
      return;
    }

    const uid = auth.currentUser.uid;
    const q = query(collection(db, 'users', uid, 'reports'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loaded = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report));
      const bootstrapFlag = `bootstrapped_reports_${uid}`;
      if (loaded.length === 0 && !localStorage.getItem(bootstrapFlag)) {
        localStorage.setItem(bootstrapFlag, 'true');
        defaultReports.forEach(async (r) => {
          const { id, ...clean } = r;
          try {
            await addDoc(collection(db, 'users', uid, 'reports'), { ...clean, userId: uid });
          } catch (e) {
            console.error("Bootstrap reports error:", e);
          }
        });
      }
      setReports(loaded.length > 0 ? loaded : defaultReports);
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'reports'));
    return () => unsubscribe();
  }, [auth.currentUser]);

  const addReport = async (reportData: Omit<Report, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    const fresh: Omit<Report, 'id'> = {
      ...reportData,
      userId: auth.currentUser?.uid || 'guest',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    if (!auth.currentUser || auth.currentUser.isAnonymous) {
      const items = getLocalItem<Report[]>('t_reports', defaultReports);
      const newR: Report = { ...fresh, id: 'r-' + Math.random().toString(36).substr(2, 9) };
      const updated = [newR, ...items];
      setLocalItem('t_reports', updated);
      setReports(updated);
      return;
    }

    try {
      await addDoc(collection(db, 'users', auth.currentUser.uid, 'reports'), fresh);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'reports');
    }
  };

  const updateReportStatus = async (id: string, status: Report['status']) => {
    if (!auth.currentUser || auth.currentUser.isAnonymous) {
      const items = getLocalItem<Report[]>('t_reports', defaultReports);
      const updated = items.map(r => r.id === id ? { ...r, status, updatedAt: Date.now() } : r);
      setLocalItem('t_reports', updated);
      setReports(updated);
      return;
    }
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid, 'reports', id), {
        status,
        updatedAt: Date.now()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `reports/${id}`);
    }
  };

  return { reports, loading, addReport, updateReportStatus };
}

// 5. Complaints state hook
export function useComplaints() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser || auth.currentUser.isAnonymous) {
      const items = getLocalItem<Complaint[]>('t_complaints', defaultComplaints);
      setComplaints(items);
      setLoading(false);
      return;
    }

    const uid = auth.currentUser.uid;
    const q = query(collection(db, 'users', uid, 'complaints'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loaded = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Complaint));
      const bootstrapFlag = `bootstrapped_complaints_${uid}`;
      if (loaded.length === 0 && !localStorage.getItem(bootstrapFlag)) {
        localStorage.setItem(bootstrapFlag, 'true');
        defaultComplaints.forEach(async (c) => {
          const { id, ...clean } = c;
          try {
            await addDoc(collection(db, 'users', uid, 'complaints'), { ...clean, userId: uid });
          } catch (e) {
            console.error("Bootstrap complaints error:", e);
          }
        });
      }
      setComplaints(loaded.length > 0 ? loaded : defaultComplaints);
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'complaints'));
    return () => unsubscribe();
  }, [auth.currentUser]);

  const addComplaint = async (data: Omit<Complaint, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    const fresh = {
      ...data,
      userId: auth.currentUser?.uid || 'guest',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    if (!auth.currentUser || auth.currentUser.isAnonymous) {
      const items = getLocalItem<Complaint[]>('t_complaints', defaultComplaints);
      const newC: Complaint = { ...fresh, id: 'c-' + Math.random().toString(36).substr(2, 9) };
      const updated = [newC, ...items];
      setLocalItem('t_complaints', updated);
      setComplaints(updated);
      return;
    }

    try {
      await addDoc(collection(db, 'users', auth.currentUser.uid, 'complaints'), fresh);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'complaints');
    }
  };

  const updateComplaintStatus = async (id: string, status: Complaint['status']) => {
    if (!auth.currentUser || auth.currentUser.isAnonymous) {
      const items = getLocalItem<Complaint[]>('t_complaints', defaultComplaints);
      const updated = items.map(c => c.id === id ? { ...c, status, updatedAt: Date.now() } : r => r);
      // fallback safety typing:
      const safeUpdated = items.map(c => c.id === id ? { ...c, status, updatedAt: Date.now() } : c);
      setLocalItem('t_complaints', safeUpdated);
      setComplaints(safeUpdated);
      return;
    }
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid, 'complaints', id), {
        status,
        updatedAt: Date.now()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `complaints/${id}`);
    }
  };

  const updateComplaintResponse = async (id: string, responseTemplate: string) => {
    if (!auth.currentUser || auth.currentUser.isAnonymous) {
      const items = getLocalItem<Complaint[]>('t_complaints', defaultComplaints);
      const safeUpdated = items.map(c => c.id === id ? { ...c, responseTemplate, status: 'in_progress' as const, updatedAt: Date.now() } : c);
      setLocalItem('t_complaints', safeUpdated);
      setComplaints(safeUpdated);
      return;
    }
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid, 'complaints', id), {
        responseTemplate,
        status: 'in_progress',
        updatedAt: Date.now()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `complaints/${id}`);
    }
  };

  return { complaints, loading, addComplaint, updateComplaintStatus, updateComplaintResponse };
}

// 6. Departments state hook
export function useDepartments() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const items = getLocalItem<Department[]>('t_departments', defaultDepartments);
    setDepartments(items);
    setLoading(false);
  }, []);

  const updateDepartmentKPI = (id: string, kpi: number) => {
    const items = getLocalItem<Department[]>('t_departments', defaultDepartments);
    const updated = items.map(d => d.id === id ? { ...d, kpi } : d);
    setLocalItem('t_departments', updated);
    setDepartments(updated);
  };

  return { departments, loading, updateDepartmentKPI };
}

// 7. Employee Tasks state hook
export function useEmployeeTasks() {
  const [employeeTasks, setEmployeeTasks] = useState<EmployeeTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser || auth.currentUser.isAnonymous) {
      const items = getLocalItem<EmployeeTask[]>('tmk_employee_tasks', defaultEmployeeTasks);
      setEmployeeTasks(items);
      setLoading(false);
      return;
    }

    const uid = auth.currentUser.uid;
    const q = query(collection(db, 'users', uid, 'employeeTasks'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loaded = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EmployeeTask));
      const bootstrapFlag = `bootstrapped_employeeTasks_${uid}`;
      if (loaded.length === 0 && !localStorage.getItem(bootstrapFlag)) {
        localStorage.setItem(bootstrapFlag, 'true');
        defaultEmployeeTasks.forEach(async (et) => {
          const { id, ...clean } = et;
          try {
            await addDoc(collection(db, 'users', uid, 'employeeTasks'), { ...clean, userId: uid });
          } catch (e) {
            console.error("Bootstrap employeeTasks error:", e);
          }
        });
      }
      setEmployeeTasks(loaded.length > 0 ? loaded : defaultEmployeeTasks);
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'employeeTasks'));
    return () => unsubscribe();
  }, [auth.currentUser]);

  const addEmployeeTask = async (taskData: Omit<EmployeeTask, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    const fresh = {
      ...taskData,
      userId: auth.currentUser?.uid || 'guest',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    if (!auth.currentUser || auth.currentUser.isAnonymous) {
      const items = getLocalItem<EmployeeTask[]>('tmk_employee_tasks', defaultEmployeeTasks);
      const newTask: EmployeeTask = { ...fresh, id: 'emp-' + Math.random().toString(36).substr(2, 9) };
      const updated = [newTask, ...items];
      setLocalItem('tmk_employee_tasks', updated);
      setEmployeeTasks(updated);
      return;
    }

    try {
      await addDoc(collection(db, 'users', auth.currentUser.uid, 'employeeTasks'), fresh);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'employeeTasks');
    }
  };

  const updateEmployeeTask = async (id: string, updates: Partial<EmployeeTask>) => {
    if (!auth.currentUser || auth.currentUser.isAnonymous) {
      const items = getLocalItem<EmployeeTask[]>('tmk_employee_tasks', defaultEmployeeTasks);
      const updated = items.map(t => t.id === id ? { ...t, ...updates, updatedAt: Date.now() } : t);
      setLocalItem('tmk_employee_tasks', updated);
      setEmployeeTasks(updated);
      return;
    }
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid, 'employeeTasks', id), {
        ...updates,
        updatedAt: Date.now()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `employeeTasks/${id}`);
    }
  };

  return { employeeTasks, loading, addEmployeeTask, updateEmployeeTask };
}

// 8. Keep Notes state hook
export function useKeepNotes() {
  const [notes, setNotes] = useState<KeepNote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser || auth.currentUser.isAnonymous) {
      const items = getLocalItem<KeepNote[]>('executive_keep_notes', defaultKeepNotes);
      setNotes(items);
      setLoading(false);
      return;
    }

    const uid = auth.currentUser.uid;
    const q = query(collection(db, 'users', uid, 'keepNotes'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loaded = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as KeepNote));
      const bootstrapFlag = `bootstrapped_keepNotes_${uid}`;
      if (loaded.length === 0 && !localStorage.getItem(bootstrapFlag)) {
        localStorage.setItem(bootstrapFlag, 'true');
        defaultKeepNotes.forEach(async (n) => {
          const { id, ...clean } = n;
          try {
            await addDoc(collection(db, 'users', uid, 'keepNotes'), { ...clean, userId: uid });
          } catch (e) {
            console.error("Bootstrap keepNotes error:", e);
          }
        });
      }
      setNotes(loaded.length > 0 ? loaded : defaultKeepNotes);
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'keepNotes'));
    return () => unsubscribe();
  }, [auth.currentUser]);

  const addNote = async (noteData: Omit<KeepNote, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    const fresh = {
      ...noteData,
      userId: auth.currentUser?.uid || 'guest',
      createdAt: Date.now(),
      updatedAt: new Date().toLocaleDateString('ru-RU')
    };

    if (!auth.currentUser || auth.currentUser.isAnonymous) {
      const items = getLocalItem<KeepNote[]>('executive_keep_notes', defaultKeepNotes);
      const newNote: KeepNote = { ...fresh, id: 'note-' + Math.random().toString(36).substr(2, 9) };
      const updated = [newNote, ...items];
      setLocalItem('executive_keep_notes', updated);
      setNotes(updated);
      return;
    }

    try {
      await addDoc(collection(db, 'users', auth.currentUser.uid, 'keepNotes'), fresh);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'keepNotes');
    }
  };

  const updateNote = async (id: string, updates: Partial<KeepNote>) => {
    const stringDate = new Date().toLocaleDateString('ru-RU');
    if (!auth.currentUser || auth.currentUser.isAnonymous) {
      const items = getLocalItem<KeepNote[]>('executive_keep_notes', defaultKeepNotes);
      const updated = items.map(n => n.id === id ? { ...n, ...updates, updatedAt: stringDate } : n);
      setLocalItem('executive_keep_notes', updated);
      setNotes(updated);
      return;
    }
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid, 'keepNotes', id), {
        ...updates,
        updatedAt: stringDate
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `keepNotes/${id}`);
    }
  };

  const deleteNote = async (id: string) => {
    if (!auth.currentUser || auth.currentUser.isAnonymous) {
      const items = getLocalItem<KeepNote[]>('executive_keep_notes', defaultKeepNotes);
      const updated = items.filter(n => n.id !== id);
      setLocalItem('executive_keep_notes', updated);
      setNotes(updated);
      return;
    }
    try {
      await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'keepNotes', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `keepNotes/${id}`);
    }
  };

  return { notes, loading, addNote, updateNote, deleteNote };
}

// 9. Decisions registry Hook
export function useDecisions() {
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser || auth.currentUser.isAnonymous) {
      const items = getLocalItem<Decision[]>('tmk_decisions', defaultDecisions);
      setDecisions(items);
      setLoading(false);
      return;
    }

    const uid = auth.currentUser.uid;
    const q = query(collection(db, 'users', uid, 'decisions'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loaded = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Decision));
      const bootstrapFlag = `bootstrapped_decisions_${uid}`;
      if (loaded.length === 0 && !localStorage.getItem(bootstrapFlag)) {
        localStorage.setItem(bootstrapFlag, 'true');
        defaultDecisions.forEach(async (d) => {
          const { id, ...clean } = d;
          try {
            await addDoc(collection(db, 'users', uid, 'decisions'), { ...clean, userId: uid });
          } catch (e) {
            console.error("Bootstrap decisions error:", e);
          }
        });
      }
      setDecisions(loaded.length > 0 ? loaded : defaultDecisions);
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'decisions'));
    return () => unsubscribe();
  }, [auth.currentUser]);

  const addDecision = async (decisionData: Omit<Decision, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    const fresh = {
      ...decisionData,
      userId: auth.currentUser?.uid || 'guest',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    if (!auth.currentUser || auth.currentUser.isAnonymous) {
      const items = getLocalItem<Decision[]>('tmk_decisions', defaultDecisions);
      const newD: Decision = { ...fresh, id: 'dec-' + Math.random().toString(36).substr(2, 9) };
      const updated = [newD, ...items];
      setLocalItem('tmk_decisions', updated);
      setDecisions(updated);
      return;
    }

    try {
      await addDoc(collection(db, 'users', auth.currentUser.uid, 'decisions'), fresh);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'decisions');
    }
  };

  const updateDecisionStatus = async (id: string, status: Decision['status']) => {
    if (!auth.currentUser || auth.currentUser.isAnonymous) {
      const items = getLocalItem<Decision[]>('tmk_decisions', defaultDecisions);
      const updated = items.map(d => d.id === id ? { ...d, status, updatedAt: Date.now() } : d);
      setLocalItem('tmk_decisions', updated);
      setDecisions(updated);
      return;
    }
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid, 'decisions', id), {
        status,
        updatedAt: Date.now()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `decisions/${id}`);
    }
  };

  return { decisions, loading, addDecision, updateDecisionStatus };
}

// 10. Risks compliance map hook
export function useRisks() {
  const [risks, setRisks] = useState<ExecutiveRisk[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser || auth.currentUser.isAnonymous) {
      const items = getLocalItem<ExecutiveRisk[]>('tmk_risks', defaultRisks);
      setRisks(items);
      setLoading(false);
      return;
    }

    const uid = auth.currentUser.uid;
    const q = query(collection(db, 'users', uid, 'risks'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loaded = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExecutiveRisk));
      const bootstrapFlag = `bootstrapped_risks_${uid}`;
      if (loaded.length === 0 && !localStorage.getItem(bootstrapFlag)) {
        localStorage.setItem(bootstrapFlag, 'true');
        defaultRisks.forEach(async (r) => {
          const { id, ...clean } = r;
          try {
            await addDoc(collection(db, 'users', uid, 'risks'), { ...clean, userId: uid });
          } catch (e) {
            console.error("Bootstrap risks error:", e);
          }
        });
      }
      setRisks(loaded.length > 0 ? loaded : defaultRisks);
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'risks'));
    return () => unsubscribe();
  }, [auth.currentUser]);

  const addRisk = async (riskData: Omit<ExecutiveRisk, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    const fresh = {
      ...riskData,
      userId: auth.currentUser?.uid || 'guest',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    if (!auth.currentUser || auth.currentUser.isAnonymous) {
      const items = getLocalItem<ExecutiveRisk[]>('tmk_risks', defaultRisks);
      const newR: ExecutiveRisk = { ...fresh, id: 'risk-' + Math.random().toString(36).substr(2, 9) };
      const updated = [newR, ...items];
      setLocalItem('tmk_risks', updated);
      setRisks(updated);
      return;
    }

    try {
      await addDoc(collection(db, 'users', auth.currentUser.uid, 'risks'), fresh);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'risks');
    }
  };

  const mitigationRisk = async (id: string) => {
    if (!auth.currentUser || auth.currentUser.isAnonymous) {
      const items = getLocalItem<ExecutiveRisk[]>('tmk_risks', defaultRisks);
      const updated = items.map(r => r.id === id ? { ...r, status: 'mitigated' as const, updatedAt: Date.now() } : r);
      setLocalItem('tmk_risks', updated);
      setRisks(updated);
      return;
    }
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid, 'risks', id), {
        status: 'mitigated',
        updatedAt: Date.now()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `risks/${id}`);
    }
  };

  return { risks, loading, addRisk, mitigationRisk };
}

// 11. Scheduled Reminders Hook
export function useReminders() {
  const [reminders, setReminders] = useState<RemindItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser || auth.currentUser.isAnonymous) {
      const items = getLocalItem<RemindItem[]>('tmk_reminders', defaultReminders);
      setReminders(items);
      setLoading(false);
      return;
    }

    const uid = auth.currentUser.uid;
    const q = query(collection(db, 'users', uid, 'reminders'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loaded = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RemindItem));
      const bootstrapFlag = `bootstrapped_reminders_${uid}`;
      if (loaded.length === 0 && !localStorage.getItem(bootstrapFlag)) {
        localStorage.setItem(bootstrapFlag, 'true');
        defaultReminders.forEach(async (r) => {
          const { id, ...clean } = r;
          try {
            await addDoc(collection(db, 'users', uid, 'reminders'), { ...clean, userId: uid });
          } catch (e) {
            console.error("Bootstrap reminders error:", e);
          }
        });
      }
      setReminders(loaded.length > 0 ? loaded : defaultReminders);
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'reminders'));
    return () => unsubscribe();
  }, [auth.currentUser]);

  const addReminder = async (remData: Omit<RemindItem, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    const fresh = {
      ...remData,
      userId: auth.currentUser?.uid || 'guest',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    if (!auth.currentUser || auth.currentUser.isAnonymous) {
      const items = getLocalItem<RemindItem[]>('tmk_reminders', defaultReminders);
      const newRem: RemindItem = { ...fresh, id: 'rem-' + Math.random().toString(36).substr(2, 9) };
      const updated = [newRem, ...items];
      setLocalItem('tmk_reminders', updated);
      setReminders(updated);
      return;
    }

    try {
      await addDoc(collection(db, 'users', auth.currentUser.uid, 'reminders'), fresh);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'reminders');
    }
  };

  const updateReminderStatus = async (id: string, status: RemindItem['status']) => {
    if (!auth.currentUser || auth.currentUser.isAnonymous) {
      const items = getLocalItem<RemindItem[]>('tmk_reminders', defaultReminders);
      const updated = items.map(r => r.id === id ? { ...r, status, updatedAt: Date.now() } : r);
      setLocalItem('tmk_reminders', updated);
      setReminders(updated);
      return;
    }
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid, 'reminders', id), {
        status,
        updatedAt: Date.now()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `reminders/${id}`);
    }
  };

  const deleteReminder = async (id: string) => {
    if (!auth.currentUser || auth.currentUser.isAnonymous) {
      const items = getLocalItem<RemindItem[]>('tmk_reminders', defaultReminders);
      const updated = items.filter(r => r.id !== id);
      setLocalItem('tmk_reminders', updated);
      setReminders(updated);
      return;
    }
    try {
      await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'reminders', id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `reminders/${id}`);
    }
  };

  return { reminders, loading, addReminder, updateReminderStatus, deleteReminder };
}

// 12. Agreement workflows Approvals Hook
export function useApprovals() {
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser || auth.currentUser.isAnonymous) {
      const items = getLocalItem<ApprovalRequest[]>('tmk_approvals', defaultApprovals);
      setApprovals(items);
      setLoading(false);
      return;
    }

    const uid = auth.currentUser.uid;
    const q = query(collection(db, 'users', uid, 'approvals'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loaded = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ApprovalRequest));
      const bootstrapFlag = `bootstrapped_approvals_${uid}`;
      if (loaded.length === 0 && !localStorage.getItem(bootstrapFlag)) {
        localStorage.setItem(bootstrapFlag, 'true');
        defaultApprovals.forEach(async (a) => {
          const { id, ...clean } = a;
          try {
            await addDoc(collection(db, 'users', uid, 'approvals'), { ...clean, userId: uid });
          } catch (e) {
            console.error("Bootstrap approvals error:", e);
          }
        });
      }
      setApprovals(loaded.length > 0 ? loaded : defaultApprovals);
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'approvals'));
    return () => unsubscribe();
  }, [auth.currentUser]);

  const addApproval = async (appData: Omit<ApprovalRequest, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    const fresh = {
      ...appData,
      userId: auth.currentUser?.uid || 'guest',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    if (!auth.currentUser || auth.currentUser.isAnonymous) {
      const items = getLocalItem<ApprovalRequest[]>('tmk_approvals', defaultApprovals);
      const newApp: ApprovalRequest = { ...fresh, id: 'app-' + Math.random().toString(36).substr(2, 9) };
      const updated = [newApp, ...items];
      setLocalItem('tmk_approvals', updated);
      setApprovals(updated);
      return;
    }

    try {
      await addDoc(collection(db, 'users', auth.currentUser.uid, 'approvals'), fresh);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'approvals');
    }
  };

  const signApprovalStep = async (id: string, action: 'approve' | 'reject') => {
    if (!auth.currentUser || auth.currentUser.isAnonymous) {
      const items = getLocalItem<ApprovalRequest[]>('tmk_approvals', defaultApprovals);
      const updated = items.map(app => {
        if (app.id === id) {
          if (action === 'reject') {
            return { ...app, status: 'rejected' as const, updatedAt: Date.now() };
          } else {
            const nextIndex = app.currentSignerIndex + 1;
            const isFullyApproved = nextIndex >= app.appointedSigners.length;
            return {
              ...app,
              currentSignerIndex: nextIndex,
              status: (isFullyApproved ? 'approved' : 'pending') as any,
              updatedAt: Date.now()
            };
          }
        }
        return app;
      });
      setLocalItem('tmk_approvals', updated);
      setApprovals(updated);
      return;
    }

    // Firebase update based on matching document state
    const currentDoc = approvals.find(a => a.id === id);
    if (!currentDoc) return;

    let nextStatus = currentDoc.status;
    let nextIndex = currentDoc.currentSignerIndex;

    if (action === 'reject') {
      nextStatus = 'rejected';
    } else {
      nextIndex = currentDoc.currentSignerIndex + 1;
      const isFullyApproved = nextIndex >= currentDoc.appointedSigners.length;
      nextStatus = isFullyApproved ? 'approved' : 'pending';
    }

    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid, 'approvals', id), {
        status: nextStatus,
        currentSignerIndex: nextIndex,
        updatedAt: Date.now()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `approvals/${id}`);
    }
  };

  return { approvals, loading, addApproval, signApprovalStep };
}

// 13. System Knowledge Base guides Hook
export function useGuides() {
  const [guides, setGuides] = useState<GuideItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser || auth.currentUser.isAnonymous) {
      const items = getLocalItem<GuideItem[]>('executive_corporate_guides', defaultGuides);
      setGuides(items);
      setLoading(false);
      return;
    }

    const uid = auth.currentUser.uid;
    const q = query(collection(db, 'users', uid, 'guides'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      // If collection is empty, write initial data synchronously
      const loaded = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GuideItem));
      const bootstrapFlag = `bootstrapped_guides_${uid}`;
      if (loaded.length === 0 && !localStorage.getItem(bootstrapFlag)) {
        localStorage.setItem(bootstrapFlag, 'true');
        // Bootstrap sample guide asynchronously so we do not block thread
        defaultGuides.forEach(async (g) => {
          const { id, ...cleanSpec } = g;
          try {
            await addDoc(collection(db, 'users', uid, 'guides'), {
              ...cleanSpec,
              userId: uid
            });
          } catch (err) {}
        });
      }
      setGuides(loaded.length > 0 ? loaded : defaultGuides);
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'guides'));
    return () => unsubscribe();
  }, [auth.currentUser]);

  const addGuide = async (guideData: Omit<GuideItem, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    const fresh = {
      ...guideData,
      userId: auth.currentUser?.uid || 'guest',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    if (!auth.currentUser || auth.currentUser.isAnonymous) {
      const items = getLocalItem<GuideItem[]>('executive_corporate_guides', defaultGuides);
      const newGuide: GuideItem = { ...fresh, id: 'guide-' + Math.random().toString(36).substr(2, 9) };
      const updated = [newGuide, ...items];
      setLocalItem('executive_corporate_guides', updated);
      setGuides(updated);
      return;
    }

    try {
      await addDoc(collection(db, 'users', auth.currentUser.uid, 'guides'), fresh);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'guides');
    }
  };

  return { guides, loading, addGuide };
}

// 14. Minutes of Meeting protocols Hook
export function useMomProtocols() {
  const [protocols, setProtocols] = useState<MomProtocol[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser || auth.currentUser.isAnonymous) {
      const items = getLocalItem<MomProtocol[]>('executive_mom_protocols', defaultMomProtocols);
      setProtocols(items);
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'users', auth.currentUser.uid, 'protocols'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProtocols(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MomProtocol)));
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'protocols'));
    return () => unsubscribe();
  }, [auth.currentUser]);

  const addProtocol = async (title: string, date: string, content: string) => {
    const fresh: Omit<MomProtocol, 'id'> = {
      title,
      date,
      content,
      userId: auth.currentUser?.uid || 'guest',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    if (!auth.currentUser || auth.currentUser.isAnonymous) {
      const items = getLocalItem<MomProtocol[]>('executive_mom_protocols', defaultMomProtocols);
      const newProto: MomProtocol = { ...fresh, id: 'proto-' + Math.random().toString(36).substr(2, 9) };
      const updated = [newProto, ...items];
      setLocalItem('executive_mom_protocols', updated);
      setProtocols(updated);
      return;
    }

    try {
      await addDoc(collection(db, 'users', auth.currentUser.uid, 'protocols'), fresh);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'protocols');
    }
  };

  return { protocols, loading, addProtocol };
}

// 15. Employee sub-reports documents Hook
export function useSubReports() {
  const [subReports, setSubReports] = useState<SubReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser || auth.currentUser.isAnonymous) {
      const items = getLocalItem<SubReport[]>('executive_sub_reports', defaultSubReports);
      setSubReports(items);
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'users', auth.currentUser.uid, 'subReports'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setSubReports(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SubReport)));
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'subReports'));
    return () => unsubscribe();
  }, [auth.currentUser]);

  const addSubReport = async (title: string, content: string) => {
    const fresh: Omit<SubReport, 'id'> = {
      title,
      content,
      userId: auth.currentUser?.uid || 'guest',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    if (!auth.currentUser || auth.currentUser.isAnonymous) {
      const items = getLocalItem<SubReport[]>('executive_sub_reports', defaultSubReports);
      const newRep: SubReport = { ...fresh, id: 'subrep-' + Math.random().toString(36).substr(2, 9) };
      const updated = [newRep, ...items];
      setLocalItem('executive_sub_reports', updated);
      setSubReports(updated);
      return;
    }

    try {
      await addDoc(collection(db, 'users', auth.currentUser.uid, 'subReports'), fresh);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'subReports');
    }
  };

  return { subReports, loading, addSubReport };
}

// Core Sync & Reset Engine API
export async function syncAllData(uid: string | null) {
  if (!uid || uid === 'guest') {
    // Soft sync for guest: make sure keys are populated in localStorage
    const keys = [
      { key: 't_tasks', val: defaultTasks },
      { key: 't_meetings', val: defaultMeetings },
      { key: 't_letters', val: defaultLetters },
      { key: 't_reports', val: defaultReports },
      { key: 't_complaints', val: defaultComplaints },
      { key: 'tmk_employee_tasks', val: defaultEmployeeTasks },
      { key: 'executive_keep_notes', val: defaultKeepNotes },
      { key: 'tmk_decisions', val: defaultDecisions },
      { key: 'tmk_risks', val: defaultRisks },
      { key: 'tmk_reminders', val: defaultReminders },
      { key: 'tmk_approvals', val: defaultApprovals },
      { key: 'executive_corporate_guides', val: defaultGuides },
      { key: 't_departments', val: defaultDepartments }
    ];
    keys.forEach(({ key, val }) => {
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, JSON.stringify(val));
      }
    });
    return;
  }

  // Soft sync for authenticated Firestore
  const targets = [
    { name: 'tasks', data: defaultTasks },
    { name: 'meetings', data: defaultMeetings },
    { name: 'letters', data: defaultLetters },
    { name: 'reports', data: defaultReports },
    { name: 'complaints', data: defaultComplaints },
    { name: 'employeeTasks', data: defaultEmployeeTasks },
    { name: 'keepNotes', data: defaultKeepNotes },
    { name: 'decisions', data: defaultDecisions },
    { name: 'risks', data: defaultRisks },
    { name: 'reminders', data: defaultReminders },
    { name: 'approvals', data: defaultApprovals },
    { name: 'guides', data: defaultGuides }
  ];

  for (const target of targets) {
    const colRef = collection(db, 'users', uid, target.name);
    const snap = await getDocs(colRef);
    if (snap.empty) {
      const bootstrapFlag = `bootstrapped_${target.name}_${uid}`;
      localStorage.setItem(bootstrapFlag, 'true');
      const promises = target.data.map(async (item) => {
        const { id, ...cleanItem } = item;
        return addDoc(colRef, {
          ...cleanItem,
          userId: uid
        });
      });
      await Promise.all(promises);
    }
  }
}

export async function resetAllData(uid: string | null) {
  if (!uid || uid === 'guest') {
    // Hard reset for guest: overwrite keys in localStorage
    localStorage.setItem('t_tasks', JSON.stringify(defaultTasks));
    localStorage.setItem('t_meetings', JSON.stringify(defaultMeetings));
    localStorage.setItem('t_letters', JSON.stringify(defaultLetters));
    localStorage.setItem('t_reports', JSON.stringify(defaultReports));
    localStorage.setItem('t_complaints', JSON.stringify(defaultComplaints));
    localStorage.setItem('tmk_employee_tasks', JSON.stringify(defaultEmployeeTasks));
    localStorage.setItem('executive_keep_notes', JSON.stringify(defaultKeepNotes));
    localStorage.setItem('tmk_decisions', JSON.stringify(defaultDecisions));
    localStorage.setItem('tmk_risks', JSON.stringify(defaultRisks));
    localStorage.setItem('tmk_reminders', JSON.stringify(defaultReminders));
    localStorage.setItem('tmk_approvals', JSON.stringify(defaultApprovals));
    localStorage.setItem('executive_corporate_guides', JSON.stringify(defaultGuides));
    localStorage.setItem('executive_mom_protocols', JSON.stringify([]));
    localStorage.setItem('executive_sub_reports', JSON.stringify([]));
    localStorage.setItem('t_departments', JSON.stringify(defaultDepartments));
    return;
  }

  // Hard reset for authenticated Firestore
  const targets = [
    { name: 'tasks', data: defaultTasks },
    { name: 'meetings', data: defaultMeetings },
    { name: 'letters', data: defaultLetters },
    { name: 'reports', data: defaultReports },
    { name: 'complaints', data: defaultComplaints },
    { name: 'employeeTasks', data: defaultEmployeeTasks },
    { name: 'keepNotes', data: defaultKeepNotes },
    { name: 'decisions', data: defaultDecisions },
    { name: 'risks', data: defaultRisks },
    { name: 'reminders', data: defaultReminders },
    { name: 'approvals', data: defaultApprovals },
    { name: 'guides', data: defaultGuides },
    { name: 'protocols', data: [] },
    { name: 'subReports', data: [] }
  ];

  for (const target of targets) {
    const colRef = collection(db, 'users', uid, target.name);
    const snap = await getDocs(colRef);
    
    // 1. Delete all existing docs
    const deletePromises = snap.docs.map(d => deleteDoc(doc(db, 'users', uid, target.name, d.id)));
    await Promise.all(deletePromises);

    // 2. Set bootstrap flag and populate defaults (if any)
    const bootstrapFlag = `bootstrapped_${target.name}_${uid}`;
    localStorage.setItem(bootstrapFlag, 'true');
    if (target.data.length > 0) {
      const addPromises = target.data.map(async (item) => {
        const { id, ...cleanItem } = item as any;
        return addDoc(colRef, {
          ...cleanItem,
          userId: uid
        });
      });
      await Promise.all(addPromises);
    }
  }
}
