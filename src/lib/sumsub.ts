import "server-only";
import crypto from "node:crypto";

const BASE = "https://api.sumsub.com";

export function sumsubConfigured() {
  return !!(process.env.SUMSUB_APP_TOKEN && process.env.SUMSUB_SECRET_KEY && process.env.SUMSUB_LEVEL_NAME);
}

function sign(method: string, path: string, body: string, ts: number) {
  return crypto.createHmac("sha256", process.env.SUMSUB_SECRET_KEY!).update(ts + method.toUpperCase() + path + body).digest("hex");
}

/** Short-lived token for the WebSDK; applicant is keyed by our own user id (externalUserId). */
export async function createAccessToken(userId: string): Promise<string> {
  const path = "/resources/accessTokens/sdk";
  const body = JSON.stringify({ userId, levelName: process.env.SUMSUB_LEVEL_NAME, ttlInSecs: 900 });
  const ts = Math.floor(Date.now() / 1000);
  const res = await fetch(BASE + path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-App-Token": process.env.SUMSUB_APP_TOKEN!,
      "X-App-Access-Ts": String(ts),
      "X-App-Access-Sig": sign("POST", path, body, ts),
    },
    body,
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`sumsub token ${res.status}`);
  return (await res.json()).token as string;
}

const ALGS: Record<string, string> = { HMAC_SHA1_HEX: "sha1", HMAC_SHA256_HEX: "sha256", HMAC_SHA512_HEX: "sha512" };

export function verifyWebhook(rawBody: string, digest: string | null, alg: string | null): boolean {
  const secret = process.env.SUMSUB_WEBHOOK_SECRET;
  const algo = alg ? ALGS[alg] : undefined;
  if (!secret || !digest || !algo) return false;
  const expected = crypto.createHmac(algo, secret).update(rawBody).digest("hex");
  const a = Buffer.from(expected), b = Buffer.from(digest.toLowerCase());
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
