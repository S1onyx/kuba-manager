import { useTranslation } from 'react-i18next';
import { usePublicApp } from '../../context/PublicAppContext.jsx';

export default function PublicFooter() {
  const { t } = useTranslation();
  const {
    impressum: { open }
  } = usePublicApp();

  return (
    <footer className="public-footer">
      <button type="button" onClick={open} className="public-footer__btn">
        {t('footer.impressum')}
      </button>
    </footer>
  );
}
