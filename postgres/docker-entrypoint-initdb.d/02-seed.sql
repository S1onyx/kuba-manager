-- Teams
INSERT INTO "Teams" (name, photo_url, anthem_url, "createdAt", "updatedAt") VALUES
('FC Bayern München', 'https://example.com/bayern_logo.png', 'https://example.com/bayern_anthem.mp3', NOW(), NOW()),
('Real Madrid CF', 'https://example.com/real_logo.png', 'https://example.com/real_anthem.mp3', NOW(), NOW()),
('Liverpool FC', 'https://example.com/liverpool_logo.png', 'https://example.com/liverpool_anthem.mp3', NOW(), NOW());

-- Players
INSERT INTO "Players" (jersey_number, first_name, last_name, team_id, "createdAt", "updatedAt") VALUES
(10, 'Harry', 'Kane', (SELECT id FROM "Teams" WHERE name = 'FC Bayern München'), NOW(), NOW()),
(7, 'Vinícius', 'Júnior', (SELECT id FROM "Teams" WHERE name = 'Real Madrid CF'), NOW(), NOW()),
(11, 'Mohamed', 'Salah', (SELECT id FROM "Teams" WHERE name = 'Liverpool FC'), NOW(), NOW());

-- Tournaments
INSERT INTO "Tournaments" (name, description, location, "createdAt", "updatedAt") VALUES
('Champions League 2025', 'UEFA Champions League Season 2025', 'Europe', NOW(), NOW()),
('Copa Libertadores 2025', 'South American Club Championship', 'South America', NOW(), NOW());

-- TournamentTypes
INSERT INTO "TournamentTypes" (name, description, has_group_stage, group_stage_size, has_knockout_stage, knockout_depth, "createdAt", "updatedAt") VALUES
('Knockout Tournament', 'Simple knockout format', FALSE, NULL, TRUE, 4, NOW(), NOW()),
('Group Stage + Knockout', 'Group stage followed by knockout rounds', TRUE, 4, TRUE, 4, NOW(), NOW());

-- MatchStatuses
INSERT INTO "MatchStatuses" (name, description, "createdAt", "updatedAt") VALUES
('Scheduled', 'Match is scheduled but not yet played', NOW(), NOW()),
('In Progress', 'Match is currently being played', NOW(), NOW()),
('Completed', 'Match has finished', NOW(), NOW()),
('Postponed', 'Match has been postponed', NOW(), NOW());

-- MatchTypes
INSERT INTO "MatchTypes" (name, "createdAt", "updatedAt") VALUES
('Regular Time', NOW(), NOW()),
('Extra Time', NOW(), NOW()),
('Penalty Shootout', NOW(), NOW());

-- Matches
INSERT INTO "Matches" (tournament_id, status_id, type_id, team_a, team_b, schedule_at, duration_seconds, score_a, score_b, "createdAt", "updatedAt") VALUES
((SELECT id FROM "Tournaments" WHERE name = 'Champions League 2025'), (SELECT id FROM "MatchStatuses" WHERE name = 'Completed'), (SELECT id FROM "MatchTypes" WHERE name = 'Regular Time'), (SELECT id FROM "Teams" WHERE name = 'FC Bayern München'), (SELECT id FROM "Teams" WHERE name = 'Real Madrid CF'), NOW() - INTERVAL '2 days', 5400, 2, 1, NOW(), NOW()),
((SELECT id FROM "Tournaments" WHERE name = 'Copa Libertadores 2025'), (SELECT id FROM "MatchStatuses" WHERE name = 'Scheduled'), (SELECT id FROM "MatchTypes" WHERE name = 'Regular Time'), (SELECT id FROM "Teams" WHERE name = 'Liverpool FC'), (SELECT id FROM "Teams" WHERE name = 'FC Bayern München'), NOW() + INTERVAL '3 days', 5400, NULL, NULL, NOW(), NOW());

-- EventTypes
INSERT INTO "EventTypes" (name, description, "createdAt", "updatedAt") VALUES
('Goal', 'A goal scored by a player', NOW(), NOW()),
('Yellow Card', 'A yellow card given to a player', NOW(), NOW()),
('Red Card', 'A red card given to a player', NOW(), NOW()),
('Substitution', 'A player is substituted', NOW(), NOW());

-- MatchEvents
INSERT INTO "MatchEvents" (match_id, event_type_id, "timestamp", in_game_timestamp, team_id, player_id, points, "createdAt", "updatedAt") VALUES
((SELECT id FROM "Matches" WHERE team_a = (SELECT id FROM "Teams" WHERE name = 'FC Bayern München') AND team_b = (SELECT id FROM "Teams" WHERE name = 'Real Madrid CF')), (SELECT id FROM "EventTypes" WHERE name = 'Goal'), NOW() - INTERVAL '2 days' + INTERVAL '30 minutes', 1800, (SELECT id FROM "Teams" WHERE name = 'FC Bayern München'), (SELECT id FROM "Players" WHERE first_name = 'Harry' AND last_name = 'Kane'), 1, NOW(), NOW()),
((SELECT id FROM "Matches" WHERE team_a = (SELECT id FROM "Teams" WHERE name = 'FC Bayern München') AND team_b = (SELECT id FROM "Teams" WHERE name = 'Real Madrid CF')), (SELECT id FROM "EventTypes" WHERE name = 'Yellow Card'), NOW() - INTERVAL '2 days' + INTERVAL '45 minutes', 2700, (SELECT id FROM "Teams" WHERE name = 'Real Madrid CF'), (SELECT id FROM "Players" WHERE first_name = 'Vinícius' AND last_name = 'Júnior'), NULL, NOW(), NOW());

-- tournament_teams
INSERT INTO tournament_teams (tournament_id, team_id) VALUES
((SELECT id FROM "Tournaments" WHERE name = 'Champions League 2025'), (SELECT id FROM "Teams" WHERE name = 'FC Bayern München')),
((SELECT id FROM "Tournaments" WHERE name = 'Champions League 2025'), (SELECT id FROM "Teams" WHERE name = 'Real Madrid CF')),
((SELECT id FROM "Tournaments" WHERE name = 'Copa Libertadores 2025'), (SELECT id FROM "Teams" WHERE name = 'Liverpool FC'));