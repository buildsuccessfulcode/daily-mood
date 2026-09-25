import {
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, ADMIN_SESSION_MAX_AGE } from "./constants";

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LENGTH = 64;

function safeEqual(a: string | Buffer, b: string | Buffer): boolean {
  const left = Buffer.isBuffer(a) ? a : Buffer.from(a, "utf8");
  const right = Buffer.isBuffer(b) ? b : Buffer.from(b, "utf8");
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, KEY_LENGTH, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
  });
  return `scrypt:${SCRYPT_N}:${SCRYPT_R}:${SCRYPT_P}:${salt.toString("base64")}:${hash.toString("base64")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split(":");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [, n, r, p, saltB64, hashB64] = parts;
  const salt = Buffer.from(saltB64, "base64");
  const expected = Buffer.from(hashB64, "base64");
  if (salt.length === 0 || expected.length === 0) return false;
  const actual = scryptSync(password, salt, expected.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
  });
  return safeEqual(actual, expected);
}

function getSessionSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error("ADMIN_SESSION_SECRET belum diatur");
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getSessionSecret())
    .update(payload)
    .digest("base64url");
}

export function createSessionToken(adminId: string): string {
  const expiresAt = Date.now() + ADMIN_SESSION_MAX_AGE * 1000;
  const payload = Buffer.from(`${adminId}.${expiresAt}`).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | undefined): string | null {
  if (!token) return null;
  const dotIndex = token.lastIndexOf(".");
  if (dotIndex <= 0) return null;
  const payload = token.slice(0, dotIndex);
  const signature = token.slice(dotIndex + 1);
  if (!safeEqual(signature, sign(payload))) return null;
  const decoded = Buffer.from(payload, "base64url").toString("utf8");
  const separator = decoded.lastIndexOf(".");
  if (separator <= 0) return null;
  const adminId = decoded.slice(0, separator);
  const expiresAt = Number(decoded.slice(separator + 1));
  if (!adminId || !Number.isFinite(expiresAt) || Date.now() > expiresAt) {
    return null;
  }
  return adminId;
}

export async function getAdminId(): Promise<string | null> {
  const store = await cookies();
  return verifySessionToken(store.get(ADMIN_COOKIE)?.value);
}

export async function setAdminSession(adminId: string): Promise<void> {
  const store = await cookies();
  store.set(ADMIN_COOKIE, createSessionToken(adminId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE,
  });
}

export async function clearAdminSession(): Promise<void> {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
}

export async function requireAdminPage(): Promise<string> {
  const adminId = await getAdminId();
  if (!adminId) redirect("/admin/login");
  return adminId;
}

type RateEntry = { count: number; resetAt: number };
const rateBuckets = new Map<string, RateEntry>();

export function checkRateLimit(
  key: string,
  limit = 6,
  windowMs = 60_000,
): boolean {
  const now = Date.now();
  const entry = rateBuckets.get(key);
  if (!entry || now > entry.resetAt) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count += 1;
  return true;
}
