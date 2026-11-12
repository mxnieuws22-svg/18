import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import jpeg from "jpeg-js";
import { base64ToBytes } from "./base64";
import type { RgbaImage } from "./image";

/**
 * Load a photo as pixels at a working resolution. The photo is shrunk first by the platform's own image
 * code (fast, applies EXIF rotation), then decoded locally. Nothing leaves the device.
 */
export async function loadRgba(uri: string, width = 640): Promise<RgbaImage> {
  const r = await manipulateAsync(uri, [{ resize: { width } }], { base64: true, format: SaveFormat.JPEG, compress: 0.95 });
  if (!r.base64) throw new Error("no image data");
  const d = jpeg.decode(base64ToBytes(r.base64), { useTArray: true, formatAsRGBA: true, maxMemoryUsageInMB: 256 });
  return { width: d.width, height: d.height, data: d.data as Uint8Array };
}
