import { useEffect } from 'react';

export default function useBodyScrollLock() {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const previousMargin = document.body.style.margin;
    document.body.style.overflow = 'hidden';
    document.body.style.margin = '0';
    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.margin = previousMargin;
    };
  }, []);
}
