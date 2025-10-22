import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createPlayer,
  deletePlayer,
  fetchPlayers,
  updatePlayer
} from '../utils/api.js';

export default function usePlayerManager({ updateMessage, loadPlayersDependencies = [], refreshActiveTeams }) {
  const [players, setPlayers] = useState([]);
  const [playersLoading, setPlayersLoading] = useState(true);
  const [playersError, setPlayersError] = useState('');
  const [playerCreate, setPlayerCreate] = useState({ teamId: '', name: '', jerseyNumber: '', position: '' });
  const [playerEdits, setPlayerEdits] = useState({});

  const loadPlayers = useCallback(() => {
    setPlayersLoading(true);
    fetchPlayers()
      .then((data) => {
        setPlayers(data);
        setPlayersError('');
      })
      .catch(() => {
        setPlayersError('Spieler konnten nicht geladen werden.');
      })
      .finally(() => {
        setPlayersLoading(false);
      });
  }, []);

  useEffect(() => {
    loadPlayers();
  }, [loadPlayers, ...loadPlayersDependencies]);

  const handlePlayerCreateChange = useCallback((field, value) => {
    setPlayerCreate((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handlePlayerCreateSubmit = useCallback(
    async (event) => {
      event?.preventDefault();

      if (!playerCreate.teamId) {
        updateMessage('error', 'Bitte ein Team auswählen.');
        return false;
      }
      if (!playerCreate.name.trim()) {
        updateMessage('error', 'Bitte einen Spielernamen eingeben.');
        return false;
      }

      let jerseyNumber;
      const jerseyValue = (playerCreate.jerseyNumber ?? '').toString().trim();
      if (jerseyValue) {
        const parsed = Number(jerseyValue);
        if (!Number.isFinite(parsed) || parsed < 0) {
          updateMessage('error', 'Bitte eine gültige Rückennummer angeben.');
          return false;
        }
        jerseyNumber = parsed;
      }

      const payload = {
        teamId: Number(playerCreate.teamId),
        name: playerCreate.name.trim(),
        jerseyNumber,
        position: playerCreate.position.trim()
      };

      try {
        await createPlayer(payload);
        setPlayerCreate((prev) => ({ teamId: prev.teamId, name: '', jerseyNumber: '', position: '' }));
        updateMessage('info', 'Spieler angelegt.');
        loadPlayers();
        refreshActiveTeams?.();
        return true;
      } catch (err) {
        console.error(err);
        updateMessage('error', 'Spieler konnte nicht angelegt werden.');
        return false;
      }
    },
    [playerCreate, loadPlayers, updateMessage, refreshActiveTeams]
  );

  const startPlayerEdit = useCallback((player) => {
    setPlayerEdits((prev) => ({
      ...prev,
      [player.id]: {
        name: player.name ?? '',
        jerseyNumber: player.jersey_number ?? '',
        position: player.position ?? '',
        teamId: player.team_id ? String(player.team_id) : '',
        editing: true
      }
    }));
  }, []);

  const cancelPlayerEdit = useCallback((id) => {
    setPlayerEdits((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const handlePlayerEditChange = useCallback((id, field, value) => {
    setPlayerEdits((prev) => {
      const current = prev[id];
      if (!current) {
        return prev;
      }
      return {
        ...prev,
        [id]: { ...current, [field]: value }
      };
    });
  }, []);

  const handlePlayerUpdateSubmit = useCallback(
    async (id) => {
      const edit = playerEdits[id];
      if (!edit) {
        return false;
      }

      if (!edit.name.trim()) {
        updateMessage('error', 'Bitte einen Spielernamen eingeben.');
        return false;
      }

      let jerseyNumber;
      const jerseyValue = (edit.jerseyNumber ?? '').toString().trim();
      if (jerseyValue) {
        const parsed = Number(jerseyValue);
        if (!Number.isFinite(parsed) || parsed < 0) {
          updateMessage('error', 'Bitte eine gültige Rückennummer angeben.');
          return false;
        }
        jerseyNumber = parsed;
      }

      const original = players.find((player) => player.id === id);
      const payload = {
        name: edit.name.trim(),
        jerseyNumber,
        position: edit.position.trim(),
        teamId: edit.teamId ? Number(edit.teamId) : original?.team_id
      };

      if (payload.teamId == null) {
        updateMessage('error', 'Bitte ein Team auswählen.');
        return false;
      }

      try {
        await updatePlayer(id, payload);
        updateMessage('info', 'Spieler aktualisiert.');
        cancelPlayerEdit(id);
        loadPlayers();
        refreshActiveTeams?.();
        return true;
      } catch (err) {
        console.error(err);
        updateMessage('error', 'Spieler konnte nicht aktualisiert werden.');
        return false;
      }
    },
    [playerEdits, players, cancelPlayerEdit, loadPlayers, updateMessage, refreshActiveTeams]
  );

  const handlePlayerDelete = useCallback(
    async (id) => {
      if (!window.confirm('Spieler wirklich löschen?')) {
        return false;
      }

      try {
        await deletePlayer(id);
        updateMessage('info', 'Spieler gelöscht.');
        setPlayerEdits((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
        loadPlayers();
        refreshActiveTeams?.();
        return true;
      } catch (err) {
        console.error(err);
        updateMessage('error', 'Spieler konnte nicht gelöscht werden.');
        return false;
      }
    },
    [loadPlayers, updateMessage, refreshActiveTeams]
  );

  const playersByTeam = useMemo(() => {
    const map = new Map();
    players.forEach((player) => {
      const key = player.team_id != null ? String(player.team_id) : 'unassigned';
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key).push(player);
    });

    map.forEach((list) => {
      list.sort((a, b) => {
        const aNum = a.jersey_number ?? Number.MAX_SAFE_INTEGER;
        const bNum = b.jersey_number ?? Number.MAX_SAFE_INTEGER;
        if (aNum !== bNum) {
          return aNum - bNum;
        }
        return (a.name ?? '').localeCompare(b.name ?? '', 'de', { sensitivity: 'base' });
      });
    });

    return map;
  }, [players]);

  const unassignedPlayers = playersByTeam.get('unassigned') ?? [];

  return {
    players,
    playersLoading,
    playersError,
    playerCreate,
    playerEdits,
    playersByTeam,
    unassignedPlayers,
    loadPlayers,
    setPlayerCreate,
    setPlayerEdits,
    handlePlayerCreateChange,
    handlePlayerCreateSubmit,
    startPlayerEdit,
    cancelPlayerEdit,
    handlePlayerEditChange,
    handlePlayerUpdateSubmit,
    handlePlayerDelete
  };
}
