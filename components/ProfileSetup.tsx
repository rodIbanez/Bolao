
import React, { useState } from 'react';
import { Language, User, Team } from '../types';
import { TRANSLATIONS, TEAMS } from '../constants';

interface ProfileSetupProps {
  lang: Language;
  onComplete: (data: Partial<User>) => void;
}

const ProfileSetup: React.FC<ProfileSetupProps> = ({ lang, onComplete }) => {
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [preferredTeam, setPreferredTeam] = useState('');
  const [photo, setPhoto] = useState<string | undefined>(undefined);

  const t = TRANSLATIONS[lang];

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !surname || !preferredTeam) return;
    onComplete({ name, surname, preferredTeam, photo });
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
      <h2 className="text-2xl font-bold mb-6 text-slate-800">Complete seu Perfil</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-col items-center">
          <div className="relative group cursor-pointer">
            <div className="w-24 h-24 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 overflow-hidden relative">
              {photo ? (
                <img src={photo} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs text-center px-2">Adicionar Foto</span>
              )}
              <input 
                type="file" 
                accept="image/*" 
                onChange={handlePhotoUpload}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t.name}*</label>
            <input 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t.surname}*</label>
            <input 
              required
              value={surname}
              onChange={(e) => setSurname(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">{t.preferredTeam}*</label>
          <p className="text-[10px] text-slate-400 italic mb-2 leading-tight">
            {t.prefTeamInfo}
          </p>
          <select 
            required
            value={preferredTeam}
            onChange={(e) => setPreferredTeam(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 appearance-none"
          >
            <option value="">Seleccione...</option>
            {Object.values(TEAMS).map((team) => (
              <option key={team.id} value={team.name[lang]}>
                {team.flag} {team.name[lang]}
              </option>
            ))}
          </select>
        </div>

        <button 
          type="submit"
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-green-500/30 transition"
        >
          {t.save}
        </button>
      </form>
    </div>
  );
};

export default ProfileSetup;
