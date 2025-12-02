import { useEffect } from 'react';
import useMediaQuery from './useMediaQuery.js';

export default function useBodyScrollLock(minWidth = 768) {
  const shouldLock = useMediaQuery(`(min-width: ${minWidth}px)`);

  useEffect(() => {
    if (!shouldLock) {
      return undefined;
    }
    const previousOverflow = document.body.style.overflow;
    const previousMargin = document.body.style.margin;
    document.body.style.overflow = 'hidden';
    document.body.style.margin = '0';
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.margin = previousMargin;
    };
  }, [shouldLock]);
}
