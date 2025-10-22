import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchTournamentStages, updateMatchContext } from '../utils/api.js';
import { canonicalizeGroupLabel } from '../utils/formatters.js';

const EMPTY_STAGE_OPTIONS = { group: [], knockout: [], placement: [] };

export default function useMatchContext({ scoreboard, updateMessage, setScoreboard }) {
  const [contextForm, setContextForm] = useState({ tournamentId: '', stageType: '', stageLabel: '' });
  const [contextFormDirty, setContextFormDirty] = useState(false);
  const [stageOptions, setStageOptions] = useState(EMPTY_STAGE_OPTIONS);
  const [stageOptionsLoading, setStageOptionsLoading] = useState(false);
  const stageLabelMapRef = useRef(new Map());

  const resolvedTournamentId = useMemo(() => {
    const scoreboardId = scoreboard?.tournamentId ? Number(scoreboard.tournamentId) : null;
    if (scoreboardId && Number.isInteger(scoreboardId) && scoreboardId > 0) {
      return scoreboardId;
    }
    const contextId = contextForm.tournamentId ? Number(contextForm.tournamentId) : null;
    if (contextId && Number.isInteger(contextId) && contextId > 0) {
      return contextId;
    }
    return null;
  }, [scoreboard?.tournamentId, contextForm.tournamentId]);

  const stageLabelData = useMemo(() => {
    const labelMap = new Map();
    const hintsByPhase = {
      group: [],
      knockout: [],
      placement: []
    };

    Object.entries(stageOptions).forEach(([phase, labels = []]) => {
      labels.forEach((label) => {
        const trimmed = (label ?? '').toString().trim();
        if (!trimmed) {
          return;
        }

        if (Array.isArray(hintsByPhase[phase]) && !hintsByPhase[phase].includes(trimmed)) {
          hintsByPhase[phase].push(trimmed);
        }

        const normalized = trimmed.toLowerCase();
        const existing = labelMap.get(normalized);
        if (existing) {
          if (!existing.phases.includes(phase)) {
            existing.phases.push(phase);
          }
        } else {
          labelMap.set(normalized, {
            label: trimmed,
            phases: [phase]
          });
        }
      });
    });

    Object.keys(hintsByPhase).forEach((phase) => {
      hintsByPhase[phase].sort((a, b) => a.localeCompare(b, 'de', { sensitivity: 'base' }));
    });

    const suggestions = Array.from(labelMap.values()).sort((a, b) =>
      a.label.localeCompare(b.label, 'de', { sensitivity: 'base' })
    );

    return {
      labelMap,
      hintsByPhase,
      suggestions
    };
  }, [stageOptions]);

  stageLabelMapRef.current = stageLabelData.labelMap;
  const stageHintsByPhase = stageLabelData.hintsByPhase;
  const stageSuggestionEntries = stageLabelData.suggestions;

  useEffect(() => {
    if (!scoreboard) return;
    if (contextFormDirty) return;
    setContextForm({
      tournamentId: scoreboard.tournamentId ? String(scoreboard.tournamentId) : '',
      stageType: scoreboard.stageType ?? '',
      stageLabel: scoreboard.stageLabel ?? ''
    });
  }, [contextFormDirty, scoreboard]);

  useEffect(() => {
    if (!resolvedTournamentId) {
      setStageOptions(EMPTY_STAGE_OPTIONS);
      setStageOptionsLoading(false);
      return;
    }

    let active = true;
    setStageOptionsLoading(true);

    fetchTournamentStages(resolvedTournamentId)
      .then((data) => {
        if (!active) return;
        setStageOptions({
          group: Array.isArray(data?.group) ? data.group : [],
          knockout: Array.isArray(data?.knockout) ? data.knockout : [],
          placement: Array.isArray(data?.placement) ? data.placement : []
        });
      })
      .catch(() => {
        if (!active) return;
        setStageOptions(EMPTY_STAGE_OPTIONS);
      })
      .finally(() => {
        if (!active) return;
        setStageOptionsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [resolvedTournamentId]);

  useEffect(() => {
    if (!contextForm.stageType || contextForm.stageLabel) {
      return;
    }
    const options = stageOptions[contextForm.stageType] ?? [];
    if (options.length > 0 && !contextFormDirty) {
      setContextForm((prev) => {
        if (prev.stageType !== contextForm.stageType || prev.stageLabel) {
          return prev;
        }
        return { ...prev, stageLabel: options[0] };
      });
    }
  }, [stageOptions, contextForm.stageType, contextForm.stageLabel, contextFormDirty]);

  const handleContextFormChange = useCallback((field, value) => {
    setContextFormDirty(true);
    setContextForm((prev) => {
      if (field === 'stageType') {
        return {
          ...prev,
          stageType: value,
          stageLabel: ''
        };
      }

      if (field === 'stageLabel') {
        const raw = typeof value === 'string' ? value : String(value ?? '');
        const trimmed = raw.trim();
        const normalized = trimmed.toLowerCase();
        const match = stageLabelMapRef.current.get(normalized);

        let nextStageType = prev.stageType || '';
        if (match) {
          if (!nextStageType || !match.phases.includes(nextStageType)) {
            [nextStageType] = match.phases;
          }
        }

        const canonical = nextStageType === 'group' ? canonicalizeGroupLabel(raw) : trimmed;

        return {
          ...prev,
          stageType: nextStageType,
          stageLabel: nextStageType ? canonical : trimmed
        };
      }

      return { ...prev, [field]: value };
    });
  }, []);

  const handleContextSubmit = useCallback(
    async () => {
      const trimmedLabel = (contextForm.stageLabel ?? '').trim();
      const payload = {
        tournamentId: contextForm.tournamentId ? Number(contextForm.tournamentId) : null,
        stageType: contextForm.stageType || null,
        stageLabel: contextForm.stageType ? trimmedLabel : ''
      };

      if (payload.stageType && !payload.stageLabel) {
        updateMessage('error', 'Bitte eine Phasenbezeichnung angeben.');
        return false;
      }

      try {
        const updated = await updateMatchContext(payload);
        setScoreboard(updated);
        updateMessage('info', 'Match-Kontext aktualisiert.');
        setContextFormDirty(false);
        return true;
      } catch (err) {
        console.error(err);
        updateMessage('error', 'Match-Kontext konnte nicht gesetzt werden.');
        return false;
      }
    },
    [contextForm, setScoreboard, updateMessage]
  );

  const stageListId = stageSuggestionEntries.length > 0 ? 'stage-options-all' : undefined;
  const stageHintLines = useMemo(() => {
    const labels = {
      group: 'Gruppen',
      knockout: 'KO',
      placement: 'Platzierung'
    };
    return Object.entries(stageHintsByPhase)
      .filter(([, entries]) => Array.isArray(entries) && entries.length > 0)
      .map(([phase, entries]) => `${labels[phase] ?? phase}: ${entries.join(', ')}`);
  }, [stageHintsByPhase]);

  const stageLabelPlaceholder = useMemo(() => {
    if (contextForm.stageType === 'group') return 'z.B. Gruppe A';
    if (contextForm.stageType === 'knockout') return 'z.B. Viertelfinale';
    if (contextForm.stageType === 'placement') return 'z.B. Spiel um Platz 3 / 4';
    return 'z.B. Viertelfinale oder Spiel um Platz 3 / 4';
  }, [contextForm.stageType]);

  return {
    contextForm,
    contextFormDirty,
    stageOptions,
    stageOptionsLoading,
    stageSuggestionEntries,
    stageHintLines,
    stageLabelPlaceholder,
    stageListId,
    resolvedTournamentId,
    setContextForm,
    setContextFormDirty,
    handleContextFormChange,
    handleContextSubmit
  };
}
