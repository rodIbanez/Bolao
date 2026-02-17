import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Prediction } from '../types';

interface UsePredictionsReturn {
  predictions: Record<string, Prediction>;
  loading: boolean;
  error: string | null;
  submitPrediction: (matchId: string, homeScore: number, awayScore: number, isJoker?: boolean) => Promise<void>;
}

interface DBPrediction {
  id: string;
  user_id: string;
  group_id: string;
  match_id: string;
  home_score: number;
  away_score: number;
  is_joker: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Custom hook to manage predictions for a specific group
 * 
 * Fetches existing predictions for the current user in the given group
 * Provides a function to submit/update predictions
 * 
 * @param groupId - The ID of the group to fetch predictions for
 * @returns { predictions, loading, error, submitPrediction }
 */
export const usePredictions = (groupId: string): UsePredictionsReturn => {
  const [predictions, setPredictions] = useState<Record<string, Prediction>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!groupId) {
      setLoading(false);
      return;
    }

    const fetchPredictions = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get current authenticated user
        const { data: session } = await supabase.auth.getSession();
        
        if (!session?.session?.user?.id) {
          console.warn('⚠️ No authenticated user found');
          setPredictions({});
          setLoading(false);
          return;
        }

        const userId = session.session.user.id;

        // Fetch predictions for this user + group
        const { data, error: fetchError } = await supabase
          .from('predictions')
          .select('*')
          .eq('user_id', userId)
          .eq('group_id', groupId);

        if (fetchError) {
          console.error('❌ Error fetching predictions:', fetchError);
          setError(fetchError.message);
          return;
        }

        if (!data) {
          setPredictions({});
          return;
        }

        // Transform DB data (snake_case) to Frontend format (camelCase)
        // Create map: { matchId: { homeScore, awayScore, timestamp, isJoker } }
        const predictionsMap: Record<string, Prediction> = {};
        
        data.forEach((dbPred: DBPrediction) => {
          predictionsMap[dbPred.match_id] = {
            homeScore: dbPred.home_score,
            awayScore: dbPred.away_score,
            timestamp: new Date(dbPred.updated_at).getTime(),
            isJoker: dbPred.is_joker
          };
        });

        console.log(`✅ Fetched ${data.length} predictions for group ${groupId}`);
        setPredictions(predictionsMap);
      } catch (err: any) {
        console.error('❌ Unexpected error fetching predictions:', err);
        setError(err.message || 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchPredictions();
  }, [groupId]);

  /**
   * Submit or update a prediction
   * Uses UPSERT to handle both new predictions and updates
   */
  const submitPrediction = async (
    matchId: string, 
    homeScore: number, 
    awayScore: number,
    isJoker: boolean = false
  ): Promise<void> => {
    try {
      // Get current authenticated user
      const { data: session } = await supabase.auth.getSession();
      
      if (!session?.session?.user?.id) {
        throw new Error('No authenticated user found');
      }

      const userId = session.session.user.id;

      // Upsert prediction (insert or update if exists)
      const { error: upsertError } = await supabase
        .from('predictions')
        .upsert(
          {
            user_id: userId,
            group_id: groupId,
            match_id: matchId,
            home_score: homeScore,
            away_score: awayScore,
            is_joker: isJoker,
            updated_at: new Date().toISOString()
          },
          { 
            onConflict: 'user_id,group_id,match_id' // Unique constraint
          }
        );

      if (upsertError) {
        console.error('❌ Error saving prediction:', upsertError);
        throw upsertError;
      }

      // Update local state optimistically
      setPredictions(prev => ({
        ...prev,
        [matchId]: {
          homeScore,
          awayScore,
          timestamp: Date.now(),
          isJoker
        }
      }));

      console.log(`✅ Prediction saved for match ${matchId}: ${homeScore}-${awayScore}`);
    } catch (err: any) {
      console.error('❌ Failed to submit prediction:', err);
      throw err;
    }
  };

  return { predictions, loading, error, submitPrediction };
};
