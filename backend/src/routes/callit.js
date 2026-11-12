import express from 'express';
import { readBearerToken } from '../auth/index.js';
import {
  changeOwnPassword,
  deleteUserCascade,
  loginUser,
  logoutSession,
  optionalCallitUser,
  publicUser,
  registerUser,
  requireCallitUser
} from '../services/callit/auth.js';
import { CallitError, queryAll } from '../services/callit/db.js';
import { emitCallitUpdate } from '../services/callit/events.js';
import {
  deleteTip,
  getParticipant,
  getRanking,
  getTournamentInfo,
  joinTournament,
  listEnabledTournaments,
  listMatchesForUser,
  listSpecialsForUser,
  submitSpecialTip,
  submitTip
} from '../services/callit/index.js';
import { getFinalOverview, getMatchStats, getOverviewStats, getProfile } from '../services/callit/stats.js';
import { RANKING_CATEGORIES } from '../services/callit/scoring.js';

const router = express.Router();
const CODE_PATTERN = /^[\w.:-]{1,64}$/;

export function sendCallitError(res, error) {
  if (error instanceof CallitError) {
    return res.status(error.status).json({ code: error.code, message: error.message });
  }
  console.error('[callit] Anfrage fehlgeschlagen:', error);
  return res.status(500).json({ code: 'CALLIT_INTERNAL', message: 'Unerwarteter Fehler.' });
}

export const handle = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (error) {
    sendCallitError(res, error);
  }
};

export function tournamentIdParam(req) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) throw new CallitError('CALLIT_INVALID_TOURNAMENT', 'Ungültige Turnier-ID.');
  return id;
}

export function codeParam(value) {
  const code = String(value ?? '');
  if (!CODE_PATTERN.test(code)) throw new CallitError('CALLIT_INVALID_CODE', 'Ungültiger Code.');
  return code;
}

router.post(
  '/auth/register',
  handle(async (req, res) => {
    const { nickname, password } = req.body ?? {};
    const { user, session } = await registerUser({ nickname, password, clientKey: req.ip || 'unknown' });
    res.status(201).json({ user, ...session });
  })
);

router.post(
  '/auth/login',
  handle(async (req, res) => {
    const { nickname, password } = req.body ?? {};
    const { user, session } = await loginUser({ nickname, password, clientKey: req.ip || 'unknown' });
    res.json({ user, ...session });
  })
);

router.post(
  '/auth/logout',
  handle(async (req, res) => {
    await logoutSession(readBearerToken(req));
    res.status(204).end();
  })
);

router.get('/me', requireCallitUser, (req, res) => res.json({ user: publicUser(req.callitUser) }));

router.post(
  '/me/password',
  requireCallitUser,
  handle(async (req, res) => {
    await changeOwnPassword(req.callitUser.id, req.body?.currentPassword, req.body?.newPassword);
    res.status(204).end();
  })
);

router.delete(
  '/me',
  requireCallitUser,
  handle(async (req, res) => {
    const tournaments = await queryAll('SELECT tournament_id FROM callit_participants WHERE user_id = ?', [req.callitUser.id]);
    await deleteUserCascade(req.callitUser.id);
    tournaments.forEach((row) => emitCallitUpdate(row.tournament_id, 'participants'));
    res.status(204).end();
  })
);

router.get(
  '/tournaments',
  optionalCallitUser,
  handle(async (req, res) => {
    const tournaments = await listEnabledTournaments();
    const top = Math.min(10, Math.max(0, Number(req.query.top) || 0));
    const enriched = await Promise.all(
      tournaments.map(async (tournament) => {
        const participant = req.callitUser ? await getParticipant(tournament.id, req.callitUser.id) : null;
        let leaders = [];
        if (top > 0) {
          try {
            leaders = (await getRanking(tournament.id, 'total')).rows.slice(0, top).map(({ rank, nickname, total }) => ({ rank, nickname, total }));
          } catch (error) {
            console.error('[callit] Top-Liste fehlgeschlagen:', error);
          }
        }
        return { ...tournament, joined: Boolean(participant), leaders };
      })
    );
    res.json(enriched);
  })
);

router.get(
  '/tournaments/:id',
  optionalCallitUser,
  handle(async (req, res) => res.json(await getTournamentInfo(tournamentIdParam(req), req.callitUser)))
);

router.post(
  '/tournaments/:id/join',
  requireCallitUser,
  handle(async (req, res) => res.json(await joinTournament(tournamentIdParam(req), req.callitUser, req.body?.joinCode)))
);

router.get(
  '/tournaments/:id/matches',
  optionalCallitUser,
  handle(async (req, res) => res.json(await listMatchesForUser(tournamentIdParam(req), req.callitUser)))
);

router.put(
  '/tournaments/:id/tips/:code',
  requireCallitUser,
  handle(async (req, res) => res.json(await submitTip(tournamentIdParam(req), req.callitUser, codeParam(req.params.code), req.body ?? {})))
);

router.delete(
  '/tournaments/:id/tips/:code',
  requireCallitUser,
  handle(async (req, res) => {
    await deleteTip(tournamentIdParam(req), req.callitUser, codeParam(req.params.code));
    res.status(204).end();
  })
);

router.get(
  '/tournaments/:id/specials',
  optionalCallitUser,
  handle(async (req, res) => res.json(await listSpecialsForUser(tournamentIdParam(req), req.callitUser)))
);

router.put(
  '/tournaments/:id/specials/:betKey',
  requireCallitUser,
  handle(async (req, res) =>
    res.json(await submitSpecialTip(tournamentIdParam(req), req.callitUser, codeParam(req.params.betKey), req.body?.value))
  )
);

router.get(
  '/tournaments/:id/ranking',
  handle(async (req, res) => {
    const category = Object.hasOwn(RANKING_CATEGORIES, req.query.category) ? req.query.category : 'total';
    res.json(await getRanking(tournamentIdParam(req), category));
  })
);

router.get(
  '/tournaments/:id/stats',
  handle(async (req, res) => res.json(await getOverviewStats(tournamentIdParam(req))))
);

router.get(
  '/tournaments/:id/final',
  handle(async (req, res) => res.json(await getFinalOverview(tournamentIdParam(req))))
);

router.get(
  '/tournaments/:id/matches/:code/stats',
  handle(async (req, res) => res.json(await getMatchStats(tournamentIdParam(req), codeParam(req.params.code))))
);

router.get(
  '/tournaments/:id/users/:userId',
  optionalCallitUser,
  handle(async (req, res) => {
    const userId = Number(req.params.userId);
    if (!Number.isInteger(userId) || userId <= 0) throw new CallitError('CALLIT_USER_NOT_FOUND', 'Tipper nicht gefunden.', 404);
    res.json(await getProfile(tournamentIdParam(req), userId, req.callitUser));
  })
);

export default router;
