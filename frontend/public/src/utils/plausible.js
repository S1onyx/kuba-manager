const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 400;

function callPlausible(eventName, payload, attempt = 0) {
  if (typeof window === 'undefined') {
    return;
  }

  const plausible = window.plausible;
  if (typeof plausible === 'function') {
    plausible(eventName, payload);
    return;
  }

  if (attempt >= MAX_RETRIES) {
    return;
  }

  window.setTimeout(() => {
    callPlausible(eventName, payload, attempt + 1);
  }, RETRY_DELAY_MS);
}

export function trackEvent(eventName, props = {}) {
  if (!eventName) {
    return;
  }

  const hasProps = props && Object.keys(props).length > 0;
  const payload = hasProps ? { props } : undefined;
  callPlausible(eventName, payload);
}

export function trackPageview(path, props = {}) {
  const payload = {};

  if (path) {
    payload.u = path;
  }

  if (props && Object.keys(props).length > 0) {
    payload.props = props;
  }

  const finalPayload = Object.keys(payload).length > 0 ? payload : undefined;
  callPlausible('pageview', finalPayload);
}
