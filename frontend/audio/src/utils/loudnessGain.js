// Zielpegel für alle Sounds; Spitzen fängt der Limiter (-1 dB) ab.
export const TARGET_LUFS = -14;
// Begrenzt die Anhebung sehr leiser Dateien, damit Rauschen nicht hochgezogen wird.
export const MAX_BOOST_DB = 12;

// Lineare Verstärkung, die eine Datei mit gemessener Lautheit auf TARGET_LUFS bringt; ohne Messwert unverändert.
export function normalizationGain(lufs) {
  if (typeof lufs !== 'number' || !Number.isFinite(lufs)) {
    return 1;
  }
  const gainDb = Math.min(MAX_BOOST_DB, TARGET_LUFS - lufs);
  return 10 ** (gainDb / 20);
}
