const KNOWN = new Set([
  'CALLIT_INVALID_NICKNAME',
  'CALLIT_INVALID_PASSWORD',
  'CALLIT_NICKNAME_TAKEN',
  'CALLIT_INVALID_CREDENTIALS',
  'CALLIT_USER_BANNED',
  'CALLIT_TOO_MANY_ATTEMPTS',
  'CALLIT_TOO_MANY_REGISTRATIONS',
  'CALLIT_NOT_AVAILABLE',
  'CALLIT_REGISTRATION_CLOSED',
  'CALLIT_INVALID_JOIN_CODE',
  'CALLIT_NOT_JOINED',
  'CALLIT_DISQUALIFIED',
  'CALLIT_MATCH_LOCKED',
  'CALLIT_MATCH_PENDING',
  'CALLIT_INVALID_SCORE',
  'CALLIT_ADVANCE_REQUIRED',
  'CALLIT_JOKER_USED',
  'CALLIT_BET_LOCKED',
  'CALLIT_INVALID_VALUE',
  'CALLIT_AUTH_REQUIRED'
]);

export function errorMessage(t, error) {
  if (!error) return '';
  if (error.code && KNOWN.has(error.code)) return t(`errors.${error.code}`);
  if (error.status === 404) return t('errors.notFound');
  return t('errors.generic');
}
