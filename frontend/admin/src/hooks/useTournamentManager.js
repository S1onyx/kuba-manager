import { useCallback, useEffect, useState } from 'react';
import {
  createTournament,
  deleteTournament,
  fetchTournaments,
  updateMatchContext,
  updateTournament,
  setTournamentCompletionStatus,
  uploadTournamentPoster
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
    status: 'active',
    planned_at: '',
    description: '',
    location: '',
    group_count: '',
    knockout_rounds: '',
    team_count: '',
    classification_mode: 'top4',
    is_public: false,
    schedule_info: '',
    travel_info: '',
    contact_email: '',
    registration_url: '',
    registration_deadline: ''
  });
  const [tournamentEdits, setTournamentEdits] = useState({});
  const [expandedTournamentId, setExpandedTournamentId] = useState(null);
  const [tournamentCompletionSaving, setTournamentCompletionSaving] = useState({});

  const loadTournaments = useCallback((showLoader = false) => {
    if (showLoader) {
      setTournamentsLoading(true);
    }
    fetchTournaments()
      .then((data) => {
        setTournaments(data);
        setTournamentsError('');
      })
      .catch(() => {
        setTournamentsError('Turniere konnten nicht geladen werden.');
      })
      .finally(() => {
        if (showLoader) {
          setTournamentsLoading(false);
        }
      });
  }, []);

  useEffect(() => {
    loadTournaments(true);
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
          status: tournamentForm.status || 'active',
          planned_at: tournamentForm.planned_at || null,
          description: tournamentForm.description || null,
          location: tournamentForm.location || null,
          group_count: Number(tournamentForm.group_count || 0),
          knockout_rounds: Number(tournamentForm.knockout_rounds || 0),
          team_count: Number(tournamentForm.team_count || 0),
          classification_mode: tournamentForm.classification_mode,
          is_public: Boolean(tournamentForm.is_public),
          schedule_info: tournamentForm.schedule_info || null,
          travel_info: tournamentForm.travel_info || null,
          contact_email: tournamentForm.contact_email || null,
          registration_url: tournamentForm.registration_url || null,
          registration_deadline: tournamentForm.registration_deadline || null
        });
        setTournamentForm({
          name: '',
          status: 'active',
          planned_at: '',
          description: '',
          location: '',
          group_count: '',
          knockout_rounds: '',
          team_count: '',
          classification_mode: 'top4',
          is_public: false,
          schedule_info: '',
          travel_info: '',
          contact_email: '',
          registration_url: '',
          registration_deadline: ''
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
        status: tournament.status ?? 'active',
        planned_at: tournament.planned_at ?? '',
        description: tournament.description ?? '',
        location: tournament.location ?? '',
        group_count: String(tournament.group_count ?? 0),
        knockout_rounds: String(tournament.knockout_rounds ?? 0),
        team_count: String(tournament.team_count ?? 0),
        classification_mode: tournament.classification_mode ?? 'top4',
        is_public: Boolean(tournament.is_public),
        schedule_info: tournament.schedule_info ?? '',
        travel_info: tournament.travel_info ?? '',
        contact_email: tournament.contact_email ?? '',
        registration_url: tournament.registration_url ?? '',
        registration_deadline: tournament.registration_deadline ?? ''
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
          status: draft.status || 'active',
          planned_at: draft.planned_at || null,
          description: draft.description || null,
          location: draft.location || null,
          group_count: Number(draft.group_count || 0),
          knockout_rounds: Number(draft.knockout_rounds || 0),
          team_count: Number(draft.team_count || 0),
          classification_mode: draft.classification_mode,
          is_public: Boolean(draft.is_public),
          schedule_info: draft.schedule_info || null,
          travel_info: draft.travel_info || null,
          contact_email: draft.contact_email || null,
          registration_url: draft.registration_url || null,
          registration_deadline: draft.registration_deadline || null
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

  const handleTournamentCompletionChange = useCallback(
    async (id, completed) => {
      const key = String(id);
      setTournamentCompletionSaving((prev) => ({ ...prev, [key]: true }));
      try {
        await setTournamentCompletionStatus(id, completed);
        loadTournaments();
        updateMessage('info', completed ? 'Turnier abgeschlossen.' : 'Turnier wieder geöffnet.');
        return true;
      } catch (error) {
        console.error(error);
        updateMessage('error', 'Turnierstatus konnte nicht aktualisiert werden.');
        return false;
      } finally {
        setTournamentCompletionSaving((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }
    },
    [loadTournaments, updateMessage]
  );

  const handlePosterUpload = useCallback(
    async (tournamentId, file) => {
      try {
        await uploadTournamentPoster(tournamentId, file);
        loadTournaments();
        updateMessage('info', 'Plakat hochgeladen.');
      } catch (err) {
        console.error(err);
        updateMessage('error', 'Plakat konnte nicht hochgeladen werden.');
      }
    },
    [loadTournaments, updateMessage]
  );

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
    setTournamentEdits,
    handleTournamentCompletionChange,
    tournamentCompletionSaving,
    handlePosterUpload
  };
}
