import { useEffect, useState } from 'react';

function getMatches(query) {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia(query).matches;
}

export default function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => getMatches(query));

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }
    const mediaQuery = window.matchMedia(query);

    const updateMatch = (event) => setMatches(event.matches);

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', updateMatch);
    } else if (typeof mediaQuery.addListener === 'function') {
      mediaQuery.addListener(updateMatch);
    }

    setMatches(mediaQuery.matches);

    return () => {
      if (typeof mediaQuery.removeEventListener === 'function') {
        mediaQuery.removeEventListener('change', updateMatch);
      } else if (typeof mediaQuery.removeListener === 'function') {
        mediaQuery.removeListener(updateMatch);
      }
    };
  }, [query]);

  return matches;
}
