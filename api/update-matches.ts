/**
 * Match Sync API Route - Serverless Function
 * 
 * Syncs match data from football-data.org API to Supabase
 * Deploy to: Vercel, Netlify, or any serverless platform
 * 
 * Environment Variables Required:
 * - FOOTBALL_DATA_API_KEY: Your API key from football-data.org
 * - SUPABASE_URL: Your Supabase project URL
 * - SUPABASE_SERVICE_KEY: Supabase service role key (for admin operations)
 * - MATCH_SYNC_SECRET: Secret key to authorize sync requests
 */

import { createClient } from '@supabase/supabase-js';

// Types for football-data.org API response
interface FootballDataMatch {
  id: number;
  utcDate: string;
  status: 'SCHEDULED' | 'TIMED' | 'IN_PLAY' | 'PAUSED' | 'FINISHED' | 'POSTPONED' | 'SUSPENDED' | 'CANCELLED';
  homeTeam: {
    id: number;
    name: string;
    shortName: string;
    tla: string; // Three Letter Acronym
    crest: string;
  };
  awayTeam: {
    id: number;
    name: string;
    shortName: string;
    tla: string;
    crest: string;
  };
  score: {
    winner: string | null;
    fullTime: {
      home: number | null;
      away: number | null;
    };
    halfTime: {
      home: number | null;
      away: number | null;
    };
  };
  venue?: string;
  group?: string;
}

interface FootballDataResponse {
  matches: FootballDataMatch[];
}

// Team name mapping (API names -> Your DB team IDs)
const TEAM_MAPPING: Record<string, string> = {
  'Brazil': 'BRA',
  'Brasil': 'BRA',
  'Argentina': 'ARG',
  'United States': 'USA',
  'USA': 'USA',
  'Mexico': 'MEX',
  'México': 'MEX',
  'Germany': 'GER',
  'France': 'FRA',
  'Spain': 'ESP',
  'England': 'ENG',
  'Portugal': 'POR',
  'Netherlands': 'NED',
  'Belgium': 'BEL',
  'Italy': 'ITA',
  'Uruguay': 'URU',
  'Colombia': 'COL',
  'Chile': 'CHI',
  'Ecuador': 'ECU',
  'Peru': 'PER',
  'Canada': 'CAN',
  'Morocco': 'MAR',
  'Japan': 'JPN',
  'South Korea': 'KOR',
  'Korea Republic': 'KOR',
  'Australia': 'AUS',
  'Saudi Arabia': 'KSA',
  'Iran': 'IRN',
  'Senegal': 'SEN',
  'Ghana': 'GHA',
  'Cameroon': 'CMR',
  'Tunisia': 'TUN',
  'Nigeria': 'NGA',
  'Costa Rica': 'CRC',
  'Jamaica': 'JAM',
  'Panama': 'PAN',
  // Add more mappings as needed
};

/**
 * Fuzzy match team name to get team ID
 */
function getTeamId(apiTeamName: string, tla: string): string | null {
  // Try exact match with TLA (Three Letter Acronym)
  if (tla && tla.length === 3) {
    return tla;
  }
  
  // Try mapping
  if (TEAM_MAPPING[apiTeamName]) {
    return TEAM_MAPPING[apiTeamName];
  }
  
  // Try fuzzy match (case-insensitive, remove special chars)
  const normalized = apiTeamName.toLowerCase().replace(/[^a-z]/g, '');
  for (const [key, value] of Object.entries(TEAM_MAPPING)) {
    if (key.toLowerCase().replace(/[^a-z]/g, '') === normalized) {
      return value;
    }
  }
  
  return null;
}

/**
 * Main handler function
 */
export default async function handler(req: any, res: any) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check authorization
  const authHeader = req.headers['authorization'] || req.headers['x-api-key'];
  const expectedSecret = process.env.MATCH_SYNC_SECRET;
  
  if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Initialize Supabase client with service role key
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Fetch matches from football-data.org
    const apiKey = process.env.FOOTBALL_DATA_API_KEY;
    if (!apiKey) {
      throw new Error('FOOTBALL_DATA_API_KEY not configured');
    }

    const response = await fetch(
      'https://api.football-data.org/v4/competitions/WC/matches',
      {
        headers: {
          'X-Auth-Token': apiKey
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Football Data API error: ${response.status} ${response.statusText}`);
    }

    const data: FootballDataResponse = await response.json();
    
    let updated = 0;
    let created = 0;
    let skipped = 0;
    let errors: string[] = [];

    // Process each match
    for (const match of data.matches) {
      try {
        const homeTeamId = getTeamId(match.homeTeam.name, match.homeTeam.tla);
        const awayTeamId = getTeamId(match.awayTeam.name, match.awayTeam.tla);

        if (!homeTeamId || !awayTeamId) {
          errors.push(`Could not map teams for match ${match.id}: ${match.homeTeam.name} vs ${match.awayTeam.name}`);
          skipped++;
          continue;
        }

        // Check if match exists by external_id
        const { data: existingMatch, error: fetchError } = await supabase
          .from('matches')
          .select('id, external_id')
          .eq('external_id', match.id.toString())
          .maybeSingle();

        if (fetchError) {
          errors.push(`Database error for match ${match.id}: ${fetchError.message}`);
          skipped++;
          continue;
        }

        const matchData = {
          external_id: match.id.toString(),
          home_team_id: homeTeamId,
          away_team_id: awayTeamId,
          start_time: match.utcDate,
          venue: match.venue || 'TBD',
          match_group: match.group || 'Group Stage',
          status: match.status,
          actual_home_score: match.score.fullTime.home,
          actual_away_score: match.score.fullTime.away,
          full_time_home_score: match.score.fullTime.home,
          full_time_away_score: match.score.fullTime.away,
          last_synced_at: new Date().toISOString()
        };

        if (existingMatch) {
          // Update existing match
          const { error: updateError } = await supabase
            .from('matches')
            .update(matchData)
            .eq('id', existingMatch.id);

          if (updateError) {
            errors.push(`Update error for match ${match.id}: ${updateError.message}`);
            skipped++;
          } else {
            updated++;
          }
        } else {
          // Try to find by teams and date (fallback for matches without external_id)
          const matchDate = new Date(match.utcDate);
          const startOfDay = new Date(matchDate);
          startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date(matchDate);
          endOfDay.setHours(23, 59, 59, 999);

          const { data: fuzzyMatch } = await supabase
            .from('matches')
            .select('id')
            .eq('home_team_id', homeTeamId)
            .eq('away_team_id', awayTeamId)
            .gte('start_time', startOfDay.toISOString())
            .lte('start_time', endOfDay.toISOString())
            .maybeSingle();

          if (fuzzyMatch) {
            // Update existing match found by fuzzy matching
            const { error: updateError } = await supabase
              .from('matches')
              .update(matchData)
              .eq('id', fuzzyMatch.id);

            if (updateError) {
              errors.push(`Update error for fuzzy-matched ${match.id}: ${updateError.message}`);
              skipped++;
            } else {
              updated++;
            }
          } else {
            // Create new match
            const { error: insertError } = await supabase
              .from('matches')
              .insert(matchData);

            if (insertError) {
              errors.push(`Insert error for match ${match.id}: ${insertError.message}`);
              skipped++;
            } else {
              created++;
            }
          }
        }
      } catch (matchError: any) {
        errors.push(`Error processing match ${match.id}: ${matchError.message}`);
        skipped++;
      }
    }

    // Return summary
    return res.status(200).json({
      success: true,
      summary: {
        total: data.matches.length,
        updated,
        created,
        skipped
      },
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Match sync error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
