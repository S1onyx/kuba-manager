import { useEffect, useRef, useState } from 'react';
import { chooseContentWidth } from '../utils/fitWidth.js';

export default function useDisplayScaling(dependencies = [], { fitWidth = false } = {}) {
  const rootRef = useRef(null);
  const contentRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [contentWidth, setContentWidth] = useState(null);
  const scaleRef = useRef(1);
  const contentWidthRef = useRef(null);
  const pendingRef = useRef(null);

  useEffect(() => {
    const compute = () => {
      if (!rootRef.current || !contentRef.current) {
        return;
      }
      const container = rootRef.current;
      const content = contentRef.current;
      const contentWidth = content.offsetWidth;
      const contentHeight = content.offsetHeight;
      // Skip during layout reflow (e.g. beamer connect/disconnect, fullscreen toggle)
      if (!contentWidth || !contentHeight || !container.clientWidth || !container.clientHeight) {
        return;
      }
      const computed = window.getComputedStyle(container);
      const paddingX =
        parseFloat(computed.paddingLeft || '0') + parseFloat(computed.paddingRight || '0');
      const paddingY =
        parseFloat(computed.paddingTop || '0') + parseFloat(computed.paddingBottom || '0');
      const availableWidth = Math.max(container.clientWidth - paddingX, 50);
      const availableHeight = Math.max(container.clientHeight - paddingY, 50);
      let nextScale = Math.min(availableWidth / contentWidth, availableHeight / contentHeight);
      if (fitWidth) {
        const fitted = chooseContentWidth({
          availableWidth,
          availableHeight,
          measureHeight: (width) => {
            content.style.width = `${width}px`;
            return content.offsetHeight;
          }
        });
        content.style.width = `${fitted.width}px`;
        nextScale = fitted.scale;
        if (fitted.width !== contentWidthRef.current) {
          contentWidthRef.current = fitted.width;
          setContentWidth(fitted.width);
        }
      } else if (contentWidthRef.current !== null) {
        contentWidthRef.current = null;
        setContentWidth(null);
      }
      // Minimum dynamisch: auf kleinen Screens (z.B. 375px Portrait) darf unter 0.45
      // skaliert werden, damit die Bühne immer komplett in Breite UND Höhe passt.
      // Auf großen Screens bleibt das bisherige Verhalten (Untergrenze 0.45) unverändert.
      const minScale = Math.min(0.45, nextScale);
      const clamped = Math.max(Math.min(nextScale, 2.2), minScale);
      if (Math.abs(clamped - scaleRef.current) > 0.0005) {
        scaleRef.current = clamped;
        setScale(clamped);
      }
    };

    // Debounced wrapper — waits for layout to settle after resize/fullscreen/beamer events
    const updateScale = () => {
      if (pendingRef.current !== null) {
        clearTimeout(pendingRef.current);
      }
      pendingRef.current = setTimeout(() => {
        pendingRef.current = null;
        compute();
        // Second pass after another frame in case browser hasn't fully painted
        requestAnimationFrame(compute);
      }, 80);
    };

    // Immediate first compute + deferred fallback
    compute();
    requestAnimationFrame(compute);

    const resizeObserver =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateScale) : null;

    if (resizeObserver && rootRef.current) {
      resizeObserver.observe(rootRef.current);
    }
    if (resizeObserver && contentRef.current) {
      resizeObserver.observe(contentRef.current);
    }

    window.addEventListener('resize', updateScale);
    document.addEventListener('fullscreenchange', updateScale);

    return () => {
      if (pendingRef.current !== null) {
        clearTimeout(pendingRef.current);
        pendingRef.current = null;
      }
      window.removeEventListener('resize', updateScale);
      document.removeEventListener('fullscreenchange', updateScale);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [...dependencies, fitWidth]); // eslint-disable-line react-hooks/exhaustive-deps

  return { rootRef, contentRef, scale, contentWidth };
}
