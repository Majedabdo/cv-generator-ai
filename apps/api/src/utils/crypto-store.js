// AES-256-GCM encryption for credentials at rest.
// The key is derived from an env secret so plaintext secrets never touch the DB.
import crypto from "crypto";

const SECRET = process.env.CREDENTIAL_ENC_KEY || "cvpilot-default-credential-key-change-me";
const KEY = crypto.createHash("sha256").update(SECRET).digest(); // 32 bytes

export function encrypt(plain) {
  if (plain == null || plain === "") return "";
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", KEY, iv);
  const enc = Buffer.concat([cipher.update(String(plain), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("base64")}:${tag.toString("base64")}:${enc.toString("base64")}`;
}

export function decrypt(blob) {
  if (!blob || typeof blob !== "string" || !blob.startsWith("v1:")) return "";
  try {
    const [, ivB64, tagB64, dataB64] = blob.split(":");
    const iv = Buffer.from(ivB64, "base64");
    const tag = Buffer.from(tagB64, "base64");
    const data = Buffer.from(dataB64, "base64");
    const decipher = crypto.createDecipheriv("aes-256-gcm", KEY, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
  } catch (_) {
    return "";
  }
}

export function maskTail(value, keep = 4) {
  if (!value) return "";
  const s = String(value);
  if (s.length <= keep) return "•".repeat(s.length);
  return `${"•".repeat(Math.min(20, s.length - keep))}${s.slice(-keep)}`;
}
