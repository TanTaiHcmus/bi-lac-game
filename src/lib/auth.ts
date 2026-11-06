// Optional shared passcode. When APP_PASSCODE is unset the app is open to everyone.
// Shared by proxy.ts and Server Actions, so it only uses Web APIs.

export const SESSION_COOKIE = "bilac_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 365;

export function passcodeEnabled() {
  return Boolean(process.env.APP_PASSCODE);
}

async function hmacHex(secret: string, message: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return Array.from(new Uint8Array(signature), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

function constantTimeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Cookie value proving the passcode was entered. Changing APP_PASSCODE invalidates it. */
export function sessionToken(passcode: string) {
  return hmacHex(passcode, "bilac-session-v1");
}

export async function passcodeMatches(input: string) {
  const passcode = process.env.APP_PASSCODE;
  if (!passcode) return true;
  return constantTimeEqual(await sessionToken(input), await sessionToken(passcode));
}

export async function isValidSession(token: string | undefined) {
  const passcode = process.env.APP_PASSCODE;
  if (!passcode) return true;
  if (!token) return false;
  return constantTimeEqual(token, await sessionToken(passcode));
}

/** Only same-origin paths, so ?next= cannot redirect off-site. */
export function safeNextPath(value: unknown) {
  return typeof value === "string" &&
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.startsWith("/\\")
    ? value
    : "/";
}
