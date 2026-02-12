
import React from 'react';
import { User, Language, Match } from '../types';
import { TRANSLATIONS, SCORING_RULES } from '../constants';

interface LeaderboardProps {
  lang: Language;
  matches: Match[];
  groupId: string | null;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ lang, matches, groupId }) => {
  const t = TRANSLATIONS[lang];

  const calculatePoints = (user: User) => {
    let total = 0;
    matches.forEach(match => {
      const pred = user.predictions[match.id];
      if (pred && match.actualHomeScore !== undefined && match.actualAwayScore !== undefined) {
        const { actualHomeScore: ah, actualAwayScore: aa } = match;
        const { homeScore: ph, awayScore: pa, isJoker } = pred;

        let matchPts = 0;
        const actualDiff = ah - aa;
        const predDiff = ph - pa;
        const correctOutcome = Math.sign(actualDiff) === Math.sign(predDiff);

        // Tier 1: Exact Score
        if (ah === ph && aa === pa) {
          matchPts = SCORING_RULES.exact;
        } 
        // Tier 2: Correct Outcome + Same Difference
        else if (correctOutcome && actualDiff === predDiff) {
          matchPts = SCORING_RULES.diff;
        }
        // Tier 3: Correct Outcome
        else if (correctOutcome) {
          matchPts = SCORING_RULES.outcome;
        }
        // Tier 4: One side score matches
        else if (ph === ah || pa === aa) {
          matchPts = SCORING_RULES.oneScore;
        }

        total += isJoker ? matchPts * 2 : matchPts;
      }
    });
    return total;
  };

  // Get all users from storage
  const allUsers: User[] = JSON.parse(localStorage.getItem('wc_users_db') || '[]');
  
  // Filter by group if groupId is provided
  const groupUsers = groupId 
    ? allUsers.filter(user => user.groupIds && user.groupIds.includes(groupId))
    : allUsers;

  // Calculate points and sort
  const rankings = groupUsers
    .map(user => ({
      ...user,
      totalPoints: calculatePoints(user)
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints);

  return (
    <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">{t.ranking}</h3>
        {groupId && (
          <span className="text-[10px] font-black bg-blue-600 text-white px-3 py-1 rounded-full uppercase tracking-widest">
            {rankings.length} {rankings.length === 1 ? 'membro' : 'membros'}
          </span>
        )}
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50">
              <th className="px-6 py-4 w-16 text-center">{t.rank}</th>
              <th className="px-2 py-4">{t.player}</th>
              <th className="px-6 py-4 text-right">{t.points}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {rankings.map((user, index) => (
              <tr key={user.email} className={`group hover:bg-slate-50/50 transition-colors ${index === 0 ? 'bg-yellow-50/30' : ''}`}>
                <td className="px-6 py-5 text-center">
                  {index === 0 ? (
                    <span className="text-xl">🥇</span>
                  ) : index === 1 ? (
                    <span className="text-xl">🥈</span>
                  ) : index === 2 ? (
                    <span className="text-xl">🥉</span>
                  ) : (
                    <span className="text-sm font-black text-slate-400">{index + 1}</span>
                  )}
                </td>
                <td className="px-2 py-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-bold overflow-hidden border border-slate-200 shadow-sm transition-transform group-hover:scale-110">
                      {user.photo ? (
                        <img src={user.photo} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs">{user.name[0]}{user.surname[0]}</span>
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-black text-slate-900 leading-none mb-1">{user.name} {user.surname}</div>
                      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{user.preferredTeam}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5 text-right">
                  <span className="text-lg font-black text-slate-900">{user.totalPoints}</span>
                </td>
              </tr>
            ))}
            {rankings.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-20 text-center text-slate-400 font-medium">
                  {groupId ? 'Nenhum membro neste grupo ainda.' : 'Aguardando os primeiros palpites...'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Leaderboard;
