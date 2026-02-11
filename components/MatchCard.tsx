
import React from 'react';
import { Match, Language, Prediction } from '../types';
import { TRANSLATIONS } from '../constants';

interface MatchCardProps {
  match: Match;
  lang: Language;
  prediction?: Prediction;
  onClick: () => void;
}

const MatchCard: React.FC<MatchCardProps> = ({ match, lang, prediction, onClick }) => {
  const t = TRANSLATIONS[lang];
  const startTime = new Date(match.startTime);
  const now = new Date();
  const timeUntilStart = startTime.getTime() - now.getTime();
  const isLocked = timeUntilStart < 10 * 60 * 1000;
  const isFinished = match.actualHomeScore !== undefined && match.actualAwayScore !== undefined;

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat(lang, {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getPoints = () => {
    if (!isFinished || !prediction) return null;
    const { actualHomeScore, actualAwayScore } = match;
    const { homeScore: pHome, awayScore: pAway } = prediction;

    // Exact score
    if (actualHomeScore === pHome && actualAwayScore === pAway) return 5;
    
    // Correct outcome
    const actualDiff = (actualHomeScore || 0) - (actualAwayScore || 0);
    const predDiff = pHome - pAway;
    if ((actualDiff > 0 && predDiff > 0) || (actualDiff < 0 && predDiff < 0) || (actualDiff === 0 && predDiff === 0)) return 2;

    return 0;
  };

  const points = getPoints();

  return (
    <button 
      onClick={(isLocked || isFinished) ? undefined : onClick}
      className={`relative w-full overflow-hidden rounded-3xl border transition-all group ${
        (isLocked || isFinished) ? 'cursor-default' : 'hover:shadow-xl hover:-translate-y-1 active:scale-[0.98]'
      } ${isFinished ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-100 shadow-sm'}`}
    >
      <div 
        className="h-1.5 w-full" 
        style={{ background: `linear-gradient(to right, ${match.homeTeam.color}, ${match.awayTeam.color})` }}
      />
      
      <div className="p-5 flex flex-col gap-5">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{match.group} • {match.venue}</span>
          <div className="flex gap-2">
            {isFinished && points !== null && (
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${points === 5 ? 'bg-green-100 text-green-700' : points === 2 ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-500'}`}>
                +{points} PTS
              </span>
            )}
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${isFinished ? 'bg-slate-800 text-white' : isLocked ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
              {isFinished ? 'Fim' : isLocked ? t.locked : formatTime(startTime)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          {/* Home Team */}
          <div className="flex flex-col items-center flex-1">
            <div className="text-4xl mb-2 filter drop-shadow-sm">{match.homeTeam.flag}</div>
            <span className="font-black text-xs text-center line-clamp-1 text-slate-800 uppercase tracking-tight">{match.homeTeam.name[lang]}</span>
          </div>

          {/* Scores Area */}
          <div className="flex flex-col items-center min-w-[100px]">
            {isFinished ? (
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-black text-slate-900">{match.actualHomeScore}</span>
                  <span className="text-slate-300 font-bold">-</span>
                  <span className="text-3xl font-black text-slate-900">{match.actualAwayScore}</span>
                </div>
                {prediction && (
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Seu palpite: {prediction.homeScore}-{prediction.awayScore}</span>
                )}
              </div>
            ) : prediction ? (
              <div className="flex items-center gap-3">
                <span className="text-2xl font-black text-blue-600">{prediction.homeScore}</span>
                <span className="text-slate-200 font-bold">-</span>
                <span className="text-2xl font-black text-blue-600">{prediction.awayScore}</span>
              </div>
            ) : (
              <div className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black text-slate-400">
                {isLocked ? '---' : 'VS'}
              </div>
            )}
          </div>

          {/* Away Team */}
          <div className="flex flex-col items-center flex-1">
            <div className="text-4xl mb-2 filter drop-shadow-sm">{match.awayTeam.flag}</div>
            <span className="font-black text-xs text-center line-clamp-1 text-slate-800 uppercase tracking-tight">{match.awayTeam.name[lang]}</span>
          </div>
        </div>

        {!isLocked && !isFinished && (
          <div className="text-center pt-1 border-t border-slate-50">
             <span className={`text-[10px] font-black uppercase tracking-widest transition-all ${prediction ? 'text-blue-500 group-hover:text-blue-600' : 'text-slate-400 group-hover:text-slate-800'}`}>
              {prediction ? t.edit : '+ Clique para palpitar'}
             </span>
          </div>
        )}
      </div>
    </button>
  );
};

export default MatchCard;
