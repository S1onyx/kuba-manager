import { useEffect, useRef, useState } from 'react';

export default function useDisplayScaling(dependencies = []) {
  const rootRef = useRef(null);
  const contentRef = useRef(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      if (!rootRef.current || !contentRef.current) {
        return;
      }
      const container = rootRef.current;
      const content = contentRef.current;
      const contentWidth = content.offsetWidth;
      const contentHeight = content.offsetHeight;
      if (!contentWidth || !contentHeight) {
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
      setScale(clamped);
    };

    updateScale();

    const resizeObserver =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateScale) : null;

    if (resizeObserver && contentRef.current) {
      resizeObserver.observe(contentRef.current);
    }

    window.addEventListener('resize', updateScale);
    return () => {
      window.removeEventListener('resize', updateScale);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, dependencies);

  return { rootRef, contentRef, scale };
}
