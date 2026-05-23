import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  MapPin, 
  PhoneCall, 
  Mail, 
  CheckCircle2, 
  Building 
} from 'lucide-react';

interface AuthorityPerson {
  id: string;
  name: string;
  role: string;
  department: string;
  phone: string;
  email: string;
  loadIndex: number; // Active tasks count
  areaOfResponsibility: string;
}

const initialAuthorityMap: AuthorityPerson[] = [
  {
    id: 'pers-1',
    name: 'Юсупов Алишер Тахирович',
    role: 'Генеральный директор',
    department: 'Администрация правления',
    phone: '+998 (71) 233-00-11',
    email: 'a.yusupov@tmk.uz',
    loadIndex: 3,
    areaOfResponsibility: 'Стратегическое планирование, лимиты одобрения затрат, координация министерств.'
  },
  {
    id: 'pers-2',
    name: 'Ахмедов Улугбек Муратович',
    role: 'Руководитель департамента IT',
    department: 'Департамент IT и цифровизации',
    phone: '+998 (90) 905-22-11',
    email: 'u.akhmedov@tmk.uz',
    loadIndex: 12,
    areaOfResponsibility: 'Цифровая СЭД, Сбер-Push шлюзы, интеграция баз данных, ИИ-Помощники.'
  },
  {
    id: 'pers-3',
    name: 'Каримова Наргиза Мухаммадовна',
    role: 'Директор финансового сектора',
    department: 'Финансовый департамент',
    phone: '+998 (94) 600-44-33',
    email: 'n.karimova@tmk.uz',
    loadIndex: 7,
    areaOfResponsibility: 'Согласование актов сверки бюджетных вложений, расчет НДС, компенсации.'
  },
  {
    id: 'pers-4',
    name: 'Туляганов Даврон Хамидович',
    role: 'Начальник сектора логистики',
    department: 'Департамент логистики и закупок',
    phone: '+998 (97) 111-55-99',
    email: 'd.tulyaganov@tmk.uz',
    loadIndex: 15,
    areaOfResponsibility: 'Растаможка трубных партий, разбор задержек на погранпереходе Яллама.'
  }
];

export default function ResponsibilityMap() {
  const [persons] = useState<AuthorityPerson[]>(initialAuthorityMap);
  const [search, setSearch] = useState('');

  const filtered = persons.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.department.toLowerCase().includes(search.toLowerCase()) ||
    p.areaOfResponsibility.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 font-sans">
      <header className="border-b border-slate-200/60 pb-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-xs font-bold text-slate-600 uppercase tracking-widest font-display">Кадровый реестр структуры</span>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 font-display mt-1">Карта зон ответственности (Responsibility Map)</h1>
          <p className="text-slate-500 text-sm mt-0.5">Визуальная матрица руководителей ведомств ТМК, координационные контакты и закрепленные лимиты.</p>
        </div>
      </header>

      <div className="space-y-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
          <input 
            id="resp-search"
            type="text" 
            placeholder="Поиск по ФИО, департаменту или полномочиям..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full text-xs border bg-white pl-8 pr-4 py-2 rounded-xl text-slate-800"
          />
        </div>

        {/* Grid map */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(p => (
            <div key={p.id} className="bg-white border rounded-2xl p-5 shadow-xs hover:shadow transition-shadow flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                    <Users size={18} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-xs leading-none">{p.name}</h3>
                    <span className="text-[10px] text-slate-400 font-medium block mt-1">{p.role}</span>
                  </div>
                </div>

                <div className="text-[11px] space-y-1.5 border-y py-2.5 my-1 text-slate-600">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Building size={13} className="text-slate-400" />
                    <span>{p.department}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <PhoneCall size={13} className="text-slate-400" />
                    <span>{p.phone}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Mail size={13} className="text-slate-400" />
                    <span>{p.email}</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-205">
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Зона ответственности</span>
                  <p className="text-[10px] text-slate-600 leading-relaxed">{p.areaOfResponsibility}</p>
                </div>
              </div>

              <div className="flex justify-between items-center text-[10px] font-mono font-bold text-slate-400">
                <span>Индекс СЭД нагрузки:</span>
                <span className={`px-2 py-0.5 rounded text-[10px] ${
                  p.loadIndex >= 12 ? 'bg-orange-50 text-orange-700 font-extrabold border border-orange-200' : 'bg-slate-105 text-slate-700'
                }`}>
                  {p.loadIndex} в работе
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
