import PanelCard from '../common/PanelCard.jsx';
import { useDashboard } from '../../context/DashboardContext.jsx';

export default function AudioTab() {
  const {
    audio: {
      audioTriggers,
      audioLibrary,
      audioLoading,
      audioError,
      audioTriggerBusy,
      audioUploadBusy,
      audioManualBusy,
      audioTriggerLabels,
      audioLibraryUploadLabel,
      setAudioLibraryUploadLabel,
      handleAudioTriggerLabelChange,
      handleAudioTriggerToggle,
      handleAudioTriggerUpload,
      handleAudioTriggerAssign,
      handleAudioTriggerClear,
      handleAudioTriggerPreview,
      handleAudioLibraryUpload,
      handleAudioLibraryDelete,
      handleAudioLibraryPlay,
      describeAudioFile
    }
  } = useDashboard();

  return (
    <div style={{ display: 'grid', gap: '1.75rem' }}>
      <PanelCard
        title="Audio-Steuerung"
        description="Wähle Sounds für Spielereignisse oder löse Audios manuell aus – ideal für Moderation und Hallen-Atmosphäre."
      >
        {audioError ? <p style={{ margin: 0, color: 'var(--warning)' }}>{audioError}</p> : null}
        {audioLoading ? <p style={{ margin: 0 }}>Audiodaten werden geladen...</p> : null}
      </PanelCard>

      <PanelCard
        title="Spielereignis-Sounds"
        description="Ordne jedem Ereignis passende Sounds zu, teste sie oder schalte Trigger schnell ab."
      >
        {audioTriggers.length === 0 ? (
          <p style={{ margin: 0, opacity: 0.7 }}>Noch keine Audio-Trigger konfiguriert.</p>
        ) : (
          <div style={{ display: 'grid', gap: '1.1rem' }}>
            {audioTriggers.map((trigger) => {
              const busy = Boolean(audioTriggerBusy[trigger.key] || audioUploadBusy[trigger.key]);
              const currentFile = trigger.file;
              return (
                <article
                  key={trigger.key}
                  style={{
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    padding: '1rem 1.2rem',
                    background: 'rgba(8, 20, 35, 0.55)',
                    display: 'grid',
                    gap: '0.75rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'grid', gap: '0.25rem' }}>
                      <strong>{trigger.label}</strong>
                      {trigger.description ? (
                        <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                          {trigger.description}
                        </span>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAudioTriggerToggle(trigger.key, !trigger.is_active)}
                      disabled={busy}
                      style={{
                        padding: '0.45rem 1.1rem',
                        borderRadius: '999px',
                        background: trigger.is_active ? 'var(--accent)' : 'rgba(8, 20, 35, 0.65)',
                        color: trigger.is_active ? '#041022' : 'var(--text-secondary)'
                      }}
                    >
                      {trigger.is_active ? 'Aktiv' : 'Stumm'}
                    </button>
                  </div>

                  {currentFile ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.9rem' }}>
                        Aktueller Sound: <strong>{describeAudioFile(currentFile)}</strong>
                      </span>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={() => handleAudioTriggerPreview(trigger.key)}
                          disabled={busy}
                        >
                          Abspielen
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAudioTriggerClear(trigger.key)}
                          disabled={busy}
                        >
                          Zuordnung entfernen
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.7 }}>Keine Audiodatei zugewiesen.</p>
                  )}

                  <div style={{ display: 'grid', gap: '0.65rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                    <label style={{ display: 'grid', gap: '0.3rem' }}>
                      Label (optional)
                      <input
                        value={audioTriggerLabels[trigger.key] ?? ''}
                        onChange={(event) => handleAudioTriggerLabelChange(trigger.key, event.target.value)}
                        placeholder="z. B. Fanfare"
                        disabled={audioUploadBusy[trigger.key]}
                      />
                    </label>
                    <label
                      style={{
                        display: 'grid',
                        gap: '0.3rem',
                        border: '1px dashed rgba(255,255,255,0.14)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.75rem'
                      }}
                    >
                      Neue Datei hochladen
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) {
                            handleAudioTriggerUpload(trigger.key, file);
                            event.target.value = '';
                          }
                        }}
                        disabled={busy}
                      />
                    </label>
                    <label style={{ display: 'grid', gap: '0.3rem' }}>
                      Aus Bibliothek wählen
                      <select
                        value={currentFile?.id ?? ''}
                        onChange={(event) => handleAudioTriggerAssign(trigger.key, event.target.value)}
                        disabled={busy}
                      >
                        <option value="">Keine Auswahl</option>
                        {audioLibrary.map((file) => (
                          <option key={file.id} value={file.id}>
                            {describeAudioFile(file)}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </PanelCard>

      <PanelCard
        title="Audio-Bibliothek"
        description="Verwalte alle verfügbaren Audiodateien und starte Sounds manuell."
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
          }}
          style={{ display: 'flex', flexWrap: 'wrap', gap: '0.85rem', alignItems: 'center', marginBottom: '1rem' }}
        >
          <label style={{ display: 'grid', gap: '0.3rem', minWidth: '220px' }}>
            Label (optional)
            <input
              value={audioLibraryUploadLabel}
              onChange={(event) => setAudioLibraryUploadLabel(event.target.value)}
              placeholder="z. B. Intro Musik"
            />
          </label>
          <label
            style={{
              display: 'grid',
              gap: '0.3rem',
              border: '1px dashed rgba(255,255,255,0.14)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.75rem'
            }}
          >
            Datei hochladen
            <input
              type="file"
              accept="audio/*"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  handleAudioLibraryUpload(file);
                  event.target.value = '';
                }
              }}
            />
          </label>
        </form>

        {audioLibrary.length === 0 ? (
          <p style={{ margin: 0, opacity: 0.7 }}>Noch keine Audiodateien vorhanden.</p>
        ) : (
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {audioLibrary.map((file) => {
              const busy = Boolean(audioManualBusy[file.id]);
              return (
                <article
                  key={file.id}
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(8,20,35,0.45)'
                  }}
                >
                  <div style={{ display: 'grid', gap: '0.2rem' }}>
                    <strong>{describeAudioFile(file)}</strong>
                    <span style={{ fontSize: '0.82rem', opacity: 0.65 }}>{file.original_name}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => handleAudioLibraryPlay(file.id)}
                      disabled={busy}
                    >
                      Abspielen
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAudioLibraryDelete(file.id)}
                      disabled={busy}
                      style={{ background: 'rgba(211,47,47,0.85)', color: '#fff' }}
                    >
                      Löschen
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </PanelCard>
    </div>
  );
}
