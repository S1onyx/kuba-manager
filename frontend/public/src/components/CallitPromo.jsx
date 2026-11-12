import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BACKEND_BASE_URL } from '../api.js';
import { trackEvent } from '../utils/plausible.js';

const CALLIT_URL =
  import.meta.env.VITE_CALLIT_URL && import.meta.env.VITE_CALLIT_URL.trim().length > 0
    ? import.meta.env.VITE_CALLIT_URL.trim().replace(/\/$/, '')
    : 'https://callit.kunstradbasketball.de';
const REFRESH_MS = 60000;

function useCallitTournaments() {
  const [list, setList] = useState([]);
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const response = await fetch(`${BACKEND_BASE_URL}/api/callit/tournaments?top=3`);
        if (!response.ok) return;
        const data = await response.json();
        if (!cancelled && Array.isArray(data)) setList(data.filter((entry) => entry.isPublic));
      } catch {
        // Tippspiel ist optional – Fehler blenden die Karte einfach aus.
      }
    };
    load();
    const timer = window.setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);
  return list;
}

function PromoCard({ tournament, compact }) {
  const { t, i18n } = useTranslation();
  const href = `${CALLIT_URL}/#/t/${tournament.id}`;
  const format = (value) => new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 1 }).format(value);
  return (
    <a
      href={href}
      onClick={() => trackEvent('Callit Click', { tournament: tournament.name })}
      style={{
        display: 'grid',
        gap: '0.75rem',
        padding: compact ? '1rem 1.1rem' : '1.2rem 1.35rem',
        borderRadius: '18px',
        textDecoration: 'none',
        color: '#fff',
        background: 'linear-gradient(135deg, rgba(249,115,22,0.32), rgba(86,160,255,0.22))',
        border: '1px solid rgba(249,115,22,0.55)',
        boxShadow: '0 18px 40px rgba(0,0,0,0.35)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', flexWrap: 'wrap' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ padding: '0.2rem 0.65rem', borderRadius: '999px', background: '#f97316', fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            {t('callit.badge')}
          </span>
          <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>{tournament.name}</span>
        </span>
        <span style={{ fontSize: '0.8rem', opacity: 0.75 }}>{t('callit.participants', { count: tournament.participantCount })}</span>
      </div>
      <strong style={{ fontSize: compact ? '1.15rem' : '1.35rem', lineHeight: 1.25 }}>{t('callit.title')}</strong>
      {!compact ? <span style={{ fontSize: '0.92rem', opacity: 0.85, lineHeight: 1.5 }}>{t('callit.text')}</span> : null}
      {tournament.leaders?.length ? (
        <div style={{ display: 'grid', gap: '0.25rem' }}>
          <span style={{ fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.7 }}>{t('callit.leaders')}</span>
          {tournament.leaders.map((leader) => (
            <span key={`${leader.rank}-${leader.nickname}`} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', fontSize: '0.9rem' }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {leader.rank}. {leader.nickname}
              </span>
              <span style={{ fontWeight: 700 }}>{t('callit.points', { points: format(leader.total) })}</span>
            </span>
          ))}
        </div>
      ) : null}
      <span
        style={{
          justifySelf: 'start',
          display: 'inline-flex',
          alignItems: 'center',
          minHeight: '48px',
          padding: '0 1.4rem',
          borderRadius: '999px',
          background: '#f97316',
          fontWeight: 800,
          letterSpacing: '0.04em'
        }}
      >
        {t('callit.cta')} →
      </span>
    </a>
  );
}

export default function CallitPromo({ tournamentId = null, compact = false }) {
  const list = useCallitTournaments();
  const visible = tournamentId ? list.filter((entry) => entry.id === Number(tournamentId)) : list.filter((entry) => !entry.isCompleted);
  if (visible.length === 0) return null;
  return (
    <section style={{ display: 'grid', gap: '0.75rem' }}>
      {visible.map((tournament) => (
        <PromoCard key={tournament.id} tournament={tournament} compact={compact} />
      ))}
    </section>
  );
}
