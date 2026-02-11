
export type Language = 'pt' | 'en' | 'es';

export interface User {
  email: string;
  name: string;
  surname: string;
  photo?: string;
  preferredTeam: string;
  predictions: Record<string, Prediction>;
}

export interface Prediction {
  homeScore: number;
  awayScore: number;
  timestamp: number;
}

export interface Team {
  id: string;
  name: Record<Language, string>;
  flag: string;
  color: string;
}

export interface Match {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  startTime: string; // ISO format
  venue: string;
  group: string;
  actualHomeScore?: number;
  actualAwayScore?: number;
}

export interface Translations {
  login: string;
  register: string;
  email: string;
  password: string;
  name: string;
  surname: string;
  preferredTeam: string;
  save: string;
  cancel: string;
  edit: string;
  locked: string;
  matchStartMessage: string;
  prefTeamInfo: string;
  logout: string;
  welcome: string;
  predictions: string;
  noPredictions: string;
  alreadyRegistered: string;
  invalidCredentials: string;
  ranking: string;
  matches: string;
  points: string;
  rank: string;
  player: string;
}
