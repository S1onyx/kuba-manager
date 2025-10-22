import { useMemo } from 'react';
import PanelCard from '../../common/PanelCard.jsx';

export default function TournamentDetailsPanel({
  tournament,
  structureState,
  teams
}) {
  const {
    activeStructure,
    structureLoading,
    structureError,
    slotAssignments,
    slotInitialAssignments,
    structureSaving,
    hasTournamentChanges,
    handleSlotNameChange,
    handleSlotTeamSelect,
    handleSlotReset,
    handleResetAllSlots,
    handleTournamentAssignmentsSave,
    handleTournamentStructureRefresh,
    teamNameById
  } = structureState;

  const groups = useMemo(() => {
    if (!activeStructure?.groups) {
      return [];
    }
    return activeStructure.groups;
  }, [activeStructure]);

  const qualifierSummary = activeStructure?.knockout?.entrants
    ? `${activeStructure.knockout.entrants} mögliche KO-Teilnehmer`
    : 'Keine KO-Runde konfiguriert';

  if (structureLoading) {
    return (
      <PanelCard title="Turnierdetails" description={`Struktur wird geladen für ${tournament.name}...`}>
        <p style={{ margin: 0 }}>Bitte warten...</p>
      </PanelCard>
    );
  }

  if (structureError) {
    return (
      <PanelCard title="Turnierdetails" description={`Aktuelle Struktur von ${tournament.name}`}>
        <p style={{ margin: 0, color: 'var(--warning)' }}>{structureError}</p>
        <div>
          <button type="button" onClick={handleTournamentStructureRefresh}>
            Erneut versuchen
          </button>
        </div>
      </PanelCard>
    );
  }

  if (!activeStructure) {
    return (
      <PanelCard title="Turnierdetails" description={`Aktuelle Struktur von ${tournament.name}`}>
        <p style={{ margin: 0 }}>
          Noch keine Struktur verfügbar. Bitte aktualisiere das Turnier oder lade die Struktur neu.
        </p>
        <div>
          <button type="button" onClick={handleTournamentStructureRefresh}>
            Struktur laden
          </button>
        </div>
      </PanelCard>
    );
  }

  return (
    <PanelCard
      title={`Turnierstruktur – ${tournament.name}`}
      description={qualifierSummary}
      action={
        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
          <button type="button" onClick={handleTournamentStructureRefresh}>
            Neu laden
          </button>
          <button
            type="button"
            onClick={handleTournamentAssignmentsSave}
            disabled={!hasTournamentChanges || structureSaving}
          >
            {structureSaving ? 'Speichere...' : 'Änderungen sichern'}
          </button>
          <button type="button" onClick={handleResetAllSlots}>
            Zurücksetzen
          </button>
        </div>
      }
    >
      {groups.length === 0 ? (
        <p style={{ margin: 0 }}>Noch keine Gruppen/Slots definiert.</p>
      ) : (
        <div style={{ display: 'grid', gap: '1.25rem' }}>
          {groups.map((group) => (
            <section
              key={group.label ?? group.id}
              style={{
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(8,20,35,0.45)',
                padding: '1rem 1.2rem',
                display: 'grid',
                gap: '0.8rem'
              }}
            >
              <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong>{group.label || `Gruppe ${group.id ?? ''}`}</strong>
                <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>
                  {group.slots?.length ?? 0} Slots
                </span>
              </header>

              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {group.slots.map((slot) => {
                  const key = String(slot.slotNumber);
                  const assignment = slotAssignments[key] ?? {
                    name: `Team ${slot.slotNumber}`,
                    placeholder: `Team ${slot.slotNumber}`,
                    teamId: ''
                  };
                  const initial = slotInitialAssignments[key] ?? assignment;
                  const hasChanges =
                    (assignment.name ?? '').trim() !== (initial.name ?? '').trim() ||
                    (assignment.teamId ?? '') !== (initial.teamId ?? '');

                  return (
                    <div
                      key={key}
                      style={{
                        display: 'grid',
                        gap: '0.65rem',
                        padding: '0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        border: hasChanges ? '1px solid var(--accent)' : '1px solid rgba(255,255,255,0.08)',
                        background: 'rgba(12, 28, 48, 0.6)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600 }}>Slot {slot.slotNumber}</span>
                        <button type="button" onClick={() => handleSlotReset(slot.slotNumber)}>
                          Zurücksetzen
                        </button>
                      </div>
                      <label style={{ display: 'grid', gap: '0.3rem' }}>
                        Platzhalter / Name
                        <input
                          value={assignment.name}
                          onChange={(event) => handleSlotNameChange(slot.slotNumber, event.target.value)}
                          placeholder={assignment.placeholder}
                        />
                      </label>
                      <label style={{ display: 'grid', gap: '0.3rem' }}>
                        Team zuweisen
                        <select
                          value={assignment.teamId ?? ''}
                          onChange={(event) => handleSlotTeamSelect(slot.slotNumber, event.target.value)}
                        >
                          <option value="">Kein fixes Team</option>
                          {teams.map((team) => (
                            <option key={team.id} value={team.id}>
                              {team.name}
                              {teamNameById.get(String(team.id)) ? '' : ''}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </PanelCard>
  );
}
