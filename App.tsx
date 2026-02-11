
import React, { useState, useEffect } from 'react';
import { User, Language, Prediction, Match } from './types';
import { TRANSLATIONS, MOCK_MATCHES } from './constants';
import Login from './components/Auth';
import MatchList from './components/MatchList';
import ProfileSetup from './components/ProfileSetup';
import Leaderboard from './components/Leaderboard';

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('pt');
  const [user, setUser] = useState<User | null>(null);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [activeTab, setActiveTab] = useState<'matches' | 'ranking'>('matches');

  const t = TRANSLATIONS[lang];

  useEffect(() => {
    const savedUser = localStorage.getItem('wc_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (loggedUser: User) => {
    setUser(loggedUser);
    localStorage.setItem('wc_user', JSON.stringify(loggedUser));
  };

  const handleRegister = (email: string) => {
    const newUser: Partial<User> = { email, predictions: {} };
    setUser(newUser as User);
    setShowProfileSetup(true);
  };

  const handleProfileComplete = (profileData: Partial<User>) => {
    const completeUser = { ...user, ...profileData, predictions: {} } as User;
    setUser(completeUser);
    localStorage.setItem('wc_user', JSON.stringify(completeUser));
    setShowProfileSetup(false);

    const users = JSON.parse(localStorage.getItem('wc_users_db') || '[]');
    users.push(completeUser);
    localStorage.setItem('wc_users_db', JSON.stringify(users));
  };

  const handleLogout = () => {
    localStorage.removeItem('wc_user');
    setUser(null);
  };

  const updatePrediction = (matchId: string, pred: Prediction) => {
    if (!user) return;
    const updatedUser = {
      ...user,
      predictions: {
        ...user.predictions,
        [matchId]: pred
      }
    };
    setUser(updatedUser);
    localStorage.setItem('wc_user', JSON.stringify(updatedUser));
    
    const users = JSON.parse(localStorage.getItem('wc_users_db') || '[]');
    const index = users.findIndex((u: any) => u.email === user.email);
    if (index !== -1) {
      users[index] = updatedUser;
      localStorage.setItem('wc_users_db', JSON.stringify(users));
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 px-4 py-3 flex justify-between items-center border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 flex items-center justify-center">
             <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-red-500 to-green-600 rounded-lg rotate-3 shadow-lg opacity-80"></div>
             <div className="relative bg-white rounded-lg w-9 h-9 flex items-center justify-center text-slate-900 shadow-sm border border-slate-100">
               <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-blue-600" stroke="currentColor" strokeWidth="2.5">
                 <circle cx="12" cy="12" r="10" />
                 <path d="M12 2a10 10 0 0 1 10 10M12 22a10 10 0 0 1-10-10" stroke="red" strokeWidth="1.5"/>
                 <circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.2"/>
                 <path d="M12 2v20M2 12h20" stroke="green" strokeWidth="1" strokeDasharray="2 2"/>
               </svg>
             </div>
          </div>
          <div>
            <h1 className="font-black text-xl tracking-tight leading-none bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-red-600">BOLÃO</h1>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">UNITED 2026</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select 
            value={lang} 
            onChange={(e) => setLang(e.target.value as Language)}
            className="text-xs font-bold bg-slate-100 border-none rounded-full px-3 py-1.5 outline-none cursor-pointer hover:bg-slate-200 transition appearance-none text-center"
          >
            <option value="pt">PT</option>
            <option value="en">EN</option>
            <option value="es">ES</option>
          </select>
          
          {user && (
            <button 
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-500 transition-colors"
              title={t.logout}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          )}
        </div>
      </header>

      <main className={`flex-1 ${!user && !showProfileSetup ? '' : 'max-w-xl mx-auto px-4 mt-6 w-full'}`}>
        {!user && !showProfileSetup && (
          <Login 
            lang={lang} 
            onLogin={handleLogin} 
            onRegister={handleRegister} 
          />
        )}

        {showProfileSetup && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ProfileSetup 
              lang={lang} 
              onComplete={handleProfileComplete} 
            />
          </div>
        )}

        {user && !showProfileSetup && (
          <div className="space-y-6 animate-in fade-in duration-500">
            {activeTab === 'matches' ? (
              <>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-4 opacity-5">
                    <svg className="w-24 h-24 rotate-12" fill="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" />
                    </svg>
                  </div>
                  <div className="flex items-center gap-5 relative z-10">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center text-blue-600 font-bold text-xl overflow-hidden shadow-inner border border-blue-200/50">
                      {user.photo ? (
                        <img src={user.photo} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span>{user.name?.[0]}{user.surname?.[0]}</span>
                      )}
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-slate-800 tracking-tight">{t.welcome}, {user.name}!</h2>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full uppercase tracking-widest border border-slate-200/50">
                          Squad: {user.preferredTeam}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <MatchList 
                  lang={lang} 
                  userPredictions={user.predictions} 
                  onSavePrediction={updatePrediction} 
                />
              </>
            ) : (
              <Leaderboard lang={lang} matches={MOCK_MATCHES} />
            )}
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      {user && !showProfileSetup && (
        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm bg-white/90 backdrop-blur-xl border border-slate-200 rounded-3xl shadow-2xl p-1.5 flex gap-1 z-50">
          <button 
            onClick={() => setActiveTab('matches')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === 'matches' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {t.matches}
          </button>
          <button 
            onClick={() => setActiveTab('ranking')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold transition-all ${activeTab === 'ranking' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            {t.ranking}
          </button>
        </nav>
      )}
    </div>
  );
};

export default App;
