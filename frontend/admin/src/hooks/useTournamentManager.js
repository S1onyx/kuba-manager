import { useCallback, useEffect, useState } from 'react';
import {
  createTournament,
  deleteTournament,
  fetchTournaments,
  updateMatchContext,
  updateTournament
} from '../utils/api.js';

export default function useTournamentManager({
  scoreboard,
  updateMessage,
  setScoreboard,
  setContextForm,
  setContextFormDirty
}) {
  const [tournaments, setTournaments] = useState([]);
  const [tournamentsLoading, setTournamentsLoading] = useState(true);
  const [tournamentsError, setTournamentsError] = useState('');
  const [tournamentForm, setTournamentForm] = useState({
    name: '',
    group_count: '',
    knockout_rounds: '',
    team_count: '',
    classification_mode: 'top4',
    is_public: false
  });
  const [tournamentEdits, setTournamentEdits] = useState({});
  const [expandedTournamentId, setExpandedTournamentId] = useState(null);

  const loadTournaments = useCallback(() => {
    setTournamentsLoading(true);
    fetchTournaments()
      .then((data) => {
        setTournaments(data);
        setTournamentsError('');
      })
      .catch(() => {
        setTournamentsError('Turniere konnten nicht geladen werden.');
      })
      .finally(() => {
        setTournamentsLoading(false);
      });
  }, []);

  useEffect(() => {
    loadTournaments();
  }, [loadTournaments]);

  const handleTournamentFormChange = useCallback((field, value) => {
    setTournamentForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleTournamentFormSubmit = useCallback(
    async (event) => {
      event?.preventDefault();
      if (!tournamentForm.name.trim()) {
        updateMessage('error', 'Turniername darf nicht leer sein.');
        return false;
      }

      try {
        await createTournament({
          name: tournamentForm.name,
          group_count: Number(tournamentForm.group_count || 0),
          knockout_rounds: Number(tournamentForm.knockout_rounds || 0),
          team_count: Number(tournamentForm.team_count || 0),
          classification_mode: tournamentForm.classification_mode,
          is_public: Boolean(tournamentForm.is_public)
        });
        setTournamentForm({
          name: '',
          group_count: '',
          knockout_rounds: '',
          team_count: '',
          classification_mode: 'top4',
          is_public: false
        });
        loadTournaments();
        updateMessage('info', 'Turnier erstellt.');
        return true;
      } catch (err) {
        console.error(err);
        updateMessage('error', 'Turnier konnte nicht erstellt werden.');
        return false;
      }
    },
    [tournamentForm, loadTournaments, updateMessage]
  );

  const startTournamentEdit = useCallback((tournament) => {
    setTournamentEdits((prev) => ({
      ...prev,
      [tournament.id]: {
        name: tournament.name,
        group_count: String(tournament.group_count ?? 0),
        knockout_rounds: String(tournament.knockout_rounds ?? 0),
        team_count: String(tournament.team_count ?? 0),
        classification_mode: tournament.classification_mode ?? 'top4',
        is_public: Boolean(tournament.is_public)
      }
    }));
  }, []);

  const handleTournamentEditChange = useCallback((id, field, value) => {
    setTournamentEdits((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value }
    }));
  }, []);

  const cancelTournamentEdit = useCallback((id) => {
    setTournamentEdits((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const handleTournamentSave = useCallback(
    async (id) => {
      const draft = tournamentEdits[id];
      if (!draft || !draft.name.trim()) {
        updateMessage('error', 'Turniername darf nicht leer sein.');
        return false;
      }

      try {
        await updateTournament(id, {
          name: draft.name,
          group_count: Number(draft.group_count || 0),
          knockout_rounds: Number(draft.knockout_rounds || 0),
          team_count: Number(draft.team_count || 0),
          classification_mode: draft.classification_mode,
          is_public: Boolean(draft.is_public)
        });
        cancelTournamentEdit(id);
        loadTournaments();
        updateMessage('info', 'Turnier aktualisiert.');
        return true;
      } catch (err) {
        console.error(err);
        updateMessage('error', 'Turnier konnte nicht aktualisiert werden.');
        return false;
      }
    },
    [tournamentEdits, cancelTournamentEdit, loadTournaments, updateMessage]
  );

  const handleTournamentDelete = useCallback(
    async (id) => {
      if (!window.confirm('Turnier wirklich löschen?')) {
        return false;
      }

      try {
        await deleteTournament(id);
        cancelTournamentEdit(id);
        if (scoreboard?.tournamentId === id) {
          const updated = await updateMatchContext({ tournamentId: null, stageType: null, stageLabel: '' });
          setScoreboard(updated);
          setContextForm({
            tournamentId: '',
            stageType: '',
            stageLabel: ''
          });
          setContextFormDirty(false);
        }
        loadTournaments();
        updateMessage('info', 'Turnier gelöscht.');
        return true;
      } catch (err) {
        console.error(err);
        updateMessage('error', 'Turnier konnte nicht gelöscht werden.');
        return false;
      }
    },
    [cancelTournamentEdit, scoreboard?.tournamentId, setScoreboard, setContextForm, setContextFormDirty, loadTournaments, updateMessage]
  );

  const handleTournamentDetailsToggle = useCallback((id) => {
    setExpandedTournamentId((prev) => (prev === id ? null : id));
  }, []);

  return {
    tournaments,
    tournamentsLoading,
    tournamentsError,
    tournamentForm,
    tournamentEdits,
    expandedTournamentId,
    loadTournaments,
    setExpandedTournamentId,
    handleTournamentFormChange,
    handleTournamentFormSubmit,
    startTournamentEdit,
    handleTournamentEditChange,
    cancelTournamentEdit,
    handleTournamentSave,
    handleTournamentDelete,
    handleTournamentDetailsToggle,
    setTournamentForm,
    setTournamentEdits
  };
}
