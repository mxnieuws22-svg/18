export interface RgbaImage {
  width: number;
  height: number;
  data: Uint8Array | Uint8ClampedArray; // RGBA
}

export function toGray(img: RgbaImage): Float32Array {
  const n = img.width * img.height;
  const g = new Float32Array(n);
  for (let i = 0, j = 0; i < n; i++, j += 4) {
    g[i] = 0.299 * img.data[j] + 0.587 * img.data[j + 1] + 0.114 * img.data[j + 2];
  }
  return g;
}

/** Separable box blur, radius r (window 2r+1), edge-clamped. */
export function boxBlur(src: Float32Array, w: number, h: number, r: number): Float32Array {
  if (r <= 0) return src;
  const tmp = new Float32Array(src.length);
  const out = new Float32Array(src.length);
  const k = 2 * r + 1;
  for (let y = 0; y < h; y++) {
    const row = y * w;
    let sum = 0;
    for (let x = -r; x <= r; x++) sum += src[row + Math.min(w - 1, Math.max(0, x))];
    for (let x = 0; x < w; x++) {
      tmp[row + x] = sum / k;
      sum += src[row + Math.min(w - 1, x + r + 1)] - src[row + Math.max(0, x - r)];
    }
  }
  for (let x = 0; x < w; x++) {
    let sum = 0;
    for (let y = -r; y <= r; y++) sum += tmp[Math.min(h - 1, Math.max(0, y)) * w + x];
    for (let y = 0; y < h; y++) {
      out[y * w + x] = sum / k;
      sum += tmp[Math.min(h - 1, y + r + 1) * w + x] - tmp[Math.max(0, y - r) * w + x];
    }
  }
  return out;
}

/** Nearest-neighbour resample, used only when two photos differ slightly in size. */
export function resizeNearest(img: RgbaImage, w: number, h: number): RgbaImage {
  if (img.width === w && img.height === h) return img;
  const data = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) {
    const sy = Math.min(img.height - 1, Math.floor((y * img.height) / h));
    for (let x = 0; x < w; x++) {
      const sx = Math.min(img.width - 1, Math.floor((x * img.width) / w));
      const s = (sy * img.width + sx) * 4, d = (y * w + x) * 4;
      data[d] = img.data[s]; data[d + 1] = img.data[s + 1]; data[d + 2] = img.data[s + 2]; data[d + 3] = 255;
    }
  }
  return { width: w, height: h, data };
}

/** Average-downscale to a given width (keeps aspect ratio). */
export function downscale(img: RgbaImage, targetW: number): RgbaImage {
  if (img.width <= targetW) return img;
  const f = img.width / targetW;
  const w = targetW, h = Math.max(1, Math.round(img.height / f));
  const data = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) {
    const y0 = Math.floor(y * f), y1 = Math.min(img.height, Math.max(y0 + 1, Math.floor((y + 1) * f)));
    for (let x = 0; x < w; x++) {
      const x0 = Math.floor(x * f), x1 = Math.min(img.width, Math.max(x0 + 1, Math.floor((x + 1) * f)));
      let r = 0, g = 0, b = 0, c = 0;
      for (let yy = y0; yy < y1; yy++) for (let xx = x0; xx < x1; xx++) {
        const i = (yy * img.width + xx) * 4; r += img.data[i]; g += img.data[i + 1]; b += img.data[i + 2]; c++;
      }
      const d = (y * w + x) * 4;
      data[d] = r / c; data[d + 1] = g / c; data[d + 2] = b / c; data[d + 3] = 255;
    }
  }
  return { width: w, height: h, data };
}
