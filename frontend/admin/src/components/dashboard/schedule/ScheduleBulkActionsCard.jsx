import { useMemo, useState } from 'react';
import PanelCard from '../../common/PanelCard.jsx';
import { useDashboard } from '../../../context/DashboardContext.jsx';

const PHASE_OPTIONS = [
  { value: 'all', label: 'Alle Phasen' },
  { value: 'group', label: 'Gruppenphase' },
  { value: 'knockout', label: 'KO-Phase' },
  { value: 'placement', label: 'Platzierung' }
];

export default function ScheduleBulkActionsCard() {
  const {
    matchContext: { resolvedTournamentId },
    schedule: {
      scheduleChronological,
      scheduleLoading,
      scheduleError,
      handleScheduleApplyDate,
      handleScheduleAutoPlan,
      handleScheduleBulkPersist,
      bulkSaving
    }
  } = useDashboard();

  const [bulkDate, setBulkDate] = useState('');
  const [bulkDatePhase, setBulkDatePhase] = useState('all');
  const [autoStart, setAutoStart] = useState('');
  const [autoInterval, setAutoInterval] = useState('12');
  const [autoBreakAfter, setAutoBreakAfter] = useState('');
  const [autoBreakDuration, setAutoBreakDuration] = useState('5');
  const [autoPhase, setAutoPhase] = useState('all');
  const [autoSkipCompleted, setAutoSkipCompleted] = useState(true);
  const [autoOnlyEmpty, setAutoOnlyEmpty] = useState(false);
  const [bulkSavePhase, setBulkSavePhase] = useState('all');

  const stats = useMemo(() => {
    const total = scheduleChronological?.length ?? 0;
    const scheduled = scheduleChronological?.reduce((count, entry) => count + (entry.scheduled_at ? 1 : 0), 0) ?? 0;
    return {
      total,
      scheduled,
      unscheduled: Math.max(0, total - scheduled)
    };
  }, [scheduleChronological]);

  if (!resolvedTournamentId) {
    return (
      <PanelCard title="Spieltermine planen" description="Wähle zunächst ein Turnier aus, um Termine zu bearbeiten.">
        <p style={{ margin: 0, color: 'var(--text-muted)' }}>Kein Turnier ausgewählt.</p>
      </PanelCard>
    );
  }

  if (scheduleLoading) {
    return (
      <PanelCard title="Spieltermine planen" description="Lade Spielplan…">
        <p style={{ margin: 0 }}>Spielplan wird geladen…</p>
      </PanelCard>
    );
  }

  if (scheduleError) {
    return (
      <PanelCard title="Spieltermine planen" description="Lade Spielplan…">
        <p style={{ margin: 0, color: 'var(--warning)' }}>{scheduleError}</p>
      </PanelCard>
    );
  }

  if (!scheduleChronological || scheduleChronological.length === 0) {
    return (
      <PanelCard title="Spieltermine planen" description="Spielplan">
        <p style={{ margin: 0 }}>Noch keine Partien im Spielplan vorhanden.</p>
      </PanelCard>
    );
  }

  return (
    <PanelCard
      title="Spieltermine planen"
      description="Bulk-Aktionen zum Setzen von Datum, Uhrzeit und Speichern des Spielplans."
    >
      <div style={{ display: 'grid', gap: '1.25rem' }}>
        <div
          style={{
            display: 'grid',
            gap: '0.35rem',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            fontSize: '0.9rem',
            padding: '0.85rem 1rem',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(12, 28, 48, 0.55)'
          }}
        >
          <span>Gesamtspiele: {stats.total}</span>
          <span>Geplant: {stats.scheduled}</span>
          <span>Offen: {stats.unscheduled}</span>
        </div>

        <section style={{ display: 'grid', gap: '0.75rem' }}>
          <header>
            <h3 style={{ margin: 0, fontSize: '1rem', letterSpacing: '0.04em' }}>Datum für alle Spiele</h3>
            <p style={{ margin: 0, opacity: 0.75 }}>Setzt lediglich das Datum – Uhrzeiten bleiben erhalten.</p>
          </header>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              handleScheduleApplyDate({ date: bulkDate, phase: bulkDatePhase });
            }}
            style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}
          >
            <label style={{ display: 'grid', gap: '0.3rem' }}>
              Datum
              <input type="date" value={bulkDate} onChange={(event) => setBulkDate(event.target.value)} required />
            </label>
            <label style={{ display: 'grid', gap: '0.3rem' }}>
              Phase
              <select value={bulkDatePhase} onChange={(event) => setBulkDatePhase(event.target.value)}>
                {PHASE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit">Datum anwenden</button>
          </form>
        </section>

        <section style={{ display: 'grid', gap: '0.75rem' }}>
          <header>
            <h3 style={{ margin: 0, fontSize: '1rem', letterSpacing: '0.04em' }}>Auto-Planer</h3>
            <p style={{ margin: 0, opacity: 0.75 }}>
              Vergibt Startzeiten automatisch – perfekt für feste Intervalle (z. B. alle 12 Minuten).
            </p>
          </header>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              handleScheduleAutoPlan({
                start: autoStart,
                intervalMinutes: autoInterval,
                breakAfter: autoBreakAfter,
                breakMinutes: autoBreakDuration,
                phase: autoPhase,
                skipCompleted: autoSkipCompleted,
                onlyEmpty: autoOnlyEmpty
              });
            }}
            style={{ display: 'grid', gap: '0.75rem' }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              <label style={{ display: 'grid', gap: '0.3rem' }}>
                Startzeitpunkt
                <input
                  type="datetime-local"
                  value={autoStart}
                  onChange={(event) => setAutoStart(event.target.value)}
                  required
                />
              </label>
              <label style={{ display: 'grid', gap: '0.3rem' }}>
                Intervall (Minuten)
                <input
                  type="number"
                  min="1"
                  value={autoInterval}
                  onChange={(event) => setAutoInterval(event.target.value)}
                  required
                />
              </label>
              <label style={{ display: 'grid', gap: '0.3rem' }}>
                Pause nach X Spielen
                <input
                  type="number"
                  min="1"
                  placeholder="optional"
                  value={autoBreakAfter}
                  onChange={(event) => setAutoBreakAfter(event.target.value)}
                />
              </label>
              <label style={{ display: 'grid', gap: '0.3rem' }}>
                Pausenlänge (Minuten)
                <input
                  type="number"
                  min="1"
                  value={autoBreakDuration}
                  onChange={(event) => setAutoBreakDuration(event.target.value)}
                />
              </label>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.9rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <input
                  type="checkbox"
                  checked={autoSkipCompleted}
                  onChange={(event) => setAutoSkipCompleted(event.target.checked)}
                />
                Abgeschlossene Spiele überspringen
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <input
                  type="checkbox"
                  checked={autoOnlyEmpty}
                  onChange={(event) => setAutoOnlyEmpty(event.target.checked)}
                />
                Nur freie Slots füllen
              </label>
              <label style={{ display: 'grid', gap: '0.3rem' }}>
                Phase
                <select value={autoPhase} onChange={(event) => setAutoPhase(event.target.value)}>
                  {PHASE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div>
              <button type="submit">Auto-Plan anwenden</button>
            </div>
          </form>
        </section>

        <section style={{ display: 'grid', gap: '0.75rem' }}>
          <header>
            <h3 style={{ margin: 0, fontSize: '1rem', letterSpacing: '0.04em' }}>Änderungen speichern</h3>
            <p style={{ margin: 0, opacity: 0.75 }}>
              Speichert alle geänderten Termine auf einmal in der Datenbank.
            </p>
          </header>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
            <label style={{ display: 'grid', gap: '0.3rem' }}>
              Phase
              <select value={bulkSavePhase} onChange={(event) => setBulkSavePhase(event.target.value)}>
                {PHASE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() => handleScheduleBulkPersist({ phase: bulkSavePhase })}
              disabled={bulkSaving}
            >
              {bulkSaving ? 'Speichere...' : 'Alle Änderungen speichern'}
            </button>
          </div>
        </section>
      </div>
    </PanelCard>
  );
}
