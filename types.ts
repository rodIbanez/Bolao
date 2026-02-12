
export type Language = 'pt' | 'en' | 'es';
export type GroupRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export interface User {
  email: string;
  name: string;
  surname: string;
  photo?: string;
  preferredTeam: string;
  predictions: Record<string, Prediction>;
  groupIds: string[]; // List of IDs of groups the user belongs to
}

export interface Group {
  id: string;
  code: string;
  name: string;
  description?: string;
  photoUrl?: string;
  initials: string;
  languageDefault: Language;
  ownerUserId: string;
  createdAt: number;
  updatedAt: number;
  isPrivate: boolean;
  status: 'ACTIVE' | 'ARCHIVED';
}

export interface UserGroup {
  id: string;
  userId: string;
  groupId: string;
  role: GroupRole;
  joinedAt: number;
  isActive: boolean;
}

export interface Prediction {
  homeScore: number;
  awayScore: number;
  timestamp: number;
  isJoker?: boolean;
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

export interface ScoringConfig {
  exact: number;
  diff: number;
  outcome: number;
  oneScore: number;
}

export interface Translations {
  login: string;
  register: string;
  email: string;
  password: string;
  name: string;
  surname: string;
  preferredTeam: string;
  prefTeamInfo: string;
  save: string;
  cancel: string;
  edit: string;
  locked: string;
  matchStartMessage: string;
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
  groups: string;
  joinGroup: string;
  createGroup: string;
  groupCode: string;
  selectGroup: string;
  noGroups: string;
  myGroups: string;
  joker: string;
  doublePoints: string;
  rules: string;
  scoringTitle: string;
  deadlineTitle: string;
  deadlineInfo: string;
  tiebreakerTitle: string;
  tiebreaker1: string;
  tiebreaker2: string;
  tiebreaker3: string;
  exactScoreDesc: string;
  diffScoreDesc: string;
  outcomeScoreDesc: string;
  oneSideScoreDesc: string;
}
