import { useEffect, useRef, useState } from 'react';

export default function useDisplayScaling(dependencies = []) {
  const rootRef = useRef(null);
  const contentRef = useRef(null);
  const [scale, setScale] = useState(1);
  const scaleRef = useRef(1);
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
      const nextScale = Math.min(availableWidth / contentWidth, availableHeight / contentHeight);
      const clamped = Math.max(Math.min(nextScale, 1.6), 0.45);
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
  }, dependencies); // eslint-disable-line react-hooks/exhaustive-deps

  return { rootRef, contentRef, scale };
}
