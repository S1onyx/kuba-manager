import { useState } from 'react';
import { submitRegistration } from '../../api.js';

const POSITIONS = ['', 'Aufbau', 'Flügel', 'Center', 'Guard'];

function emptyPlayer() {
  return { name: '', jerseyNumber: '', position: '' };
}

export default function RegistrationForm({ tournament, onSuccess }) {
  const [teamName, setTeamName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [players, setPlayers] = useState([emptyPlayer(), emptyPlayer(), emptyPlayer(), emptyPlayer(), emptyPlayer()]);
  const [audioNotes, setAudioNotes] = useState('');
  const [audioFiles, setAudioFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const updatePlayer = (i, field, value) => {
    setPlayers((prev) => prev.map((p, idx) => idx === i ? { ...p, [field]: value } : p));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const validPlayers = players.filter((p) => p.name.trim());
    if (validPlayers.length < 1) {
      setError('Bitte mindestens einen Spieler eintragen.');
      return;
    }

    const fd = new FormData();
    fd.append('team_name', teamName.trim());
    fd.append('contact_name', contactName.trim());
    fd.append('contact_email', contactEmail.trim());
    fd.append('players', JSON.stringify(validPlayers));
    fd.append('audio_notes', audioNotes);
    for (const file of audioFiles) {
      fd.append('audio', file);
    }

    setSubmitting(true);
    try {
      await submitRegistration(tournament.id, fd);
      onSuccess?.();
    } catch (err) {
      setError(err.message || 'Anmeldung fehlgeschlagen.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '0.6rem 0.8rem',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.15)',
    background: 'rgba(255,255,255,0.06)',
    color: '#fff',
    fontSize: '0.95rem',
    boxSizing: 'border-box'
  };

  const labelStyle = { display: 'grid', gap: '0.3rem', fontSize: '0.875rem', opacity: 0.85 };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.5rem' }}>
      <section style={{ display: 'grid', gap: '0.75rem' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', opacity: 0.9 }}>Teamdaten</h3>
        <label style={labelStyle}>
          Teamname *
          <input style={inputStyle} value={teamName} onChange={(e) => setTeamName(e.target.value)} required placeholder="z. B. Flying Wheels" />
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <label style={labelStyle}>
            Kontaktperson *
            <input style={inputStyle} value={contactName} onChange={(e) => setContactName(e.target.value)} required placeholder="Vor- und Nachname" />
          </label>
          <label style={labelStyle}>
            E-Mail *
            <input style={inputStyle} type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} required placeholder="team@beispiel.de" />
          </label>
        </div>
      </section>

      <section style={{ display: 'grid', gap: '0.75rem' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', opacity: 0.9 }}>Spieler (4 Pflicht, 1 optional)</h3>
        {players.map((p, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '0.5rem', alignItems: 'end' }}>
            <label style={labelStyle}>
              {i < 4 ? `Spieler ${i + 1} *` : `Spieler ${i + 1} (optional)`}
              <input
                style={inputStyle}
                value={p.name}
                onChange={(e) => updatePlayer(i, 'name', e.target.value)}
                required={i < 4}
                placeholder="Name"
              />
            </label>
            <label style={{ ...labelStyle, width: '70px' }}>
              #
              <input
                style={{ ...inputStyle, width: '70px' }}
                type="number"
                min="0"
                max="99"
                value={p.jerseyNumber}
                onChange={(e) => updatePlayer(i, 'jerseyNumber', e.target.value)}
                placeholder="Nr."
              />
            </label>
            <label style={{ ...labelStyle, width: '110px' }}>
              Position
              <select style={{ ...inputStyle, width: '110px' }} value={p.position} onChange={(e) => updatePlayer(i, 'position', e.target.value)}>
                {POSITIONS.map((pos) => <option key={pos} value={pos}>{pos || '–'}</option>)}
              </select>
            </label>
          </div>
        ))}
      </section>

      <section style={{ display: 'grid', gap: '0.75rem' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', opacity: 0.9 }}>Audio-Wünsche</h3>
        <label style={labelStyle}>
          MP3-Dateien hochladen (max. 5, je 20 MB)
          <input
            type="file"
            accept="audio/mpeg,audio/mp3,.mp3"
            multiple
            onChange={(e) => setAudioFiles(Array.from(e.target.files).slice(0, 5))}
            style={{ ...inputStyle, padding: '0.4rem' }}
          />
        </label>
        <label style={labelStyle}>
          Anmerkungen zu den Sounds (optional)
          <textarea
            style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
            value={audioNotes}
            onChange={(e) => setAudioNotes(e.target.value)}
            placeholder="z. B. Einlaufmusik für welches Team, Zeitpunkt, ..."
          />
        </label>
      </section>

      {error && (
        <p style={{ margin: 0, color: '#ffb0b0', fontSize: '0.9rem' }}>{error}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        style={{
          padding: '0.75rem 2rem',
          borderRadius: '999px',
          border: 'none',
          background: submitting ? 'rgba(86,160,255,0.3)' : 'rgba(86,160,255,0.8)',
          color: '#fff',
          fontSize: '1rem',
          fontWeight: 600,
          cursor: submitting ? 'not-allowed' : 'pointer',
          justifySelf: 'start'
        }}
      >
        {submitting ? 'Wird eingereicht...' : 'Jetzt anmelden'}
      </button>
    </form>
  );
}
