import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, updateDoc, doc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, auth } from '../firebase';
import { Task, Meeting, Letter, Report, Complaint, Department } from '../types';

// Default Demo Data to populate local sandbox right away
const defaultTasks: Task[] = [
  {
    id: 't-1',
    title: 'Подготовить проект Постановления о цифровизации госорганов',
    description: 'Разработать подробный план сквозной интеграции СЭД и внедрения ИИ-ассистентов во все министерства до осени.',
    priority: 'urgent',
    status: 'pending',
    department: 'Департамент IT и цифровизации',
    assignee: 'Ахмедов У.М.',
    deadline: '2026-05-28',
    source: 'Поручение Администрации',
    userId: 'guest',
    createdAt: Date.now() - 3600000 * 24,
    updatedAt: Date.now() - 3600000 * 2
  },
  {
    id: 't-2',
    title: 'Согласовать бюджет развития и капитальных вложений с Минфином',
    description: 'Защитить статьи инвестиций по модернизации Таможенного поста Яллама перед межведомственной комиссией.',
    priority: 'high',
    status: 'in_progress',
    department: 'Финансовый департамент',
    assignee: 'Каримова Н.М.',
    deadline: '2026-06-05',
    userId: 'guest',
    createdAt: Date.now() - 3600000 * 48,
    updatedAt: Date.now() - 3600000 * 10
  },
  {
    id: 't-3',
    title: 'Рассмотреть критическую жалобу ООО "КаргоЛинк" о задержках логистики',
    description: 'Проанализировать сбой на пограничном узле, выявить ответственных и подготовить отчет Генеральному директору.',
    priority: 'urgent',
    status: 'pending',
    department: 'Департамент логистики и закупок',
    assignee: 'Туляганов Д.Х.',
    deadline: '2026-05-25',
    userId: 'guest',
    createdAt: Date.now() - 3600000 * 12,
    updatedAt: Date.now()
  },
  {
    id: 't-4',
    title: 'Разработать квартальный аудит исполнительской дисциплины',
    description: 'Сформировать сводный отчет по КПЭ всех секторов управления за прошедший квартал с выделением отстающих отделов.',
    priority: 'medium',
    status: 'completed',
    department: 'Аналитический сектор',
    assignee: 'Сабиров А.Р.',
    deadline: '2026-05-20',
    userId: 'guest',
    createdAt: Date.now() - 3600000 * 120,
    updatedAt: Date.now() - 3600000 * 6
  }
];

const defaultMeetings: Meeting[] = [
  {
    id: 'm-1',
    title: 'Расширенное заседание Кабинета Министров Республики Узбекистан',
    date: '2026-05-24',
    participants: ['Премьер-министр', 'Генеральный директор', 'Коллегия ведомств'],
    agenda: 'Ускорение реализации стратегических инвестиционных проектов в сфере ТЭК и логистики.',
    notes: 'Необходимо срочно подготовить сводный доклад по модернизации ключевых объектов инфраструктуры.',
    decisions: [
      'Усилить персональную ответственность руководителей секторов за срыв сроков сдачи актов приемки.',
      'Передать функции технического надзора по приоритетным точкам независимому аудитору.'
    ],
    userId: 'guest',
    createdAt: Date.now() - 3600000 * 10,
    updatedAt: Date.now()
  },
  {
    id: 'm-2',
    title: 'Оперативное совещание: Анализ просроченных поручений дирекции',
    date: '2026-05-26',
    participants: ['Ассистент генерального директора', 'Директора Департаментов', 'Юридический советник'],
    agenda: 'Разбор причин невыполнения задач по Спецсектору за май месяц и перераспределение дедлайнов.',
    notes: 'Интегрировать систему прямого контроля поручений с СЭД, увязать задачи со штрафными баллами.',
    decisions: [
      'Внедрить автоматические ежедневные СМС-напоминания для ответственных лиц.',
      'Предоставить юристу право наложения вето на пролонгацию задач без веского обоснования.'
    ],
    userId: 'guest',
    createdAt: Date.now() - 3600000 * 120,
    updatedAt: Date.now()
  }
];

const defaultLetters: Letter[] = [
  {
    id: 'l-1',
    subject: 'Запрос в Хокимият Ташкента о выделении дополнительной территории под проект Технопарка',
    instructionsRu: 'Написать строго официальное письмо хокиму города с просьбой ускорить рассмотрение документов по нашему предыдущему обращению и выделить участок площадью 1.5 Га.',
    bodyUzbek: 'Toshkent shahar Hokimi janoblariga!\n\nUshbu xatimiz orqali kompaniyamiz tomonidan amalga oshirilayotgan innovatsion Technopark loyihasini kengaytirish maqsadida qo\'shimcha 1.5 gektar yer maydoni ajratish bo\'yicha topshirilgan hujjatlar to\'plamini ko\'rib chiqishni jadallashtirishingizni so\'raymiz. Loyiha davlatimizning raqamlashtirish strategiyasi va yangi ish o\'rinlari yaratish dasturiga to\'liq muvofiq keladi.',
    status: 'ready',
    recipient: 'Хокимият г. Ташкента',
    userId: 'guest',
    createdAt: Date.now() - 3600000 * 20,
    updatedAt: Date.now()
  }
];

const defaultReports: Report[] = [
  {
    id: 'r-1',
    title: 'Отчет Минэнерго о ходе строительства распределительных сетей',
    summary: 'В отчете подробно отражены этапы прокладки высоковольтных линий и проблемы с задержкой закупки силовых трансформаторов. Выявлен высокий риск несоблюдения сезонного графика подготовки системы к пиковым нагрузкам.',
    status: 'submitted',
    department: 'Сектор энергетики',
    userId: 'guest',
    createdAt: Date.now() - 3600000 * 5,
    updatedAt: Date.now()
  }
];

const defaultComplaints: Complaint[] = [
  {
    id: 'c-1',
    title: 'Жалоба №14-А от ООО "КаргоЛинк" на затяжной таможенный досмотр груза',
    description: 'Скоропортящаяся продукция компании удерживается на пограничном терминале свыше 48 часов без официального разъяснения причин.',
    category: 'Логистика и Таможня',
    status: 'pending',
    department: 'Департамент логистики и закупок',
    reporter: 'ООО "КаргоЛинк"',
    deadline: '2026-05-25',
    createdAt: Date.now() - 3600000 * 26
  },
  {
    id: 'c-2',
    title: 'Обращение граждан Мирабадского района о нарушении шумового режима застройщиком',
    description: 'Жители сообщают о круглосуточной работе тяжелой строительной техники на площадке без надлежащих ограждений и мер пылеподавления.',
    category: 'Нарушение регламента',
    status: 'in_progress',
    department: 'Сектор надзора и безопасности',
    reporter: 'Комитет жителей ул. Шевченко',
    deadline: '2026-05-27',
    createdAt: Date.now() - 3600000 * 50
  }
];

const defaultDepartments: Department[] = [
  {
    id: 'd-1',
    name: 'Департамент IT и цифровизации',
    head: 'Ахмедов У.М.',
    tasksCount: 12,
    overdueCount: 0,
    kpi: 98
  },
  {
    id: 'd-2',
    name: 'Финансовый департамент',
    head: 'Каримова Н.М.',
    tasksCount: 7,
    overdueCount: 0,
    kpi: 90
  },
  {
    id: 'd-3',
    name: 'Департамент логистики и закупок',
    head: 'Туляганов Д.Х.',
    tasksCount: 15,
    overdueCount: 2,
    kpi: 74
  },
  {
    id: 'd-4',
    name: 'Аналитический сектор',
    head: 'Сабиров А.Р.',
    tasksCount: 4,
    overdueCount: 0,
    kpi: 95
  }
];

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
      // Local Guest Storage
      const items = getLocalItem<Task[]>('t_tasks', defaultTasks);
      setTasks(items);
      setLoading(false);
      return;
    }

    // Real Firebase Storage
    const q = query(collection(db, 'users', auth.currentUser.uid, 'tasks'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)));
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
      console.error(e);
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

    const q = query(collection(db, 'users', auth.currentUser.uid, 'meetings'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMeetings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Meeting)));
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

    const q = query(collection(db, 'users', auth.currentUser.uid, 'letters'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLetters(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Letter)));
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

    const q = query(collection(db, 'users', auth.currentUser.uid, 'reports'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setReports(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report)));
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
      console.error(e);
    }
  };

  return { reports, loading, addReport, updateReportStatus };
}

// 5. Complaints state hook (Local-backed tracker)
export function useComplaints() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const items = getLocalItem<Complaint[]>('t_complaints', defaultComplaints);
    setComplaints(items);
    setLoading(false);
  }, []);

  const addComplaint = (data: Omit<Complaint, 'id' | 'createdAt'>) => {
    const items = getLocalItem<Complaint[]>('t_complaints', defaultComplaints);
    const newC: Complaint = {
      ...data,
      id: 'c-' + Math.random().toString(36).substr(2, 9),
      createdAt: Date.now()
    };
    const updated = [newC, ...items];
    setLocalItem('t_complaints', updated);
    setComplaints(updated);
  };

  const updateComplaintStatus = (id: string, status: Complaint['status']) => {
    const items = getLocalItem<Complaint[]>('t_complaints', defaultComplaints);
    const updated = items.map(c => c.id === id ? { ...c, status } : c);
    setLocalItem('t_complaints', updated);
    setComplaints(updated);
  };

  const updateComplaintResponse = (id: string, responseTemplate: string) => {
    const items = getLocalItem<Complaint[]>('t_complaints', defaultComplaints);
    const updated = items.map(c => c.id === id ? { ...c, responseTemplate, status: 'in_progress' as const } : c);
    setLocalItem('t_complaints', updated);
    setComplaints(updated);
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
