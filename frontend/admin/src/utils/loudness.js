// Integrierte Lautheit nach ITU-R BS.1770-4 / EBU R128 (K-Filter, 400-ms-Blöcke mit 75 % Überlappung,
// absolutes Gate -70 LUFS, relatives Gate -10 LU) plus Sample-Peak. Filterdesign wie libebur128.

const BLOCK_SECONDS = 0.4;
const HOP_SECONDS = 0.1;
const ABSOLUTE_GATE_LUFS = -70;
const RELATIVE_GATE_LU = -10;
const LOUDNESS_OFFSET = -0.691;

function kWeightingCoefficients(sampleRate) {
  // Stufe 1: High-Shelf (Kopfmodell)
  let f0 = 1681.974450955533;
  const gain = 3.999843853973347;
  let q = 0.7071752369554196;
  let k = Math.tan((Math.PI * f0) / sampleRate);
  const vh = 10 ** (gain / 20);
  const vb = vh ** 0.4996667741545416;
  let a0 = 1 + k / q + k * k;
  const shelf = {
    b: [(vh + (vb * k) / q + k * k) / a0, (2 * (k * k - vh)) / a0, (vh - (vb * k) / q + k * k) / a0],
    a: [(2 * (k * k - 1)) / a0, (1 - k / q + k * k) / a0]
  };
  // Stufe 2: Hochpass (RLB)
  f0 = 38.13547087602444;
  q = 0.5003270373238773;
  k = Math.tan((Math.PI * f0) / sampleRate);
  a0 = 1 + k / q + k * k;
  const highpass = { b: [1, -2, 1], a: [(2 * (k * k - 1)) / a0, (1 - k / q + k * k) / a0] };
  return [shelf, highpass];
}

function biquad(input, { b, a }) {
  const output = new Float64Array(input.length);
  let x1 = 0;
  let x2 = 0;
  let y1 = 0;
  let y2 = 0;
  for (let i = 0; i < input.length; i += 1) {
    const x0 = input[i];
    const y0 = b[0] * x0 + b[1] * x1 + b[2] * x2 - a[0] * y1 - a[1] * y2;
    output[i] = y0;
    x2 = x1;
    x1 = x0;
    y2 = y1;
    y1 = y0;
  }
  return output;
}

function prefixSquares(samples) {
  const sums = new Float64Array(samples.length + 1);
  for (let i = 0; i < samples.length; i += 1) {
    sums[i + 1] = sums[i] + samples[i] * samples[i];
  }
  return sums;
}

const toLoudness = (power) => LOUDNESS_OFFSET + 10 * Math.log10(power);
const mean = (values) => values.reduce((sum, value) => sum + value, 0) / values.length;

// channels: Float32Array je Kanal (gleich lang), sampleRate in Hz → { lufs, peakDb } (null bei Stille)
export function measureLoudness(channels, sampleRate) {
  const length = channels[0]?.length ?? 0;
  let peak = 0;
  channels.forEach((samples) => {
    for (let i = 0; i < samples.length; i += 1) {
      const value = Math.abs(samples[i]);
      if (value > peak) peak = value;
    }
  });
  if (length === 0 || peak === 0) {
    return { lufs: null, peakDb: null };
  }

  const filters = kWeightingCoefficients(sampleRate);
  const squareSums = channels.map((samples) => prefixSquares(filters.reduce((signal, filter) => biquad(signal, filter), samples)));

  const blockLength = Math.round(BLOCK_SECONDS * sampleRate);
  const hop = Math.round(HOP_SECONDS * sampleRate);
  // Kürzer als ein Block: die ganze Datei als einen Block werten.
  const ranges = [];
  if (length < blockLength) {
    ranges.push([0, length]);
  } else {
    for (let start = 0; start + blockLength <= length; start += hop) ranges.push([start, start + blockLength]);
  }
  const blockPowers = ranges.map(([start, end]) =>
    squareSums.reduce((sum, sums) => sum + (sums[end] - sums[start]) / (end - start), 0)
  );

  const aboveAbsolute = blockPowers.filter((power) => toLoudness(power) > ABSOLUTE_GATE_LUFS);
  if (aboveAbsolute.length === 0) {
    return { lufs: null, peakDb: 20 * Math.log10(peak) };
  }
  const relativeGate = toLoudness(mean(aboveAbsolute)) + RELATIVE_GATE_LU;
  const gated = aboveAbsolute.filter((power) => toLoudness(power) > relativeGate);
  return { lufs: toLoudness(mean(gated)), peakDb: 20 * Math.log10(peak) };
}

// Browser: Datei laden, dekodieren und messen.
export async function measureAudioUrl(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Audio konnte nicht geladen werden (${response.status}).`);
  }
  const OfflineContext = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const decoder = new OfflineContext(1, 1, 48000);
  const buffer = await decoder.decodeAudioData(await response.arrayBuffer());
  const channels = Array.from({ length: buffer.numberOfChannels }, (_, index) => buffer.getChannelData(index));
  return measureLoudness(channels, buffer.sampleRate);
}
