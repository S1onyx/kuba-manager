import { useTranslation } from 'react-i18next';
import { errorMessage } from '../utils/errors.js';

export function Spinner() {
  return <div className="spinner" role="status" aria-label="…" />;
}

export function ErrorBox({ error, onRetry }) {
  const { t } = useTranslation();
  if (!error) return null;
  return (
    <div className="banner banner--error" role="alert">
      <span className="grow">{errorMessage(t, error)}</span>
      {onRetry ? (
        <button type="button" className="btn btn--small" onClick={onRetry}>
          {t('common.retry')}
        </button>
      ) : null}
    </div>
  );
}

export function Toast({ message }) {
  if (!message) return null;
  return (
    <div className="toast" role="status" aria-live="polite">
      {message}
    </div>
  );
}
