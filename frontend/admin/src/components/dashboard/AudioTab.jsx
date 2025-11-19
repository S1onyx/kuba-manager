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
    <div style={{ display: 'grid', gap: '1.75rem' }} className="audio-tab">
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
          <div className="audio-trigger-list">
            {audioTriggers.map((trigger) => {
              const busy = Boolean(audioTriggerBusy[trigger.key] || audioUploadBusy[trigger.key]);
              const currentFile = trigger.file;
              return (
                <article key={trigger.key} className="audio-trigger-card">
                  <div className="audio-trigger-card__header">
                    <div className="audio-trigger-card__headerText">
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
                      className={`audio-trigger-card__toggle${trigger.is_active ? ' audio-trigger-card__toggle--active' : ''}`}
                    >
                      {trigger.is_active ? 'Aktiv' : 'Stumm'}
                    </button>
                  </div>

                  {currentFile ? (
                    <div className="audio-trigger-card__current">
                      <span>
                        Aktueller Sound: <strong>{describeAudioFile(currentFile)}</strong>
                      </span>
                      <div className="audio-trigger-card__currentButtons">
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

                  <div className="audio-trigger-card__inputs">
                    <label className="audio-trigger-card__field">
                      Label (optional)
                      <input
                        value={audioTriggerLabels[trigger.key] ?? ''}
                        onChange={(event) => handleAudioTriggerLabelChange(trigger.key, event.target.value)}
                        placeholder="z. B. Fanfare"
                        disabled={audioUploadBusy[trigger.key]}
                      />
                    </label>
                    <label className="audio-trigger-card__upload">
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
                    <label className="audio-trigger-card__field">
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
          className="audio-library-form"
        >
          <label className="audio-library-form__field">
            Label (optional)
            <input
              value={audioLibraryUploadLabel}
              onChange={(event) => setAudioLibraryUploadLabel(event.target.value)}
              placeholder="z. B. Intro Musik"
            />
          </label>
          <label className="audio-library-form__upload">
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
                <article key={file.id} className="audio-library-item">
                  <div className="audio-library-item__info">
                    <strong>{describeAudioFile(file)}</strong>
                    <span style={{ fontSize: '0.82rem', opacity: 0.65 }}>{file.original_name}</span>
                  </div>
                  <div className="audio-library-item__actions">
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
