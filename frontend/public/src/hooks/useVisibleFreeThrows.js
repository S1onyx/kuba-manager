import { useEffect, useRef, useState } from 'react';
import { FREE_THROW_HIDE_DELAY_MS, freeThrowSeriesKey, isFreeThrowVisible } from '../utils/freeThrows.js';

export default function useVisibleFreeThrows(freeThrows) {
  const doneSeen = useRef({ key: null, at: null });
  const [, forceRender] = useState(0);
  const key = freeThrowSeriesKey(freeThrows);
  const done = Boolean(freeThrows?.status?.done);

  if (!done || doneSeen.current.key !== key) {
    doneSeen.current = { key, at: done ? Date.now() : null };
  }

  useEffect(() => {
    if (!done) return undefined;
    const timer = setTimeout(() => forceRender((value) => value + 1), FREE_THROW_HIDE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [done, key]);

  return isFreeThrowVisible(freeThrows, doneSeen.current.at, Date.now()) ? freeThrows : null;
}
