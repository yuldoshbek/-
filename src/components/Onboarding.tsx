import React from 'react';
import { Domain } from '../types';
import { useWorkspace } from '../context/WorkspaceContext';
import { PROFILES, ALL_PROFILE_IDS } from '../lib/profiles';

export default function Onboarding() {
  const { setDomain } = useWorkspace();

  const handleSelect = (id: Domain) => {
    setDomain(id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 flex items-center justify-center p-6">
      <div className="max-w-5xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-blue-500/20">
              <span className="text-white text-xl font-black">A</span>
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-black text-white tracking-tight">Assistant OS</h1>
              <p className="text-xs text-slate-400 font-medium">Universal Executive Workspace</p>
            </div>
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-3">
            В каком формате вы работаете?
          </h2>
          <p className="text-slate-400 text-base max-w-2xl mx-auto">
            Выберите направление — система подстроит интерфейс, терминологию, модули и поведение ИИ под ваш формат работы. Вы сможете сменить профиль в любой момент в настройках.
          </p>
        </div>

        {/* Profile Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ALL_PROFILE_IDS.map(id => {
            const p = PROFILES[id];
            return (
              <button
                key={id}
                onClick={() => handleSelect(id)}
                className="group p-6 rounded-2xl border border-slate-700/50 bg-slate-800/50 backdrop-blur-sm text-left transition-all duration-300 hover:border-blue-500/60 hover:bg-slate-800/80 hover:shadow-xl hover:shadow-blue-500/5 hover:scale-[1.02] cursor-pointer"
              >
                <div className="text-3xl mb-4">{p.icon}</div>
                <h3 className="text-lg font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">
                  {p.name}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {p.description}
                </p>
                <div className="mt-4 pt-4 border-t border-slate-700/50">
                  <div className="flex flex-wrap gap-1.5">
                    {p.modules.filter(m => m !== 'settings' && m !== 'dashboard' && m !== 'ai').slice(0, 5).map(m => (
                      <span
                        key={m}
                        className="px-2 py-0.5 rounded-md bg-slate-700/50 text-[10px] font-semibold text-slate-300 uppercase"
                      >
                        {p.labels[m] || m}
                      </span>
                    ))}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="text-center mt-10">
          <p className="text-xs text-slate-500">
            Профиль влияет только на интерфейс и поведение ИИ. Все ваши данные сохраняются при смене профиля.
          </p>
        </div>
      </div>
    </div>
  );
}
