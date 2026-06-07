#!/usr/bin/env node
/**
 * Generate synthetic sample assets with FFmpeg so the example project renders
 * end-to-end without any external media.
 *
 *   node examples/generate-sample-assets.mjs
 *
 * Creates under examples/assets:
 *   voiceover.mp3        8s tone (stands in for a narration track)
 *   background_music.mp3 12s tone (background bed)
 *   clip_01.mp4          6s animated test pattern (footage)
 *   clip_02.mp4          6s animated test pattern (footage)
 *   image_01.png         1080x1920 gradient still (image cutaway)
 */
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const assets = join(here, 'assets');
mkdirSync(assets, { recursive: true });

const FFMPEG = process.env.FFMPEG_PATH || 'ffmpeg';

function run(args) {
  return new Promise((resolve, reject) => {
    const c = spawn(FFMPEG, ['-hide_banner', '-y', ...args], { stdio: ['ignore', 'ignore', 'inherit'] });
    c.on('error', reject);
    c.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}`))));
  });
}

const jobs = [
  // Voiceover — 8s 220Hz tone.
  ['-f', 'lavfi', '-i', 'sine=frequency=220:duration=8', '-c:a', 'libmp3lame', '-q:a', '4', join(assets, 'voiceover.mp3')],
  // Music — 12s 110Hz tone (will be looped/trimmed + ducked by the agent).
  ['-f', 'lavfi', '-i', 'sine=frequency=110:duration=12', '-c:a', 'libmp3lame', '-q:a', '6', join(assets, 'background_music.mp3')],
  // Footage clip 1 — 6s animated test source.
  ['-f', 'lavfi', '-i', 'testsrc2=size=1080x1920:rate=30:duration=6', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-t', '6', join(assets, 'clip_01.mp4')],
  // Footage clip 2 — 6s mandelbrot animation.
  ['-f', 'lavfi', '-i', 'mandelbrot=size=1080x1920:rate=30', '-t', '6', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', join(assets, 'clip_02.mp4')],
  // Image — 1080x1920 gradient still.
  ['-f', 'lavfi', '-i', 'gradients=size=1080x1920:duration=1', '-frames:v', '1', join(assets, 'image_01.png')],
];

for (const args of jobs) {
  process.stderr.write(`generating ${args[args.length - 1]}\n`);
  // eslint-disable-next-line no-await-in-loop
  await run(args);
}
process.stderr.write('Sample assets ready in examples/assets\n');
