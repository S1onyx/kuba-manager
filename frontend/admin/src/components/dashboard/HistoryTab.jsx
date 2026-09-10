import { useTranslation } from 'react-i18next';
import PanelCard from '../common/PanelCard.jsx';
import { useDashboard } from '../../context/DashboardContext.jsx';
import { formatTime } from '../../utils/formatters.js';
import { useFormatStageLabel } from '../../utils/stageLabels.js';

export default function HistoryTab() {
  const { t } = useTranslation();
  const formatStageLabel = useFormatStageLabel();
  const {
    history: {
      history,
      historyLoading,
      historyError,
      editingGameId,
      editForm,
      loadHistory,
      startHistoryEdit,
      handleHistoryEditChange,
      cancelHistoryEdit,
      handleHistoryEditSubmit,
      handleHistoryDelete,
      formatDateTime
    }
  } = useDashboard();

  return (
    <PanelCard
      title={t('history.title')}
      description={t('history.description')}
      action={
        <button type="button" onClick={loadHistory}>
          {t('history.refresh')}
        </button>
      }
    >
      {historyLoading ? (
        <p style={{ margin: 0 }}>{t('history.loading')}</p>
      ) : historyError ? (
        <p style={{ margin: 0, color: 'var(--warning)' }}>{historyError}</p>
      ) : history.length === 0 ? (
        <p style={{ margin: 0 }}>{t('history.empty')}</p>
      ) : (
        <div style={{ display: 'grid', gap: '1.2rem' }}>
          {history.map((game) => {
            const penalties = game.penalties ?? { a: [], b: [] };
            const plannedExtra = game.extra_seconds > 0 ? `+${formatTime(game.extra_seconds)}` : '—';
            const playedExtra = game.extra_elapsed_seconds > 0 ? formatTime(game.extra_elapsed_seconds) : '—';
            const isEditing = editingGameId === game.id;
            const stageSuffix = game.stage_label
              ? game.stage_type === 'group'
                ? formatStageLabel(game.stage_label_i18n ?? { type: 'group', group: game.stage_label }, game.stage_label)
                : formatStageLabel(game.stage_label_i18n, game.stage_label)
              : '';

            return (
              <article key={game.id} className="card-item">
                <header
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    gap: '0.75rem',
                    alignItems: 'center'
                  }}
                >
                  <strong>#{game.id}</strong>
                  <span style={{ fontSize: '0.9rem', opacity: 0.7 }}>{formatDateTime(game.created_at)}</span>
                </header>

                {isEditing && editForm ? (
                  <form
                    onSubmit={handleHistoryEditSubmit}
                    style={{ display: 'grid', gap: '0.75rem', background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}
                  >
                    <div className="form-grid">
                      <label className="form-field">
                        {t('common.teamA')}
                        <input value={editForm.team_a} onChange={(event) => handleHistoryEditChange('team_a', event.target.value)} />
                      </label>
                      <label className="form-field">
                        {t('common.teamB')}
                        <input value={editForm.team_b} onChange={(event) => handleHistoryEditChange('team_b', event.target.value)} />
                      </label>
                      <label className="form-field">
                        {t('history.scoreA')}
                        <input
                          type="number"
                          min="0"
                          value={editForm.score_a}
                          onChange={(event) => handleHistoryEditChange('score_a', event.target.value)}
                        />
                      </label>
                      <label className="form-field">
                        {t('history.scoreB')}
                        <input
                          type="number"
                          min="0"
                          value={editForm.score_b}
                          onChange={(event) => handleHistoryEditChange('score_b', event.target.value)}
                        />
                      </label>
                    </div>

                    <div className="form-grid">
                      <label className="form-field">
                        {t('history.extraPlanned')}
                        <input
                          value={editForm.extra_seconds}
                          onChange={(event) => handleHistoryEditChange('extra_seconds', event.target.value)}
                          placeholder={t('history.mmssPlaceholder')}
                        />
                      </label>
                      <label className="form-field">
                        {t('history.extraElapsed')}
                        <input
                          value={editForm.extra_elapsed_seconds}
                          onChange={(event) => handleHistoryEditChange('extra_elapsed_seconds', event.target.value)}
                          placeholder={t('history.mmssPlaceholder')}
                        />
                      </label>
                      <label className="form-field">
                        {t('history.penaltiesA')}
                        <input
                          type="number"
                          min="0"
                          value={editForm.penalty_count_a}
                          onChange={(event) => handleHistoryEditChange('penalty_count_a', event.target.value)}
                        />
                      </label>
                      <label className="form-field">
                        {t('history.penaltiesB')}
                        <input
                          type="number"
                          min="0"
                          value={editForm.penalty_count_b}
                          onChange={(event) => handleHistoryEditChange('penalty_count_b', event.target.value)}
                        />
                      </label>
                    </div>

                    <div className="btn-row">
                      <button type="submit">{t('common.save')}</button>
                      <button type="button" onClick={cancelHistoryEdit}>
                        {t('common.cancel')}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div style={{ display: 'grid', gap: '0.4rem' }}>
                    <p style={{ margin: 0, fontWeight: 600 }}>
                      {game.team_a} {game.score_a} : {game.score_b} {game.team_b}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.88rem', opacity: 0.75 }}>
                      {t('history.tournament', { name: game.tournament_name ?? '—' })}
                      {stageSuffix ? ` · ${stageSuffix}` : ''}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.88rem', opacity: 0.75 }}>
                      {t('history.gameTime', {
                        duration: formatTime(game.duration_seconds),
                        halftime: formatTime(game.halftime_seconds),
                        pause: formatTime(game.halftime_pause_seconds)
                      })}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.88rem', opacity: 0.75 }}>
                      {t('history.extraTimeLine', { planned: plannedExtra, elapsed: playedExtra })}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.88rem', opacity: 0.75 }}>
                      {t('history.penaltiesLine', {
                        teamA: game.team_a,
                        countA: penalties.a?.length ?? 0,
                        teamB: game.team_b,
                        countB: penalties.b?.length ?? 0
                      })}
                    </p>
                    <div style={{ display: 'flex', gap: '0.65rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                      <button type="button" onClick={() => startHistoryEdit(game)}>
                        {t('common.edit')}
                      </button>
                      <button
                        type="button"
                        className="btn-danger"
                        onClick={() => handleHistoryDelete(game.id)}
                      >
                        {t('common.delete')}
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </PanelCard>
  );
}
