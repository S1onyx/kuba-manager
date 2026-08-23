import { useTranslation } from 'react-i18next';
import PanelCard from '../common/PanelCard.jsx';
import { useDashboard } from '../../context/DashboardContext.jsx';
import { TOURNAMENT_CLASSIFICATION_OPTIONS } from '../../constants/dashboard.js';
import { useDateLocale } from '../../i18n/index.js';
import TournamentDetailsPanel from './tournaments/TournamentDetailsPanel.jsx';

export default function TournamentsTab() {
  const { t } = useTranslation();
  const dateLocale = useDateLocale();
  const {
    tournaments: {
      tournaments,
      tournamentsLoading,
      tournamentsError,
      tournamentForm,
      tournamentEdits,
      expandedTournamentId,
      setExpandedTournamentId,
      handleTournamentFormChange,
      handleTournamentFormSubmit,
      startTournamentEdit,
      handleTournamentEditChange,
      cancelTournamentEdit,
      handleTournamentSave,
      handleTournamentDelete,
      handleTournamentCompletionChange,
      tournamentCompletionSaving
    },
    tournamentStructure,
    teams
  } = useDashboard();

  const renderStatusOptions = (value, onChange) => (
    <select value={value} onChange={onChange}>
      <option value="active">{t('tournaments.statusActive')}</option>
      <option value="planned">{t('tournaments.statusPlanned')}</option>
    </select>
  );

  return (
    <div style={{ display: 'grid', gap: '1.75rem' }}>
      <PanelCard
        title={t('tournaments.createTitle')}
        description={t('tournaments.createDescription')}
      >
        <form onSubmit={handleTournamentFormSubmit} style={{ display: 'grid', gap: '1rem' }}>
          <div style={{ display: 'grid', gap: '0.85rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <label style={{ display: 'grid', gap: '0.3rem' }}>
              {t('tournaments.status')}
              {renderStatusOptions(tournamentForm.status, (event) => handleTournamentFormChange('status', event.target.value))}
            </label>
            <label style={{ display: 'grid', gap: '0.3rem' }}>
              {t('tournaments.name')}
              <input
                value={tournamentForm.name}
                onChange={(event) => handleTournamentFormChange('name', event.target.value)}
                placeholder={t('tournaments.namePlaceholder')}
                required
              />
            </label>
            {tournamentForm.status === 'planned' && (
              <label style={{ display: 'grid', gap: '0.3rem' }}>
                {t('tournaments.dateTime')}
                <input
                  type="datetime-local"
                  value={tournamentForm.planned_at}
                  onChange={(event) => handleTournamentFormChange('planned_at', event.target.value)}
                />
              </label>
            )}
            {tournamentForm.status === 'planned' && (
              <label style={{ display: 'grid', gap: '0.3rem' }}>
                {t('tournaments.location')}
                <input
                  type="text"
                  value={tournamentForm.location}
                  onChange={(event) => handleTournamentFormChange('location', event.target.value)}
                  placeholder={t('tournaments.locationPlaceholder')}
                />
              </label>
            )}
            {tournamentForm.status === 'planned' && (
              <label style={{ display: 'grid', gap: '0.3rem', gridColumn: '1 / -1' }}>
                {t('tournaments.description')}
                <textarea
                  value={tournamentForm.description}
                  onChange={(event) => handleTournamentFormChange('description', event.target.value)}
                  placeholder={t('tournaments.descriptionPlaceholder')}
                  rows={3}
                />
              </label>
            )}
            {tournamentForm.status === 'planned' && (
              <label style={{ display: 'grid', gap: '0.3rem', gridColumn: '1 / -1' }}>
                {t('tournaments.scheduleInfo')}
                <textarea
                  value={tournamentForm.schedule_info}
                  onChange={(event) => handleTournamentFormChange('schedule_info', event.target.value)}
                  placeholder={t('tournaments.scheduleInfoPlaceholder')}
                  rows={3}
                />
              </label>
            )}
            {tournamentForm.status === 'planned' && (
              <label style={{ display: 'grid', gap: '0.3rem', gridColumn: '1 / -1' }}>
                {t('tournaments.travelInfo')}
                <textarea
                  value={tournamentForm.travel_info}
                  onChange={(event) => handleTournamentFormChange('travel_info', event.target.value)}
                  placeholder={t('tournaments.travelInfoPlaceholder')}
                  rows={3}
                />
              </label>
            )}
            {tournamentForm.status === 'planned' && (
              <label style={{ display: 'grid', gap: '0.3rem' }}>
                {t('tournaments.contactEmail')}
                <input
                  type="email"
                  value={tournamentForm.contact_email}
                  onChange={(event) => handleTournamentFormChange('contact_email', event.target.value)}
                  placeholder={t('tournaments.contactEmailPlaceholder')}
                />
              </label>
            )}
            {tournamentForm.status === 'planned' && (
              <label style={{ display: 'grid', gap: '0.3rem' }}>
                {t('tournaments.registrationDeadline')}
                <input
                  type="date"
                  value={tournamentForm.registration_deadline}
                  onChange={(event) => handleTournamentFormChange('registration_deadline', event.target.value)}
                />
              </label>
            )}
            {tournamentForm.status === 'planned' && (
              <div style={{ gridColumn: '1 / -1', display: 'grid', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{t('tournaments.links')}</span>
                {(tournamentForm.links ?? []).map((link, index) => (
                  <div key={index} className="admin-link-row">
                    <input
                      placeholder={t('tournaments.linkLabelPlaceholder')}
                      value={link.label}
                      onChange={(event) => {
                        const updated = [...tournamentForm.links];
                        updated[index] = { ...updated[index], label: event.target.value };
                        handleTournamentFormChange('links', updated);
                      }}
                    />
                    <input
                      placeholder={t('tournaments.linkUrlPlaceholder')}
                      value={link.url}
                      onChange={(event) => {
                        const updated = [...tournamentForm.links];
                        updated[index] = { ...updated[index], url: event.target.value };
                        handleTournamentFormChange('links', updated);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleTournamentFormChange('links', tournamentForm.links.filter((_, i) => i !== index))}
                      style={{ padding: '0.3rem 0.6rem', background: 'rgba(255,100,100,0.2)', border: '1px solid rgba(255,100,100,0.4)', borderRadius: '6px', color: '#ff9999', cursor: 'pointer' }}
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => handleTournamentFormChange('links', [...(tournamentForm.links ?? []), { label: '', url: '' }])}
                  style={{ alignSelf: 'start', padding: '0.3rem 0.8rem', background: 'rgba(86,160,255,0.15)', border: '1px solid rgba(86,160,255,0.35)', borderRadius: '6px', color: '#7cb9ff', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  {t('tournaments.addLink')}
                </button>
              </div>
            )}
            {tournamentForm.status !== 'planned' && (
              <label style={{ display: 'grid', gap: '0.3rem' }}>
                {t('tournaments.groups')}
                <input
                  type="number"
                  min="0"
                  value={tournamentForm.group_count}
                  onChange={(event) => handleTournamentFormChange('group_count', event.target.value)}
                />
              </label>
            )}
            {tournamentForm.status !== 'planned' && (
              <label style={{ display: 'grid', gap: '0.3rem' }}>
                {t('tournaments.knockoutRounds')}
                <input
                  type="number"
                  min="0"
                  value={tournamentForm.knockout_rounds}
                  onChange={(event) => handleTournamentFormChange('knockout_rounds', event.target.value)}
                />
              </label>
            )}
            {tournamentForm.status !== 'planned' && (
              <label style={{ display: 'grid', gap: '0.3rem' }}>
                {t('tournaments.teamCount')}
                <input
                  type="number"
                  min="0"
                  value={tournamentForm.team_count}
                  onChange={(event) => handleTournamentFormChange('team_count', event.target.value)}
                />
              </label>
            )}
            {tournamentForm.status !== 'planned' && (
              <label style={{ display: 'grid', gap: '0.3rem' }}>
                {t('tournaments.classificationMode')}
                <select
                  value={tournamentForm.classification_mode}
                  onChange={(event) => handleTournamentFormChange('classification_mode', event.target.value)}
                >
                  {TOURNAMENT_CLASSIFICATION_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {t(option.labelKey)}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '1.65rem' }}>
              <input
                type="checkbox"
                checked={Boolean(tournamentForm.is_public)}
                onChange={(event) => handleTournamentFormChange('is_public', event.target.checked)}
              />
              {t('tournaments.isPublic')}
            </label>
          </div>
          <div>
            <button type="submit">{t('tournaments.create')}</button>
          </div>
        </form>
      </PanelCard>

      <PanelCard
        title={t('tournaments.listTitle')}
        description={t('tournaments.listDescription')}
      >
        {tournamentsLoading ? (
          <p style={{ margin: 0 }}>{t('tournaments.loading')}</p>
        ) : tournamentsError ? (
          <p style={{ margin: 0, color: 'var(--warning)' }}>{tournamentsError}</p>
        ) : tournaments.length === 0 ? (
          <p style={{ margin: 0 }}>{t('tournaments.empty')}</p>
        ) : (
          <div style={{ display: 'grid', gap: '1.1rem' }}>
            {tournaments.map((tournament) => {
              const edit = tournamentEdits[tournament.id];
              const isEditing = Boolean(edit);
              const isExpanded = expandedTournamentId === tournament.id;
              const completionSaving = Boolean(
                tournamentCompletionSaving?.[String(tournament.id)] ?? false
              );

              return (
                <div
                  key={tournament.id}
                  style={{
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(8,20,35,0.55)',
                    padding: '1rem 1.2rem',
                    display: 'grid',
                    gap: '0.9rem'
                  }}
                >
                  {isEditing ? (
                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                      <div style={{ display: 'grid', gap: '0.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
                        <label>
                          {t('tournaments.status')}
                          {renderStatusOptions(edit.status, (event) => handleTournamentEditChange(tournament.id, 'status', event.target.value))}
                        </label>
                        <label>
                          {t('tournaments.name')}
                          <input
                            value={edit.name}
                            onChange={(event) => handleTournamentEditChange(tournament.id, 'name', event.target.value)}
                          />
                        </label>
                      </div>
                      {edit.status === 'planned' && (
                        <div style={{ display: 'grid', gap: '0.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
                          <label>
                            {t('tournaments.dateTime')}
                            <input
                              type="datetime-local"
                              value={edit.planned_at}
                              onChange={(event) => handleTournamentEditChange(tournament.id, 'planned_at', event.target.value)}
                            />
                          </label>
                          <label>
                            {t('tournaments.location')}
                            <input
                              type="text"
                              value={edit.location}
                              onChange={(event) => handleTournamentEditChange(tournament.id, 'location', event.target.value)}
                              placeholder={t('tournaments.locationPlaceholder')}
                            />
                          </label>
                        </div>
                      )}
                      {edit.status === 'planned' && (
                        <label>
                          {t('tournaments.description')}
                          <textarea
                            value={edit.description}
                            onChange={(event) => handleTournamentEditChange(tournament.id, 'description', event.target.value)}
                            placeholder={t('tournaments.descriptionPlaceholder')}
                            rows={3}
                          />
                        </label>
                      )}
                      {edit.status === 'planned' && (
                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{t('tournaments.links')}</span>
                          {(edit.links ?? []).map((link, index) => (
                            <div key={index} className="admin-link-row">
                              <input
                                placeholder={t('tournaments.linkLabelPlaceholder')}
                                value={link.label}
                                onChange={(event) => {
                                  const updated = [...edit.links];
                                  updated[index] = { ...updated[index], label: event.target.value };
                                  handleTournamentEditChange(tournament.id, 'links', updated);
                                }}
                              />
                              <input
                                placeholder={t('tournaments.linkUrlPlaceholder')}
                                value={link.url}
                                onChange={(event) => {
                                  const updated = [...edit.links];
                                  updated[index] = { ...updated[index], url: event.target.value };
                                  handleTournamentEditChange(tournament.id, 'links', updated);
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => handleTournamentEditChange(tournament.id, 'links', edit.links.filter((_, i) => i !== index))}
                                style={{ padding: '0.3rem 0.6rem', background: 'rgba(255,100,100,0.2)', border: '1px solid rgba(255,100,100,0.4)', borderRadius: '6px', color: '#ff9999', cursor: 'pointer' }}
                              >
                                ×
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => handleTournamentEditChange(tournament.id, 'links', [...(edit.links ?? []), { label: '', url: '' }])}
                            style={{ alignSelf: 'start', padding: '0.3rem 0.8rem', background: 'rgba(86,160,255,0.15)', border: '1px solid rgba(86,160,255,0.35)', borderRadius: '6px', color: '#7cb9ff', cursor: 'pointer', fontSize: '0.85rem' }}
                          >
                            {t('tournaments.addLink')}
                          </button>
                        </div>
                      )}
                      {edit.status !== 'planned' && (
                        <div style={{ display: 'grid', gap: '0.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
                          <label>
                            {t('tournaments.groups')}
                            <input
                              type="number"
                              min="0"
                              value={edit.group_count}
                              onChange={(event) => handleTournamentEditChange(tournament.id, 'group_count', event.target.value)}
                            />
                          </label>
                          <label>
                            {t('tournaments.knockoutRounds')}
                            <input
                              type="number"
                              min="0"
                              value={edit.knockout_rounds}
                              onChange={(event) => handleTournamentEditChange(tournament.id, 'knockout_rounds', event.target.value)}
                            />
                          </label>
                        </div>
                      )}
                      {edit.status !== 'planned' && (
                        <div style={{ display: 'grid', gap: '0.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
                          <label>
                            {t('tournaments.teamCount')}
                            <input
                              type="number"
                              min="0"
                              value={edit.team_count}
                              onChange={(event) => handleTournamentEditChange(tournament.id, 'team_count', event.target.value)}
                            />
                          </label>
                          <label>
                            {t('tournaments.classificationMode')}
                            <select
                              value={edit.classification_mode}
                              onChange={(event) => handleTournamentEditChange(tournament.id, 'classification_mode', event.target.value)}
                            >
                              {TOURNAMENT_CLASSIFICATION_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {t(option.labelKey)}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>
                      )}
                      <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <input
                          type="checkbox"
                          checked={Boolean(edit.is_public)}
                          onChange={(event) => handleTournamentEditChange(tournament.id, 'is_public', event.target.checked)}
                        />
                        {t('tournaments.isPublic')}
                      </label>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gap: '0.35rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <strong>{tournament.name}</strong>
                        {tournament.status === 'planned' ? (
                          <span style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            padding: '0.15rem 0.55rem',
                            borderRadius: '999px',
                            background: 'rgba(251, 191, 36, 0.2)',
                            color: '#fbbf24',
                            border: '1px solid rgba(251, 191, 36, 0.4)'
                          }}>
                            {t('tournaments.statusPlanned')}
                          </span>
                        ) : (
                          <span style={{
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            padding: '0.15rem 0.55rem',
                            borderRadius: '999px',
                            background: 'rgba(59, 130, 246, 0.2)',
                            color: '#93c5fd',
                            border: '1px solid rgba(59, 130, 246, 0.4)'
                          }}>
                            {t('tournaments.statusActive')}
                          </span>
                        )}
                      </div>
                      {tournament.planned_at && (
                        <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>
                          {(() => { try { return new Date(tournament.planned_at).toLocaleString(dateLocale); } catch { return tournament.planned_at; } })()}
                        </span>
                      )}
                      {tournament.location && (
                        <span style={{ fontSize: '0.85rem', opacity: 0.75 }}>
                          {tournament.location}
                        </span>
                      )}
                      {tournament.description && (
                        <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>
                          {tournament.description.length > 80 ? tournament.description.slice(0, 80) + '…' : tournament.description}
                        </span>
                      )}
                      {tournament.status !== 'planned' && (
                        <>
                          <span style={{ fontSize: '0.9rem', opacity: 0.75 }}>
                            {t('tournaments.structureSummary', {
                              groups: tournament.group_count ?? 0,
                              rounds: tournament.knockout_rounds ?? 0
                            })}
                          </span>
                          <span style={{ fontSize: '0.9rem', opacity: 0.75 }}>
                            {t('tournaments.teamsSummary', {
                              count: tournament.team_count ?? 0,
                              mode: tournament.classification_mode === 'all'
                                ? t('tournaments.classificationAll')
                                : t('tournaments.classificationTop4')
                            })}
                          </span>
                        </>
                      )}
                      <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>
                        {t('tournaments.visibility', {
                          visibility: tournament.is_public
                            ? t('tournaments.visibilityPublic')
                            : t('tournaments.visibilityPrivate')
                        })}
                      </span>
                      <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>
                        {t('tournaments.state', {
                          state: tournament.is_completed
                            ? t('tournaments.stateCompleted')
                            : t('tournaments.stateRunning')
                        })}
                      </span>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                    <button type="button" onClick={() => setExpandedTournamentId(isExpanded ? null : tournament.id)}>
                      {isExpanded ? t('tournaments.hideDetails') : t('tournaments.showDetails')}
                    </button>
                    {isEditing ? (
                      <>
                        <button type="button" onClick={() => handleTournamentSave(tournament.id)}>
                          {t('common.save')}
                        </button>
                        <button type="button" onClick={() => cancelTournamentEdit(tournament.id)}>
                          {t('common.cancel')}
                        </button>
                      </>
                    ) : (
                      <>
                        <button type="button" onClick={() => startTournamentEdit(tournament)}>
                          {t('common.edit')}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTournamentDelete(tournament.id)}
                          style={{ background: 'rgba(211,47,47,0.85)', color: '#fff' }}
                        >
                          {t('common.delete')}
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => handleTournamentCompletionChange(tournament.id, !tournament.is_completed)}
                      disabled={completionSaving}
                      style={{
                        borderRadius: '999px',
                        border: '1px solid rgba(255,255,255,0.35)',
                        background: tournament.is_completed ? 'rgba(0, 180, 120, 0.25)' : 'transparent',
                        color: '#fff',
                        padding: '0.35rem 0.9rem',
                        fontSize: '0.85rem',
                        opacity: completionSaving ? 0.6 : 1,
                        cursor: completionSaving ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {completionSaving
                        ? t('tournaments.updating')
                        : tournament.is_completed
                          ? t('tournaments.reopen')
                          : t('tournaments.complete')}
                    </button>
                  </div>

                  {isExpanded ? (
                    <TournamentDetailsPanel
                      tournament={tournament}
                      structureState={tournamentStructure}
                      teams={teams.teams}
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </PanelCard>
    </div>
  );
}
