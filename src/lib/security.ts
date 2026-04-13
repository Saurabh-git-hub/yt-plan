import { NextResponse } from "next/server";

type RateLimitConfig = {
  windowMs: number;
  max: number;
};

type RateLimitEntry = {
  count: number;
  expiresAt: number;
};

declare global {
  var __rateLimitStore: Map<string, RateLimitEntry> | undefined;
}

const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  windowMs: 60_000,
  max: 60,
};

function getRateLimitStore() {
  if (!global.__rateLimitStore) {
    global.__rateLimitStore = new Map<string, RateLimitEntry>();
  }

  return global.__rateLimitStore;
}

function normalizeHost(value: string | null) {
  return (value ?? "").trim().toLowerCase();
}

export function enforceSameOrigin(request: Request) {
  const origin = request.headers.get("origin");

  // Some non-browser clients omit Origin. Keep compatibility for those requests.
  if (!origin) {
    return null;
  }

  let parsedOrigin: URL;
  try {
    parsedOrigin = new URL(origin);
  } catch {
    return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  }

  const forwardedHost = normalizeHost(request.headers.get("x-forwarded-host"));
  const host = normalizeHost(request.headers.get("host"));
  const requestHost = forwardedHost || host;

  if (!requestHost) {
    return NextResponse.json({ error: "Unable to validate request origin" }, { status: 403 });
  }

  if (normalizeHost(parsedOrigin.host) !== requestHost) {
    return NextResponse.json({ error: "Cross-site request blocked" }, { status: 403 });
  }

  return null;
}

export function applyRateLimit(request: Request, key: string, config?: Partial<RateLimitConfig>) {
  const store = getRateLimitStore();
  const now = Date.now();
  const rateLimit = {
    ...DEFAULT_RATE_LIMIT,
    ...config,
  };

  for (const [entryKey, entry] of store.entries()) {
    if (entry.expiresAt <= now) {
      store.delete(entryKey);
    }
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const scopedKey = `${key}:${ip}`;
  const entry = store.get(scopedKey);

  if (!entry || entry.expiresAt <= now) {
    store.set(scopedKey, {
      count: 1,
      expiresAt: now + rateLimit.windowMs,
    });
    return null;
  }

  if (entry.count >= rateLimit.max) {
    const retryAfterSeconds = Math.max(1, Math.ceil((entry.expiresAt - now) / 1000));
    return NextResponse.json(
      { error: "Too many requests. Please try again shortly." },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfterSeconds),
        },
      },
    );
  }

  entry.count += 1;
  store.set(scopedKey, entry);
  return null;
}

export function sanitizePlainText(value: string, maxLength: number) {
  return value.replace(/[\u0000-\u001F\u007F]/g, "").trim().slice(0, maxLength);
}

export async function safeReadJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
