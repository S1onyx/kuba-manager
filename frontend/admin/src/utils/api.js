const BASE = import.meta.env.VITE_BACKEND_URL;
const API_BASE = `${BASE}/api`;

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Request failed');
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export function fetchScoreboard() {
  return request('/scoreboard');
}

export function updateTeams(payload) {
  return request('/scoreboard/teams', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function mutateScore(team, points) {
  return request('/scoreboard/score', {
    method: 'POST',
    body: JSON.stringify({ team, points })
  });
}

export function setScoreAbsolute(team, score) {
  return request('/scoreboard/score/set', {
    method: 'POST',
    body: JSON.stringify({ team, score })
  });
}

export function resetScoreboard() {
  return request('/scoreboard/score/reset', {
    method: 'POST'
  });
}

export function startScoreboardTimer() {
  return request('/scoreboard/start', {
    method: 'POST'
  });
}

export function pauseScoreboardTimer() {
  return request('/scoreboard/pause', {
    method: 'POST'
  });
}

export function setScoreboardTimer(seconds) {
  return request('/scoreboard/timer', {
    method: 'POST',
    body: JSON.stringify({ seconds })
  });
}

export function addPenalty(team, name, seconds) {
  return request('/scoreboard/penalties', {
    method: 'POST',
    body: JSON.stringify({ team, name, seconds })
  });
}

export function removePenalty(id) {
  return request(`/scoreboard/penalties/${id}`, {
    method: 'DELETE'
  });
}

export function setHalftime(seconds) {
  return request('/scoreboard/halftime', {
    method: 'POST',
    body: JSON.stringify({ seconds })
  });
}

export function setExtraTime(seconds) {
  return request('/scoreboard/extra-time', {
    method: 'POST',
    body: JSON.stringify({ seconds })
  });
}

export function setHalftimePause(seconds) {
  return request('/scoreboard/halftime/pause', {
    method: 'POST',
    body: JSON.stringify({ seconds })
  });
}

export function finishGame() {
  return request('/scoreboard/finish', {
    method: 'POST'
  });
}

export function startNewGame() {
  return request('/scoreboard/game/new', {
    method: 'POST'
  });
}

export function fetchHistory() {
  return request('/scoreboard/history');
}

export function updateHistoryGame(id, payload) {
  return request(`/scoreboard/history/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}

export function deleteHistoryGame(id) {
  return request(`/scoreboard/history/${id}`, {
    method: 'DELETE'
  });
}

export function updateMatchContext(payload) {
  return request('/scoreboard/context', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function selectScheduleMatch(tournamentId, scheduleCode) {
  return request('/scoreboard/schedule/select', {
    method: 'POST',
    body: JSON.stringify({ tournamentId, scheduleCode })
  });
}

export function fetchTournaments() {
  return request('/tournaments');
}

export function createTournament(payload) {
  return request('/tournaments', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function updateTournament(id, payload) {
  return request(`/tournaments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}

export function deleteTournament(id) {
  return request(`/tournaments/${id}`, {
    method: 'DELETE'
  });
}

export function fetchTeams() {
  return request('/teams');
}

export function createTeam(payload) {
  return request('/teams', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function updateTeam(id, payload) {
  return request(`/teams/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}

export function deleteTeam(id) {
  return request(`/teams/${id}`, {
    method: 'DELETE'
  });
}

export function fetchTournamentStages(id) {
  return request(`/tournaments/${id}/stages`);
}

export function fetchTournamentSchedule(id) {
  return request(`/tournaments/${id}/schedule`);
}

export function fetchTournamentStructure(id) {
  return request(`/tournaments/${id}/structure`);
}

export function updateTournamentTeams(id, assignments) {
  return request(`/tournaments/${id}/teams`, {
    method: 'PUT',
    body: JSON.stringify({ assignments })
  });
}
