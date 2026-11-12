import test from 'node:test';
import assert from 'node:assert/strict';
import { measureLoudness } from '../src/utils/loudness.js';

const sine = ({ amplitude = 1, seconds = 5, sampleRate = 48000, frequency = 997 }) =>
  Float32Array.from({ length: Math.round(seconds * sampleRate) }, (_, i) => amplitude * Math.sin((2 * Math.PI * frequency * i) / sampleRate));
const near = (actual, expected, tolerance, label) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${label}: ${actual} statt ${expected} ±${tolerance}`);

test('BS.1770-Referenz: 997-Hz-Sinus 0 dBFS mono = -3,01 LUFS, stereo = 0 LUFS', () => {
  near(measureLoudness([sine({})], 48000).lufs, -3.01, 0.1, 'mono');
  near(measureLoudness([sine({}), sine({})], 48000).lufs, 0, 0.1, 'stereo');
});

test('-20 dB Pegel ergibt -23,01 LUFS, auch bei 44,1 kHz', () => {
  near(measureLoudness([sine({ amplitude: 0.1 })], 48000).lufs, -23.01, 0.1, '48k');
  near(measureLoudness([sine({ amplitude: 0.1, sampleRate: 44100 })], 44100).lufs, -23.01, 0.1, '44.1k');
});

test('Stille am Ende wird weggegated, nur die 3 Übergangsblöcke zählen anteilig', () => {
  const tone = sine({ amplitude: 0.1 });
  const withSilence = new Float32Array(tone.length * 2);
  withSilence.set(tone);
  // 47 volle Blöcke + Übergang (0,75 + 0,5 + 0,25) → 48,5 / 50 → -0,13 dB gegenüber -23,01
  near(measureLoudness([withSilence], 48000).lufs, -23.01 + 10 * Math.log10(48.5 / 50), 0.02, 'mit Stille');
});

test('Sehr kurze Datei (< 400 ms) liefert trotzdem einen Wert', () => {
  near(measureLoudness([sine({ seconds: 0.3 })], 48000).lufs, -3.01, 0.3, 'kurz');
});

test('Spitzenpegel in dBFS, reine Stille hat keine Lautheit', () => {
  near(measureLoudness([sine({ amplitude: 0.5 })], 48000).peakDb, -6.02, 0.05, 'peak');
  const silent = measureLoudness([new Float32Array(48000)], 48000);
  assert.deepEqual([silent.lufs, silent.peakDb], [null, null]);
});
