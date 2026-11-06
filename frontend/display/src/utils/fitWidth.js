const MIN_LAYOUT_WIDTH = 900;
const MAX_LAYOUT_WIDTH = 3200;
const WIDTH_STEP = 100;

export function chooseContentWidth({ availableWidth, availableHeight, measureHeight, maxScale = 2.2 }) {
  const minWidth = Math.min(availableWidth, MIN_LAYOUT_WIDTH);
  const candidates = new Set([Math.round(availableWidth)]);
  for (let width = minWidth; width <= MAX_LAYOUT_WIDTH; width += WIDTH_STEP) {
    candidates.add(Math.round(width));
  }

  let best = null;
  candidates.forEach((width) => {
    const height = measureHeight(width);
    if (!height) return;
    const widthScale = availableWidth / width;
    const heightScale = availableHeight / height;
    const scale = Math.min(widthScale, heightScale, maxScale);
    const balance = Math.abs(Math.log(widthScale / heightScale));
    if (!best || scale > best.scale + 0.001 || (Math.abs(scale - best.scale) <= 0.001 && balance < best.balance)) {
      best = { width, scale, balance };
    }
  });

  return best ? { width: best.width, scale: best.scale } : { width: availableWidth, scale: 1 };
}
