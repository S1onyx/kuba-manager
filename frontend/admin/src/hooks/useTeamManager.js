import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createTeam, deleteTeam, fetchTeams, updateTeam } from '../utils/api.js';
import { formatApiError } from '../utils/apiError.js';

export default function useTeamManager({ updateMessage }) {
  const { t } = useTranslation();
  const [teams, setTeams] = useState([]);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [teamsError, setTeamsError] = useState('');
  const [teamCreateName, setTeamCreateName] = useState('');
  const [teamEdits, setTeamEdits] = useState({});

  const loadTeams = useCallback((showLoader = false) => {
    if (showLoader) {
      setTeamsLoading(true);
    }
    fetchTeams()
      .then((data) => {
        setTeams(data);
        setTeamsError('');
      })
      .catch((err) => {
        setTeamsError(formatApiError(err, t, 'feedback.teamsLoadFailed'));
      })
      .finally(() => {
        if (showLoader) {
          setTeamsLoading(false);
        }
      });
  }, [t]);

  useEffect(() => {
    loadTeams(true);
  }, [loadTeams]);

  const handleTeamCreateSubmit = useCallback(
    async (event) => {
      event?.preventDefault();
      const trimmed = teamCreateName.trim();
      if (!trimmed) {
        updateMessage('error', t('feedback.teamNameRequired'));
        return false;
      }

      try {
        await createTeam({ name: trimmed });
        setTeamCreateName('');
        loadTeams();
        updateMessage('info', t('feedback.teamCreated'));
        return true;
      } catch (err) {
        console.error(err);
        updateMessage('error', formatApiError(err, t, 'feedback.teamCreateFailed'));
        return false;
      }
    },
    [teamCreateName, loadTeams, updateMessage, t]
  );

  const startTeamEdit = useCallback((team) => {
    setTeamEdits((prev) => ({
      ...prev,
      [team.id]: { name: team.name }
    }));
  }, []);

  const handleTeamEditChange = useCallback((id, value) => {
    setTeamEdits((prev) => ({
      ...prev,
      [id]: { name: value }
    }));
  }, []);

  const cancelTeamEdit = useCallback((id) => {
    setTeamEdits((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const handleTeamSave = useCallback(
    async (id) => {
      const draft = teamEdits[id];
      if (!draft || !draft.name.trim()) {
        updateMessage('error', t('feedback.teamNameRequired'));
        return false;
      }

      try {
        await updateTeam(id, { name: draft.name });
        cancelTeamEdit(id);
        loadTeams();
        updateMessage('info', t('feedback.teamUpdated'));
        return true;
      } catch (err) {
        console.error(err);
        updateMessage('error', formatApiError(err, t, 'feedback.teamUpdateFailed'));
        return false;
      }
    },
    [teamEdits, cancelTeamEdit, loadTeams, updateMessage, t]
  );

  const handleTeamDelete = useCallback(
    async (id) => {
      if (!window.confirm(t('teams.confirmDelete'))) {
        return false;
      }

      try {
        await deleteTeam(id);
        cancelTeamEdit(id);
        loadTeams();
        updateMessage('info', t('feedback.teamDeleted'));
        return true;
      } catch (err) {
        console.error(err);
        updateMessage('error', formatApiError(err, t, 'feedback.teamDeleteFailed'));
        return false;
      }
    },
    [cancelTeamEdit, loadTeams, updateMessage, t]
  );

  return {
    teams,
    teamsLoading,
    teamsError,
    teamCreateName,
    teamEdits,
    setTeamCreateName,
    loadTeams,
    handleTeamCreateSubmit,
    startTeamEdit,
    handleTeamEditChange,
    cancelTeamEdit,
    handleTeamSave,
    handleTeamDelete
  };
}
