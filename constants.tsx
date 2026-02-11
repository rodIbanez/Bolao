
import { Team, Match, Language, Translations } from './types';

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

export const MOCK_MATCHES: Match[] = [
  {
    id: 'm1',
    homeTeam: TEAMS.MEX,
    awayTeam: TEAMS.USA,
    startTime: '2026-06-11T20:00:00Z',
    venue: 'Estádio Azteca, Mexico City',
    group: 'Group A',
    actualHomeScore: 2,
    actualAwayScore: 1
  },
  {
    id: 'm2',
    homeTeam: TEAMS.CAN,
    awayTeam: TEAMS.IRL,
    startTime: '2026-06-12T18:00:00Z',
    venue: 'BC Place, Vancouver',
    group: 'Group B',
    actualHomeScore: 1,
    actualAwayScore: 1
  },
  {
    id: 'm3',
    homeTeam: TEAMS.BRA,
    awayTeam: TEAMS.ESP,
    startTime: '2026-06-13T21:00:00Z',
    venue: 'MetLife Stadium, East Rutherford',
    group: 'Group C'
  },
  {
    id: 'm4',
    homeTeam: TEAMS.ARG,
    awayTeam: TEAMS.GER,
    startTime: '2026-06-14T15:00:00Z',
    venue: 'SoFi Stadium, Inglewood',
    group: 'Group D'
  },
  {
    id: 'm5',
    homeTeam: TEAMS.FRA,
    awayTeam: TEAMS.POR,
    startTime: '2026-06-15T19:00:00Z',
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
    save: 'Salvar',
    cancel: 'Cancelar',
    edit: 'Editar Placar',
    locked: 'Bloqueado',
    matchStartMessage: 'Palpites encerram 10 min antes do jogo.',
    prefTeamInfo: 'Por favor, selecione seu time preferido e não brinque, pois isso pode (ou não) ser levado em conta na pontuação total.',
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
    player: 'Jogador'
  },
  en: {
    login: 'Login',
    register: 'Register',
    email: 'Email',
    password: 'Password',
    name: 'First Name',
    surname: 'Last Name',
    preferredTeam: 'Preferred Team',
    save: 'Save',
    cancel: 'Cancel',
    edit: 'Edit Score',
    locked: 'Locked',
    matchStartMessage: 'Predictions close 10 mins before match start.',
    prefTeamInfo: 'Please select your preferred team and do not mess around because it might (or might not) be taken into account as total points.',
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
    player: 'Player'
  },
  es: {
    login: 'Iniciar sesión',
    register: 'Registrarse',
    email: 'Correo electrónico',
    password: 'Contraseña',
    name: 'Nombre',
    surname: 'Apellido',
    preferredTeam: 'Equipo Favorito',
    save: 'Guardar',
    cancel: 'Cancelar',
    edit: 'Editar Resultado',
    locked: 'Bloqueado',
    matchStartMessage: 'Los pronósticos se cierran 10 min antes del partido.',
    prefTeamInfo: 'Por favor, selecciona tu equipo favorito y no juegues, ya que esto podría (o no) tenerse en cuenta en la puntuación total.',
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
    player: 'Jugador'
  }
};
