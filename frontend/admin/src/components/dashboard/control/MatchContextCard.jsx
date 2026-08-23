import { useTranslation } from 'react-i18next';
import PanelCard from '../../common/PanelCard.jsx';
import { useDashboard } from '../../../context/DashboardContext.jsx';

export default function MatchContextCard() {
  const { t } = useTranslation();
  const {
    matchContext: {
      contextForm,
      stageOptions,
      stageOptionsLoading,
      stageSuggestionEntries,
      stageHintLines,
      stageLabelPlaceholder,
      stageListId,
      handleContextFormChange,
      handleContextSubmit
    },
    tournaments: { tournaments, tournamentsLoading, tournamentsError }
  } = useDashboard();

  return (
    <PanelCard
      title={t('control.context.title')}
      description={t('control.context.description')}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          handleContextSubmit();
        }}
        style={{ display: 'grid', gap: '1rem' }}
      >
        <label style={{ display: 'grid', gap: '0.35rem' }}>
          {t('control.context.tournament')}
          <select
            value={contextForm.tournamentId}
            onChange={(event) => handleContextFormChange('tournamentId', event.target.value)}
            disabled={tournamentsLoading}
          >
            <option value="">{t('control.context.noTournament')}</option>
            {tournaments.map((tournament) => (
              <option key={tournament.id} value={tournament.id}>
                {tournament.name}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: 'grid', gap: '0.35rem' }}>
          {t('control.context.stage')}
          <select
            value={contextForm.stageType}
            onChange={(event) => handleContextFormChange('stageType', event.target.value)}
          >
            <option value="">{t('control.context.noStage')}</option>
            <option value="group">{t('control.context.stageGroup')}</option>
            <option value="knockout">{t('control.context.stageKnockout')}</option>
            <option value="placement">{t('control.context.stagePlacement')}</option>
          </select>
        </label>

        {contextForm.stageType ? (
          <label style={{ display: 'grid', gap: '0.35rem' }}>
            {contextForm.stageType === 'group'
              ? t('control.context.groupLabel')
              : contextForm.stageType === 'knockout'
                ? t('control.context.roundLabel')
                : t('control.context.placementLabel')}
            <input
              value={contextForm.stageLabel}
              onChange={(event) => handleContextFormChange('stageLabel', event.target.value)}
              placeholder={stageLabelPlaceholder}
              list={stageListId}
            />
            {stageListId ? (
              <datalist id={stageListId}>
                {stageSuggestionEntries.map((entry) => (
                  <option key={`${stageListId}-${entry.label}`} value={entry.label} />
                ))}
              </datalist>
            ) : null}
            {stageOptionsLoading ? (
              <span style={{ fontSize: '0.8rem', opacity: 0.65 }}>{t('control.context.loadingStages')}</span>
            ) : stageHintLines.length > 0 ? (
              <div style={{ display: 'grid', gap: '0.2rem', fontSize: '0.8rem', opacity: 0.68 }}>
                <span>{t('control.context.suggestions', { hints: stageHintLines.join(' · ') })}</span>
                <span>{t('control.context.suggestionsTip')}</span>
              </div>
            ) : (
              <span style={{ fontSize: '0.8rem', opacity: 0.65 }}>{t('control.context.noSuggestions')}</span>
            )}
          </label>
        ) : null}

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit">{t('control.context.submit')}</button>
        </div>
      </form>
      {tournamentsError ? (
        <p style={{ margin: 0, color: 'var(--warning)' }}>{tournamentsError}</p>
      ) : null}
    </PanelCard>
  );
}
