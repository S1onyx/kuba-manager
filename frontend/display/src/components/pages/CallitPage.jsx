import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import qrcode from 'qrcode-generator';
import { fetchJson } from '../../utils/api.js';
import socket from '../../socket.js';

const CALLIT_URL =
  import.meta.env.VITE_CALLIT_URL && import.meta.env.VITE_CALLIT_URL.trim().length > 0
    ? import.meta.env.VITE_CALLIT_URL.trim().replace(/\/$/, '')
    : 'https://callit.kunstradbasketball.de';
const REFRESH_MS = 15000;
const TOP_COUNT = 10;

// QR-Code als React-SVG (ohne innerHTML).
function QrCode({ value, size = 260 }) {
  const cells = useMemo(() => {
    const qr = qrcode(0, 'M');
    qr.addData(value);
    qr.make();
    const count = qr.getModuleCount();
    const dark = [];
    for (let row = 0; row < count; row += 1) {
      for (let col = 0; col < count; col += 1) {
        if (qr.isDark(row, col)) dark.push(`M${col},${row}h1v1h-1z`);
      }
    }
    return { count, path: dark.join('') };
  }, [value]);
  const margin = 2;
  const box = cells.count + margin * 2;
  return (
    <svg width={size} height={size} viewBox={`${-margin} ${-margin} ${box} ${box}`} shapeRendering="crispEdges" role="img" aria-label={value} style={{ background: '#fff', borderRadius: 16 }}>
      <path d={cells.path} fill="#050d1a" />
    </svg>
  );
}

function useCallitRanking(tournamentId) {
  const [state, setState] = useState({ ranking: null, info: null, error: null });

  useEffect(() => {
    if (!tournamentId) {
      setState({ ranking: null, info: null, error: null });
      return undefined;
    }
    let cancelled = false;
    let timer = null;
    const load = async () => {
      try {
        const [ranking, info] = await Promise.all([
          fetchJson(`/callit/tournaments/${tournamentId}/ranking?category=total`),
          fetchJson(`/callit/tournaments/${tournamentId}`)
        ]);
        if (!cancelled) setState({ ranking, info, error: null });
      } catch (error) {
        if (!cancelled) setState((prev) => ({ ...prev, error }));
      }
    };
    const schedule = () => {
      if (timer) return;
      timer = window.setTimeout(() => {
        timer = null;
        load();
      }, 800);
    };
    const onUpdate = (payload) => {
      if (Number(payload?.tournamentId) === Number(tournamentId)) schedule();
    };
    load();
    socket.on('callit:update', onUpdate);
    const interval = window.setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      socket.off('callit:update', onUpdate);
      window.clearInterval(interval);
      if (timer) window.clearTimeout(timer);
    };
  }, [tournamentId]);

  return state;
}

const formatPoints = (value, language) => new Intl.NumberFormat(language, { maximumFractionDigits: 1 }).format(Number(value ?? 0));

function Delta({ value }) {
  if (!value) return <span style={{ width: 56, display: 'inline-block' }} />;
  const up = value > 0;
  return (
    <span style={{ width: 56, display: 'inline-block', color: up ? '#4ade80' : '#f87171', fontWeight: 800, fontSize: '1.3rem' }}>
      {up ? '▲' : '▼'}
      {Math.abs(value)}
    </span>
  );
}

const rankColor = (rank) => (rank === 1 ? '#facc15' : rank === 2 ? '#e5e7eb' : rank === 3 ? '#fdba74' : '#ffffff');

export default function CallitPage({ scoreboard }) {
  const { t, i18n } = useTranslation();
  const tournamentId = scoreboard?.displayCallitTournamentId ?? scoreboard?.tournamentId ?? null;
  const { ranking, info, error } = useCallitRanking(tournamentId);
  const joinUrl = tournamentId ? `${CALLIT_URL}/#/t/${tournamentId}` : CALLIT_URL;
  const rows = ranking?.rows ?? [];
  const top = rows.slice(0, TOP_COUNT);
  const exactKing = rows.filter((row) => row.exact > 0).sort((a, b) => b.exact - a.exact)[0];
  const underdogKing = rows.filter((row) => row.underdogHits > 0).sort((a, b) => b.underdogHits - a.underdogHits)[0];
  const climber = rows.filter((row) => row.delta > 0).sort((a, b) => b.delta - a.delta)[0];
  const live = ranking?.liveMatch;

  let body;
  if (!tournamentId) {
    body = <p style={{ fontSize: '1.6rem', opacity: 0.8 }}>{t('callit.noTournament')}</p>;
  } else if (error && !ranking) {
    body = <p style={{ fontSize: '1.6rem', color: '#ff8a80' }}>{error.status === 404 ? t('callit.notEnabled') : t('callit.loadError')}</p>;
  } else if (!ranking) {
    body = <p style={{ fontSize: '1.6rem', opacity: 0.8 }}>{t('callit.loading')}</p>;
  } else if (rows.length === 0) {
    body = <p style={{ fontSize: '2rem', opacity: 0.85 }}>{t('callit.empty')}</p>;
  } else {
    body = (
      <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '0.55rem' }}>
        {top.map((row) => (
          <li
            key={row.userId}
            style={{
              display: 'grid',
              gridTemplateColumns: '72px 56px 1fr auto',
              alignItems: 'center',
              gap: '1rem',
              padding: '0.55rem 1.2rem',
              borderRadius: 18,
              background: row.rank <= 3 ? 'rgba(249, 115, 22, 0.16)' : 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            <span style={{ fontSize: '2.2rem', fontWeight: 900, color: rankColor(row.rank), textAlign: 'center' }}>{row.rank}</span>
            <Delta value={row.delta} />
            <span style={{ minWidth: 0 }}>
              <span style={{ display: 'block', fontSize: '1.9rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.nickname}</span>
              <span style={{ fontSize: '1rem', opacity: 0.65 }}>{t('callit.rowDetail', { exact: row.exact, diff: row.diff, tendency: row.tendency })}</span>
            </span>
            <span style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '2.4rem', fontWeight: 900, fontVariantNumeric: 'tabular-nums' }}>{formatPoints(row.total, i18n.language)}</span>
              {row.livePoints > 0 ? (
                <span style={{ display: 'block', fontSize: '1rem', fontWeight: 800, color: '#fca5a5' }}>
                  {t('callit.livePlus', { points: formatPoints(row.livePoints, i18n.language) })}
                </span>
              ) : null}
            </span>
          </li>
        ))}
      </ol>
    );
  }

  return (
    <div style={{ width: '100%', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: '2rem', padding: '1.5rem 2rem', boxSizing: 'border-box', color: '#fff' }}>
      <section style={{ display: 'grid', gap: '1.2rem', alignContent: 'start', minWidth: 0 }}>
        <header style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', flexWrap: 'wrap' }}>
          <h1 style={{ margin: 0, fontSize: '3rem', letterSpacing: '0.04em' }}>{t('callit.title')}</h1>
          <span style={{ fontSize: '1.4rem', opacity: 0.7 }}>{info?.tournament?.name ?? scoreboard?.tournamentName ?? ''}</span>
          {ranking?.live ? (
            <span style={{ padding: '0.3rem 0.9rem', borderRadius: 999, background: '#ef4444', fontWeight: 800, fontSize: '1.1rem', letterSpacing: '0.08em' }}>
              {t('callit.live')}
            </span>
          ) : null}
        </header>
        {live ? (
          <div style={{ fontSize: '1.3rem', opacity: 0.85 }}>
            {t('callit.liveMatch', {
              home: live.home?.name ?? live.homeLabel,
              away: live.away?.name ?? live.awayLabel,
              score: `${live.result?.home ?? 0}:${live.result?.away ?? 0}`
            })}
          </div>
        ) : null}
        {body}
      </section>
      <aside style={{ display: 'grid', gap: '1.2rem', alignContent: 'start', justifyItems: 'center', textAlign: 'center' }}>
        <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{t('callit.join')}</div>
        <QrCode value={joinUrl} />
        <div style={{ fontSize: '1.15rem', fontWeight: 700, wordBreak: 'break-all' }}>{CALLIT_URL.replace(/^https?:\/\//, '')}</div>
        {info ? <div style={{ fontSize: '1.1rem', opacity: 0.75 }}>{t('callit.participants', { count: info.participantCount })}</div> : null}
        <div style={{ display: 'grid', gap: '0.7rem', width: '100%', marginTop: '0.5rem' }}>
          {[
            exactKing ? [t('callit.exactKing'), `${exactKing.nickname} · ${exactKing.exact}×`] : null,
            underdogKing ? [t('callit.underdogKing'), `${underdogKing.nickname} · ${underdogKing.underdogHits}×`] : null,
            climber ? [t('callit.climber'), `${climber.nickname} · ▲${climber.delta}`] : null
          ]
            .filter(Boolean)
            .map(([label, value]) => (
              <div key={label} style={{ padding: '0.7rem 0.9rem', borderRadius: 14, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ fontSize: '0.95rem', opacity: 0.65, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>{value}</div>
              </div>
            ))}
        </div>
      </aside>
    </div>
  );
}
