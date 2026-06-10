import { usePublicApp } from '../../context/PublicAppContext.jsx';

export default function PublicFooter() {
  const {
    impressum: { open }
  } = usePublicApp();

  return (
    <footer className="public-footer">
      <button type="button" onClick={open} className="public-footer__btn">
        Impressum
      </button>
    </footer>
  );
}
