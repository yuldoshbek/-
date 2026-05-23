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
  }
];

const defaultMeetings: Meeting[] = [
  {
    id: 'm-1',
    title: 'Расширенное заседание Кабинета Министров Республики Узбекистан',
    date: '2026-05-24',
    participants: ['Премьер-министр', 'Генеральный директор', 'Коллегия ведомств'],
    agenda: 'Ускорение реализации strategic инвестиционных проектов в сфере ТЭК и логистики.',
    notes: 'Необходимо срочно подготовить сводный доклад по модернизации ключевых объектов инфраструктуры.',
    decisions: [
      'Усилить персональную ответственность руководителей секторов за срыв сроков сдачи актов приемки.',
      'Передать функции технического надзора по приоритетным точкам независимому аудитору.'
    ],
    userId: 'guest',
    createdAt: Date.now() - 3600000 * 10,
    updatedAt: Date.now()
  }
];

const defaultLetters: Letter[] = [
  {
    id: 'l-1',
    subject: 'Запрос в Хокимият Ташкента о выделении дополнительной территории под проект Технопарка',
    instructionsRu: 'Написать строго официальное письмо хокиму города с просьбой ускорить рассмотрение документов по нашему предыдущему обращению и выделить участок площадью 1.5 Га.',
    bodyUzbek: 'Toshkent shahar Hokimi janoblariga!\n\nUshbu xatimiz orqali kompaniyamiz tomonidan amalga oshirilayotgan innovatsion Technopark loyihasini kengaytirish maqsadida qo\'shimcha 1.5 gektar yer maydoni ajratish bo\'yicha topshirilgan hujjatlar to\'plamini ko\'rib chiqishni jadallashtirishingizni so\'raymiz.',
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
    summary: 'В отчете подробно отражены этапы прокладки высоковольтных линий и проблемы с задержкой закупки силовых трансформаторов.',
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
    description: 'Скоропортящаяся продукция компании удерживается на пограничном терминале свыше 48 часов.',
    category: 'Логистика и Таможня',
    status: 'pending',
    department: 'Департамент логистики и закупок',
    reporter: 'ООО "КаргоЛинк"',
    deadline: '2026-05-25',
    createdAt: Date.now() - 3600000 * 26,
    updatedAt: Date.now(),
    userId: 'guest'
  }
];

const defaultDepartments: Department[] = [
  { id: 'd-1', name: 'Департамент IT и цифровизации', head: 'Ахмедов У.М.', tasksCount: 12, overdueCount: 0, kpi: 98 },
  { id: 'd-2', name: 'Финансовый департамент', head: 'Каримова Н.М.', tasksCount: 7, overdueCount: 0, kpi: 90 },
  { id: 'd-3', name: 'Департамент логистики и закупок', head: 'Туляганов Д.Х.', tasksCount: 15, overdueCount: 2, kpi: 74 },
  { id: 'd-4', name: 'Аналитический сектор', head: 'Сабиров А.Р.', tasksCount: 4, overdueCount: 0, kpi: 95 }
];

const defaultEmployeeTasks: EmployeeTask[] = [
  {
    id: 'emp-1',
    employeeName: 'Иванов С.П.',
    role: 'Главный специалист',
    department: 'Департамент IT и цифровизации',
    taskTitle: 'Провести миграцию локальных БД СЭД в кластер',
    status: 'active',
    priority: 'high',
    deadline: '2026-05-30',
    kpiImpact: 15,
    comments: ['Начал подготовительный бэкап таблиц.'],
    userId: 'guest',
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
];

const defaultKeepNotes: KeepNote[] = [
  {
    id: 'note-1',
    title: 'Срочный звонок в Кабмин',
    content: 'Уточнить дату приемки протокола по субсидиям импорта логистики.',
    color: 'bg-amber-50 border-amber-200',
    tag: 'Важно',
    isPinned: true,
    userId: 'guest',
    createdAt: Date.now(),
    updatedAt: new Date().toLocaleDateString('ru-RU')
  }
];

const defaultDecisions: Decision[] = [
  {
    id: 'dec-1',
    referenceNo: '№ ТМК-048/2026',
    title: 'О продлении льготных тарифов на транзит металлопроката по узлу Яллама',
    category: 'Стратегическое',
    date: '2026-05-20',
    signer: 'Юсупов А.Т. (Генеральный директор)',
    status: 'Действует',
    summary: 'Утвердить льготный коэффициент 0.85 для всех резидентов СЭЗ до конца календарного года.',
    userId: 'guest',
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
];

const defaultRisks: ExecutiveRisk[] = [
  {
    id: 'risk-1',
    title: 'Задержка транзита стальных комплектующих на узле Яллама',
    category: 'Логистика',
    level: 'critical',
    mitidgationPlan: 'Использовать резервный порт содействия и оформить таможенную гарантию.',
    reporter: 'Туляганов Д.Х. (Сектор импорта/логистики)',
    status: 'active',
    userId: 'guest',
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
];

const defaultReminders: RemindItem[] = [
  {
    id: 'rem-1',
    text: 'Собрать КПЭ-справку со 2-го сектора управления',
    datetime: '2026-05-24T10:00',
    method: 'Telegram',
    status: 'pending',
    userId: 'guest',
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
];

const defaultApprovals: ApprovalRequest[] = [
  {
    id: 'app-1',
    documentTitle: 'Запрос на субсидирование логистических расходов ООО "КаргоЛинк"',
    documentType: 'Письмо',
    applicant: 'Туляганов Д.Х. (Департамент логистики)',
    status: 'pending',
    urgency: 'urgent',
    appointedSigners: ['Каримова Н.М. (Минфинансы)', 'Юсупов А.Т. (Генеральный директор)'],
    currentSignerIndex: 0,
    userId: 'guest',
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
];

const defaultGuides: GuideItem[] = [
  {
    id: 'guide-1',
    title: 'Регламент создания исходящих писем в ведомства',
    category: 'Инструкции',
    summary: 'Правила согласования и отправки корреспонденции через единый СЭД портал ТМК.',
    content: 'Все исходящие письма регистрируются в Архиве и визируются по схеме: Исполнитель -> Директор департамента -> Комплаенс -> Директор.',
    userId: 'guest',
    createdAt: Date.now(),
    updatedAt: Date.now()
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

    const q = query(collection(db, 'users', auth.currentUser.uid, 'complaints'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setComplaints(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Complaint)));
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

    const q = query(collection(db, 'users', auth.currentUser.uid, 'employeeTasks'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setEmployeeTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EmployeeTask)));
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

    const q = query(collection(db, 'users', auth.currentUser.uid, 'keepNotes'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNotes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as KeepNote)));
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

    const q = query(collection(db, 'users', auth.currentUser.uid, 'decisions'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setDecisions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Decision)));
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

    const q = query(collection(db, 'users', auth.currentUser.uid, 'risks'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRisks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ExecutiveRisk)));
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

    const q = query(collection(db, 'users', auth.currentUser.uid, 'reminders'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setReminders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RemindItem)));
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

    const q = query(collection(db, 'users', auth.currentUser.uid, 'approvals'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setApprovals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ApprovalRequest)));
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

    const q = query(collection(db, 'users', auth.currentUser.uid, 'guides'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      // If collection is empty, write initial data synchronously
      const loaded = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GuideItem));
      if (loaded.length === 0) {
        // Bootstrap sample guide asynchronously so we do not block thread
        defaultGuides.forEach(async (g) => {
          const { id, ...cleanSpec } = g;
          try {
            await addDoc(collection(db, 'users', auth!.currentUser!.uid, 'guides'), {
              ...cleanSpec,
              userId: auth!.currentUser!.uid
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
