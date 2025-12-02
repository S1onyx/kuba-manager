import { useCallback, useEffect, useState } from 'react';
import { createTeam, deleteTeam, fetchTeams, updateTeam } from '../utils/api.js';

export default function useTeamManager({ updateMessage }) {
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
      .catch(() => {
        setTeamsError('Teams konnten nicht geladen werden.');
      })
      .finally(() => {
        if (showLoader) {
          setTeamsLoading(false);
        }
      });
  }, []);

  useEffect(() => {
    loadTeams(true);
  }, [loadTeams]);

  const handleTeamCreateSubmit = useCallback(
    async (event) => {
      event?.preventDefault();
      const trimmed = teamCreateName.trim();
      if (!trimmed) {
        updateMessage('error', 'Teamname darf nicht leer sein.');
        return false;
      }

      try {
        await createTeam({ name: trimmed });
        setTeamCreateName('');
        loadTeams();
        updateMessage('info', 'Team angelegt.');
        return true;
      } catch (err) {
        console.error(err);
        updateMessage('error', 'Team konnte nicht angelegt werden.');
        return false;
      }
    },
    [teamCreateName, loadTeams, updateMessage]
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
        updateMessage('error', 'Teamname darf nicht leer sein.');
        return false;
      }

      try {
        await updateTeam(id, { name: draft.name });
        cancelTeamEdit(id);
        loadTeams();
        updateMessage('info', 'Team aktualisiert.');
        return true;
      } catch (err) {
        console.error(err);
        updateMessage('error', 'Team konnte nicht aktualisiert werden.');
        return false;
      }
    },
    [teamEdits, cancelTeamEdit, loadTeams, updateMessage]
  );

  const handleTeamDelete = useCallback(
    async (id) => {
      if (!window.confirm('Team wirklich löschen?')) {
        return false;
      }

      try {
        await deleteTeam(id);
        cancelTeamEdit(id);
        loadTeams();
        updateMessage('info', 'Team gelöscht.');
        return true;
      } catch (err) {
        console.error(err);
        updateMessage('error', 'Team konnte nicht gelöscht werden.');
        return false;
      }
    },
    [cancelTeamEdit, loadTeams, updateMessage]
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
