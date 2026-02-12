
import React from 'react';
import { Language } from '../types';
import { TRANSLATIONS, SCORING_RULES } from '../constants';

interface RulesProps {
  lang: Language;
}

const Rules: React.FC<RulesProps> = ({ lang }) => {
  const t = TRANSLATIONS[lang];

  const scenarios = [
    { label: t.exactScoreDesc, pts: SCORING_RULES.exact, icon: '🎯' },
    { label: t.diffScoreDesc, pts: SCORING_RULES.diff, icon: '⚖️' },
    { label: t.outcomeScoreDesc, pts: SCORING_RULES.outcome, icon: '🏁' },
    { label: t.oneSideScoreDesc, pts: SCORING_RULES.oneScore, icon: '🔢' },
  ];

  return (
    <div className="space-y-6 pb-10">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-600"></span>
          {t.scoringTitle}
        </h3>
        
        <div className="grid gap-3">
          {scenarios.map((s, idx) => (
            <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl group transition-all hover:bg-white hover:border-blue-200 hover:shadow-md">
              <div className="flex items-center gap-4">
                <span className="text-2xl group-hover:scale-125 transition-transform">{s.icon}</span>
                <span className="text-xs font-bold text-slate-700">{s.label}</span>
              </div>
              <div className="flex items-center gap-1 bg-slate-900 text-white px-3 py-1 rounded-full">
                <span className="text-sm font-black">{s.pts}</span>
                <span className="text-[8px] font-black uppercase tracking-widest">{t.points}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-3">
          <span className="text-xl">🃏</span>
          <div>
            <p className="text-xs font-black text-blue-900 uppercase tracking-tight mb-1">{t.joker}</p>
            <p className="text-[11px] text-blue-700 font-medium leading-relaxed">
              Use o Curinga para dobrar a pontuação de qualquer partida! (Ex: {SCORING_RULES.exact} pts viram {SCORING_RULES.exact * 2} pts).
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-600"></span>
          {t.deadlineTitle}
        </h3>
        <p className="text-xs text-slate-500 font-medium leading-relaxed mb-6">
          {t.deadlineInfo}
        </p>

        <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-600"></span>
          {t.tiebreakerTitle}
        </h3>
        <div className="space-y-3">
          {[t.tiebreaker1, t.tiebreaker2, t.tiebreaker3].map((tb, idx) => (
            <p key={idx} className="text-xs text-slate-600 font-bold bg-slate-50/50 p-3 rounded-xl border border-slate-100/50">
              {tb}
            </p>
          ))}
        </div>
      </div>

      <div className="text-center px-6">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">United 2026 • Official Rules</p>
      </div>
    </div>
  );
};

export default Rules;
