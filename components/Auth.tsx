
import React, { useState } from 'react';
import { Language, User } from '../types';
import { TRANSLATIONS } from '../constants';

interface AuthProps {
  lang: Language;
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (email: string, password: string, name: string, surname: string) => Promise<void>;
}

const Auth: React.FC<AuthProps> = ({ lang, onLogin, onRegister }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const t = TRANSLATIONS[lang];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!email || !password) {
        setError(t.invalidCredentials);
        return;
      }

      if (isLogin) {
        await onLogin(email, password);
      } else {
        if (!name) {
          setError('Please enter your name');
          return;
        }
        await onRegister(email, password, name, surname);
      }
    } catch (err: any) {
      setError(err?.message || 'An error occurred');
      console.error('Auth error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-64px)] w-full flex items-center justify-center p-4 overflow-hidden">
      {/* Background with Theme Colors */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-slate-900"></div>
        {/* Animated Gradient Orbs for USA/MEX/CAN theme */}
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/30 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-red-600/30 rounded-full blur-[120px] animate-pulse delay-700"></div>
        <div className="absolute top-[20%] right-[-5%] w-[40%] h-[40%] bg-green-600/20 rounded-full blur-[100px] animate-pulse delay-1000"></div>
        
        {/* Stadium Light Effect */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.05)_0%,transparent_70%)]"></div>
        
        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
      </div>

      <div className="relative z-10 w-full max-w-md animate-in fade-in zoom-in-95 duration-700">
        <div className="mb-10 text-center">
           <div className="inline-block p-4 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl mb-6">
             <div className="w-16 h-16 flex items-center justify-center bg-gradient-to-tr from-blue-500 to-red-500 rounded-2xl shadow-lg">
                <svg viewBox="0 0 24 24" fill="white" className="w-10 h-10">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" className="opacity-20"/>
                  <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.3"/>
                  <path d="M12 4v2m0 12v2M4 12h2m12 0h2" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
             </div>
           </div>
           <h2 className="text-3xl font-black text-white tracking-tighter mb-2">UNITED <span className="text-blue-400">20</span><span className="text-red-400">26</span></h2>
           <p className="text-slate-400 font-medium text-sm tracking-wide uppercase">{isLogin ? 'Bem-vindo de volta' : 'Crie sua conta'}</p>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl shadow-black/50 border border-slate-100 ring-1 ring-black/5 transition-all duration-300">
          <div className="flex justify-center mb-8">
            <div className="inline-flex bg-slate-100 p-1.5 rounded-2xl w-full">
              <button 
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${isLogin ? 'bg-white shadow-md text-blue-600 translate-z-10' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {t.login}
              </button>
              <button 
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${!isLogin ? 'bg-white shadow-md text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {t.register}
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                    {t.name || 'Name'}
                  </label>
                  <input 
                    type="text" 
                    required={!isLogin}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-slate-800"
                    placeholder="Your first name"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                    {t.surname || 'Surname'}
                  </label>
                  <input 
                    type="text" 
                    value={surname}
                    onChange={(e) => setSurname(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-slate-800"
                    placeholder="Your last name"
                  />
                </div>
              </>
            )}
            <div className="space-y-1">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                {t.email}
              </label>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-slate-800"
                placeholder="nome@exemplo.com"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                {t.password}
              </label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium text-slate-800"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-xs font-bold p-3 rounded-xl border border-red-100 flex items-center gap-2 animate-in slide-in-from-top-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="group relative w-full bg-slate-900 hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-4.5 rounded-2xl shadow-xl transition-all transform active:scale-[0.97] overflow-hidden"
            >
              <span className="relative z-10">{loading ? 'Loading...' : (isLogin ? t.login : t.register)}</span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-red-500 to-green-600 opacity-0 group-hover:opacity-10 transition-opacity"></div>
            </button>
          </form>
          
          <div className="mt-8 text-center">
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">World Cup 2026 Prediction League</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
