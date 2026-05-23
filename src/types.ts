export interface Task {
  id: string;
  title: string;
  description?: string;
  source?: string;
  assignee?: string;
  department?: string;
  deadline?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  risk?: string;
  userId: string;
  createdAt: number;
  updatedAt: number;
}

export interface Meeting {
  id: string;
  title: string;
  date?: string;
  participants?: string[];
  agenda?: string;
  notes?: string;
  decisions?: string[];
  userId: string;
  createdAt: number;
  updatedAt: number;
}

export interface Letter {
  id: string;
  subject: string;
  bodyUzbek?: string;
  instructionsRu?: string;
  status: 'draft' | 'ready' | 'sent';
  recipient?: string;
  userId: string;
  createdAt: number;
  updatedAt: number;
}

export interface Report {
  id: string;
  title: string;
  summary?: string;
  status: 'pending' | 'submitted' | 'approved';
  department?: string;
  userId: string;
  createdAt: number;
  updatedAt: number;
}

export interface Complaint {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'pending' | 'in_progress' | 'resolved';
  department: string;
  reporter: string;
  deadline: string;
  createdAt: number;
  updatedAt?: number;
  userId?: string;
  responseTemplate?: string;
}

export interface Department {
  id: string;
  name: string;
  head: string;
  tasksCount: number;
  overdueCount: number;
  kpi: number; // e.g. 92 (for 92%)
}

export interface EmployeeTask {
  id: string;
  employeeName: string;
  role: string;
  department: string;
  taskTitle: string;
  status: 'active' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high' | 'critical';
  deadline: string;
  kpiImpact: number;
  comments: string[];
  userId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface KeepNote {
  id: string;
  title: string;
  content: string;
  color: string;
  tag: string;
  isPinned: boolean;
  userId?: string;
  createdAt: number;
  updatedAt: string;
}

export interface Decision {
  id: string;
  referenceNo: string;
  title: string;
  category: 'Стратегическое' | 'Кадровое' | 'Финансовое' | 'Организационное';
  date: string;
  signer: string;
  status: 'Действует' | 'Архив' | 'Пересмотрено';
  summary: string;
  userId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface ExecutiveRisk {
  id: string;
  title: string;
  category: 'Финансовый' | 'Информационный' | 'Кадровый' | 'Логистика' | 'Политический';
  level: 'low' | 'medium' | 'high' | 'critical';
  mitidgationPlan: string;
  reporter: string;
  status: 'active' | 'mitigated';
  userId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface RemindItem {
  id: string;
  text: string;
  datetime: string;
  method: 'SMS' | 'Telegram' | 'Sber-Push' | 'Email';
  status: 'pending' | 'sent';
  userId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface ApprovalRequest {
  id: string;
  documentTitle: string;
  documentType: 'Письмо' | 'Отчет' | 'Протокол' | 'Распоряжение';
  applicant: string;
  status: 'pending' | 'approved' | 'rejected';
  urgency: 'routine' | 'urgent' | 'critical';
  appointedSigners: string[];
  currentSignerIndex: number;
  userId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface GuideItem {
  id: string;
  title: string;
  category: 'Документооборот' | 'Шаблоны' | 'Правила ТМК' | 'Инструкции';
  summary: string;
  content: string;
  userId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface MomProtocol {
  id: string;
  title: string;
  date: string;
  content: string;
  userId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface SubReport {
  id: string;
  title: string;
  content: string;
  userId?: string;
  createdAt: number;
  updatedAt: number;
}

