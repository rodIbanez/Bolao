
import React, { useState } from 'react';
import { Match, Language, Prediction, User } from '../types';
import { TRANSLATIONS, SCORING_RULES } from '../constants';

interface MatchCardProps {
  match: Match;
  lang: Language;
  prediction?: Prediction;
  onClick: () => void;
}

type MatchStatus = 'SCHEDULED' | 'LIVE' | 'FINISHED';

const MatchCard: React.FC<MatchCardProps> = ({ match, lang, prediction, onClick }) => {
  const [showOthers, setShowOthers] = useState(false);
  const t = TRANSLATIONS[lang];
  const startTime = new Date(match.startTime);
  const now = new Date();
  
  // Calculate Status
  const getMatchStatus = (): MatchStatus => {
    // If we have actual scores and match was a while ago, it's finished
    if (match.actualHomeScore !== undefined && match.actualAwayScore !== undefined) {
      const matchAge = now.getTime() - startTime.getTime();
      if (matchAge > 120 * 60 * 1000) return 'FINISHED'; // Finished after 2 hours
      if (matchAge >= 0) return 'LIVE';
    }
    if (now >= startTime) return 'LIVE';
    return 'SCHEDULED';
  };

  const status = getMatchStatus();
  const isLocked = status !== 'SCHEDULED';
  
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat(lang, {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const calculatePoints = (pred?: Prediction): number | null => {
    if (status !== 'FINISHED' || !pred || match.actualHomeScore === undefined) return null;
    const { actualHomeScore: ah, actualAwayScore: aa } = match;
    const { homeScore: ph, awayScore: pa } = pred;

    let pts = 0;
    const actualDiff = ah - aa;
    const predDiff = ph - pa;
    const correctOutcome = Math.sign(actualDiff) === Math.sign(predDiff);

    if (ah === ph && aa === pa) pts = SCORING_RULES.exact;
    else if (correctOutcome && actualDiff === predDiff) pts = SCORING_RULES.diff;
    else if (correctOutcome) pts = SCORING_RULES.outcome;
    else if (ph === ah || pa === aa) pts = SCORING_RULES.oneScore;

    return pred.isJoker ? pts * 2 : pts;
  };

  const userPoints = calculatePoints(prediction);

  // Reveal Logic: Fetch other users' predictions for this specific match
  const getOthersPredictions = () => {
    const allUsers: User[] = JSON.parse(localStorage.getItem('wc_users_db') || '[]');
    const currentUser = JSON.parse(localStorage.getItem('wc_user') || '{}');
    
    return allUsers
      .filter(u => u.email !== currentUser.email && u.predictions[match.id])
      .map(u => ({
        name: `${u.name} ${u.surname[0]}.`,
        pred: u.predictions[match.id],
        pts: calculatePoints(u.predictions[match.id])
      }));
  };

  const others = showOthers ? getOthersPredictions() : [];

  return (
    <div className={`relative w-full overflow-hidden rounded-[2.5rem] border transition-all duration-500 shadow-sm ${
      status === 'LIVE' ? 'ring-2 ring-red-500 ring-offset-2 animate-pulse-slow' : 'border-slate-100'
    } ${status === 'FINISHED' ? 'bg-slate-50/50 opacity-90' : 'bg-white'}`}>
      
      {/* Top Decoration */}
      <div 
        className="h-1.5 w-full opacity-80" 
        style={{ background: `linear-gradient(to right, ${match.homeTeam.color}, ${match.awayTeam.color})` }}
      />
      
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{match.group}</span>
            <span className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter">{match.venue}</span>
          </div>
          
          <div className="flex gap-2 items-center">
             {status === 'LIVE' && (
               <div className="flex items-center gap-1.5 bg-red-500 text-white px-3 py-1 rounded-full animate-pulse">
                 <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                 <span className="text-[10px] font-black uppercase tracking-widest">LIVE</span>
               </div>
             )}
             {status === 'FINISHED' && (
               <div className="bg-slate-800 text-white px-3 py-1 rounded-full">
                 <span className="text-[10px] font-black uppercase tracking-widest">FINISHED</span>
               </div>
             )}
             {status === 'SCHEDULED' && (
               <div className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full">
                 <span className="text-[10px] font-black uppercase tracking-widest">{formatTime(startTime)}</span>
               </div>
             )}
          </div>
        </div>

        {/* Main Score Area */}
        <div className="flex items-center justify-between gap-4 mb-6">
          {/* Home */}
          <div className="flex flex-col items-center flex-1">
            <div className="text-5xl mb-3 drop-shadow-md transform group-hover:scale-110 transition-transform">{match.homeTeam.flag}</div>
            <span className="font-black text-[11px] text-center text-slate-800 uppercase tracking-tight">{match.homeTeam.name[lang]}</span>
          </div>

          {/* Center Display */}
          <div className="flex flex-col items-center min-w-[120px]">
            {status !== 'SCHEDULED' ? (
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-4">
                  <span className="text-4xl font-black text-slate-900">{match.actualHomeScore ?? 0}</span>
                  <span className="text-slate-200 font-bold text-2xl">-</span>
                  <span className="text-4xl font-black text-slate-900">{match.actualAwayScore ?? 0}</span>
                </div>
                {prediction && (
                  <div className="mt-2 flex items-center gap-1.5 bg-blue-50 px-2 py-0.5 rounded-lg">
                    <span className="text-[9px] font-bold text-blue-400 uppercase tracking-tighter">Palpite:</span>
                    <span className="text-[10px] font-black text-blue-600">{prediction.homeScore}-{prediction.awayScore}</span>
                    {prediction.isJoker && <span>🃏</span>}
                  </div>
                )}
              </div>
            ) : (
              <button 
                onClick={onClick}
                className="group flex flex-col items-center gap-1"
              >
                {prediction ? (
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl font-black text-blue-600">{prediction.homeScore}</span>
                      <span className="text-slate-200 font-bold">-</span>
                      <span className="text-3xl font-black text-blue-600">{prediction.awayScore}</span>
                    </div>
                    {prediction.isJoker && <span className="text-xs">🃏 Joker</span>}
                    <span className="text-[9px] font-bold text-slate-300 uppercase mt-1 group-hover:text-blue-500 transition-colors">{t.edit}</span>
                  </div>
                ) : (
                  <div className="px-6 py-3 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl text-xs font-black text-slate-400 group-hover:border-blue-300 group-hover:text-blue-500 transition-all">
                    PALPITAR
                  </div>
                )}
              </button>
            )}
          </div>

          {/* Away */}
          <div className="flex flex-col items-center flex-1">
            <div className="text-5xl mb-3 drop-shadow-md transform group-hover:scale-110 transition-transform">{match.awayTeam.flag}</div>
            <span className="font-black text-[11px] text-center text-slate-800 uppercase tracking-tight">{match.awayTeam.name[lang]}</span>
          </div>
        </div>

        {/* Action / Results Bar */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-50">
          {status === 'FINISHED' ? (
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-black px-3 py-1 rounded-full ${userPoints && userPoints >= SCORING_RULES.exact ? 'bg-green-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                {userPoints !== null ? `+${userPoints} PTS` : '0 PTS'}
              </span>
              <button 
                onClick={() => setShowOthers(!showOthers)}
                className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors"
              >
                {showOthers ? 'Recolher' : 'Match Summary'}
              </button>
            </div>
          ) : status === 'LIVE' ? (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <span className="text-xs">🔒</span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.locked}</span>
              </div>
              <button 
                onClick={() => setShowOthers(!showOthers)}
                className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform"
              >
                <span>Spy Others</span>
                <span className="text-xs">👁️</span>
              </button>
            </div>
          ) : (
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">Predictions close 10m before start</span>
          )}
        </div>

        {/* Reveal Section (Other Users' Predictions) */}
        {showOthers && (status !== 'SCHEDULED') && (
          <div className="mt-4 pt-4 border-t border-slate-100 animate-in slide-in-from-top-2 duration-300">
             <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Other Players</h4>
             <div className="space-y-2">
                {others.length > 0 ? others.map((o, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-slate-50/50 p-2 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2">
                       <div className="w-6 h-6 rounded-md bg-slate-200 flex items-center justify-center text-[8px] font-black text-slate-500">
                         {o.name[0]}
                       </div>
                       <span className="text-[10px] font-bold text-slate-700">{o.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                       <span className="text-[10px] font-black text-slate-900">{o.pred.homeScore}-{o.pred.awayScore} {o.pred.isJoker && '🃏'}</span>
                       {status === 'FINISHED' && (
                         <span className="text-[9px] font-black text-blue-600">+{o.pts}</span>
                       )}
                    </div>
                  </div>
                )) : (
                  <p className="text-[10px] text-slate-400 italic">No other predictions found.</p>
                )}
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchCard;
