import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import PanelCard from '../common/PanelCard.jsx';
import { useDashboard } from '../../context/DashboardContext.jsx';
import { callitAdmin } from '../../utils/api.js';
import { formatApiError } from '../../utils/apiError.js';

const CALLIT_URL = 'https://callit.kunstradbasketball.de';
const SPECIAL_TYPES = ['winner', 'top_scorer', 'most_penalty_seconds', 'group_winner', 'total_baskets'];

const toLocalInput = (iso) => {
  if (!iso) return '';
  const date = new Date(iso);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

function NumberField({ label, value, onChange, step = 1, min = 0, max }) {
  return (
    <label className="form-field">
      <span>{label}</span>
      <input type="number" value={value} step={step} min={min} max={max} onChange={(event) => onChange(event.target.value === '' ? '' : Number(event.target.value))} />
    </label>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

function SettingsForm({ config, onSave, saving }) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(() => structuredClone(config.settings));
  const [rulesText, setRulesText] = useState(config.rulesText ?? '');

  useEffect(() => {
    setDraft(structuredClone(config.settings));
    setRulesText(config.rulesText ?? '');
  }, [config]);

  const set = (path, value) =>
    setDraft((prev) => {
      const next = structuredClone(prev);
      let target = next;
      path.slice(0, -1).forEach((key) => {
        target = target[key];
      });
      target[path[path.length - 1]] = value;
      return next;
    });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSave({ settings: draft, rulesText });
      }}
      style={{ display: 'grid', gap: '1.25rem' }}
    >
      <div style={{ display: 'grid', gap: '0.5rem' }}>
        <strong>{t('callit.settings.points')}</strong>
        <div className="form-grid">
          <NumberField label={t('callit.settings.exact')} value={draft.points.exact} step={0.5} onChange={(v) => set(['points', 'exact'], v)} />
          <NumberField label={t('callit.settings.diff')} value={draft.points.diff} step={0.5} onChange={(v) => set(['points', 'diff'], v)} />
          <NumberField label={t('callit.settings.tendency')} value={draft.points.tendency} step={0.5} onChange={(v) => set(['points', 'tendency'], v)} />
          <NumberField label={t('callit.settings.koAdvance')} value={draft.points.koAdvance} step={0.5} onChange={(v) => set(['points', 'koAdvance'], v)} />
        </div>
      </div>
      <div style={{ display: 'grid', gap: '0.5rem' }}>
        <strong>{t('callit.settings.multipliers')}</strong>
        <div className="form-grid">
          {['group', 'knockout', 'placement', 'final'].map((key) => (
            <NumberField key={key} label={t(`callit.settings.phase.${key}`)} value={draft.multipliers[key]} step={0.5} max={10} onChange={(v) => set(['multipliers', key], v)} />
          ))}
        </div>
      </div>
      <div className="form-grid" style={{ alignItems: 'end' }}>
        <Toggle label={t('callit.settings.jokerEnabled')} checked={draft.joker.enabled} onChange={(v) => set(['joker', 'enabled'], v)} />
        <NumberField label={t('callit.settings.jokerPerPhase')} value={draft.joker.perPhase} max={10} onChange={(v) => set(['joker', 'perPhase'], v)} />
      </div>
      <div className="form-grid" style={{ alignItems: 'end' }}>
        <Toggle label={t('callit.settings.underdogEnabled')} checked={draft.underdog.enabled} onChange={(v) => set(['underdog', 'enabled'], v)} />
        <NumberField label={t('callit.settings.underdogThreshold')} value={draft.underdog.thresholdPct} min={1} max={100} onChange={(v) => set(['underdog', 'thresholdPct'], v)} />
        <NumberField label={t('callit.settings.underdogMinTips')} value={draft.underdog.minTips} min={1} onChange={(v) => set(['underdog', 'minTips'], v)} />
        <NumberField label={t('callit.settings.underdogBonus')} value={draft.underdog.bonus} step={0.5} onChange={(v) => set(['underdog', 'bonus'], v)} />
      </div>
      <Toggle label={t('callit.settings.lockAtScheduled')} checked={draft.locks.atScheduledTime} onChange={(v) => set(['locks', 'atScheduledTime'], v)} />
      <div style={{ display: 'grid', gap: '0.5rem' }}>
        <strong>{t('callit.settings.specials')}</strong>
        {SPECIAL_TYPES.map((type) => (
          <div key={type} className="form-grid" style={{ alignItems: 'end' }}>
            <Toggle label={t(`callit.specialTypes.${type}`)} checked={draft.specials[type].enabled} onChange={(v) => set(['specials', type, 'enabled'], v)} />
            <NumberField label={t('callit.settings.specialPoints')} value={draft.specials[type].points} step={0.5} onChange={(v) => set(['specials', type, 'points'], v)} />
            <label className="form-field">
              <span>{t('callit.settings.deadline')}</span>
              <input
                type="datetime-local"
                value={toLocalInput(draft.specials[type].deadline)}
                onChange={(event) => set(['specials', type, 'deadline'], event.target.value ? new Date(event.target.value).toISOString() : null)}
              />
            </label>
          </div>
        ))}
        <p className="status-text status-text--muted">{t('callit.settings.deadlineHint')}</p>
      </div>
      <label className="form-field">
        <span>{t('callit.settings.rulesText')}</span>
        <textarea rows={4} value={rulesText} maxLength={5000} onChange={(event) => setRulesText(event.target.value)} />
      </label>
      <div className="btn-row">
        <button type="submit" disabled={saving}>
          {saving ? t('common.saving') : t('common.save')}
        </button>
      </div>
    </form>
  );
}

function SpecialOverride({ bet, onSave }) {
  const { t } = useTranslation();
  const [keys, setKeys] = useState(bet.override?.keys ?? []);
  const [value, setValue] = useState(bet.override?.value ?? '');
  const title = bet.type === 'group_winner' ? t('callit.specialTypes.group_winner_label', { group: bet.groupLabel }) : t(`callit.specialTypes.${bet.type}`);
  return (
    <article className="card-item">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
        <strong>{title}</strong>
        <span className="status-text status-text--muted">
          {bet.locked ? t('callit.specials.locked') : t('callit.specials.open')}
          {bet.outcome ? ` · ${bet.outcome.final ? t('callit.specials.result') : t('callit.specials.provisional')}: ${bet.outcome.labels.join(', ')}` : ''}
        </span>
      </div>
      {bet.type === 'total_baskets' ? (
        <input type="number" min={0} value={value} onChange={(event) => setValue(event.target.value)} placeholder={t('callit.specials.overridePlaceholder')} />
      ) : (
        <select multiple value={keys} onChange={(event) => setKeys(Array.from(event.target.selectedOptions).map((option) => option.value))} style={{ minHeight: '6rem' }}>
          {bet.options.map((option) => (
            <option key={option.key} value={option.key}>
              {option.label}
              {option.sub ? ` (${option.sub})` : ''}
            </option>
          ))}
        </select>
      )}
      <div className="btn-row">
        <button
          type="button"
          onClick={() => onSave(bet.betKey, bet.type === 'total_baskets' ? (value === '' ? null : { value: Number(value) }) : keys.length ? { keys } : null)}
        >
          {t('callit.specials.saveOverride')}
        </button>
        {bet.override ? (
          <button type="button" onClick={() => onSave(bet.betKey, null)}>
            {t('callit.specials.resetOverride')}
          </button>
        ) : null}
      </div>
      <p className="status-text status-text--muted">{bet.override ? t('callit.specials.overrideActive') : t('callit.specials.overrideHint')}</p>
    </article>
  );
}

export default function CallitTab() {
  const { t, i18n } = useTranslation();
  const {
    feedback: { updateMessage },
    scoreboard: { scoreboard },
    scoreboardActions: { handleDisplayViewChange }
  } = useDashboard();
  const [tournaments, setTournaments] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [openTips, setOpenTips] = useState({});
  const [search, setSearch] = useState('');

  const fail = useCallback((error, key) => updateMessage('error', formatApiError(error, t, key)), [t, updateMessage]);

  useEffect(() => {
    callitAdmin
      .tournaments()
      .then((list) => {
        setTournaments(list);
        setSelectedId((prev) => prev ?? scoreboard?.tournamentId ?? list.find((entry) => entry.enabled)?.id ?? list[0]?.id ?? null);
      })
      .catch((error) => fail(error, 'callit.loadFailed'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reload = useCallback(async () => {
    if (!selectedId) return;
    setLoading(true);
    try {
      const data = await callitAdmin.overview(selectedId);
      setOverview(data);
      setJoinCode(data.config.joinCode ?? '');
    } catch (error) {
      fail(error, 'callit.loadFailed');
    } finally {
      setLoading(false);
    }
  }, [selectedId, fail]);

  useEffect(() => {
    setOverview(null);
    setOpenTips({});
    reload();
  }, [reload]);

  const run = async (action, successKey) => {
    try {
      await action();
      if (successKey) updateMessage('info', t(successKey));
      await reload();
    } catch (error) {
      fail(error, 'callit.actionFailed');
    }
  };

  const saveConfig = async (patch) => {
    setSaving(true);
    await run(async () => {
      await callitAdmin.updateConfig(selectedId, patch);
      if (patch.enabled !== undefined) {
        setTournaments((list) => list.map((entry) => (entry.id === selectedId ? { ...entry, enabled: patch.enabled } : entry)));
      }
    }, 'callit.saved');
    setSaving(false);
  };

  const toggleTips = async (code) => {
    if (openTips[code]) {
      setOpenTips((prev) => ({ ...prev, [code]: null }));
      return;
    }
    try {
      const tips = await callitAdmin.matchTips(selectedId, code);
      setOpenTips((prev) => ({ ...prev, [code]: tips }));
    } catch (error) {
      fail(error, 'callit.loadFailed');
    }
  };

  const participants = useMemo(() => {
    const list = overview?.participants ?? [];
    const query = search.trim().toLowerCase();
    return list
      .filter((entry) => !query || entry.nickname.toLowerCase().includes(query))
      .sort((a, b) => (a.rank ?? 9999) - (b.rank ?? 9999) || a.nickname.localeCompare(b.nickname));
  }, [overview, search]);

  const config = overview?.config;
  const url = selectedId ? `${CALLIT_URL}/#/t/${selectedId}` : CALLIT_URL;
  const onBeamer = scoreboard?.displayView === 'callit' && scoreboard?.displayCallitTournamentId === selectedId;
  const dateFormat = (iso) => (iso ? new Date(iso).toLocaleString(i18n.language, { dateStyle: 'short', timeStyle: 'short' }) : '–');

  return (
    <div className="tab-container">
      <PanelCard title={t('callit.title')} description={t('callit.description')}>
        <select value={selectedId ?? ''} onChange={(event) => setSelectedId(Number(event.target.value) || null)} style={{ maxWidth: '360px' }}>
          {tournaments.map((tournament) => (
            <option key={tournament.id} value={tournament.id}>
              {tournament.name}
              {tournament.enabled ? ` · ${t('callit.active')}` : ''}
            </option>
          ))}
        </select>
        {loading && !overview ? <p className="status-text">{t('callit.loading')}</p> : null}
      </PanelCard>

      {config ? (
        <PanelCard
          tone={config.enabled ? 'accent' : undefined}
          title={t('callit.statusTitle')}
          description={config.enabled ? t('callit.statusOn', { count: overview.participants.length }) : t('callit.statusOff')}
          action={
            <button type="button" onClick={() => saveConfig({ enabled: !config.enabled })} disabled={saving}>
              {config.enabled ? t('callit.disable') : t('callit.enable')}
            </button>
          }
        >
          {!overview.tournament.isPublic ? <p className="status-text status-text--error">{t('callit.notPublic')}</p> : null}
          <div className="form-grid" style={{ alignItems: 'end' }}>
            <Toggle label={t('callit.registrationOpen')} checked={config.registrationOpen} onChange={(value) => saveConfig({ registrationOpen: value })} />
            <label className="form-field">
              <span>{t('callit.joinCode')}</span>
              <input value={joinCode} maxLength={40} placeholder={t('callit.joinCodePlaceholder')} onChange={(event) => setJoinCode(event.target.value)} />
            </label>
            <div className="btn-row">
              <button type="button" onClick={() => saveConfig({ joinCode })} disabled={saving || joinCode === (config.joinCode ?? '')}>
                {t('callit.saveJoinCode')}
              </button>
            </div>
          </div>
          <div className="btn-row" style={{ alignItems: 'center' }}>
            <a href={url} target="_blank" rel="noopener noreferrer" style={{ overflowWrap: 'anywhere' }}>
              {url}
            </a>
            <button type="button" onClick={() => navigator.clipboard?.writeText(url).then(() => updateMessage('info', t('callit.copied')))}>
              {t('callit.copyLink')}
            </button>
          </div>
          <div className="btn-row">
            <button
              type="button"
              onClick={() => (onBeamer ? handleDisplayViewChange('scoreboard') : handleDisplayViewChange('callit', { callitTournamentId: selectedId }))}
              disabled={!config.enabled}
            >
              {onBeamer ? t('callit.beamerOff') : t('callit.beamerOn')}
            </button>
            <button type="button" onClick={() => callitAdmin.exportCsv(selectedId).catch((error) => fail(error, 'callit.actionFailed'))} disabled={!config.enabled}>
              {t('callit.exportCsv')}
            </button>
            <button type="button" onClick={reload}>
              {t('callit.refresh')}
            </button>
          </div>
        </PanelCard>
      ) : null}

      {config ? (
        <PanelCard title={t('callit.settings.title')} description={t('callit.settings.description')}>
          <SettingsForm config={config} onSave={saveConfig} saving={saving} />
        </PanelCard>
      ) : null}

      {config?.enabled ? (
        <>
          <PanelCard title={t('callit.matches.title')} description={t('callit.matches.description')}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: 'var(--text-muted)' }}>
                    <th>{t('callit.matches.match')}</th>
                    <th>{t('callit.matches.time')}</th>
                    <th>{t('callit.matches.status')}</th>
                    <th>{t('callit.matches.tips')}</th>
                    <th>{t('callit.matches.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {overview.matches.map((match) => (
                    <Fragment key={match.code}>
                      <tr style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                        <td style={{ padding: '0.4rem 0.3rem' }}>
                          <div>{match.home} – {match.away}</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                            {match.stageLabel} · {match.code}
                            {match.result ? ` · ${match.result.home}:${match.result.away}${match.result.live ? ' (live)' : ''}` : ''}
                          </div>
                        </td>
                        <td>{dateFormat(match.scheduledAt)}</td>
                        <td>
                          {t(`callit.status.${match.status}`)}
                          {match.lockReason ? ` (${t(`callit.lockReason.${match.lockReason}`)})` : ''}
                          {match.unlockedOverride ? ` (${t('callit.lockReason.unlocked')})` : ''}
                        </td>
                        <td>
                          <button type="button" onClick={() => toggleTips(match.code)} disabled={match.tipCount === 0}>
                            {match.tipCount}
                          </button>
                        </td>
                        <td>
                          <div className="btn-row">
                            {match.locked ? (
                              <button type="button" onClick={() => run(() => callitAdmin.setLock(selectedId, match.code, 'unlock'), 'callit.matches.unlocked')}>
                                {t('callit.matches.unlock')}
                              </button>
                            ) : (
                              <button type="button" onClick={() => run(() => callitAdmin.setLock(selectedId, match.code, 'lock'), 'callit.matches.locked')}>
                                {t('callit.matches.lock')}
                              </button>
                            )}
                            {match.lockReason === 'manual' || match.unlockedOverride ? (
                              <button type="button" onClick={() => run(() => callitAdmin.setLock(selectedId, match.code, 'auto'), 'callit.saved')}>
                                {t('callit.matches.auto')}
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                      {openTips[match.code] ? (
                        <tr>
                          <td colSpan={5} style={{ padding: '0.4rem 0.3rem 0.8rem' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                              {openTips[match.code].map((tip) => (
                                <span key={tip.userId} className="card-item--flat" style={{ padding: '0.3rem 0.6rem', opacity: tip.stale ? 0.5 : 1 }}>
                                  {tip.nickname}: <strong>{tip.scoreHome}:{tip.scoreAway}</strong>
                                  {tip.advance ? ` (${tip.advance === 'home' ? match.home : match.away})` : ''}
                                  {tip.isJoker ? ' ★' : ''}
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </PanelCard>

          <PanelCard title={t('callit.specials.title')} description={t('callit.specials.description')}>
            {overview.specials.length === 0 ? <p className="status-text status-text--muted">{t('callit.specials.none')}</p> : null}
            {overview.specials.map((bet) => (
              <SpecialOverride key={`${bet.betKey}-${JSON.stringify(bet.override)}`} bet={bet} onSave={(betKey, value) => run(() => callitAdmin.setSpecialResult(selectedId, betKey, value), 'callit.saved')} />
            ))}
          </PanelCard>

          <PanelCard title={t('callit.participants.title')} description={t('callit.participants.description')}>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('callit.participants.search')} style={{ maxWidth: '320px' }} />
            {participants.length === 0 ? <p className="status-text status-text--muted">{t('callit.participants.empty')}</p> : null}
            <div style={{ display: 'grid', gap: '0.6rem' }}>
              {participants.map((entry) => (
                <article key={entry.userId} className="card-item--flat">
                  <div style={{ display: 'grid', gap: '0.2rem' }}>
                    <strong>
                      {entry.rank ? `${entry.rank}. ` : ''}
                      {entry.nickname}
                      {entry.banned ? ` · ${t('callit.participants.banned')}` : ''}
                      {entry.disqualified ? ` · ${t('callit.participants.disqualified')}` : ''}
                    </strong>
                    <span className="status-text status-text--muted">
                      {t('callit.participants.meta', { points: entry.total ?? 0, tips: entry.tipsCount, login: dateFormat(entry.lastLoginAt) })}
                    </span>
                  </div>
                  <div className="btn-row">
                    <button
                      type="button"
                      onClick={() => {
                        const nickname = window.prompt(t('callit.participants.renamePrompt'), entry.nickname);
                        if (nickname && nickname !== entry.nickname) run(() => callitAdmin.updateUser(entry.userId, { nickname }), 'callit.saved');
                      }}
                    >
                      {t('callit.participants.rename')}
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!window.confirm(t('callit.participants.resetConfirm', { name: entry.nickname }))) return;
                        try {
                          const { temporaryPassword } = await callitAdmin.resetPassword(entry.userId);
                          window.prompt(t('callit.participants.resetResult', { name: entry.nickname }), temporaryPassword);
                        } catch (error) {
                          fail(error, 'callit.actionFailed');
                        }
                      }}
                    >
                      {t('callit.participants.resetPassword')}
                    </button>
                    <button type="button" onClick={() => run(() => callitAdmin.setDisqualified(selectedId, entry.userId, !entry.disqualified), 'callit.saved')}>
                      {entry.disqualified ? t('callit.participants.requalify') : t('callit.participants.disqualify')}
                    </button>
                    <button type="button" onClick={() => run(() => callitAdmin.updateUser(entry.userId, { banned: !entry.banned }), 'callit.saved')}>
                      {entry.banned ? t('callit.participants.unban') : t('callit.participants.ban')}
                    </button>
                    <button
                      type="button"
                      className="btn-danger"
                      onClick={() => window.confirm(t('callit.participants.removeConfirm', { name: entry.nickname })) && run(() => callitAdmin.removeParticipant(selectedId, entry.userId), 'callit.saved')}
                    >
                      {t('callit.participants.remove')}
                    </button>
                    <button
                      type="button"
                      className="btn-danger"
                      onClick={() => window.confirm(t('callit.participants.deleteConfirm', { name: entry.nickname })) && run(() => callitAdmin.deleteUser(entry.userId), 'callit.saved')}
                    >
                      {t('callit.participants.deleteAccount')}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </PanelCard>
        </>
      ) : null}
    </div>
  );
}
