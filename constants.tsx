
import { Team, Match, Language, Translations, Group, ScoringConfig } from './types';

export const SCORING_RULES: ScoringConfig = {
  exact: 25,
  diff: 18,
  outcome: 10,
  oneScore: 4
};

export const TEAMS: Record<string, Team> = {
  BRA: { id: 'BRA', name: { pt: 'Brasil', en: 'Brazil', es: 'Brasil' }, flag: '🇧🇷', color: '#FFDF00' },
  USA: { id: 'USA', name: { pt: 'EUA', en: 'USA', es: 'EE.UU.' }, flag: '🇺🇸', color: '#002868' },
  MEX: { id: 'MEX', name: { pt: 'México', en: 'Mexico', es: 'México' }, flag: '🇲🇽', color: '#006847' },
  ESP: { id: 'ESP', name: { pt: 'Espanha', en: 'Spain', es: 'España' }, flag: '🇪🇸', color: '#C60B1E' },
  ARG: { id: 'ARG', name: { pt: 'Argentina', en: 'Argentina', es: 'Argentina' }, flag: '🇦🇷', color: '#75AADB' },
  GER: { id: 'GER', name: { pt: 'Alemanha', en: 'Germany', es: 'Alemania' }, flag: '🇩🇪', color: '#000000' },
  FRA: { id: 'FRA', name: { pt: 'França', en: 'France', es: 'Francia' }, flag: '🇫🇷', color: '#002395' },
  POR: { id: 'POR', name: { pt: 'Portugal', en: 'Portugal', es: 'Portugal' }, flag: '🇵🇹', color: '#E42518' },
  IRL: { id: 'IRL', name: { pt: 'Irlanda', en: 'Ireland', es: 'Irlanda' }, flag: '🇮🇪', color: '#169B62' },
  CAN: { id: 'CAN', name: { pt: 'Canadá', en: 'Canada', es: 'Canadá' }, flag: '🇨🇦', color: '#FF0000' },
};

// Fixed missing properties in MOCK_GROUPS to satisfy the Group interface
export const MOCK_GROUPS: Group[] = [
  { 
    id: 'g1', 
    name: 'Família Silva', 
    code: 'SILVA26',
    initials: 'FS',
    languageDefault: 'pt',
    ownerUserId: 'system',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isPrivate: false,
    status: 'ACTIVE'
  },
  { 
    id: 'g2', 
    name: 'Trabalho - Devs', 
    code: 'CODEGOAL',
    initials: 'TD',
    languageDefault: 'pt',
    ownerUserId: 'system',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isPrivate: false,
    status: 'ACTIVE'
  },
  { 
    id: 'g3', 
    name: 'Amigos da Pelada', 
    code: 'PELADA10',
    initials: 'AP',
    languageDefault: 'pt',
    ownerUserId: 'system',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isPrivate: false,
    status: 'ACTIVE'
  },
];

const now = Date.now();

export const MOCK_MATCHES: Match[] = [
  {
    id: 'm1',
    homeTeam: TEAMS.MEX,
    awayTeam: TEAMS.USA,
    startTime: new Date(now - 86400000).toISOString(), // Finished (Yesterday)
    venue: 'Estádio Azteca, Mexico City',
    group: 'Group A',
    actualHomeScore: 2,
    actualAwayScore: 1
  },
  {
    id: 'm2',
    homeTeam: TEAMS.CAN,
    awayTeam: TEAMS.IRL,
    startTime: new Date(now - 1800000).toISOString(), // Live (Started 30m ago)
    venue: 'BC Place, Vancouver',
    group: 'Group B',
    actualHomeScore: 1, // Optional: Live score tracking
    actualAwayScore: 1
  },
  {
    id: 'm3',
    homeTeam: TEAMS.BRA,
    awayTeam: TEAMS.ESP,
    startTime: new Date(now + 3600000).toISOString(), // Scheduled (1h from now)
    venue: 'MetLife Stadium, East Rutherford',
    group: 'Group C'
  },
  {
    id: 'm4',
    homeTeam: TEAMS.ARG,
    awayTeam: TEAMS.GER,
    startTime: new Date(now + 172800000).toISOString(), // Scheduled (2 days from now)
    venue: 'SoFi Stadium, Inglewood',
    group: 'Group D'
  },
  {
    id: 'm5',
    homeTeam: TEAMS.FRA,
    awayTeam: TEAMS.POR,
    startTime: new Date(now + 259200000).toISOString(), // Scheduled (3 days from now)
    venue: 'Hard Rock Stadium, Miami',
    group: 'Group E'
  }
];

export const TRANSLATIONS: Record<Language, Translations> = {
  pt: {
    login: 'Entrar',
    register: 'Cadastrar',
    email: 'E-mail',
    password: 'Senha',
    name: 'Nome',
    surname: 'Sobrenome',
    preferredTeam: 'Seleção Favorita',
    prefTeamInfo: 'Escolha sua seleção favorita para personalizar sua experiência.',
    save: 'Salvar',
    cancel: 'Cancelar',
    edit: 'Editar Placar',
    locked: 'Bloqueado',
    matchStartMessage: 'Palpites encerram 10 min antes do jogo.',
    logout: 'Sair',
    welcome: 'Bem-vindo',
    predictions: 'Meus Palpites',
    noPredictions: 'Nenhum palpite ainda.',
    alreadyRegistered: 'E-mail já cadastrado, insira um novo endereço de e-mail.',
    invalidCredentials: 'E-mail ou senha inválidos.',
    ranking: 'Ranking',
    matches: 'Jogos',
    points: 'Pts',
    rank: 'Pos',
    player: 'Jogador',
    groups: 'Grupos',
    joinGroup: 'Entrar em Grupo',
    createGroup: 'Criar Grupo',
    groupCode: 'Código do Grupo',
    selectGroup: 'Escolher Grupo',
    noGroups: 'Você não está em nenhum grupo.',
    myGroups: 'Meus Grupos',
    joker: 'Curinga',
    doublePoints: 'Dobrar pontos deste jogo',
    rules: 'Regras',
    scoringTitle: 'Sistema de Pontuação',
    deadlineTitle: 'Prazos de Envio',
    deadlineInfo: 'Os palpites fecham automaticamente 10 minutos antes do início oficial de cada partida.',
    tiebreakerTitle: 'Critérios de Desempate',
    tiebreaker1: '1. Maior número de placares exatos.',
    tiebreaker2: '2. Maior número de acertos de diferença de gols.',
    tiebreaker3: '3. Data de cadastro mais antiga no sistema.',
    exactScoreDesc: 'Placar Exato (Casa e Fora)',
    diffScoreDesc: 'Vencedor + Diferença de Gols',
    outcomeScoreDesc: 'Vencedor ou Empate',
    oneSideScoreDesc: 'Acerto de gols de um dos times'
  },
  en: {
    login: 'Login',
    register: 'Register',
    email: 'Email',
    password: 'Password',
    name: 'First Name',
    surname: 'Last Name',
    preferredTeam: 'Preferred Team',
    prefTeamInfo: 'Choose your favorite team to personalize your experience.',
    save: 'Save',
    cancel: 'Cancel',
    edit: 'Edit Score',
    locked: 'Locked',
    matchStartMessage: 'Predictions close 10 mins before match start.',
    logout: 'Logout',
    welcome: 'Welcome',
    predictions: 'My Predictions',
    noPredictions: 'No predictions yet.',
    alreadyRegistered: 'Email already registered, enter a new email address.',
    invalidCredentials: 'Invalid email or password.',
    ranking: 'Ranking',
    matches: 'Matches',
    points: 'Pts',
    rank: 'Pos',
    player: 'Player',
    groups: 'Groups',
    joinGroup: 'Join Group',
    createGroup: 'Create Group',
    groupCode: 'Group Code',
    selectGroup: 'Select Group',
    noGroups: 'You are not in any groups.',
    myGroups: 'My Groups',
    joker: 'Joker',
    doublePoints: 'Double points for this match',
    rules: 'Rules',
    scoringTitle: 'Scoring System',
    deadlineTitle: 'Submission Deadlines',
    deadlineInfo: 'Predictions close automatically 10 minutes before the official start of each match.',
    tiebreakerTitle: 'Tiebreaker Criteria',
    tiebreaker1: '1. Most exact scores correctly predicted.',
    tiebreaker2: '2. Most correct goal differences predicted.',
    tiebreaker3: '3. Earlier registration date in the system.',
    exactScoreDesc: 'Exact Score (Home and Away)',
    diffScoreDesc: 'Winner + Goal Difference',
    outcomeScoreDesc: 'Correct Outcome (Win/Draw)',
    oneSideScoreDesc: 'Correct goals for one team'
  },
  es: {
    login: 'Iniciar sesión',
    register: 'Registrarse',
    email: 'Correo electrónico',
    password: 'Contraseña',
    name: 'Nombre',
    surname: 'Apellido',
    preferredTeam: 'Equipo Favorito',
    prefTeamInfo: 'Elige tu equipo favorito para personalizar tu experiencia.',
    save: 'Guardar',
    cancel: 'Cancelar',
    edit: 'Editar Resultado',
    locked: 'Bloqueado',
    matchStartMessage: 'Los pronósticos se cierran 10 min antes del partido.',
    logout: 'Cerrar sesión',
    welcome: 'Bienvenido',
    predictions: 'Mis Pronósticos',
    noPredictions: 'Aún no hay pronósticos.',
    alreadyRegistered: 'El correo electrónico ya está registrado, introduzca una nueva dirección.',
    invalidCredentials: 'Correo electrónico o contraseña incorrectos.',
    ranking: 'Ranking',
    matches: 'Partidos',
    points: 'Pts',
    rank: 'Pos',
    player: 'Player',
    groups: 'Grupos',
    joinGroup: 'Unirse a Grupo',
    createGroup: 'Crear Grupo',
    groupCode: 'Código del Grupo',
    selectGroup: 'Seleccionar Grupo',
    noGroups: 'No estás en ningún grupo.',
    myGroups: 'Mis Grupos',
    joker: 'Comodín',
    doublePoints: 'Dobla los pontos de este partido',
    rules: 'Regras',
    scoringTitle: 'Sistema de Puntuación',
    deadlineTitle: 'Plazos de Envío',
    deadlineInfo: 'Los pronósticos se cierran automáticamente 10 minutos antes del inicio oficial de cada partido.',
    tiebreakerTitle: 'Criterios de Desempate',
    tiebreaker1: '1. Mayor número de resultados exactos.',
    tiebreaker2: '2. Mayor número de diferencias de goles acertadas.',
    tiebreaker3: '3. Fecha de registro más antigua en el sistema.',
    exactScoreDesc: 'Resultado Exacto (Local y Visitante)',
    diffScoreDesc: 'Ganador + Diferencia de Goles',
    outcomeScoreDesc: 'Ganador o Empate',
    oneSideScoreDesc: 'Goles acertados de un equipo'
  }
};
