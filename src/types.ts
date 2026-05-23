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
