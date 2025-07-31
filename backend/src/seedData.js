// Seed-Daten für Teams
import { sequelize, Player, Team, Tournament, TournamentType, MatchStatus, Match, MatchType, MatchEvent, EventType, TournamentTeam } from './db.js';

const teams = [
  { name: 'Los Angeles Lakers', photo_url: 'lakers.jpg', anthem_url: 'lakers_anthem.mp3' },
  { name: 'Golden State Warriors', photo_url: 'warriors.jpg', anthem_url: 'warriors_anthem.mp3' },
  { name: 'Chicago Bulls', photo_url: 'bulls.jpg', anthem_url: 'bulls_anthem.mp3' }
];

// Seed-Daten für Spieler
const players = [
  { jersey_number: 23, first_name: 'LeBron', last_name: 'James', team_id: 1 },
  { jersey_number: 30, first_name: 'Stephen', last_name: 'Curry', team_id: 2 },
  { jersey_number: 23, first_name: 'Michael', last_name: 'Jordan', team_id: 3 }
];

// Seed-Daten für Turniere
const tournaments = [
  { name: 'NBA Championship', description: 'The ultimate basketball tournament', location: 'USA' },
  { name: 'EuroLeague', description: 'The top European basketball league', location: 'Europe' }
];

// Seed-Daten für Turnier-Typen
const tournamentTypes = [
  { name: 'Knockout', description: 'Single elimination tournament', group_stage_size: 0, has_knockout_stage: true },
  { name: 'Group Stage + Knockout', description: 'Tournament with group stage and knockout phase', group_stage_size: 4, has_knockout_stage: true }
];

// Seed-Daten für Match-Status
const matchStatuses = [
  { name: 'Scheduled', description: 'Match is scheduled' },
  { name: 'In Progress', description: 'Match is currently in progress' },
  { name: 'Completed', description: 'Match has been completed' },
  { name: 'Postponed', description: 'Match has been postponed' }
];

// Seed-Daten für Matches
const matches = [
  { tournament_id: 1, status_id: 3, type_id: 1, team_a: 1, team_b: 2, schedule_at: new Date(), duration_seconds: 7200, score_a: 120, score_b: 110 },
  { tournament_id: 2, status_id: 3, type_id: 2, team_a: 3, team_b: 1, schedule_at: new Date(), duration_seconds: 7200, score_a: 95, score_b: 100 }
];

// Seed-Daten für Match-Typen
const matchTypes = [
  { name: 'Regular Season' },
  { name: 'Playoff' }
];

// Seed-Daten für Event-Typen
const eventTypes = [
  { name: 'korb', description: 'Scored a basket' },
  { name: 'Freiwurf', description: 'Free throw' },
  { name: 'timeout', description: 'Timeout' },
  { name: 'foul', description: 'Foul' },
  { name: 'strafe', description: 'Penalty' },
  { name: 'pause', description: 'Pause' },
  { name: 'start', description: 'Start of the game' },
  { name: 'stop', description: 'Stop of the game' },
  { name: 'extra_time', description: 'Extra time' }
];

// Seed-Daten für Match-Events
const matchEvents = [
  { match_id: 1, event_type_id: 1, timestamp: new Date(), in_game_timestamp: 60, team_id: 1, player_id: 1, points: 2, time: null },
  { match_id: 1, event_type_id: 2, timestamp: new Date(), in_game_timestamp: 120, team_id: 2, player_id: 2, points: 1, time: null }
];

// Seed-Daten für TournamentTeam
const tournamentTeams = [
  { tournament_id: 1, team_id: 1 },
  { tournament_id: 1, team_id: 2 },
  { tournament_id: 2, team_id: 3 }
];

// Funktion zum Einfügen der Seed-Daten
export const seedDatabase = async () => {
  try {
    await sequelize.sync({ force: true }); // Tabellen löschen und neu erstellen

    await Team.bulkCreate(teams);
    await Player.bulkCreate(players);
    await Tournament.bulkCreate(tournaments);
    await TournamentType.bulkCreate(tournamentTypes);
    await MatchStatus.bulkCreate(matchStatuses);
    await Match.bulkCreate(matches);
    await MatchType.bulkCreate(matchTypes);
    await EventType.bulkCreate(eventTypes);
    await MatchEvent.bulkCreate(matchEvents);
    await TournamentTeam.bulkCreate(tournamentTeams);

    console.log('Datenbank mit Seed-Daten gefüllt.');
  } catch (error) {
    console.error('Fehler beim Einfügen der Seed-Daten:', error);
  }
};