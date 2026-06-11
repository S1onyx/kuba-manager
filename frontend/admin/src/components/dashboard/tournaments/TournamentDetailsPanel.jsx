import { useCallback, useEffect, useMemo, useState } from 'react';
import PanelCard from '../../common/PanelCard.jsx';
import { useDashboard } from '../../../context/DashboardContext.jsx';
import { fetchRegistrations, updateRegistrationStatus, activateTournament, setRegistrationClosed } from '../../../utils/api.js';

export default function TournamentDetailsPanel({
  tournament,
  structureState,
  teams
}) {
  const { tournaments: { handlePosterUpload, loadTournaments } } = useDashboard();
  const [posterFile, setPosterFile] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [regLoading, setRegLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  const [activating, setActivating] = useState(false);
  const [showActivateForm, setShowActivateForm] = useState(false);
  const [activateGroupCount, setActivateGroupCount] = useState('1');
  const [activateKoRounds, setActivateKoRounds] = useState('0');
  const [activateTeams, setActivateTeams] = useState([]);
  const [statusChanging, setStatusChanging] = useState(null);
  const [statusError, setStatusError] = useState('');
  const [closingReg, setClosingReg] = useState(false);

  const loadRegistrations = useCallback(() => {
    setRegLoading(true);
    fetchRegistrations(tournament.id)
      .then(setRegistrations)
      .catch(() => {})
      .finally(() => setRegLoading(false));
  }, [tournament.id]);

  useEffect(() => {
    if (tournament.status === 'planned') loadRegistrations();
  }, [tournament.id, tournament.status, loadRegistrations]);

  const handleStatusChange = async (regId, status) => {
    setStatusChanging(regId);
    setStatusError('');
    try {
      await updateRegistrationStatus(tournament.id, regId, status);
      await loadRegistrations();
    } catch (err) {
      setStatusError(err.message || 'Status konnte nicht geändert werden.');
    } finally {
      setStatusChanging(null);
    }
  };

  const handleToggleRegistrationClosed = async () => {
    setClosingReg(true);
    try {
      await setRegistrationClosed(tournament.id, !tournament.registration_closed);
      loadTournaments();
    } catch (err) {
      alert(err.message || 'Fehler beim Ändern des Anmeldestatus.');
    } finally {
      setClosingReg(false);
    }
  };

  const openActivateForm = () => {
    const confirmed = registrations
      .filter((r) => r.status === 'confirmed')
      .map((r, i) => ({ slot_number: i + 1, team_id: r.teamId, name: r.teamName }));
    setActivateTeams(confirmed.length > 0 ? confirmed : [{ slot_number: 1, team_id: null, name: '' }]);
    setActivateGroupCount(String(tournament.group_count || 1));
    setActivateKoRounds(String(tournament.knockout_rounds || 0));
    setShowActivateForm(true);
  };

  const addActivateTeamSlot = () => {
    setActivateTeams((prev) => [...prev, { slot_number: prev.length + 1, team_id: null, name: '' }]);
  };

  const removeActivateTeamSlot = (idx) => {
    setActivateTeams((prev) => prev.filter((_, i) => i !== idx).map((t, i) => ({ ...t, slot_number: i + 1 })));
  };

  const updateActivateTeam = (idx, field, value) => {
    setActivateTeams((prev) => prev.map((t, i) => i === idx ? { ...t, [field]: value } : t));
  };

  const handleActivate = async () => {
    setActivating(true);
    try {
      await activateTournament(tournament.id, {
        group_count: Number(activateGroupCount),
        knockout_rounds: Number(activateKoRounds),
        teams: activateTeams.filter((t) => t.name.trim())
      });
      setShowActivateForm(false);
      loadTournaments();
    } catch (err) {
      alert(err.message || 'Aktivierung fehlgeschlagen.');
    } finally {
      setActivating(false);
    }
  };

  const handlePosterFileSelect = (event) => {
    setPosterFile(event.target.files[0] ?? null);
  };

  const handlePosterUploadClick = () => {
    if (posterFile) {
      handlePosterUpload(tournament.id, posterFile);
      setPosterFile(null);
    }
  };

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

  if (tournament.status === 'planned' || tournament.status === 'active') {
    const statusLabel = { pending: 'Ausstehend', confirmed: 'Bestätigt', rejected: 'Abgelehnt' };
    const statusColor = { pending: 'rgba(255,171,64,0.2)', confirmed: 'rgba(64,200,120,0.2)', rejected: 'rgba(255,100,100,0.2)' };

    return (
      <PanelCard title={`Turnierdetails – ${tournament.name}`} description="Geplantes Turnier">
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          {[
            { id: 'info', label: 'Info & Plakat' },
            { id: 'registrations', label: `Anmeldungen${registrations.length > 0 ? ` (${registrations.length})` : ''}` },
            ...(tournament.status === 'active' ? [{ id: 'structure', label: 'Turnierstruktur' }] : [])
          ].map((tab) => (
            <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
              style={{ padding: '0.4rem 1rem', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.2)', background: activeTab === tab.id ? 'rgba(86,160,255,0.2)' : 'transparent', color: '#fff', cursor: 'pointer' }}>
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'info' && (
          <div style={{ display: 'grid', gap: '1rem' }}>
            <section style={{ display: 'grid', gap: '0.65rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem' }}>Plakat</h3>
              {tournament.poster_url ? (
                <img src={tournament.poster_url} alt="Aktuelles Plakat" style={{ maxWidth: '100%', maxHeight: '240px', objectFit: 'contain', borderRadius: '8px', background: 'rgba(0,0,0,0.3)' }} />
              ) : (
                <p style={{ margin: 0, opacity: 0.6 }}>Noch kein Plakat hochgeladen.</p>
              )}
              <input type="file" accept="image/*" onChange={handlePosterFileSelect} />
              {posterFile && <p style={{ margin: 0, opacity: 0.7, fontSize: '0.85rem' }}>Ausgewählt: {posterFile.name}</p>}
              <div><button type="button" onClick={handlePosterUploadClick} disabled={!posterFile}>{tournament.poster_url ? 'Plakat ersetzen' : 'Hochladen'}</button></div>
            </section>

            {[
              ['Ablauf & Zeiten', 'schedule_info'],
              ['Anreise', 'travel_info'],
            ].map(([label, field]) => tournament[field] && (
              <section key={field}>
                <h3 style={{ margin: '0 0 0.4rem', fontSize: '0.85rem', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</h3>
                <p style={{ margin: 0, opacity: 0.85, whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>{tournament[field]}</p>
              </section>
            ))}
            {tournament.contact_email && (
              <section>
                <h3 style={{ margin: '0 0 0.4rem', fontSize: '0.85rem', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Kontakt</h3>
                <a href={`mailto:${tournament.contact_email}`} style={{ color: '#7cb9ff' }}>{tournament.contact_email}</a>
              </section>
            )}
            {tournament.registration_deadline && (
              <section>
                <h3 style={{ margin: '0 0 0.4rem', fontSize: '0.85rem', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Anmeldefrist</h3>
                <p style={{ margin: 0, opacity: 0.85 }}>{new Date(tournament.registration_deadline).toLocaleDateString('de-DE')}</p>
              </section>
            )}
          </div>
        )}

        {activeTab === 'registrations' && (
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleToggleRegistrationClosed}
                disabled={closingReg}
                style={{ padding: '0.4rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: tournament.registration_closed ? 'rgba(64,200,120,0.2)' : 'rgba(255,100,100,0.15)', color: '#fff', fontSize: '0.85rem', cursor: closingReg ? 'not-allowed' : 'pointer', fontWeight: 600 }}
              >
                {closingReg ? '...' : tournament.registration_closed ? '🔓 Anmeldung öffnen' : '🔒 Anmeldung schließen'}
              </button>
            </div>
            {statusError && <p style={{ margin: 0, color: '#ffb0b0', fontSize: '0.85rem' }}>{statusError}</p>}
            {!showActivateForm && (
              <button
                type="button"
                onClick={openActivateForm}
                style={{ padding: '0.55rem 1.25rem', borderRadius: '8px', border: 'none', background: 'rgba(64,200,120,0.25)', color: '#7dffb3', fontWeight: 600, cursor: 'pointer', justifySelf: 'start' }}
              >
                🚀 Turnier aktivieren
              </button>
            )}

            {showActivateForm && (
              <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '1.25rem', display: 'grid', gap: '1rem', border: '1px solid rgba(64,200,120,0.2)' }}>
                <h3 style={{ margin: 0, fontSize: '1rem' }}>Turnier-Konfiguration</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <label style={{ display: 'grid', gap: '0.3rem', fontSize: '0.875rem' }}>
                    Gruppen
                    <input type="number" min="1" value={activateGroupCount} onChange={(e) => setActivateGroupCount(e.target.value)}
                      style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: '#fff' }} />
                  </label>
                  <label style={{ display: 'grid', gap: '0.3rem', fontSize: '0.875rem' }}>
                    KO-Runden
                    <input type="number" min="0" value={activateKoRounds} onChange={(e) => setActivateKoRounds(e.target.value)}
                      style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: '#fff' }} />
                  </label>
                </div>

                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  <p style={{ margin: 0, fontSize: '0.875rem', opacity: 0.7 }}>Teams ({activateTeams.length})</p>
                  {activateTeams.map((t, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', opacity: 0.5, minWidth: '20px' }}>{idx + 1}.</span>
                      <input
                        value={t.name}
                        onChange={(e) => updateActivateTeam(idx, 'name', e.target.value)}
                        placeholder="Teamname"
                        style={{ padding: '0.45rem 0.6rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.15)', background: t.team_id ? 'rgba(64,200,120,0.08)' : 'rgba(255,255,255,0.06)', color: '#fff', fontSize: '0.875rem' }}
                      />
                      <button type="button" onClick={() => removeActivateTeamSlot(idx)}
                        style={{ padding: '0.3rem 0.5rem', borderRadius: '6px', border: '1px solid rgba(255,100,100,0.3)', background: 'transparent', color: 'rgba(255,100,100,0.8)', cursor: 'pointer', fontSize: '0.8rem' }}>
                        ✕
                      </button>
                    </div>
                  ))}
                  <button type="button" onClick={addActivateTeamSlot}
                    style={{ padding: '0.4rem', borderRadius: '6px', border: '1px dashed rgba(255,255,255,0.2)', background: 'transparent', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '0.85rem' }}>
                    + Team hinzufügen
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="button" onClick={handleActivate} disabled={activating}
                    style={{ padding: '0.55rem 1.25rem', borderRadius: '8px', border: 'none', background: activating ? 'rgba(64,200,120,0.15)' : 'rgba(64,200,120,0.4)', color: '#7dffb3', fontWeight: 600, cursor: activating ? 'not-allowed' : 'pointer' }}>
                    {activating ? 'Wird aktiviert...' : '🚀 Jetzt aktivieren'}
                  </button>
                  <button type="button" onClick={() => setShowActivateForm(false)}
                    style={{ padding: '0.55rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'transparent', color: '#fff', cursor: 'pointer' }}>
                    Abbrechen
                  </button>
                </div>
              </div>
            )}
            {regLoading && <p style={{ margin: 0, opacity: 0.6 }}>Lade Anmeldungen...</p>}
            {!regLoading && registrations.length === 0 && <p style={{ margin: 0, opacity: 0.6 }}>Noch keine Anmeldungen.</p>}
            {registrations.map((reg) => (
              <div key={reg.id} style={{ background: 'rgba(0,0,0,0.25)', borderRadius: '10px', padding: '1rem', display: 'grid', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <strong>{reg.teamName}</strong>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    {['pending', 'confirmed', 'rejected'].map((s) => (
                      <button
                        key={s}
                        type="button"
                        disabled={statusChanging === reg.id}
                        onClick={() => handleStatusChange(reg.id, s)}
                        style={{ padding: '0.25rem 0.7rem', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.15)', background: reg.status === s ? statusColor[s] : 'transparent', color: '#fff', fontSize: '0.8rem', cursor: statusChanging === reg.id ? 'not-allowed' : 'pointer', opacity: statusChanging === reg.id && reg.status !== s ? 0.5 : 1, fontWeight: reg.status === s ? 600 : 400 }}
                      >
                        {statusChanging === reg.id && reg.status === s ? '...' : statusLabel[s]}
                      </button>
                    ))}
                  </div>
                </div>
                <p style={{ margin: 0, opacity: 0.7, fontSize: '0.85rem' }}>{reg.contactName} · <a href={`mailto:${reg.contactEmail}`} style={{ color: '#7cb9ff' }}>{reg.contactEmail}</a></p>
                <p style={{ margin: 0, opacity: 0.65, fontSize: '0.8rem' }}>
                  {reg.players.map((p) => `${p.name}${p.jerseyNumber ? ` #${p.jerseyNumber}` : ''}`).join(', ')}
                </p>
                {reg.audioFiles?.length > 0 && (
                  <p style={{ margin: 0, opacity: 0.6, fontSize: '0.8rem' }}>
                    Audio: {reg.audioFiles.map((f) => f.originalName).join(', ')}
                  </p>
                )}
                {reg.audioNotes && <p style={{ margin: 0, opacity: 0.6, fontSize: '0.8rem', fontStyle: 'italic' }}>{reg.audioNotes}</p>}
                <p style={{ margin: 0, opacity: 0.4, fontSize: '0.75rem' }}>{new Date(reg.createdAt).toLocaleString('de-DE')}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'structure' && tournament.status === 'active' && (
          <StructureContent
            groups={groups}
            slotAssignments={slotAssignments}
            slotInitialAssignments={slotInitialAssignments}
            structureSaving={structureSaving}
            hasTournamentChanges={hasTournamentChanges}
            handleSlotNameChange={handleSlotNameChange}
            handleSlotTeamSelect={handleSlotTeamSelect}
            handleSlotReset={handleSlotReset}
            handleResetAllSlots={handleResetAllSlots}
            handleTournamentAssignmentsSave={handleTournamentAssignmentsSave}
            handleTournamentStructureRefresh={handleTournamentStructureRefresh}
            teams={teams}
            teamNameById={teamNameById}
            qualifierSummary={qualifierSummary}
          />
        )}
      </PanelCard>
    );
  }

  // Fallback for any other status (completed etc.)
  return (
    <PanelCard title={`Turnierdetails – ${tournament.name}`} description={qualifierSummary}>
      <StructureContent
        groups={groups}
        slotAssignments={slotAssignments}
        slotInitialAssignments={slotInitialAssignments}
        structureSaving={structureSaving}
        hasTournamentChanges={hasTournamentChanges}
        handleSlotNameChange={handleSlotNameChange}
        handleSlotTeamSelect={handleSlotTeamSelect}
        handleSlotReset={handleSlotReset}
        handleResetAllSlots={handleResetAllSlots}
        handleTournamentAssignmentsSave={handleTournamentAssignmentsSave}
        handleTournamentStructureRefresh={handleTournamentStructureRefresh}
        teams={teams}
        teamNameById={teamNameById}
        qualifierSummary={qualifierSummary}
      />
    </PanelCard>
  );
}

function StructureContent({ groups, slotAssignments, slotInitialAssignments, structureSaving, hasTournamentChanges, handleSlotNameChange, handleSlotTeamSelect, handleSlotReset, handleResetAllSlots, handleTournamentAssignmentsSave, handleTournamentStructureRefresh, teams, teamNameById }) {
  return (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
        <button type="button" onClick={handleTournamentStructureRefresh}>Neu laden</button>
        <button type="button" onClick={handleTournamentAssignmentsSave} disabled={!hasTournamentChanges || structureSaving}>
          {structureSaving ? 'Speichere...' : 'Änderungen sichern'}
        </button>
        <button type="button" onClick={handleResetAllSlots}>Zurücksetzen</button>
      </div>
      {groups.length === 0 ? (
        <p style={{ margin: 0 }}>Noch keine Gruppen/Slots definiert.</p>
      ) : (
        <div style={{ display: 'grid', gap: '1.25rem' }}>
          {groups.map((group) => (
            <section key={group.label ?? group.id} style={{ borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(8,20,35,0.45)', padding: '1rem 1.2rem', display: 'grid', gap: '0.8rem' }}>
              <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong>{group.label || `Gruppe ${group.id ?? ''}`}</strong>
                <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>{group.slots?.length ?? 0} Slots</span>
              </header>
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {group.slots.map((slot) => {
                  const key = String(slot.slotNumber);
                  const assignment = slotAssignments[key] ?? { name: `Team ${slot.slotNumber}`, placeholder: `Team ${slot.slotNumber}`, teamId: '' };
                  const initial = slotInitialAssignments[key] ?? assignment;
                  const hasChanges = (assignment.name ?? '').trim() !== (initial.name ?? '').trim() || (assignment.teamId ?? '') !== (initial.teamId ?? '');
                  return (
                    <div key={key} style={{ display: 'grid', gap: '0.65rem', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: hasChanges ? '1px solid var(--accent)' : '1px solid rgba(255,255,255,0.08)', background: 'rgba(12,28,48,0.6)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600 }}>Slot {slot.slotNumber}</span>
                        <button type="button" onClick={() => handleSlotReset(slot.slotNumber)}>Zurücksetzen</button>
                      </div>
                      <label style={{ display: 'grid', gap: '0.3rem' }}>
                        Platzhalter / Name
                        <input value={assignment.name} onChange={(e) => handleSlotNameChange(slot.slotNumber, e.target.value)} placeholder={assignment.placeholder} />
                      </label>
                      <label style={{ display: 'grid', gap: '0.3rem' }}>
                        Team zuweisen
                        <select value={assignment.teamId ?? ''} onChange={(e) => handleSlotTeamSelect(slot.slotNumber, e.target.value)}>
                          <option value="">Kein fixes Team</option>
                          {teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
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
    </div>
  );
}
