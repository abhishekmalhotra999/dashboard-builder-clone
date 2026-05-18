// Shared chart data utilities

export const DEFAULT_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];

function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

// Generate consistent default data from a widget ID
export function generateDefaultData(widgetId) {
  const seed = (widgetId || 'default')
    .split('')
    .reduce((acc, c) => acc + c.charCodeAt(0), 42);
  const rand = seededRandom(seed);
  return {
    labels: [...DEFAULT_LABELS],
    values: Array.from({ length: 7 }, () => Math.floor(rand() * 80 + 20)),
  };
}
