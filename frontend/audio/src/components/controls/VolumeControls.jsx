import { useAudioApp } from '../../context/AudioContext.jsx';

function formatPercent(value) {
  return `${Math.round(value * 100)}%`;
}

export default function VolumeControls() {
  const { volume } = useAudioApp();
  if (!volume) {
    return null;
  }
  const { categories, settings, setVolume } = volume;

  return (
    <section className="card">
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          alignItems: 'center'
        }}
      >
        <div style={{ display: 'grid', gap: '0.3rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.3rem', letterSpacing: '0.06em' }}>Lautstärke je Ereignis</h2>
          <span style={{ fontSize: '0.9rem', opacity: 0.75 }}>
            Passe das Verhältnis der Spielereignisse zueinander an. Die Werte werden lokal im Browser gespeichert.
          </span>
        </div>
      </header>

      <div className="volume-control-grid">
        {categories.map((category) => {
          const value = settings?.[category.key] ?? 1;
          const percent = Math.round(value * 100);
          return (
            <label key={category.key} className="volume-control">
              <div className="volume-control__label">
                <div>
                  <strong>{category.label}</strong>
                  {category.description ? (
                    <p className="volume-control__description">{category.description}</p>
                  ) : null}
                </div>
                <span className="volume-control__value">{formatPercent(value)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={percent}
                onChange={(event) => setVolume(category.key, Number(event.target.value) / 100)}
                className="volume-control__slider"
              />
            </label>
          );
        })}
      </div>
    </section>
  );
}
