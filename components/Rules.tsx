
import React from 'react';
import { Language, ScoringConfig } from '../types';
import { TRANSLATIONS } from '../constants';

interface RulesProps {
  lang: Language;
  scoringConfig: ScoringConfig;
}

const Rules: React.FC<RulesProps> = ({ lang, scoringConfig }) => {
  const t = TRANSLATIONS[lang];

  const scenarios = [
    { label: t.exactScoreDesc, pts: scoringConfig.exact, icon: '🎯', desc: 'Acerto exato do placar dos dois times.' },
    { label: t.diffScoreDesc, pts: scoringConfig.diff, icon: '⚖️', desc: 'Acerto do vencedor e saldo de gols.' },
    { label: t.outcomeScoreDesc, pts: scoringConfig.outcome, icon: '🏁', desc: 'Acerto apenas do vencedor ou empate.' },
    { label: t.oneSideScoreDesc, pts: scoringConfig.oneScore, icon: '🔢', desc: 'Acerto de gols de apenas um dos times.' },
  ];

  return (
    <div className="space-y-6 pb-24">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-600"></span>
          {t.scoringTitle}
        </h3>
        
        <div className="grid gap-3">
          {scenarios.map((s, idx) => (
            <div key={idx} className="flex flex-col p-4 bg-slate-50 border border-slate-100 rounded-2xl group transition-all hover:bg-white hover:border-blue-200 hover:shadow-md">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-3">
                  <span className="text-xl group-hover:scale-110 transition-transform">{s.icon}</span>
                  <span className="text-xs font-black text-slate-800">{s.label}</span>
                </div>
                <div className="flex items-center gap-1 bg-slate-900 text-white px-3 py-1 rounded-full">
                  <span className="text-sm font-black">{s.pts}</span>
                  <span className="text-[8px] font-black uppercase tracking-widest">{t.points}</span>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 font-medium pl-8">{s.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 p-5 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl flex items-start gap-4 shadow-lg shadow-blue-500/20">
          <div className="bg-white/20 p-2 rounded-xl text-2xl">🃏</div>
          <div>
            <p className="text-xs font-black uppercase tracking-tight mb-1">{t.joker}</p>
            <p className="text-[11px] text-blue-50 font-medium leading-relaxed">
              Dobre sua pontuação! Se você ativar o Curinga e acertar o placar exato, você ganha <strong>{scoringConfig.exact * 2} pontos</strong>.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
        <div className="mb-8">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-600"></span>
            {t.deadlineTitle}
          </h3>
          <div className="bg-red-50/50 p-4 rounded-2xl border border-red-100">
            <p className="text-xs text-red-800 font-bold leading-relaxed">
              {t.deadlineInfo}
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-600"></span>
            {t.tiebreakerTitle}
          </h3>
          <div className="space-y-2">
            {[t.tiebreaker1, t.tiebreaker2, t.tiebreaker3].map((tb, idx) => (
              <div key={idx} className="text-xs text-slate-600 font-bold bg-slate-50/50 p-4 rounded-xl border border-slate-100/50 flex items-center gap-3">
                <span className="w-5 h-5 bg-white rounded-md flex items-center justify-center text-[10px] shadow-sm text-slate-400 border border-slate-100">{idx + 1}</span>
                {tb.substring(3)}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="text-center px-6">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">United 2026 • FIFA World Cup Predictor</p>
      </div>
    </div>
  );
};

export default Rules;
