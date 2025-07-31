import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false // Nur für Entwicklungsumgebungen!
    }
  }
});

// Definition der Modelle
const Player = sequelize.define('Player', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  jersey_number: Sequelize.INTEGER,
  first_name: Sequelize.STRING,
  last_name: Sequelize.STRING,
  team_id: Sequelize.INTEGER
});

const Team = sequelize.define('Team', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: Sequelize.STRING,
  photo_url: Sequelize.STRING,
  anthem_url: Sequelize.STRING
});

const Tournament = sequelize.define('Tournament', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: Sequelize.STRING,
  description: Sequelize.STRING,
  location: Sequelize.STRING
});

const TournamentType = sequelize.define('TournamentType', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: Sequelize.STRING,
  description: Sequelize.STRING,
  group_stage_size: Sequelize.INTEGER,
  has_knockout_stage: Sequelize.BOOLEAN
});

const Match = sequelize.define('Match', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  tournament_id: Sequelize.INTEGER,
  status_id: Sequelize.INTEGER, // running, paused, finished
  type_id: Sequelize.INTEGER,
  team_a: Sequelize.INTEGER,
  team_b: Sequelize.INTEGER,
  schedule_at: Sequelize.DATE,
  duration_seconds: Sequelize.INTEGER,
  score_a: Sequelize.INTEGER,
  score_b: Sequelize.INTEGER
});

const MatchType = sequelize.define('MatchType', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: Sequelize.STRING
});

const MatchEvent = sequelize.define('MatchEvent', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  match_id: Sequelize.INTEGER,
  event_type_id: Sequelize.INTEGER,
  timestamp: Sequelize.DATE,
  in_game_timestamp: Sequelize.INTEGER,
  team_id: Sequelize.INTEGER,
  player_id: Sequelize.INTEGER,
  points: Sequelize.INTEGER,
  time: Sequelize.INTEGER // Dauer bei Strafen
});

const EventType = sequelize.define('EventType', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: Sequelize.STRING
});

const TournamentTeam = sequelize.define('TournamentTeam', {
  tournament_id: {
    type: Sequelize.INTEGER,
    references: {
      model: Tournament,
      key: 'id'
    },
    primaryKey: true
  },
  team_id: {
    type: Sequelize.INTEGER,
    references: {
      model: Team,
      key: 'id'
    },
    primaryKey: true
  }
}, {
  tableName: 'tournament_teams', // Setze den Tabellennamen explizit
  timestamps: false // Deaktiviere die automatische Erstellung von createdAt und updatedAt
});

// Beziehungen definieren
Team.hasMany(Player, { foreignKey: 'team_id' });
Player.belongsTo(Team, { foreignKey: 'team_id' });

Tournament.belongsToMany(Team, { through: TournamentTeam, foreignKey: 'tournament_id', otherKey: 'team_id' });
Team.belongsToMany(Tournament, { through: TournamentTeam, foreignKey: 'team_id', otherKey: 'tournament_id' });

Match.belongsTo(Tournament, { foreignKey: 'tournament_id' });
Tournament.hasMany(Match, { foreignKey: 'tournament_id' });

MatchEvent.belongsTo(Match, { foreignKey: 'match_id' });
Match.hasMany(MatchEvent, { foreignKey: 'match_id' });

// Funktion zur Initialisierung der Datenbank und Erstellung der Tabellen
export const initDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('Verbindung zur Datenbank hergestellt.');
    await sequelize.sync({ alter: true }); // { force: true } zum Löschen und Neuerstellen
    console.log('Datenbank synchronisiert.');
  } catch (error) {
    console.error('Fehler beim Verbinden zur Datenbank:', error);
  }
};

export {
  sequelize,
  Player,
  Team,
  Tournament,
  TournamentType,
  Match,
  MatchType,
  MatchEvent,
  EventType,
  TournamentTeam
};