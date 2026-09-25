import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "node:crypto";

const PREFIX = "v1";
const IV_BYTES = 12;
const TAG_BYTES = 16;
const KEY_BYTES = 32;

function getKey(): Buffer {
  const raw = process.env.APP_ENCRYPTION_KEY;
  if (!raw) throw new Error("APP_ENCRYPTION_KEY belum diatur");
  const key = Buffer.from(raw, "base64");
  if (key.length !== KEY_BYTES) {
    throw new Error("APP_ENCRYPTION_KEY harus 32 byte (base64)");
  }
  return key;
}

export function isEncryptionConfigured(): boolean {
  try {
    getKey();
    return true;
  } catch {
    return false;
  }
}

export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}:${Buffer.concat([iv, tag, encrypted]).toString("base64")}`;
}

export function decryptSecret(payload: string): string {
  if (!payload.startsWith(`${PREFIX}:`)) {
    throw new Error("Format secret tidak dikenal");
  }
  const data = Buffer.from(payload.slice(PREFIX.length + 1), "base64");
  const iv = data.subarray(0, IV_BYTES);
  const tag = data.subarray(IV_BYTES, IV_BYTES + TAG_BYTES);
  const encrypted = data.subarray(IV_BYTES + TAG_BYTES);
  const decipher = createDecipheriv("aes-256-gcm", getKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]).toString("utf8");
}

export function maskSecret(value: string): string {
  if (value.length <= 4) return "••••";
  return `••••••••${value.slice(-4)}`;
}
