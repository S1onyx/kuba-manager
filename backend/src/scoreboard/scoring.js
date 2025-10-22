import {
  getState,
  notifySubscribers,
  snapshotState,
  registerScoreEvent,
  resetScoreEventIds,
  resetTeamStats
} from './stateStore.js';
import { triggerAudioEvent } from '../audio/dispatcher.js';
import { ensureScoreTriggerForTeam } from '../services/audio/index.js';

export function addPoints(team, points, metadata = {}) {
  const state = getState();
  const normalized = Number(points);
  if (!Number.isFinite(normalized) || normalized === 0) {
    return snapshotState();
  }

  const delta = Math.trunc(normalized);
  const teamKey = String(team).toLowerCase() === 'b' ? 'b' : 'a';
  if (teamKey === 'b') {
    const current = state.scoreB || 0;
    const next = Math.max(0, current + delta);
    const appliedDelta = next - current;
    state.scoreB = next;
    if (appliedDelta !== 0) {
      registerScoreEvent(teamKey, appliedDelta, {
        ...metadata,
        type: appliedDelta >= 0 ? metadata.type ?? 'score' : 'adjustment'
      });
      if (appliedDelta > 0) {
        const numericTeamIdRaw = Number(state.teamBId);
        const validTeamId = Number.isInteger(numericTeamIdRaw) && numericTeamIdRaw > 0 ? numericTeamIdRaw : null;
        const context = {
          points: appliedDelta,
          score: state.scoreB,
          team: state.teamBName,
          teamKey: 'b'
        };
        if (validTeamId !== null) {
          ensureScoreTriggerForTeam(validTeamId, state.teamBName).catch((error) => {
            console.error('Team-Trigger (B) konnte nicht vorbereitet werden:', error);
          });
          triggerAudioEvent(`score_team_${validTeamId}`, {
            ...context,
            teamId: validTeamId,
            teamName: state.teamBName
          }).catch((error) => {
            console.error('Audio-Trigger (score_team_ID_B) fehlgeschlagen:', error);
          });
        }
        triggerAudioEvent('score_team_b', {
          ...context,
          teamId: validTeamId,
          teamName: state.teamBName
        }).catch((error) => {
          console.error('Audio-Trigger (score_team_b) fehlgeschlagen:', error);
        });
      }
    }
  } else {
    const current = state.scoreA || 0;
    const next = Math.max(0, current + delta);
    const appliedDelta = next - current;
    state.scoreA = next;
    if (appliedDelta !== 0) {
      registerScoreEvent(teamKey, appliedDelta, {
        ...metadata,
        type: appliedDelta >= 0 ? metadata.type ?? 'score' : 'adjustment'
      });
      if (appliedDelta > 0) {
        const numericTeamIdRaw = Number(state.teamAId);
        const validTeamId = Number.isInteger(numericTeamIdRaw) && numericTeamIdRaw > 0 ? numericTeamIdRaw : null;
        const context = {
          points: appliedDelta,
          score: state.scoreA,
          team: state.teamAName,
          teamKey: 'a'
        };
        if (validTeamId !== null) {
          ensureScoreTriggerForTeam(validTeamId, state.teamAName).catch((error) => {
            console.error('Team-Trigger (A) konnte nicht vorbereitet werden:', error);
          });
          triggerAudioEvent(`score_team_${validTeamId}`, {
            ...context,
            teamId: validTeamId,
            teamName: state.teamAName
          }).catch((error) => {
            console.error('Audio-Trigger (score_team_ID_A) fehlgeschlagen:', error);
          });
        }
        triggerAudioEvent('score_team_a', {
          ...context,
          teamId: validTeamId,
          teamName: state.teamAName
        }).catch((error) => {
          console.error('Audio-Trigger (score_team_a) fehlgeschlagen:', error);
        });
      }
    }
  }

  notifySubscribers();
  return snapshotState();
}

export function setScoreAbsolute(team, score) {
  const state = getState();
  const teamKey = String(team).toLowerCase();
  const numericScore = Number(score);
  if (!Number.isFinite(numericScore) || numericScore < 0) {
    return snapshotState();
  }

  const sanitized = Math.trunc(numericScore);

  if (teamKey === 'b') {
    state.scoreB = sanitized;
  } else if (teamKey === 'a') {
    state.scoreA = sanitized;
  } else {
    return snapshotState();
  }

  notifySubscribers();
  return snapshotState();
}

export function resetScores() {
  const state = getState();
  state.scoreA = 0;
  state.scoreB = 0;
  resetTeamStats('a');
  resetTeamStats('b');
  state.scoringLog = [];
  resetScoreEventIds();
  notifySubscribers();
  return snapshotState();
}
