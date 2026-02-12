
import React, { useState } from 'react';
import { Match, Language, Prediction } from '../types';
import { TRANSLATIONS } from '../constants';

interface PredictionModalProps {
  lang: Language;
  match: Match;
  existingPrediction?: Prediction;
  onClose: () => void;
  onSave: (pred: Prediction) => void;
}

const PredictionModal: React.FC<PredictionModalProps> = ({ lang, match, existingPrediction, onClose, onSave }) => {
  const [homeScore, setHomeScore] = useState(existingPrediction?.homeScore ?? 0);
  const [awayScore, setAwayScore] = useState(existingPrediction?.awayScore ?? 0);
  const [isJoker, setIsJoker] = useState(existingPrediction?.isJoker ?? false);

  const t = TRANSLATIONS[lang];

  const handleSave = () => {
    onSave({
      homeScore,
      awayScore,
      isJoker,
      timestamp: Date.now()
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">
        <div 
          className="h-1.5 w-full" 
          style={{ background: `linear-gradient(to right, ${match.homeTeam.color}, ${match.awayTeam.color})` }}
        />
        
        <div className="p-6">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h3 className="text-lg font-black text-slate-800">{match.homeTeam.name[lang]} vs {match.awayTeam.name[lang]}</h3>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-tight">{match.venue}</p>
            </div>
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex items-center justify-around mb-8">
            {/* Home Score */}
            <div className="flex flex-col items-center gap-4">
              <div className="text-4xl">{match.homeTeam.flag}</div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setHomeScore(Math.max(0, homeScore - 1))}
                  className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xl font-bold text-slate-600 hover:bg-slate-200"
                >-</button>
                <span className="text-5xl font-black w-12 text-center text-slate-800">{homeScore}</span>
                <button 
                  onClick={() => setHomeScore(homeScore + 1)}
                  className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xl font-bold text-slate-600 hover:bg-slate-200"
                >+</button>
              </div>
            </div>

            <div className="text-2xl font-black text-slate-200">X</div>

            {/* Away Score */}
            <div className="flex flex-col items-center gap-4">
              <div className="text-4xl">{match.awayTeam.flag}</div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setAwayScore(Math.max(0, awayScore - 1))}
                  className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xl font-bold text-slate-600 hover:bg-slate-200"
                >-</button>
                <span className="text-5xl font-black w-12 text-center text-slate-800">{awayScore}</span>
                <button 
                  onClick={() => setAwayScore(awayScore + 1)}
                  className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xl font-bold text-slate-600 hover:bg-slate-200"
                >+</button>
              </div>
            </div>
          </div>

          {/* Joker Toggle */}
          <div className="mb-8 p-4 bg-slate-50 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🃏</span>
              <div>
                <p className="text-sm font-black text-slate-800">{t.joker}</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">{t.doublePoints}</p>
              </div>
            </div>
            <button 
              onClick={() => setIsJoker(!isJoker)}
              className={`w-12 h-6 rounded-full transition-colors relative ${isJoker ? 'bg-blue-600' : 'bg-slate-200'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isJoker ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="flex-1 py-4 font-bold text-slate-500 hover:bg-slate-50 rounded-2xl transition"
            >
              {t.cancel}
            </button>
            <button 
              onClick={handleSave}
              className="flex-[2] py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/20 transition transform active:scale-[0.98]"
            >
              {t.save}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PredictionModal;
