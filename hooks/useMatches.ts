import { useState, useEffect } from 'react';
import { Match, Team } from '../types';
import { TEAMS, getTeamFlag } from '../constants';
import { supabase } from '../supabase';

interface UseMatchesReturn {
  matches: Match[];
  loading: boolean;
  error: string | null;
}

interface DBMatch {
  id: string;
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
  actual_home_score: number | null;
  actual_away_score: number | null;
  start_time: string;
  venue: string | null;
  group: string | null;
  status: string | null;
}

/**
 * Custom hook to fetch matches from Supabase and transform to frontend Match interface
 * 
 * Transforms:
 * - home_team (DB) -> homeTeam (Frontend Team object)
 * - away_team (DB) -> awayTeam (Frontend Team object)
 * - actual_home_score (DB) -> actualHomeScore (Frontend) [fallback: home_score]
 * - actual_away_score (DB) -> actualAwayScore (Frontend) [fallback: away_score]
 * - start_time (DB) -> startTime (Frontend)
 * - status (DB) -> status (Frontend)
 */
export const useMatches = (): UseMatchesReturn => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('matches')
          .select('*')
          .order('start_time', { ascending: true });

        if (fetchError) {
          console.error('❌ Error fetching matches:', fetchError);
          setError(fetchError.message);
          return;
        }

        if (!data) {
          setMatches([]);
          return;
        }

        // Transform DB data (snake_case) to Frontend interface (camelCase)
        const transformedMatches: Match[] = data.map((dbMatch: DBMatch) => {
          // Helper to find Team object by name or create fallback
          const getTeamObject = (teamName: string): Team => {
            // Try to find team by name in any language
            const foundTeam = Object.values(TEAMS).find(
              team => 
                team.name.pt.toLowerCase() === teamName.toLowerCase() ||
                team.name.en.toLowerCase() === teamName.toLowerCase() ||
                team.name.es.toLowerCase() === teamName.toLowerCase() ||
                team.id.toLowerCase() === teamName.toLowerCase()
            );

            if (foundTeam) return foundTeam;

            // Fallback: Create a Team object with getTeamFlag lookup
            return {
              id: teamName,
              name: { pt: teamName, en: teamName, es: teamName },
              flag: getTeamFlag(teamName),
              color: '#CCCCCC'
            };
          };

          return {
            id: dbMatch.id,
            homeTeam: getTeamObject(dbMatch.home_team),
            awayTeam: getTeamObject(dbMatch.away_team),
            startTime: dbMatch.start_time,
            venue: dbMatch.venue || '',
            group: dbMatch.group || '',
            actualHomeScore: dbMatch.actual_home_score ?? dbMatch.home_score ?? undefined,
            actualAwayScore: dbMatch.actual_away_score ?? dbMatch.away_score ?? undefined,
            status: dbMatch.status || 'SCHEDULED'
          };
        });

        console.log(`✅ Fetched ${transformedMatches.length} matches from Supabase`);
        setMatches(transformedMatches);
      } catch (err: any) {
        console.error('❌ Unexpected error fetching matches:', err);
        setError(err.message || 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, []);

  return { matches, loading, error };
};
