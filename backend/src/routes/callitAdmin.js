import express from 'express';
import { listTournaments } from '../services/index.js';
import { deleteUserCascade, renameUser, resetUserPassword, setUserBanned } from '../services/callit/auth.js';
import { CallitError, queryAll } from '../services/callit/db.js';
import { getConfig, updateConfig } from '../services/callit/index.js';
import {
  adminExportCsv,
  adminFindUser,
  adminListMatchTips,
  adminRemoveParticipant,
  adminSetDisqualified,
  adminSetLock,
  adminSetSpecialOverride,
  getAdminOverview
} from '../services/callit/admin.js';
import { emitCallitUpdate } from '../services/callit/events.js';
import { codeParam, handle, tournamentIdParam } from './callit.js';

const router = express.Router();

function userIdParam(req) {
  const id = Number(req.params.userId);
  if (!Number.isInteger(id) || id <= 0) throw new CallitError('CALLIT_USER_NOT_FOUND', 'Nutzer nicht gefunden.', 404);
  return id;
}

async function emitForUser(userId) {
  const rows = await queryAll('SELECT tournament_id FROM callit_participants WHERE user_id = ?', [userId]);
  rows.forEach((row) => emitCallitUpdate(row.tournament_id, 'participants'));
}

router.get(
  '/tournaments',
  handle(async (_req, res) => {
    const tournaments = await listTournaments();
    const configs = await Promise.all(tournaments.map((tournament) => getConfig(tournament.id)));
    res.json(
      tournaments.map((tournament, index) => ({
        id: tournament.id,
        name: tournament.name,
        isPublic: Boolean(tournament.is_public),
        status: tournament.status,
        enabled: configs[index].enabled
      }))
    );
  })
);

router.get('/tournaments/:id', handle(async (req, res) => res.json(await getAdminOverview(tournamentIdParam(req)))));

router.put(
  '/tournaments/:id',
  handle(async (req, res) => {
    const { enabled, registrationOpen, joinCode, settings, rulesText } = req.body ?? {};
    res.json(await updateConfig(tournamentIdParam(req), { enabled, registrationOpen, joinCode, settings, rulesText }));
  })
);

router.post(
  '/tournaments/:id/matches/:code/lock',
  handle(async (req, res) => {
    await adminSetLock(tournamentIdParam(req), codeParam(req.params.code), req.body?.action);
    res.status(204).end();
  })
);

router.get(
  '/tournaments/:id/matches/:code/tips',
  handle(async (req, res) => res.json(await adminListMatchTips(tournamentIdParam(req), codeParam(req.params.code))))
);

router.put(
  '/tournaments/:id/specials/:betKey/result',
  handle(async (req, res) => {
    await adminSetSpecialOverride(tournamentIdParam(req), codeParam(req.params.betKey), req.body?.value ?? null);
    res.status(204).end();
  })
);

router.post(
  '/tournaments/:id/participants/:userId/disqualify',
  handle(async (req, res) => {
    await adminSetDisqualified(tournamentIdParam(req), userIdParam(req), Boolean(req.body?.disqualified));
    res.status(204).end();
  })
);

router.delete(
  '/tournaments/:id/participants/:userId',
  handle(async (req, res) => {
    await adminRemoveParticipant(tournamentIdParam(req), userIdParam(req));
    res.status(204).end();
  })
);

router.get(
  '/tournaments/:id/export.csv',
  handle(async (req, res) => {
    const csv = await adminExportCsv(tournamentIdParam(req));
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="tippspiel-${tournamentIdParam(req)}.csv"`);
    res.send(csv);
  })
);

router.patch(
  '/users/:userId',
  handle(async (req, res) => {
    const userId = userIdParam(req);
    await adminFindUser(userId);
    if (req.body?.nickname !== undefined) await renameUser(userId, req.body.nickname);
    if (req.body?.banned !== undefined) await setUserBanned(userId, Boolean(req.body.banned));
    await emitForUser(userId);
    res.json(await adminFindUser(userId));
  })
);

router.post(
  '/users/:userId/reset-password',
  handle(async (req, res) => {
    const userId = userIdParam(req);
    await adminFindUser(userId);
    res.json({ temporaryPassword: await resetUserPassword(userId) });
  })
);

router.delete(
  '/users/:userId',
  handle(async (req, res) => {
    const userId = userIdParam(req);
    await emitForUser(userId);
    await deleteUserCascade(userId);
    res.status(204).end();
  })
);

export default router;
