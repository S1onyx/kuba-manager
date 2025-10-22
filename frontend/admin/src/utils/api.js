import { BACKEND_URL } from '../config.js';

const BASE = BACKEND_URL;
const API_BASE = `${BASE}/api`;

async function request(path, options = {}) {
  const isFormData = options?.body instanceof FormData;
  const headers = { ...(options.headers || {}) };

  if (isFormData) {
    // Browser setzt Boundary automatisch
    delete headers['Content-Type'];
  } else if (!headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
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

export function mutateScore(team, points, options = {}) {
  const payload = { team, points };
  if (options.playerId !== undefined && options.playerId !== null && options.playerId !== '') {
    payload.playerId = options.playerId;
  }
  if (options.shotType) {
    payload.shotType = options.shotType;
  }
  if (options.description) {
    payload.description = options.description;
  }
  if (options.affectStats !== undefined) {
    payload.affectStats = options.affectStats;
  }

  return request('/scoreboard/score', {
    method: 'POST',
    body: JSON.stringify(payload)
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

export function addPenalty(team, name, seconds, options = {}) {
  const payload = { team, name, seconds };
  if (options.playerId !== undefined && options.playerId !== null && options.playerId !== '') {
    payload.playerId = options.playerId;
  }
  if (options.description) {
    payload.description = options.description;
  }
  return request('/scoreboard/penalties', {
    method: 'POST',
    body: JSON.stringify(payload)
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

export function saveCurrentGame() {
  return request('/scoreboard/save', {
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

export function fetchAudioTriggers() {
  return request('/audio/triggers');
}

export function updateAudioTrigger(key, payload) {
  return request(`/audio/triggers/${encodeURIComponent(key)}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}

export function uploadAudioTriggerFile(key, file, label) {
  const formData = new FormData();
  formData.append('file', file);
  if (label) {
    formData.append('label', label);
  }
  return request(`/audio/triggers/${encodeURIComponent(key)}/upload`, {
    method: 'POST',
    body: formData
  });
}

export function playAudioTriggerPreview(key) {
  return request(`/audio/triggers/${encodeURIComponent(key)}/play`, {
    method: 'POST'
  });
}

export function assignAudioTriggerFile(key, fileId) {
  return request(`/audio/triggers/${encodeURIComponent(key)}/assign`, {
    method: 'POST',
    body: JSON.stringify({ fileId })
  });
}

export function fetchAudioLibrary() {
  return request('/audio/library');
}

export function uploadAudioLibraryFile(file, label) {
  const formData = new FormData();
  formData.append('file', file);
  if (label) {
    formData.append('label', label);
  }
  return request('/audio/library/upload', {
    method: 'POST',
    body: formData
  });
}

export function deleteAudioLibraryFile(id) {
  return request(`/audio/library/${id}`, {
    method: 'DELETE'
  });
}

export function playAudioLibraryFile(id) {
  return request('/audio/manual/play', {
    method: 'POST',
    body: JSON.stringify({ fileId: id })
  });
}

export function updateMatchContext(payload) {
  return request('/scoreboard/context', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function setDisplayView(view) {
  return request('/scoreboard/display', {
    method: 'POST',
    body: JSON.stringify({ view })
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

export function fetchPlayers(teamId) {
  const query = teamId ? `?teamId=${teamId}` : '';
  return request(`/players${query}`);
}

export function createPlayer(payload) {
  return request('/players', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function updatePlayer(id, payload) {
  return request(`/players/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}

export function deletePlayer(id) {
  return request(`/players/${id}`, {
    method: 'DELETE'
  });
}

export function fetchTournamentStages(id) {
  return request(`/tournaments/${id}/stages`);
}

export function fetchTournamentSchedule(id) {
  return request(`/tournaments/${id}/schedule`);
}

export function updateTournamentScheduleEntry(tournamentId, scheduleId, payload) {
  return request(`/tournaments/${tournamentId}/schedule/${scheduleId}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
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
