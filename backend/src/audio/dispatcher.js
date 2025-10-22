import crypto from 'crypto';
import {
  getActiveTriggerWithFile,
  getAudioFileById,
  ensureScoreTriggerForTeam
} from '../services/audio/index.js';
import { broadcastAudioEvent } from './socket.js';

function createEventId() {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return crypto.randomBytes(16).toString('hex');
}

function createEventPayload({ key, trigger, file, origin = 'system', context = {} }) {
  if (!file) {
    return null;
  }

  return {
    eventId: createEventId(),
    key: key ?? trigger?.key ?? null,
    origin,
    triggeredAt: new Date().toISOString(),
    file,
    trigger: trigger
      ? {
          key: trigger.key,
          label: trigger.label,
          is_active: trigger.is_active
        }
      : null,
    context
  };
}

export async function triggerAudioEvent(key, context = {}) {
  if (typeof key === 'string' && key.startsWith('score_team_')) {
    const numericPart = Number(key.replace('score_team_', ''));
    if (Number.isInteger(numericPart) && numericPart > 0) {
      const teamName = context.teamName ?? context.team ?? null;
      try {
        await ensureScoreTriggerForTeam(numericPart, teamName);
      } catch (error) {
        console.error('Team-Trigger konnte nicht vorbereitet werden:', error);
      }
    }
  }

  const trigger = await getActiveTriggerWithFile(key);
  if (!trigger || !trigger.file) {
    return null;
  }

  const payload = createEventPayload({
    key,
    trigger,
    file: trigger.file,
    context,
    origin: 'trigger'
  });

  if (!payload) {
    return null;
  }

  broadcastAudioEvent(payload);
  return payload;
}

export async function playAudioFileById(fileId, context = {}, origin = 'manual') {
  const file = await getAudioFileById(fileId);
  if (!file) {
    throw new Error('Audiodatei nicht gefunden.');
  }

  const payload = createEventPayload({
    key: null,
    trigger: null,
    file,
    context,
    origin
  });

  broadcastAudioEvent(payload);
  return payload;
}
