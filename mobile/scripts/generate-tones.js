/**
 * Generates the app's UI sound-effect assets as 16-bit PCM WAV files.
 * Ports the original web app's Web Audio oscillator synthesis (src/services/audioService.ts)
 * to pre-rendered assets, since React Native has no oscillator/AudioContext API.
 * Run with: node scripts/generate-tones.js
 */
const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 44100;

function writeWav(filePath, samples) {
  const numSamples = samples.length;
  const byteRate = SAMPLE_RATE * 2; // mono, 16-bit
  const dataSize = numSamples * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // fmt chunk size
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(2, 32); // block align
  buffer.writeUInt16LE(16, 34); // bits per sample
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < numSamples; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(Math.round(clamped * 32767), 44 + i * 2);
  }

  fs.writeFileSync(filePath, buffer);
  console.log(`Wrote ${filePath} (${(buffer.length / 1024).toFixed(1)} KB)`);
}

/** Exponential ramp helper mirroring AudioParam.exponentialRampToValueAtTime */
function expRamp(start, end, progress) {
  if (start <= 0) start = 0.0001;
  if (end <= 0) end = 0.0001;
  return start * Math.pow(end / start, progress);
}

/** Renders a single sine oscillator with exponential frequency + gain envelopes into an output buffer starting at startTime (seconds). */
function renderTone(output, startTime, duration, freqStart, freqEnd, gainStart, gainEnd) {
  const startSample = Math.floor(startTime * SAMPLE_RATE);
  const numSamples = Math.floor(duration * SAMPLE_RATE);
  let phase = 0;
  for (let i = 0; i < numSamples; i++) {
    const idx = startSample + i;
    if (idx >= output.length) break;
    const progress = i / numSamples;
    const freq = expRamp(freqStart, freqEnd, progress);
    const gain = expRamp(gainStart, gainEnd, progress);
    phase += (2 * Math.PI * freq) / SAMPLE_RATE;
    output[idx] += gain * Math.sin(phase);
  }
}

function makeBuffer(totalDuration) {
  return new Float64Array(Math.ceil(totalDuration * SAMPLE_RATE));
}

const outDir = path.join(__dirname, '..', 'assets', 'sounds');
fs.mkdirSync(outDir, { recursive: true });

// playSoftClick: single sine 440 -> 880 Hz, gain 0.08 -> 0.001, over 0.04s
{
  const dur = 0.04;
  const buf = makeBuffer(dur);
  renderTone(buf, 0, dur, 440, 880, 0.08, 0.001);
  writeWav(path.join(outDir, 'soft-click.wav'), buf);
}

// playSuccessTone: C5/E5/G5 chord, staggered 0.06s apart, each 0.25s, gain 0.1 -> 0.001
{
  const notes = [523.25, 659.25, 783.99];
  const noteDur = 0.25;
  const stagger = 0.06;
  const totalDur = stagger * (notes.length - 1) + noteDur;
  const buf = makeBuffer(totalDur);
  notes.forEach((freq, i) => {
    renderTone(buf, i * stagger, noteDur, freq, freq, 0.1, 0.001);
  });
  writeWav(path.join(outDir, 'success-tone.wav'), buf);
}

// playTimerBell: D5/A5/D6 harmonic chime, all starting together, gain 0.12 -> 0.0001, over 1.2s
{
  const notes = [587.33, 880.0, 1174.66];
  const dur = 1.2;
  const buf = makeBuffer(dur);
  notes.forEach((freq) => {
    renderTone(buf, 0, dur, freq, freq, 0.12, 0.0001);
  });
  writeWav(path.join(outDir, 'timer-bell.wav'), buf);
}

console.log('Done.');
