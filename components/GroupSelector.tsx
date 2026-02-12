
import React, { useState } from 'react';
import { Language, Group } from '../types';
import { TRANSLATIONS } from '../constants';

interface GroupSelectorProps {
  lang: Language;
  userGroupIds: string[];
  activeGroupId: string | null;
  currentUserEmail: string;
  onSelectGroup: (id: string) => void;
  onJoinGroup: (id: string) => void;
  onCreateGroup: (group: Group) => void;
}

const generateGroupCode = (existingGroups: Group[]): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  do {
    code = '';
    for (let i = 0; i < 7; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  } while (existingGroups.some(g => g.code === code));
  return code;
};

const GroupSelector: React.FC<GroupSelectorProps> = ({ 
  lang, 
  userGroupIds, 
  activeGroupId, 
  currentUserEmail,
  onSelectGroup, 
  onJoinGroup,
  onCreateGroup 
}) => {
  const [view, setView] = useState<'list' | 'join' | 'create' | 'success'>('list');
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  
  // Create Form State
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newLang, setNewLang] = useState<Language>(lang);
  const [newPhoto, setNewPhoto] = useState<string | undefined>(undefined);
  const [lastCreatedGroup, setLastCreatedGroup] = useState<Group | null>(null);

  const t = TRANSLATIONS[lang];
  const allGroups: Group[] = JSON.parse(localStorage.getItem('wc_groups_db') || '[]');
  const myGroups = allGroups.filter(g => userGroupIds.includes(g.id));

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const group = allGroups.find(g => g.code.toUpperCase() === joinCode.toUpperCase());
    if (group) {
      if (userGroupIds.includes(group.id)) {
        setError('Você já participa deste grupo.');
        return;
      }
      onJoinGroup(group.id);
      setJoinCode('');
      setView('list');
    } else {
      setError('Código inválido.');
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;

    const code = generateGroupCode(allGroups);
    const newGroup: Group = {
      id: `g_${Date.now()}`,
      code,
      name: newName,
      description: newDesc,
      photoUrl: newPhoto,
      initials: newName.substring(0, 2).toUpperCase(),
      languageDefault: newLang,
      ownerUserId: currentUserEmail,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isPrivate: false,
      status: 'ACTIVE'
    };

    onCreateGroup(newGroup);
    setLastCreatedGroup(newGroup);
    setView('success');
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setNewPhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Código copiado!');
  };

  if (view === 'success' && lastCreatedGroup) {
    return (
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 text-center animate-in zoom-in-95 duration-500">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
          ✓
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">Grupo Criado!</h2>
        <p className="text-sm text-slate-500 mb-8 font-medium">Compartilhe o código abaixo com seus amigos para eles entrarem no bolão.</p>
        
        <div className="bg-slate-50 border-2 border-dashed border-slate-200 p-6 rounded-3xl mb-8 group cursor-pointer active:scale-95 transition-transform" onClick={() => copyToClipboard(lastCreatedGroup.code)}>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Código do Grupo</span>
          <span className="text-4xl font-black text-blue-600 tracking-widest">{lastCreatedGroup.code}</span>
          <span className="text-[10px] font-bold text-blue-400 block mt-4 group-hover:underline">Clique para copiar</span>
        </div>

        <button 
          onClick={() => setView('list')}
          className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-xl transition transform active:scale-95"
        >
          Ir para Meus Grupos
        </button>
      </div>
    );
  }

  if (view === 'create') {
    return (
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 animate-in slide-in-from-right-4 duration-500">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">{t.createGroup}</h3>
          <button onClick={() => setView('list')} className="text-slate-400 hover:text-slate-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleCreate} className="space-y-6">
          <div className="flex flex-col items-center mb-4">
            <div className="relative group cursor-pointer">
              <div className="w-20 h-20 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 overflow-hidden relative shadow-inner">
                {newPhoto ? (
                  <img src={newPhoto} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[9px] font-bold text-center px-2 uppercase tracking-widest">Foto do Grupo</span>
                )}
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mb-2">Nome do Grupo*</label>
            <input 
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold"
              placeholder="Ex: Família & Futebol"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mb-2">Descrição (Opcional)</label>
            <textarea 
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-sm"
              placeholder="Fale um pouco sobre o grupo..."
              rows={2}
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1 mb-2">Idioma Padrão</label>
            <select 
              value={newLang}
              onChange={(e) => setNewLang(e.target.value as Language)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none font-bold"
            >
              <option value="pt">Português (PT)</option>
              <option value="en">English (EN)</option>
              <option value="es">Español (ES)</option>
            </select>
          </div>

          <button 
            type="submit"
            className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-500/20 transition transform active:scale-95"
          >
            {t.createGroup}
          </button>
        </form>
      </div>
    );
  }

  if (view === 'join') {
    return (
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 animate-in slide-in-from-left-4 duration-500">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">{t.joinGroup}</h3>
          <button onClick={() => setView('list')} className="text-slate-400 hover:text-slate-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleJoin} className="space-y-6">
          <input 
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-5 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-black uppercase tracking-[0.3em] text-center text-xl"
            placeholder="XXXXXXX"
            autoFocus
          />
          {error && <p className="text-xs font-bold text-red-500 text-center">{error}</p>}
          <button 
            type="submit"
            className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-xl transition transform active:scale-95"
          >
            Confirmar Entrada
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* List Section */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">{t.myGroups}</h3>
          <div className="flex gap-2">
            <button onClick={() => setView('join')} className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all" title={t.joinGroup}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <button onClick={() => setView('create')} className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/20 transition-all" title={t.createGroup}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="grid gap-3">
          {myGroups.map(group => (
            <button
              key={group.id}
              onClick={() => onSelectGroup(group.id)}
              className={`p-5 rounded-3xl border-2 transition-all flex justify-between items-center group ${
                activeGroupId === group.id 
                  ? 'border-blue-500 bg-blue-50/30 shadow-md' 
                  : 'border-slate-50 hover:border-slate-200 bg-white'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black overflow-hidden shadow-sm transition-transform group-hover:scale-110 ${activeGroupId === group.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                  {group.photoUrl ? (
                    <img src={group.photoUrl} alt={group.name} className="w-full h-full object-cover" />
                  ) : (
                    group.initials
                  )}
                </div>
                <div className="text-left">
                  <div className="font-black text-slate-800 tracking-tight leading-none mb-1">{group.name}</div>
                  <div className="flex items-center gap-2">
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-1.5 py-0.5 rounded-md border border-slate-100">#{group.code}</div>
                    {group.ownerUserId === currentUserEmail && (
                      <span className="text-[8px] font-black text-blue-600 bg-blue-50 px-1 py-0.5 rounded-md uppercase">Dono</span>
                    )}
                  </div>
                </div>
              </div>
              {activeGroupId === group.id && (
                <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-blue-500/30 animate-in zoom-in-50 duration-300">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          ))}
          {myGroups.length === 0 && (
            <div className="py-12 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">{t.noGroups}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupSelector;
