import sharp from "sharp";
import fs from "node:fs";

const SRC = "C:/Development/Animal_Shelter_public-wordmark-home/public/lca-logo.png";
const OUT = "C:/Users/Leidos/OneDrive/Desktop/lca-logo-transparent.png";

/*
 * Why not a background remover: this crest is not a photo with a subject. The
 * rim lettering sits OUTSIDE the grey disc, on the white, so anything that
 * picks out "the subject" takes the disc and discards the words with the
 * background — which is exactly what happened.
 *
 * What actually distinguishes background here is not whiteness but CONNECTION.
 * The white outside the artwork reaches the border of the image; the white
 * inside the dog's blaze, eye patches and nose ring is walled in by black, and
 * the counters inside letters like 'a' and 'o' are walled in by their own
 * strokes. So: flood fill the near-white from the four edges, and make only
 * what the fill reaches transparent. Everything enclosed stays exactly as it
 * is, with no threshold to tune and nothing for a model to guess at.
 */

const img = sharp(SRC).removeAlpha();
const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
const { width: W, height: H, channels: C } = info;

const lum = new Uint8Array(W * H);
for (let i = 0, p = 0; i < data.length; i += C, p++) {
  lum[p] = (data[i] * 299 + data[i + 1] * 587 + data[i + 2] * 114) / 1000;
}

// Anything this light, reachable from the edge, is background.
const LIGHT = 232;
const bg = new Uint8Array(W * H);
const queue = new Int32Array(W * H);
let head = 0, tail = 0;
const push = (p) => {
  if (!bg[p] && lum[p] >= LIGHT) {
    bg[p] = 1;
    queue[tail++] = p;
  }
};
for (let x = 0; x < W; x++) { push(x); push((H - 1) * W + x); }
for (let y = 0; y < H; y++) { push(y * W); push(y * W + W - 1); }
while (head < tail) {
  const p = queue[head++], x = p % W, y = (p - x) / W;
  if (x > 0) push(p - 1);
  if (x < W - 1) push(p + 1);
  if (y > 0) push(p - W);
  if (y < H - 1) push(p + W);
}

// The fill stops at the first pixel darker than LIGHT, which leaves a hard,
// slightly pale edge. Give the boundary pixels partial alpha instead, scaled
// by how light they are, so the cut-out edge stays as smooth as the original.
const alpha = new Uint8Array(W * H).fill(255);
for (let p = 0; p < W * H; p++) if (bg[p]) alpha[p] = 0;
const SOFT = 170;
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const p = y * W + x;
    if (bg[p] || lum[p] <= SOFT) continue;
    const touches =
      (x > 0 && bg[p - 1]) || (x < W - 1 && bg[p + 1]) || (y > 0 && bg[p - W]) || (y < H - 1 && bg[p + W]);
    if (touches) alpha[p] = Math.round(255 * (1 - (lum[p] - SOFT) / (LIGHT - SOFT)));
  }
}

const out = Buffer.alloc(W * H * 4);
for (let p = 0; p < W * H; p++) {
  out[p * 4] = data[p * C];
  out[p * 4 + 1] = data[p * C + 1];
  out[p * 4 + 2] = data[p * C + 2];
  out[p * 4 + 3] = alpha[p];
}
await sharp(out, { raw: { width: W, height: H, channels: 4 } }).png({ compressionLevel: 9 }).toFile(OUT);

// Check the three things that could have gone wrong, rather than assuming.
const transparent = alpha.reduce((n, a) => n + (a === 0 ? 1 : 0), 0);
const cx = W / 2, cy = H / 2, r = Math.min(W, H) / 2;
let rimInk = 0, discWhite = 0;
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const p = y * W + x, d = Math.hypot(x - cx, y - cy);
    if (d > r * 0.78 && d < r * 0.99 && lum[p] < 100 && alpha[p] > 128) rimInk++;
    if (d < r * 0.72 && lum[p] >= 235 && alpha[p] > 128) discWhite++;
  }
}
console.log(`wrote ${OUT}  ${W}x${H}  ${(fs.statSync(OUT).size / 1024).toFixed(0)}KB`);
console.log(`transparent: ${((transparent / (W * H)) * 100).toFixed(1)}% of the image`);
console.log(`rim lettering still opaque: ${rimInk} dark pixels in the ring  (0 would mean it was eaten)`);
console.log(`white markings still opaque: ${discWhite} pixels inside the disc`);
