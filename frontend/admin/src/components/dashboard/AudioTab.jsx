import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import PanelCard from '../common/PanelCard.jsx';
import AudioDuration from '../common/AudioDuration.jsx';
import { useDashboard } from '../../context/DashboardContext.jsx';
import { resolveMediaUrl } from '../../config.js';

export default function AudioTab() {
  const { t } = useTranslation();
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
      timerCueSettings,
      timerCueBusy,
      handleAudioTriggerLabelChange,
      handleAudioTriggerToggle,
      handleAudioTriggerUpload,
      handleAudioTriggerAssign,
      handleAudioTriggerClear,
      handleAudioTriggerPreview,
      handleAudioLibraryUpload,
      handleAudioLibraryDelete,
      handleAudioLibraryPlay,
      handleTimerCueSave,
      describeAudioFile
    }
  } = useDashboard();

  const [warningInput, setWarningInput] = useState('');
  const [countdownInput, setCountdownInput] = useState('');
  const [librarySearch, setLibrarySearch] = useState('');
  const [libraryCategory, setLibraryCategory] = useState('all');
  const [triggerSearch, setTriggerSearch] = useState('');
  const [triggerCategory, setTriggerCategory] = useState('all');
  const warningVal = warningInput !== '' ? warningInput : String(timerCueSettings?.warningSeconds ?? 15);
  const countdownVal = countdownInput !== '' ? countdownInput : String(timerCueSettings?.countdownFrom ?? 5);

  const isKorbhymne = (file) => String(file.label ?? '').startsWith('Korbhymne');
  const [anthemTournament, setAnthemTournament] = useState('all');
  const anthemTournaments = Array.from(
    audioLibrary
      .filter(isKorbhymne)
      .reduce((map, file) => {
        if (file.tournament_id != null && !map.has(file.tournament_id)) {
          map.set(file.tournament_id, file.tournament_name || `Turnier #${file.tournament_id}`);
        }
        return map;
      }, new Map())
  );
  const filteredLibrary = audioLibrary.filter((file) => {
    if (libraryCategory === 'anthems') {
      if (!isKorbhymne(file)) return false;
      if (anthemTournament !== 'all' && file.tournament_id !== Number(anthemTournament)) return false;
    }
    if (libraryCategory === 'other' && isKorbhymne(file)) return false;
    const needle = librarySearch.trim().toLowerCase();
    if (!needle) return true;
    const haystack = `${file.label ?? ''} ${file.original_name ?? ''}`.toLowerCase();
    return haystack.includes(needle);
  });
  const libraryCategories = [
    { id: 'all', label: t('audio.filterAll') },
    { id: 'anthems', label: t('audio.filterAnthems') },
    { id: 'other', label: t('audio.filterOther') }
  ];

  const isTeamScoreTrigger = (trigger) => String(trigger.key ?? '').startsWith('score_team_');
  const filteredTriggers = audioTriggers.filter((trigger) => {
    if (triggerCategory === 'anthems') {
      if (!isTeamScoreTrigger(trigger)) return false;
      if (anthemTournament !== 'all' && trigger.file?.tournament_id !== Number(anthemTournament)) return false;
    }
    if (triggerCategory === 'other' && isTeamScoreTrigger(trigger)) return false;
    const needle = triggerSearch.trim().toLowerCase();
    if (!needle) return true;
    const haystack = `${trigger.label ?? ''} ${trigger.description ?? ''}`.toLowerCase();
    return haystack.includes(needle);
  });

  return (
    <div className="tab-container audio-tab">
      <PanelCard
        title={t('audio.controlTitle')}
        description={t('audio.controlDescription')}
      >
        {audioError ? <p style={{ margin: 0, color: 'var(--warning)' }}>{audioError}</p> : null}
        {audioLoading ? <p style={{ margin: 0 }}>{t('audio.loading')}</p> : null}
      </PanelCard>

      <PanelCard
        title={t('audio.triggersTitle')}
        description={t('audio.triggersDescription')}
      >
        {audioTriggers.length > 0 && (
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="search"
              value={triggerSearch}
              onChange={(event) => setTriggerSearch(event.target.value)}
              placeholder={t('audio.filterTriggersPlaceholder')}
              style={{ flex: 1, minWidth: '180px', padding: '0.45rem 0.7rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: '0.875rem' }}
            />
            {libraryCategories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setTriggerCategory(category.id)}
                style={{ padding: '0.4rem 1rem', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.2)', background: triggerCategory === category.id ? 'rgba(86,160,255,0.2)' : 'transparent', color: '#fff', cursor: 'pointer', fontSize: '0.85rem' }}
              >
                {category.label}
              </button>
            ))}
            {triggerCategory === 'anthems' && anthemTournaments.length > 0 && (
              <select
                value={anthemTournament}
                onChange={(event) => setAnthemTournament(event.target.value)}
                aria-label={t('audio.filterTournament')}
                style={{ padding: '0.4rem 0.7rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: '0.85rem' }}
              >
                <option value="all">{t('audio.filterAllTournaments')}</option>
                {anthemTournaments.map(([id, name]) => (
                  <option key={id} value={String(id)}>{name}</option>
                ))}
              </select>
            )}
          </div>
        )}

      {audioTriggers.length === 0 ? (
          <p style={{ margin: 0, opacity: 0.7 }}>{t('audio.noTriggers')}</p>
        ) : filteredTriggers.length === 0 ? (
          <p style={{ margin: 0, opacity: 0.7 }}>{t('audio.noFilterResults')}</p>
        ) : (
          <div className="audio-trigger-list">
            {filteredTriggers.map((trigger) => {
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
                      {trigger.is_active ? t('audio.active') : t('audio.muted')}
                    </button>
                  </div>

                  {currentFile ? (
                    <div className="audio-trigger-card__current">
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                        {t('audio.currentSound')} <strong>{describeAudioFile(currentFile)}</strong>
                        <AudioDuration fileName={currentFile.file_name} />
                      </span>
                      <div className="audio-trigger-card__currentButtons">
                        <button
                          type="button"
                          onClick={() => handleAudioTriggerPreview(trigger.key)}
                          disabled={busy}
                        >
                          {t('audio.play')}
                        </button>
                        <a
                          href={resolveMediaUrl(`/api/audio/library/${currentFile.id}/download`)}
                          className="audio-library-item__download"
                        >
                          {t('common.download')}
                        </a>
                        <button
                          type="button"
                          onClick={() => handleAudioTriggerClear(trigger.key)}
                          disabled={busy}
                        >
                          {t('audio.clearAssignment')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.7 }}>{t('audio.noFile')}</p>
                  )}

                  <div className="audio-trigger-card__inputs">
                    <label className="audio-trigger-card__field">
                      {t('audio.labelOptional')}
                      <input
                        value={audioTriggerLabels[trigger.key] ?? ''}
                        onChange={(event) => handleAudioTriggerLabelChange(trigger.key, event.target.value)}
                        placeholder={t('audio.labelPlaceholder')}
                        disabled={audioUploadBusy[trigger.key]}
                      />
                    </label>
                    <label className="audio-trigger-card__upload">
                      {t('audio.uploadNew')}
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
                      {t('audio.chooseFromLibrary')}
                      <select
                        value={currentFile?.id ?? ''}
                        onChange={(event) => handleAudioTriggerAssign(trigger.key, event.target.value)}
                        disabled={busy}
                      >
                        <option value="">{t('audio.noSelection')}</option>
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
        title={t('audio.timerTitle')}
        description={t('audio.timerDescription')}
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            handleTimerCueSave({
              warningSeconds: Number(warningVal),
              countdownFrom: Number(countdownVal)
            });
            setWarningInput('');
            setCountdownInput('');
          }}
          style={{ display: 'grid', gap: '1rem' }}
        >
          <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.9rem' }}>
            {t('audio.warningLabel')}
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="number"
                min="0"
                max="600"
                value={warningVal}
                onChange={(e) => setWarningInput(e.target.value)}
                style={{ width: '5rem' }}
                disabled={timerCueBusy}
              />
              <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>{t('audio.warningHint')}</span>
            </div>
          </label>
          <label style={{ display: 'grid', gap: '0.35rem', fontSize: '0.9rem' }}>
            {t('audio.countdownLabel')}
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="number"
                min="0"
                max="60"
                value={countdownVal}
                onChange={(e) => setCountdownInput(e.target.value)}
                style={{ width: '5rem' }}
                disabled={timerCueBusy}
              />
              <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>{t('audio.countdownHint')}</span>
            </div>
          </label>
          <button type="submit" disabled={timerCueBusy} style={{ alignSelf: 'start' }}>
            {timerCueBusy ? t('common.saving') : t('common.save')}
          </button>
        </form>
      </PanelCard>

      <PanelCard
        title={t('audio.libraryTitle')}
        description={t('audio.libraryDescription')}
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
          }}
          className="audio-library-form"
        >
          <label className="audio-library-form__field">
            {t('audio.labelOptional')}
            <input
              value={audioLibraryUploadLabel}
              onChange={(event) => setAudioLibraryUploadLabel(event.target.value)}
              placeholder={t('audio.libraryLabelPlaceholder')}
            />
          </label>
          <label className="audio-library-form__upload">
            {t('audio.uploadFile')}
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

        {audioLibrary.length > 0 && (
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="search"
              value={librarySearch}
              onChange={(event) => setLibrarySearch(event.target.value)}
              placeholder={t('audio.filterPlaceholder')}
              style={{ flex: 1, minWidth: '180px', padding: '0.45rem 0.7rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: '0.875rem' }}
            />
            {libraryCategories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setLibraryCategory(category.id)}
                style={{ padding: '0.4rem 1rem', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.2)', background: libraryCategory === category.id ? 'rgba(86,160,255,0.2)' : 'transparent', color: '#fff', cursor: 'pointer', fontSize: '0.85rem' }}
              >
                {category.label}
              </button>
            ))}
            {libraryCategory === 'anthems' && anthemTournaments.length > 0 && (
              <select
                value={anthemTournament}
                onChange={(event) => setAnthemTournament(event.target.value)}
                aria-label={t('audio.filterTournament')}
                style={{ padding: '0.4rem 0.7rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: '0.85rem' }}
              >
                <option value="all">{t('audio.filterAllTournaments')}</option>
                {anthemTournaments.map(([id, name]) => (
                  <option key={id} value={String(id)}>{name}</option>
                ))}
              </select>
            )}
          </div>
        )}

        {audioLibrary.length === 0 ? (
          <p style={{ margin: 0, opacity: 0.7 }}>{t('audio.noFiles')}</p>
        ) : filteredLibrary.length === 0 ? (
          <p style={{ margin: 0, opacity: 0.7 }}>{t('audio.noFilterResults')}</p>
        ) : (
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {filteredLibrary.map((file) => {
              const busy = Boolean(audioManualBusy[file.id]);
              return (
                <article key={file.id} className="audio-library-item">
                  <div className="audio-library-item__info">
                    <strong style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                      {describeAudioFile(file)}
                      <AudioDuration fileName={file.file_name} />
                      {file.tournament_name ? (
                        <span style={{ fontSize: '0.75rem', fontWeight: 400, opacity: 0.55, whiteSpace: 'nowrap' }}>
                          · {file.tournament_name}
                        </span>
                      ) : null}
                    </strong>
                    <span style={{ fontSize: '0.82rem', opacity: 0.65 }}>{file.original_name}</span>
                  </div>
                  <div className="audio-library-item__actions">
                    <button
                      type="button"
                      onClick={() => handleAudioLibraryPlay(file.id)}
                      disabled={busy}
                    >
                      {t('audio.play')}
                    </button>
                    <a
                      href={resolveMediaUrl(`/api/audio/library/${file.id}/download`)}
                      className="audio-library-item__download"
                    >
                      {t('common.download')}
                    </a>
                    <button
                      type="button"
                      className="btn-danger"
                      onClick={() => handleAudioLibraryDelete(file.id)}
                      disabled={busy}
                    >
                      {t('common.delete')}
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
