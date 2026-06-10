import { usePublicApp } from '../../context/PublicAppContext.jsx';

export default function PublicHeader() {
  const {
    navigation: { goHome, goReglement },
    isReglementView
  } = usePublicApp();

  return (
    <header className="public-header">
      <h1 className="public-header__title">Kunstrad Basketball</h1>
      <p className="public-header__subtitle">
        Live-Spielstand, Tabellen und Statistiken zum aktuell ausgewählten Turnier.
      </p>
      <nav className="public-header__nav">
        <button
          type="button"
          onClick={goHome}
          className={`pill-btn${!isReglementView ? ' pill-btn--active' : ''}`}
        >
          Spielplan
        </button>
        <button
          type="button"
          onClick={goReglement}
          className={`pill-btn${isReglementView ? ' pill-btn--active' : ''}`}
        >
          Reglement
        </button>
      </nav>
    </header>
  );
}
