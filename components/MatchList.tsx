
import React, { useState } from 'react';
import { Match, Language, Prediction } from '../types';
import { MOCK_MATCHES, TRANSLATIONS } from '../constants';
import MatchCard from './MatchCard';
import PredictionModal from './PredictionModal';

interface MatchListProps {
  lang: Language;
  userPredictions: Record<string, Prediction>;
  onSavePrediction: (matchId: string, pred: Prediction) => void;
}

const MatchList: React.FC<MatchListProps> = ({ lang, userPredictions, onSavePrediction }) => {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  const t = TRANSLATIONS[lang];

  return (
    <div className="space-y-4 pb-20">
      <div className="flex justify-between items-center px-1">
        <h3 className="font-bold text-slate-800 uppercase tracking-wider text-sm">
          {t.predictions}
        </h3>
        <p className="text-[10px] text-slate-400 font-medium">
          {t.matchStartMessage}
        </p>
      </div>

      <div className="grid gap-4">
        {MOCK_MATCHES.map((match) => (
          <MatchCard 
            key={match.id}
            match={match}
            lang={lang}
            prediction={userPredictions[match.id]}
            onClick={() => setSelectedMatch(match)}
          />
        ))}
      </div>

      {selectedMatch && (
        <PredictionModal 
          lang={lang}
          match={selectedMatch}
          existingPrediction={userPredictions[selectedMatch.id]}
          onClose={() => setSelectedMatch(null)}
          onSave={(pred) => {
            onSavePrediction(selectedMatch.id, pred);
            setSelectedMatch(null);
          }}
        />
      )}
    </div>
  );
};

export default MatchList;
