import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

process.env.KUBA_DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'kuba-callit-'));

const express = (await import('express')).default;
const { createTournament, createTeam, setTournamentTeams, getTournamentSchedule, saveGame } = await import('../src/services/index.js');
const { default: callitRoutes } = await import('../src/routes/callit.js');
const { default: callitAdminRoutes } = await import('../src/routes/callitAdmin.js');
const { registerCallitScoreboardHook } = await import('../src/services/callit/locks.js');
const { invalidateTournamentContext } = await import('../src/services/callit/context.js');
const { resetCallitRateLimits } = await import('../src/services/callit/auth.js');
const { getState, notifySubscribers } = await import('../src/scoreboard/stateStore.js');

const app = express();
app.set('trust proxy', 1);
app.use(express.json());
app.use('/api/callit', callitRoutes);
app.use('/api/callit-admin', callitAdminRoutes);
const server = app.listen(0);
const base = `http://127.0.0.1:${server.address().port}/api`;
test.after(() => server.close());

async function call(method, url, { token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${base}${url}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  return { status: response.status, body: json };
}

const tournament = await createTournament({ name: 'Tipp-Cup', group_count: 1, knockout_rounds: 1, team_count: 4, is_public: true, status: 'active' });
const teams = [];
for (const name of ['Adler', 'Biber', 'Chamäleon', 'Dachs']) {
  teams.push(await createTeam({ name, tournamentId: tournament.id }));
}
await setTournamentTeams(tournament.id, teams.map((team, index) => ({ slot_number: index + 1, team_id: team.id })));
await registerCallitScoreboardHook();
const { isMatchLocked } = await import('../src/services/callit/locks.js');
const { normalizeSettings } = await import('../src/services/callit/settings.js');

const schedule = await getTournamentSchedule(tournament.id);
const groupMatch = schedule.find((entry) => entry.phase === 'group');
const koMatch = schedule.find((entry) => entry.phase === 'knockout');
const TID = tournament.id;

const users = {};

test('Tippspiel ist ohne Freischaltung nicht erreichbar', async () => {
  const res = await call('GET', `/callit/tournaments/${TID}`);
  assert.equal(res.status, 404);
  assert.equal(res.body.code, 'CALLIT_NOT_AVAILABLE');
});

test('Admin schaltet Tippspiel mit Beitrittscode frei, private Turniere erscheinen nicht in der Liste', async () => {
  const res = await call('PUT', `/callit-admin/tournaments/${TID}`, { body: { enabled: true, joinCode: 'Halle1', settings: { points: { exact: 4 } } } });
  assert.equal(res.status, 200);
  assert.equal(res.body.enabled, true);
  const hidden = await createTournament({ name: 'Geheim', group_count: 1, knockout_rounds: 0, team_count: 2, is_public: false, status: 'active' });
  await call('PUT', `/callit-admin/tournaments/${hidden.id}`, { body: { enabled: true } });
  const list = await call('GET', '/callit/tournaments?top=3');
  assert.deepEqual(list.body.map((entry) => entry.id), [TID]);
});

test('Registrierung validiert Nickname/Passwort und verhindert Duplikate', async () => {
  assert.equal((await call('POST', '/callit/auth/register', { body: { nickname: 'ab', password: 'FAKE-PASS-1' } })).body.code, 'CALLIT_INVALID_NICKNAME');
  assert.equal((await call('POST', '/callit/auth/register', { body: { nickname: 'Tipper', password: 'kurz' } })).body.code, 'CALLIT_INVALID_PASSWORD');
  for (const nickname of ['Orakel', 'Zocker', 'Mitläufer']) {
    const res = await call('POST', '/callit/auth/register', { body: { nickname, password: 'FAKE-PASS-1' } });
    assert.equal(res.status, 201);
    users[nickname] = { token: res.body.token, id: res.body.user.id };
  }
  const dup = await call('POST', '/callit/auth/register', { body: { nickname: 'orakel', password: 'FAKE-PASS-1' } });
  assert.equal(dup.status, 409);
});

test('Login: falsches Passwort 401, richtiges liefert Token, Rate-Limit greift', async () => {
  resetCallitRateLimits();
  assert.equal((await call('POST', '/callit/auth/login', { body: { nickname: 'Zocker', password: 'falsch-falsch' } })).status, 401);
  const ok = await call('POST', '/callit/auth/login', { body: { nickname: 'zocker', password: 'FAKE-PASS-1' } });
  assert.equal(ok.status, 200);
  assert.ok(ok.body.token);
  for (let i = 0; i < 10; i += 1) await call('POST', '/callit/auth/login', { body: { nickname: 'Zocker', password: 'nope-nope' } });
  assert.equal((await call('POST', '/callit/auth/login', { body: { nickname: 'Zocker', password: 'FAKE-PASS-1' } })).status, 429);
  resetCallitRateLimits();
});

test('Beitritt braucht richtigen Code', async () => {
  const wrong = await call('POST', `/callit/tournaments/${TID}/join`, { token: users.Orakel.token, body: { joinCode: 'falsch' } });
  assert.equal(wrong.status, 403);
  for (const name of Object.keys(users)) {
    const res = await call('POST', `/callit/tournaments/${TID}/join`, { token: users[name].token, body: { joinCode: 'halle1' } });
    assert.equal(res.status, 200);
  }
});

test('Tippen ohne Login 401, KO-Spiel ohne feste Teams 409', async () => {
  assert.equal((await call('PUT', `/callit/tournaments/${TID}/tips/${groupMatch.code}`, { body: { scoreHome: 1, scoreAway: 0 } })).status, 401);
  const res = await call('PUT', `/callit/tournaments/${TID}/tips/${koMatch.code}`, { token: users.Orakel.token, body: { scoreHome: 1, scoreAway: 0 } });
  assert.equal(res.status, 409);
  assert.equal(res.body.code, 'CALLIT_MATCH_PENDING');
});

test('Tipps abgeben, ungültige Werte abgelehnt', async () => {
  const url = `/callit/tournaments/${TID}/tips/${groupMatch.code}`;
  assert.equal((await call('PUT', url, { token: users.Orakel.token, body: { scoreHome: -1, scoreAway: 0 } })).status, 400);
  assert.equal((await call('PUT', url, { token: users.Orakel.token, body: { scoreHome: 1.5, scoreAway: 0 } })).status, 400);
  assert.equal((await call('PUT', url, { token: users.Orakel.token, body: { scoreHome: 4, scoreAway: 2, isJoker: true } })).status, 200);
  assert.equal((await call('PUT', url, { token: users.Zocker.token, body: { scoreHome: 0, scoreAway: 2 } })).status, 200);
  assert.equal((await call('PUT', url, { token: users.Mitläufer.token, body: { scoreHome: 2, scoreAway: 0 } })).status, 200);
  const list = await call('GET', `/callit/tournaments/${TID}/matches`, { token: users.Orakel.token });
  const entry = list.body.matches.find((match) => match.code === groupMatch.code);
  assert.equal(entry.status, 'open');
  assert.equal(entry.tipCount, 3);
  assert.deepEqual([entry.myTip.scoreHome, entry.myTip.scoreAway, entry.myTip.isJoker], [4, 2, true]);
  assert.equal(list.body.jokers.group.used, 1);
});

test('Joker wandert auf anderes offenes Gruppenspiel', async () => {
  const other = schedule.find((entry) => entry.phase === 'group' && entry.code !== groupMatch.code);
  await call('PUT', `/callit/tournaments/${TID}/tips/${other.code}`, { token: users.Orakel.token, body: { scoreHome: 1, scoreAway: 1, isJoker: true } });
  let list = await call('GET', `/callit/tournaments/${TID}/matches`, { token: users.Orakel.token });
  assert.equal(list.body.matches.find((m) => m.code === groupMatch.code).myTip.isJoker, false);
  assert.equal(list.body.jokers.group.used, 1);
  await call('PUT', `/callit/tournaments/${TID}/tips/${groupMatch.code}`, { token: users.Orakel.token, body: { scoreHome: 4, scoreAway: 2, isJoker: true } });
  list = await call('GET', `/callit/tournaments/${TID}/matches`, { token: users.Orakel.token });
  assert.equal(list.body.matches.find((m) => m.code === other.code).myTip.isJoker, false);
});

test('Vor der Sperre sind fremde Tipps verborgen', async () => {
  const stats = await call('GET', `/callit/tournaments/${TID}/matches/${groupMatch.code}/stats`);
  assert.equal(stats.body.hidden, true);
  assert.equal(stats.body.topScores, undefined);
  const profile = await call('GET', `/callit/tournaments/${TID}/users/${users.Orakel.id}`, { token: users.Zocker.token });
  assert.equal(profile.status, 200);
  assert.equal(profile.body.tips.length, 0);
  const own = await call('GET', `/callit/tournaments/${TID}/users/${users.Orakel.id}`, { token: users.Orakel.token });
  assert.ok(own.body.tips.length >= 1);
});

test('Sonderwette: Sieger tippen, ungültige Auswahl abgelehnt', async () => {
  const specials = await call('GET', `/callit/tournaments/${TID}/specials`, { token: users.Orakel.token });
  const winner = specials.body.find((bet) => bet.betKey === 'winner');
  assert.equal(winner.locked, false);
  assert.equal(winner.options.length, 4);
  assert.equal((await call('PUT', `/callit/tournaments/${TID}/specials/winner`, { token: users.Orakel.token, body: { value: { key: 'id:999' } } })).status, 400);
  const ok = await call('PUT', `/callit/tournaments/${TID}/specials/winner`, { token: users.Orakel.token, body: { value: { key: winner.options[0].key } } });
  assert.equal(ok.status, 200);
  const group = specials.body.find((bet) => bet.type === 'group_winner');
  assert.ok(group, 'Gruppensieger-Wette vorhanden');
  const total = await call('PUT', `/callit/tournaments/${TID}/specials/total_baskets`, { token: users.Zocker.token, body: { value: { value: 80 } } });
  assert.equal(total.status, 200);
  const kickoff = specials.body.find((bet) => bet.betKey === 'final_kickoff');
  assert.ok(kickoff, 'Finale-Startzeit-Wette vorhanden');
  assert.equal('scheduledAt' in kickoff, true);
  const badTime = await call('PUT', `/callit/tournaments/${TID}/specials/final_kickoff`, { token: users.Zocker.token, body: { value: { value: 1440 } } });
  assert.equal(badTime.status, 400);
  const time = await call('PUT', `/callit/tournaments/${TID}/specials/final_kickoff`, { token: users.Zocker.token, body: { value: { value: 17 * 60 + 15 } } });
  assert.equal(time.status, 200);
  const mine = await call('GET', `/callit/tournaments/${TID}/specials`, { token: users.Zocker.token });
  assert.equal(mine.body.find((bet) => bet.betKey === 'final_kickoff').myLabel, '17:15');
});

test('Laufende Uhr sperrt sofort, auch bei 0:0 und vollem Spielstand', async () => {
  const state = getState();
  const other = schedule.filter((entry) => entry.phase === 'group')[2];
  Object.assign(state, { tournamentId: TID, scheduleCode: other.code, isRunning: true, remainingSeconds: state.durationSeconds, scoreA: 0, scoreB: 0 });
  const res = await call('PUT', `/callit/tournaments/${TID}/tips/${other.code}`, { token: users.Zocker.token, body: { scoreHome: 1, scoreAway: 0 } });
  assert.equal(res.status, 409);
  Object.assign(state, { tournamentId: null, scheduleCode: null, isRunning: false });
  const { setLock } = await import('../src/services/callit/locks.js');
  await setLock(TID, other.code, null, null);
});

test('Gespeichertes oder laufendes Ergebnis bleibt trotz manuellem Entsperren gesperrt', () => {
  const settings = normalizeSettings({});
  assert.equal(isMatchLocked({ result: { saved: true } }, { state: 'unlocked' }, settings), true);
  assert.equal(isMatchLocked({ result: { saved: false, live: true } }, { state: 'unlocked' }, settings), true);
  assert.equal(isMatchLocked({ result: null }, { state: 'unlocked' }, settings), false);
  assert.equal(isMatchLocked({ result: null }, { state: 'locked' }, settings), true);
});

test('Anpfiff sperrt Spiel und Sonderwetten, Tipp danach 409', async () => {
  const state = getState();
  Object.assign(state, {
    tournamentId: TID,
    scheduleCode: groupMatch.code,
    teamAName: groupMatch.home.teamName,
    teamBName: groupMatch.away.teamName,
    teamAId: groupMatch.home.teamId,
    teamBId: groupMatch.away.teamId,
    isRunning: true,
    remainingSeconds: state.durationSeconds - 5
  });
  notifySubscribers();
  await new Promise((resolve) => setTimeout(resolve, 50));
  invalidateTournamentContext(TID);
  const late = await call('PUT', `/callit/tournaments/${TID}/tips/${groupMatch.code}`, { token: users.Zocker.token, body: { scoreHome: 4, scoreAway: 2 } });
  assert.equal(late.status, 409);
  assert.equal(late.body.code, 'CALLIT_MATCH_LOCKED');
  const bet = await call('PUT', `/callit/tournaments/${TID}/specials/winner`, { token: users.Zocker.token, body: { value: { key: 'id:1' } } });
  assert.equal(bet.status, 409);
  const stats = await call('GET', `/callit/tournaments/${TID}/matches/${groupMatch.code}/stats`);
  assert.equal(stats.body.hidden, false);
  assert.equal(stats.body.tipCount, 3);
});

test('Live-Ranking zählt laufenden Stand vorläufig', async () => {
  Object.assign(getState(), { scoreA: 4, scoreB: 2 });
  notifySubscribers();
  invalidateTournamentContext(TID);
  const ranking = await call('GET', `/callit/tournaments/${TID}/ranking`);
  assert.equal(ranking.body.live, true);
  const top = ranking.body.rows[0];
  assert.equal(top.nickname, 'Orakel');
  assert.equal(top.total, 8);
  assert.equal(top.livePoints, 8);
});

test('Gespeichertes Ergebnis zählt endgültig, Statistik zeigt Treffer', async () => {
  Object.assign(getState(), { isRunning: false, isFinished: true });
  await saveGame({
    ...getState(),
    teamAName: groupMatch.home.teamName,
    teamBName: groupMatch.away.teamName,
    scoreA: 4,
    scoreB: 2,
    durationSeconds: 600,
    remainingSeconds: 0,
    halftimeSeconds: 300,
    halftimePauseSeconds: 60,
    extraSeconds: 0,
    extraElapsedSeconds: 0,
    isExtraTime: false,
    penalties: { a: [], b: [] },
    tournamentName: 'Tipp-Cup',
    stageType: 'group',
    stageLabel: groupMatch.stage_label
  });
  Object.assign(getState(), { tournamentId: null, scheduleCode: null, scoreA: 0, scoreB: 0, isFinished: false, remainingSeconds: getState().durationSeconds });
  notifySubscribers();
  invalidateTournamentContext(TID);
  const ranking = await call('GET', `/callit/tournaments/${TID}/ranking`);
  assert.equal(ranking.body.live, false);
  assert.deepEqual(
    ranking.body.rows.map((row) => [row.nickname, row.total]),
    [
      ['Orakel', 8],
      ['Mitläufer', 3],
      ['Zocker', 0]
    ]
  );
  const stats = await call('GET', `/callit/tournaments/${TID}/matches/${groupMatch.code}/stats`);
  assert.deepEqual(stats.body.exactNicknames, ['Orakel']);
  assert.equal(stats.body.hits.exact, 1);
  const overview = await call('GET', `/callit/tournaments/${TID}/stats`);
  assert.equal(overview.status, 200);
  assert.equal(overview.body.participantCount, 3);
});

test('Admin: Sperre aufheben, Teilnehmer ausschließen, CSV, Passwort zurücksetzen', async () => {
  const unlock = await call('POST', `/callit-admin/tournaments/${TID}/matches/${groupMatch.code}/lock`, { body: { action: 'unlock' } });
  assert.equal(unlock.status, 204);
  const overview = await call('GET', `/callit-admin/tournaments/${TID}`);
  assert.equal(overview.body.matches.find((m) => m.code === groupMatch.code).locked, true);
  await call('POST', `/callit-admin/tournaments/${TID}/matches/${groupMatch.code}/lock`, { body: { action: 'auto' } });

  await call('POST', `/callit-admin/tournaments/${TID}/participants/${users.Orakel.id}/disqualify`, { body: { disqualified: true } });
  const ranking = await call('GET', `/callit/tournaments/${TID}/ranking`);
  assert.equal(ranking.body.rows.some((row) => row.nickname === 'Orakel'), false);
  const blocked = await call('PUT', `/callit/tournaments/${TID}/specials/top_scorer`, { token: users.Orakel.token, body: { value: { key: '1' } } });
  assert.equal(blocked.status, 403);
  await call('POST', `/callit-admin/tournaments/${TID}/participants/${users.Orakel.id}/disqualify`, { body: { disqualified: false } });

  const csv = await call('GET', `/callit-admin/tournaments/${TID}/export.csv`);
  assert.match(csv.body, /Platz;Nickname/);

  const reset = await call('POST', `/callit-admin/users/${users.Zocker.id}/reset-password`);
  assert.ok(reset.body.temporaryPassword.length >= 10);
  assert.equal((await call('GET', '/callit/me', { token: users.Zocker.token })).status, 401);
  const relogin = await call('POST', '/callit/auth/login', { body: { nickname: 'Zocker', password: reset.body.temporaryPassword } });
  assert.equal(relogin.status, 200);

  await call('PATCH', `/callit-admin/users/${users.Zocker.id}`, { body: { banned: true } });
  assert.equal((await call('POST', '/callit/auth/login', { body: { nickname: 'Zocker', password: reset.body.temporaryPassword } })).status, 403);
});

test('Paarungsänderung macht Tipp ungültig', async () => {
  const { write } = await import('../src/services/callit/db.js');
  await write([
    "UPDATE callit_tips SET away_key = 'id:999' WHERE tournament_id = ? AND user_id = ? AND schedule_code = ?",
    [TID, users.Mitläufer.id, groupMatch.code]
  ]);
  const list = await call('GET', `/callit/tournaments/${TID}/matches`, { token: users.Mitläufer.token });
  const entry = list.body.matches.find((match) => match.code === groupMatch.code);
  assert.equal(entry.myTip, null);
  assert.equal(entry.myTipStale, true);
});

test('Eigenes Konto löschen entfernt Tipps', async () => {
  const res = await call('DELETE', '/callit/me', { token: users.Mitläufer.token });
  assert.equal(res.status, 204);
  const ranking = await call('GET', `/callit/tournaments/${TID}/ranking`);
  assert.equal(ranking.body.rows.some((row) => row.nickname === 'Mitläufer'), false);
});

test('Endübersicht: Podest, Kategorien und Sonderwetten', async () => {
  const res = await call('GET', `/callit/tournaments/${TID}/final`);
  assert.equal(res.status, 200);
  assert.equal(typeof res.body.finished, 'boolean');
  assert.ok(Array.isArray(res.body.ranking));
  assert.ok(res.body.podium.every((row) => row.rank <= 3));
  assert.ok(res.body.specials.some((bet) => bet.betKey === 'winner'));
  assert.ok(res.body.categoryWinners.every((entry) => entry.winners.length > 0));
  const info = await call('GET', `/callit/tournaments/${TID}`);
  assert.equal(info.body.finished, false);
});

test('Erster Uhr-Start des Finales wird als Startzeit erfasst, Admin kann korrigieren', async () => {
  const { minutesOfDayInVenue, formatClock } = await import('../src/services/callit/time.js');
  const finalMatch = schedule.find((entry) => entry.phase === 'knockout' && entry.stage_label.toLowerCase() === 'finale');
  assert.ok(finalMatch, 'Finale im Spielplan');
  const expected = formatClock(minutesOfDayInVenue(new Date().toISOString()));
  Object.assign(getState(), { tournamentId: TID, scheduleCode: finalMatch.code, isRunning: true });
  notifySubscribers();
  await new Promise((resolve) => setTimeout(resolve, 50));
  Object.assign(getState(), { isRunning: false });
  notifySubscribers();
  await new Promise((resolve) => setTimeout(resolve, 50));
  invalidateTournamentContext(TID);
  let bet = (await call('GET', `/callit/tournaments/${TID}/specials`)).body.find((entry) => entry.betKey === 'final_kickoff');
  assert.deepEqual(bet.outcome.labels, [expected]);
  assert.equal(bet.outcome.final, true);
  assert.equal((await call('PUT', `/callit-admin/tournaments/${TID}/specials/final_kickoff/result`, { body: { value: { value: 1440 } } })).status, 400);
  assert.equal((await call('PUT', `/callit-admin/tournaments/${TID}/specials/final_kickoff/result`, { body: { value: { value: 18 * 60 } } })).status, 204);
  bet = (await call('GET', `/callit/tournaments/${TID}/specials`)).body.find((entry) => entry.betKey === 'final_kickoff');
  assert.deepEqual(bet.outcome.labels, ['18:00']);
  Object.assign(getState(), { tournamentId: null, scheduleCode: null });
  notifySubscribers();
});
